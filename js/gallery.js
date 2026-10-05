import { escapeHtml, formatNumber, formatYear } from './utils.js';

export function renderFeatured(container, memory, media) {
  if (!memory) return;
  const cover = media.find(m => m.id === memory.coverMediaId) || media[0];
  container.innerHTML = `
    <div class="feature-card__media">
      <img data-drive-image="${escapeHtml(cover?.id || '')}" data-src="${escapeHtml(cover?.thumbnailUrl || '')}" src="${cover?.thumbnailUrl ? escapeHtml(cover.thumbnailUrl) : 'assets/demo-1.svg'}" alt="${escapeHtml(cover?.name || memory.title)}" loading="eager">
    </div>
    <div class="feature-card__overlay">
      <div>
        <div class="eyebrow">${escapeHtml(memory.startDate || '')} · ${escapeHtml(memory.location || 'Personal archive')}</div>
        <div class="feature-card__title">${escapeHtml(memory.title)}</div>
        <div class="feature-card__meta">${formatNumber(memory.mediaIds?.length || 0)} pieces · ${escapeHtml(memory.category || 'Memory')}</div>
      </div>
      <div class="feature-card__badge">ENTER MEMORY ↗</div>
    </div>`;
}

export function renderMemoryGrid(container, memories, media) {
  container.innerHTML = memories.map((memory, index) => {
    const cover = media.find(m => m.id === memory.coverMediaId) || media.find(m => memory.mediaIds?.includes(m.id)) || media[0];
    return `<article class="memory-card reveal is-visible" data-memory-id="${escapeHtml(memory.id)}">
      <div class="memory-card__media"><img data-drive-image="${escapeHtml(cover?.id || '')}" data-src="${escapeHtml(cover?.thumbnailUrl || '')}" src="${cover?.thumbnailUrl ? escapeHtml(cover.thumbnailUrl) : 'assets/demo-1.svg'}" alt="${escapeHtml(memory.title)}" loading="lazy"></div>
      <div class="memory-card__body">
        <div class="memory-card__year">${escapeHtml(formatYear(memory.startDate))} · ${escapeHtml(memory.category || 'Memory')}</div>
        <div class="memory-card__title">${escapeHtml(memory.title)}</div>
        <div class="memory-card__count">${formatNumber(memory.mediaIds?.length || 0)} moments</div>
      </div>
    </article>`;
  }).join('');
}

export function renderTimeline(container, memories) {
  const sorted = [...memories].sort((a,b) => new Date(b.startDate) - new Date(a.startDate));
  container.innerHTML = sorted.map(memory => `
    <article class="timeline-item" data-memory-id="${escapeHtml(memory.id)}">
      <div class="timeline-item__year">${escapeHtml(formatYear(memory.startDate))}</div>
      <div>
        <div class="timeline-item__title">${escapeHtml(memory.title)}</div>
        <div class="timeline-item__meta">${escapeHtml(memory.location || 'Personal archive')} · ${formatNumber(memory.mediaIds?.length || 0)} moments</div>
      </div>
    </article>`).join('');
}

export function renderArchive(container, media) {
  container.innerHTML = media.slice(0, 40).map((item, index) => `
    <article class="masonry-card" data-media-id="${escapeHtml(item.id)}">
      <img data-drive-image="${escapeHtml(item.id)}" data-src="${escapeHtml(item.thumbnailUrl || '')}" src="${item.thumbnailUrl ? escapeHtml(item.thumbnailUrl) : 'assets/demo-1.svg'}" alt="${escapeHtml(item.name)}" loading="lazy">
      <span class="masonry-card__tag">${escapeHtml(item.kind)}</span>
    </article>`).join('');
}

export function renderStats(container, media, memories) {
  const counts = media.reduce((acc, item) => { acc[item.kind] = (acc[item.kind] || 0) + 1; return acc; }, {});
  container.innerHTML = [
    ['memories', memories.length], ['photos', counts.image || 0], ['videos', counts.video || 0], ['audio', counts.audio || 0]
  ].map(([label, value]) => `<div class="stat"><strong>${formatNumber(value)}</strong><span>${label}</span></div>`).join('');
}
