export function qs(selector, root = document) { return root.querySelector(selector); }
export function qsa(selector, root = document) { return [...root.querySelectorAll(selector)]; }
export function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}
export function formatNumber(value) { return new Intl.NumberFormat("en-IN").format(value || 0); }
export function formatDate(dateValue) {
  if (!dateValue) return "Unknown date";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}
export function formatYear(dateValue) {
  const d = new Date(dateValue);
  return Number.isNaN(d.getTime()) ? "—" : String(d.getFullYear());
}
export function extractDriveFolderId(url) {
  const text = String(url || "").trim();
  const direct = text.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (direct) return direct[1];
  const query = text.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return query ? query[1] : null;
}
export function isImage(mime = "") { return mime.startsWith("image/"); }
export function isVideo(mime = "") { return mime.startsWith("video/"); }
export function isAudio(mime = "") { return mime.startsWith("audio/"); }
export function mediaKind(mime = "") {
  if (isImage(mime)) return "image";
  if (isVideo(mime)) return "video";
  if (isAudio(mime)) return "audio";
  return "other";
}
export function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
export function debounce(fn, wait = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
export function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
