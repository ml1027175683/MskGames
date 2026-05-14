import type { ColorRarity, ColorStack, RgbColor } from '../domain/rgb';

export type Page = 'mining' | 'inventory' | 'canvas';
export type InventoryTab = 'colors' | 'artworks' | 'assets';
export type AssetSortOrder = 'newest' | 'oldest';
export type CanvasZoom = 50 | 100 | 200 | 400 | 800 | 1600 | 3200;

export type MiningRecord = {
  id: string;
  color: RgbColor;
  rarity: ColorRarity;
  createdAt: number;
};

export type MosaicWork = {
  id: string;
  title: string;
  status: 'draft' | 'certified' | 'archived';
  width: number;
  height: number;
  pixels: Array<RgbColor | null>;
  updatedAt: number;
  archivedKey?: string;
};

export type MosaicAsset = {
  id: string;
  workId: string;
  title: string;
  pixelHash: string;
  creatorId: string;
  ownerId: string;
  certifiedAt: number;
};

export type CertificationScan = {
  asset?: MosaicAsset;
  phase: 'scanning' | 'complete';
  work: MosaicWork;
};

export type SavedGame = {
  activeWorkId: string | null;
  artworks: MosaicWork[];
  assets: MosaicAsset[];
  inventory: ColorStack[];
  minedCount: number;
  selectedArtworkId: string;
};
