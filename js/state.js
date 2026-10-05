const STORAGE_KEY = "memories-gallery-ui-v1";

export const defaultState = {
  theme: "cinematic",
  selectedCategory: "All",
  favorites: [],
  memories: [],
  categories: ["Friends", "Family", "Love", "Colleagues", "Trips", "College", "Nature", "Favorites"],
  tags: [],
  lastFolderId: null,
  lastSync: null,
  metadataFileId: null
};

export function readUiState() {
  try {
    return { ...defaultState, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
  } catch {
    return { ...defaultState };
  }
}

export function writeUiState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    theme: state.theme,
    selectedCategory: state.selectedCategory,
    lastFolderId: state.lastFolderId,
    lastSync: state.lastSync,
    metadataFileId: state.metadataFileId
  }));
}

export function mergeStateWithUi(data, ui) {
  return {
    ...defaultState,
    ...data,
    ...ui,
    categories: Array.from(new Set([...(defaultState.categories || []), ...((data && data.categories) || [])]))
  };
}
