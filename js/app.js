import { CONFIG } from './config.js';
import { readUiState, writeUiState, mergeStateWithUi } from './state.js';
import { initGoogle, requestAccessToken, revokeAccess, isConfigured } from './auth.js';
import { scanFolderTree, getFolder, downloadMetadataFile, saveMetadataFile } from './drive.js';
import { demoMedia, demoMemories } from './demo.js';
import { qs, qsa, extractDriveFolderId, formatNumber, formatDate, debounce, escapeHtml } from './utils.js';
import { renderFeatured, renderMemoryGrid, renderTimeline, renderArchive, renderStats } from './gallery.js';
import { openMemoryStory, closeMemoryStory } from './story.js';
import { hydrateDriveThumbnails } from './media-loader.js';

const state = readUiState();
let media = demoMedia.map(item => ({ ...item }));
let memories = demoMemories.map(item => ({ ...item }));
let demoActive = true;
let filterCategory = 'All';

const els = {
  featuredTitle: qs('#featuredTitle'), featuredCard: qs('#featuredCard'), memoryGrid: qs('#memoryGrid'), timelineList: qs('#timelineList'),
  archiveMasonry: qs('#archiveMasonry'), archiveStats: qs('#archiveStats'), categoryChips: qs('#categoryChips'), connectionStatus: qs('#connectionStatus'),
  driveModal: qs('#driveModal'), memoryModal: qs('#memoryModal'), memoryStory: qs('#memoryStory'), searchModal: qs('#searchModal'),
  searchInput: qs('#searchInput'), searchResults: qs('#searchResults'), folderUrl: qs('#folderUrl'), connectDriveBtn: qs('#connectDriveBtn'), setupNote: qs('#setupNote'),
  importProgress: qs('#importProgress'), progressLabel: qs('#progressLabel'), progressCount: qs('#progressCount'), progressBar: qs('#progressBar'), toast: qs('#toast')
};

