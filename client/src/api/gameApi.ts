import { COLOR_RARITIES } from '../domain/rgb';
import type { ColorRarity, ColorStack, MinedColor } from '../domain/rgb';

type BackendColor = {
  red: number;
  green: number;
  blue: number;
  rarity: string;
};

type BackendInventoryItem = {
  color: BackendColor;
  quantity: number;
};

type BackendInventoryResponse = {
  items: BackendInventoryItem[];
};

export type AuthUser = {
  id: number;
  username: string;
  displayName: string;
};

export type AuthResult = {
  user: AuthUser;
  token: string;
};

const backendRarityLabels: Record<string, string> = {
  common: '普通',
  uncommon: '优良',
  rare: '稀有',
  refined: '精粹',
  epic: '史诗',
  legendary: '传说',
  prismatic: '棱晶'
};

export async function register(input: { username: string; displayName: string; password: string }): Promise<AuthResult> {
  const response = await fetch('/api/v1/auth/register', {
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST'
  });
  assertOk(response);

  return await response.json() as AuthResult;
}

export async function login(input: { username: string; password: string }): Promise<AuthResult> {
  const response = await fetch('/api/v1/auth/login', {
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST'
  });
  assertOk(response);

  return await response.json() as AuthResult;
}

export async function mineBackendColor(token: string): Promise<MinedColor> {
  const response = await fetch('/api/v1/mining/tick', { headers: authorizationHeader(token), method: 'POST' });
  assertOk(response);

  return toMinedColor(await response.json() as BackendColor);
}

export async function fetchBackendColorInventory(token: string): Promise<ColorStack[]> {
  const response = await fetch('/api/v1/inventory/colors', { headers: authorizationHeader(token) });
  assertOk(response);

  const payload = await response.json() as BackendInventoryResponse;

  return payload.items.map((item) => ({
    color: toRgbColor(item.color),
    quantity: item.quantity,
    rarity: toColorRarity(item.color.rarity)
  }));
}

function toMinedColor(color: BackendColor): MinedColor {
  return {
    color: toRgbColor(color),
    rarity: toColorRarity(color.rarity)
  };
}

function toRgbColor(color: BackendColor) {
  return { r: color.red, g: color.green, b: color.blue };
}

function toColorRarity(rarityKey: string): ColorRarity {
  const label = backendRarityLabels[rarityKey] ?? rarityKey;

  return COLOR_RARITIES.find((rarity) => rarity.label === label) ?? COLOR_RARITIES[0];
}

function assertOk(response: Response) {
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
}

function authorizationHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
