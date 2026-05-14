import { createEmptyDraft, createPikachuWork } from '../domain/artwork';
import type { SavedGame } from '../types/game';

export const saveKey = 'rgb-mosaic-save-v1';

export function createInitialGame(): SavedGame {
  const artworks = [createEmptyDraft(), createPikachuWork()];

  return {
    activeWorkId: 'current-draft',
    artworks,
    assets: [],
    inventory: [],
    minedCount: 0,
    selectedArtworkId: 'current-draft'
  };
}

export function loadSavedGame(): SavedGame {
  try {
    const rawSave = window.localStorage.getItem(saveKey);

    if (!rawSave) {
      return createInitialGame();
    }

    const parsed = JSON.parse(rawSave) as Partial<SavedGame>;

    if (!isSavedGame(parsed)) {
      return createInitialGame();
    }

    return normalizeSavedGame(parsed);
  } catch {
    return createInitialGame();
  }
}

export function normalizeSavedGame(game: SavedGame): SavedGame {
  const artworks = [...game.artworks];

  if (!artworks.some((work) => work.id === 'current-draft')) {
    artworks.push(createEmptyDraft());
  }

  if (!artworks.some((work) => work.id === 'pikachu-icon')) {
    artworks.push(createPikachuWork());
  }

  const activeWorkId = game.activeWorkId && artworks.some((work) => work.id === game.activeWorkId) ? game.activeWorkId : null;
  const selectedArtworkId = artworks.some((work) => work.id === game.selectedArtworkId) ? game.selectedArtworkId : artworks[0]?.id ?? '';

  return {
    ...game,
    activeWorkId,
    artworks,
    selectedArtworkId
  };
}

export function saveGame(game: SavedGame) {
  window.localStorage.setItem(saveKey, JSON.stringify(game));
}

export function isSavedGame(value: Partial<SavedGame>): value is SavedGame {
  return (
    Array.isArray(value.artworks) &&
    Array.isArray(value.assets) &&
    Array.isArray(value.inventory) &&
    typeof value.minedCount === 'number' &&
    typeof value.selectedArtworkId === 'string' &&
    (typeof value.activeWorkId === 'string' || value.activeWorkId === null)
  );
}
