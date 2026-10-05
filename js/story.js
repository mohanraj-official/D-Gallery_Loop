import { escapeHtml, formatNumber } from './utils.js';

export function openMemoryStory(memory, media, modal, container) {
  const items = media.filter(item => memory.mediaIds?.includes(item.id));
  const cover = items.find(item => item.id === memory.coverMediaId) || items[0];
  container.innerHTML = `
    <article class="story">
      <div class="story__hero">
        <img data-drive-image="${escapeHtml(cover?.id || '')}" data-src="${escapeHtml(cover?.thumbnailUrl || '')}" src="${cover?.thumbnailUrl ? escapeHtml(cover.thumbnailUrl) : 'assets/demo-1.svg'}" alt="${escapeHtml(memory.title)}">
        <div class="story__hero-copy">
          <div class="eyebrow">${escapeHtml(memory.startDate || '')} · ${escapeHtml(memory.location || 'Memory')}</div>
          <h3>${escapeHtml(memory.title)}</h3>
          <div class="memory-card__count">${formatNumber(items.length)} moments · ${escapeHtml(memory.category || 'Personal archive')}</div>
        </div>
      </div>
      <div class="story__body">
        <p class="story__desc">${escapeHtml(memory.description || 'A collection of moments, kept together.')}</p>
        <div class="chip-row" style="justify-content:flex-start; margin-top:16px;">${(memory.tags || []).map(tag => `<span class="chip">#${escapeHtml(tag)}</span>`).join('')}</div>
        <div class="story__media">
          ${items.map(item => renderStoryMedia(item)).join('')}
        </div>
        ${items.some(i => i.kind === 'audio') ? `<div class="story__audio">${items.filter(i=>i.kind==='audio').map(i=>`<audio controls src="${escapeHtml(i.contentUrl || i.viewUrl)}"></audio>`).join('')}</div>` : ''}
      </div>
    </article>`;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden','false');
}

function renderStoryMedia(item) {
  if (item.kind === 'video') {
    return `<div class="story__media-item"><video controls preload="metadata" poster="${escapeHtml(item.thumbnailUrl || '')}" src="${escapeHtml(item.contentUrl || '')}"></video></div>`;
  }
  if (item.kind === 'audio') return '';
  return `<div class="story__media-item"><img loading="lazy" data-drive-image="${escapeHtml(item.id)}" data-src="${escapeHtml(item.thumbnailUrl || '')}" src="${item.thumbnailUrl ? escapeHtml(item.thumbnailUrl) : 'assets/demo-1.svg'}" alt="${escapeHtml(item.name)}" data-media-id="${escapeHtml(item.id)}"></div>`;
}

export function closeMemoryStory(modal) {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden','true');
}
