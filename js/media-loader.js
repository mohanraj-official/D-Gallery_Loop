import { getAccessToken } from './auth.js';

const blobUrlCache = new Map();

export async function hydrateDriveThumbnails(root = document) {
  const images = [...root.querySelectorAll('img[data-drive-image]')].filter(img => img.dataset.hydrated !== 'true');
  for (const img of images) {
    hydrateOne(img).catch(() => {
      img.dataset.hydrated = 'error';
    });
  }
}

async function hydrateOne(img) {
  const id = img.dataset.driveImage;
  if (!id || id.startsWith('demo-')) return;
  const token = getAccessToken();
  if (!token) return;
  if (blobUrlCache.has(id)) {
    img.src = blobUrlCache.get(id);
    img.dataset.hydrated = 'true';
    return;
  }
  const fallback = img.dataset.src;
  if (!fallback) return;
  const response = await fetch(fallback, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Thumbnail request failed: ${response.status}`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  blobUrlCache.set(id, url);
  img.src = url;
  img.dataset.hydrated = 'true';
}