function showModal(el) { el.classList.add('is-open'); el.setAttribute('aria-hidden','false'); }
function hideModal(el) { el.classList.remove('is-open'); el.setAttribute('aria-hidden','true'); }
function toast(message) { els.toast.textContent = message; els.toast.classList.add('is-visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => els.toast.classList.remove('is-visible'), 2800); }

function getFilteredMemories() {
  if (filterCategory === 'All') return memories;
  return memories.filter(m => m.category === filterCategory || m.tags?.includes(filterCategory.toLowerCase()));
}

function renderAll() {
  const visibleMemories = getFilteredMemories();
  const featured = memories[0];
  els.featuredTitle.textContent = featured?.title || 'Your latest memory';
  renderFeatured(els.featuredCard, featured, media);
  renderMemoryGrid(els.memoryGrid, visibleMemories, media);
  renderTimeline(els.timelineList, memories);
  renderStats(els.archiveStats, media, memories);
  renderArchive(els.archiveMasonry, media);
  renderCategories();
  bindDynamicMemoryClicks();
  if (!demoActive) hydrateDriveThumbnails();
}

function renderCategories() {
  const categories = ['All', ...Array.from(new Set(memories.map(m => m.category).filter(Boolean))), ...state.categories.filter(c => !memories.some(m => m.category === c))];
  els.categoryChips.innerHTML = categories.map(category => `<button class="chip ${filterCategory === category ? 'is-active' : ''}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('');
  qsa('[data-category]', els.categoryChips).forEach(button => button.addEventListener('click', () => {
    filterCategory = button.dataset.category;
    state.selectedCategory = filterCategory;
    writeUiState(state);
    renderAll();
  }));
}

function bindDynamicMemoryClicks() {
  qsa('[data-memory-id]').forEach(el => {
    el.addEventListener('click', () => {
      const memory = memories.find(m => String(m.id) === String(el.dataset.memoryId));
      if (memory) { openMemoryStory(memory, media, els.memoryModal, els.memoryStory); if (!demoActive) hydrateDriveThumbnails(els.memoryStory); }
    });
  });
}

function setImportProgress(label, percent) {
  els.importProgress.hidden = false;
  els.progressLabel.textContent = label;
  els.progressCount.textContent = `${Math.round(percent)}%`;
  els.progressBar.style.width = `${percent}%`;
}

async function connectDrive() {
  const folderId = extractDriveFolderId(els.folderUrl.value);
  if (!folderId) {
    els.setupNote.textContent = 'Paste a valid Google Drive folder URL.';
    return;
  }
  if (!isConfigured()) {
    els.setupNote.innerHTML = `Google OAuth is not configured yet. Open <strong>js/config.js</strong> and replace <strong>YOUR_GOOGLE_OAUTH_CLIENT_ID...</strong> with your Web client ID from Google Cloud Console.`;
    return;
  }
  try {
    els.setupNote.textContent = 'Requesting Google Drive access…';
    await requestAccessToken('consent');
    setImportProgress('Opening folder…', 8);
    const folder = await getFolder(folderId);
    setImportProgress(`Scanning ${folder.name}…`, 15);
    media = await scanFolderTree(folderId, progress => {
      const estimate = Math.min(90, 15 + progress.media * 0.5);
      setImportProgress(`Found ${progress.media} media · ${progress.folders} folders`, estimate);
    });
    if (!media.length) throw new Error('No supported photos, videos or audio files were found in that folder.');
    demoActive = false;
    memories = createInitialMemoriesFromDrive(media, folder.name);
    state.lastFolderId = folderId;
    state.lastSync = new Date().toISOString();
    await persistMetadataBestEffort();
    setImportProgress(`Built ${media.length} media items`, 100);
    els.connectionStatus.textContent = `Connected · ${folder.name}`;
    toast(`Built ${media.length} media items from ${folder.name}`);
    setTimeout(() => hideModal(els.driveModal), 650);
    renderAll();
  } catch (error) {
    console.error(error);
    els.setupNote.textContent = error?.message || 'Could not connect to Google Drive.';
    setImportProgress('Import stopped', 0);
  }
}

function createInitialMemoriesFromDrive(items, folderName) {
  const sorted = [...items].sort((a,b) => new Date(a.createdTime) - new Date(b.createdTime));
  const groups = [];
  for (const item of sorted) {
    const time = new Date(item.createdTime).getTime();
    const previous = groups[groups.length - 1];
    if (!previous || Number.isNaN(time) || time - previous.lastTime > 36 * 60 * 60 * 1000) {
      groups.push({ id: crypto.randomUUID(), title: groups.length === 0 ? folderName : 'Memory chapter', mediaIds: [item.id], firstTime: item.createdTime, lastTime: time });
    } else {
      previous.mediaIds.push(item.id);
      previous.lastTime = time;
    }
  }
  return groups.map((group, index) => ({
    id: group.id,
    title: index === 0 ? folderName : `${folderName} · Chapter ${String(index + 1).padStart(2, '0')}`,
    description: 'Automatically grouped from your Drive timeline. Edit this later to make it yours.',
    startDate: group.firstTime,
    endDate: group.firstTime,
    coverMediaId: chooseCover(group.mediaIds, items)?.id,
    category: index === 0 ? 'Trips' : 'Memories',
    tags: [],
    mediaIds: group.mediaIds,
    location: '',
    theme: 'cinematic'
  }));
}

function chooseCover(ids, items) {
  const candidates = items.filter(item => ids.includes(item.id) && item.kind === 'image');
  candidates.sort((a,b) => ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0)));
  return candidates[0] || items.find(i => ids.includes(i.id));
}

async function persistMetadataBestEffort() {
  try {
    const previous = await downloadMetadataFile();
    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      folderId: state.lastFolderId,
      memories,
      categories: state.categories,
      settings: { theme: state.theme }
    };
    const result = await saveMetadataFile(payload, previous.file?.id || state.metadataFileId);
    state.metadataFileId = result.id;
    writeUiState(state);
  } catch (error) {
    console.warn('Metadata persistence skipped:', error);
  }
}

async function loadPersistedMetadata() {
  if (!isConfigured() || !state.lastFolderId) return;
  try {
    await requestAccessToken('');
    const saved = await downloadMetadataFile();
    if (saved.state?.memories?.length) {
      memories = saved.state.memories;
      if (Array.isArray(saved.state.categories)) state.categories = Array.from(new Set([...state.categories, ...saved.state.categories]));
      state.metadataFileId = saved.file?.id || null;
      writeUiState(state);
    }
  } catch { /* first run or session expired */ }
}

function setupSearch() {
  els.searchInput.addEventListener('input', debounce(() => {
    const query = els.searchInput.value.trim().toLowerCase();
    if (!query) {
      els.searchResults.innerHTML = '<div class="no-data">Search across filenames, memories, categories and tags.</div>';
      return;
    }
    const items = media.filter(item => {
      const haystack = [item.name, item.kind, ...(item.tags || []), ...(item.categories || [])].join(' ').toLowerCase();
      return haystack.includes(query);
    }).slice(0, 30);
    const memoryMatches = memories.filter(m => [m.title, m.description, m.category, m.location, ...(m.tags || [])].join(' ').toLowerCase().includes(query)).slice(0, 10);
    els.searchResults.innerHTML = [
      ...memoryMatches.map(m => `<div class="search-item" data-memory-id="${escapeHtml(m.id)}"><img src="${escapeHtml((media.find(x=>x.id===m.coverMediaId) || media[0])?.thumbnailUrl || '')}" alt=""><div><div class="search-item__title">${escapeHtml(m.title)}</div><div class="search-item__meta">Memory · ${escapeHtml(m.location || 'Archive')}</div></div><div class="search-item__kind">MEMORY</div></div>`),
      ...items.map(item => `<div class="search-item" data-media-id="${escapeHtml(item.id)}"><img src="${escapeHtml(item.thumbnailUrl || '')}" alt=""><div><div class="search-item__title">${escapeHtml(item.name)}</div><div class="search-item__meta">${escapeHtml(formatDate(item.createdTime))}</div></div><div class="search-item__kind">${escapeHtml(item.kind)}</div></div>`)
    ].join('') || '<div class="no-data">No matches.</div>';
    qsa('[data-memory-id]', els.searchResults).forEach(node => node.addEventListener('click', () => {
      const m = memories.find(x => String(x.id) === String(node.dataset.memoryId));
      if (m) { hideModal(els.searchModal); openMemoryStory(m, media, els.memoryModal, els.memoryStory); }
    }));
  }, 160));
}

function enableReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
  }, { threshold: .14 });
  qsa('.reveal').forEach(el => observer.observe(el));
}

function setupEvents() {
  ['buildMemoryBtn','ctaBuildBtn'].forEach(id => qs(`#${id}`).addEventListener('click', () => showModal(els.driveModal)));
  qs('#connectDriveBtn').addEventListener('click', connectDrive);
  qs('#demoBtn').addEventListener('click', () => { demoActive = true; media = demoMedia.map(i => ({...i})); memories = demoMemories.map(i => ({...i})); els.connectionStatus.textContent = 'Demo mode · local preview'; renderAll(); toast('Demo memory world loaded'); });
  qs('#openFeatured').addEventListener('click', () => openMemoryStory(memories[0], media, els.memoryModal, els.memoryStory));
  qs('#searchOpen').addEventListener('click', () => { showModal(els.searchModal); els.searchInput.focus(); });
  qs('#settingsOpen').addEventListener('click', () => {
    const action = demoActive && !isConfigured() ? 'Add your Google OAuth client ID in js/config.js first.' : 'Use the Drive import panel to reconnect or rescan a folder.';
    toast(action);
  });
  qsa('[data-close]').forEach(node => node.addEventListener('click', () => {
    const target = node.dataset.close;
    if (target === 'memoryModal') closeMemoryStory(els.memoryModal);
    else hideModal(qs(`#${target}`));
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      hideModal(els.driveModal); hideModal(els.searchModal); closeMemoryStory(els.memoryModal);
    }
  });
}

async function bootstrap() {
  renderAll();
  enableReveal();
  setupEvents();
  setupSearch();
  initGoogle();
  await loadPersistedMetadata();
  if (isConfigured()) {
    els.setupNote.textContent = 'Google Drive is configured. Connect a private folder to replace demo content.';
  } else {
    els.setupNote.innerHTML = 'Demo mode is active. To connect your private Drive later, add your Google Web client ID in <strong>js/config.js</strong>.';
  }
}

bootstrap();
