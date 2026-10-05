import { CONFIG } from './config.js';
import { getAccessToken, requestAccessToken } from './auth.js';
import { isImage, isVideo, isAudio } from './utils.js';

const DRIVE_BASE = 'https://www.googleapis.com/drive/v3';

async function driveFetch(path, options = {}, retry = true) {
  let token = getAccessToken();
  if (!token) token = await requestAccessToken('');
  const response = await fetch(`${DRIVE_BASE}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
  if (response.status === 401 && retry) {
    await requestAccessToken('');
    return driveFetch(path, options, false);
  }
  if (!response.ok) {
    let detail = '';
    try { detail = (await response.json())?.error?.message || ''; } catch {}
    throw new Error(detail || `Google Drive request failed (${response.status}).`);
  }
  return response.json();
}

async function listChildren(folderId) {
  const all = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      pageSize: String(CONFIG.mediaPageSize),
      fields: 'nextPageToken,files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink,createdTime,modifiedTime,size,imageMediaMetadata,videoMediaMetadata,parents)',
      orderBy: 'name_natural'
    });
    if (pageToken) params.set('pageToken', pageToken);
    const data = await driveFetch(`/files?${params.toString()}`);
    all.push(...(data.files || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return all;
}

export async function getFolder(folderId) {
  const params = new URLSearchParams({
    fields: 'id,name,mimeType,modifiedTime,webViewLink',
    supportsAllDrives: 'true'
  });
  return driveFetch(`/files/${encodeURIComponent(folderId)}?${params.toString()}`);
}

export async function scanFolderTree(rootId, onProgress = () => {}) {
  const queue = [rootId];
  const visited = new Set();
  const media = [];
  let folders = 0;
  while (queue.length) {
    const folderId = queue.shift();
    if (visited.has(folderId)) continue;
    visited.add(folderId);
    const children = await listChildren(folderId);
    folders += 1;
    for (const file of children) {
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        queue.push(file.id);
      } else if (isImage(file.mimeType) || isVideo(file.mimeType) || isAudio(file.mimeType)) {
        media.push(file);
      }
    }
    onProgress({ folders, media: media.length, pending: queue.length });
  }
  return media.map(normalizeDriveFile);
}

export function normalizeDriveFile(file) {
  const kind = isImage(file.mimeType) ? 'image' : isVideo(file.mimeType) ? 'video' : 'audio';
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    kind,
    createdTime: file.createdTime || file.modifiedTime,
    modifiedTime: file.modifiedTime,
    thumbnailUrl: file.thumbnailLink || '',
    viewUrl: file.webViewLink || `https://drive.google.com/open?id=${file.id}`,
    contentUrl: file.webContentLink || '',
    width: file.imageMediaMetadata?.width || file.videoMediaMetadata?.width || null,
    height: file.imageMediaMetadata?.height || file.videoMediaMetadata?.height || null,
    durationMs: file.videoMediaMetadata?.durationMillis || null,
    camera: file.imageMediaMetadata?.cameraMake || file.imageMediaMetadata?.cameraModel || null,
    location: null,
    tags: [],
    categories: [],
    favorite: false
  };
}

export async function downloadMetadataFile() {
  const params = new URLSearchParams({
    q: `name = '${CONFIG.metadataFilename.replace(/'/g, "\\'")}' and 'appDataFolder' in parents and trashed = false`,
    spaces: 'appDataFolder',
    pageSize: '10',
    fields: 'files(id,name,mimeType,modifiedTime)'
  });
  const data = await driveFetch(`/files?${params.toString()}`);
  const file = data.files?.[0];
  if (!file) return { file: null, state: null };
  const token = getAccessToken();
  const res = await fetch(`${DRIVE_BASE}/files/${file.id}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Could not read the saved memory state from Drive.');
  return { file, state: await res.json() };
}

export async function saveMetadataFile(state, existingFileId = null) {
  const token = getAccessToken();
  if (!token) throw new Error('Google Drive is not connected.');
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const metadata = { name: CONFIG.metadataFilename, parents: ['appDataFolder'], mimeType: 'application/json' };
  const boundary = `-------memories-${crypto.randomUUID()}`;
  const body = await buildMultipartBody(metadata, blob, boundary);
  const path = existingFileId ? `/files/${existingFileId}?uploadType=multipart` : '/files?uploadType=multipart';
  const method = existingFileId ? 'PATCH' : 'POST';
  const res = await fetch(`${DRIVE_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body
  });
  if (!res.ok) throw new Error('Could not save memory organization to Drive app data.');
  return res.json();
}

async function buildMultipartBody(metadata, blob, boundary) {
  const enc = new TextEncoder();
  const a = enc.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n`);
  const b = enc.encode(`\r\n--${boundary}--`);
  const media = new Uint8Array(await blob.arrayBuffer());
  const combined = new Uint8Array(a.length + media.length + b.length);
  combined.set(a, 0); combined.set(media, a.length); combined.set(b, a.length + media.length);
  return combined;
}
