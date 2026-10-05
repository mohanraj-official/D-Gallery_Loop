import { CONFIG } from './config.js';

let tokenClient = null;
let accessToken = null;
let readyPromiseResolve;
const readyPromise = new Promise(resolve => { readyPromiseResolve = resolve; });

export function isConfigured() {
  return Boolean(CONFIG.googleClientId && !CONFIG.googleClientId.startsWith('YOUR_'));
}

export async function initGoogle() {
  if (!isConfigured()) {
    readyPromiseResolve(false);
    return false;
  }
  const deadline = Date.now() + 12000;
  while (!(window.google?.accounts?.oauth2) && Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 120));
  }
  if (!window.google?.accounts?.oauth2) {
    readyPromiseResolve(false);
    return false;
  }
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.googleClientId,
    scope: CONFIG.driveScope,
    callback: () => {}
  });
  readyPromiseResolve(true);
  return true;
}

export async function ensureGoogleReady() {
  const loaded = await readyPromise;
  if (!loaded) return false;
  return true;
}

export async function requestAccessToken(prompt = '') {
  if (!(await ensureGoogleReady()) || !tokenClient) {
    throw new Error('Google OAuth is not configured. Add your client ID in js/config.js.');
  }
  return new Promise((resolve, reject) => {
    tokenClient.callback = response => {
      if (response?.error) {
        reject(new Error(response.error_description || response.error));
        return;
      }
      accessToken = response.access_token;
      resolve(accessToken);
    };
    tokenClient.requestAccessToken({ prompt });
  });
}

export function getAccessToken() { return accessToken; }

export function revokeAccess() {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
}
