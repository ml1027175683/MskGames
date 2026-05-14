export type RgbColor = {
  r: number;
  g: number;
  b: number;
};

export type ColorStack = {
  color: RgbColor;
  quantity: number;
  rarity?: ColorRarity;
};

export type ColorRarity = {
  level: number;
  label: string;
  dropRate: number;
};

export type MinedColor = {
  color: RgbColor;
  rarity: ColorRarity;
};

export type RepresentativeColor = {
  color: RgbColor;
  rarity: ColorRarity;
};

export type PixelMatrixInput = {
  width: number;
  height: number;
  pixels: RgbColor[];
};

export const COLOR_RARITIES: ColorRarity[] = [
  { level: 1, label: '普通', dropRate: 0.55 },
  { level: 2, label: '优良', dropRate: 0.25 },
  { level: 3, label: '稀有', dropRate: 0.12 },
  { level: 4, label: '精粹', dropRate: 0.05 },
  { level: 5, label: '史诗', dropRate: 0.02 },
  { level: 6, label: '传说', dropRate: 0.008 },
  { level: 7, label: '棱晶', dropRate: 0.002 }
];

export const REPRESENTATIVE_COLORS: RepresentativeColor[] = COLOR_RARITIES.flatMap((rarity) =>
  getRepresentativePalette(rarity.level).map((color) => ({ color, rarity }))
);

export function stackColors(colors: RgbColor[]): ColorStack[] {
  const stacks = new Map<string, ColorStack>();

  for (const color of colors) {
    const key = colorKey(color);
    const current = stacks.get(key);

    if (current) {
      current.quantity += 1;
    } else {
      stacks.set(key, { color, quantity: 1 });
    }
  }

  return Array.from(stacks.values());
}

export function mineColor(random: () => number = Math.random): MinedColor {
  const rarity = pickRarity(random());
  const palette = REPRESENTATIVE_COLORS.filter((item) => item.rarity.level === rarity.level);
  const picked = palette[randomInt(random, 0, palette.length - 1)];

  return {
    color: picked.color,
    rarity
  };
}

export async function createPixelHash(input: PixelMatrixInput): Promise<string> {
  const payload = JSON.stringify({
    width: input.width,
    height: input.height,
    pixels: input.pixels.map(colorKey)
  });
  const encoded = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-256', encoded);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function getColorRarityScore(color: RgbColor): number {
  const channels = [color.r, color.g, color.b];
  const extremeScore = channels.filter((value) => value === 0 || value === 255).length / 3;
  const max = Math.max(...channels);
  const min = Math.min(...channels);
  const saturationScore = max === 0 ? 0 : (max - min) / max;

  return Math.round((extremeScore * 0.6 + saturationScore * 0.4) * 100);
}

export function colorKey(color: RgbColor): string {
  return `${color.r},${color.g},${color.b}`;
}

function pickRarity(value: number): ColorRarity {
  let cursor = 0;

  for (const rarity of COLOR_RARITIES) {
    cursor += rarity.dropRate;

    if (value < cursor) {
      return rarity;
    }
  }

  return COLOR_RARITIES[COLOR_RARITIES.length - 1];
}

function getRepresentativePalette(level: number): RgbColor[] {
  const palettes: Record<number, RgbColor[]> = {
    1: [
      { r: 112, g: 118, b: 126 }, { r: 136, g: 128, b: 112 }, { r: 98, g: 121, b: 104 }, { r: 146, g: 142, b: 132 },
      { r: 84, g: 96, b: 118 }, { r: 154, g: 132, b: 116 }, { r: 118, g: 108, b: 128 }, { r: 132, g: 146, b: 138 }
    ],
    2: [
      { r: 72, g: 152, b: 96 }, { r: 82, g: 126, b: 184 }, { r: 188, g: 132, b: 74 }, { r: 162, g: 84, b: 128 },
      { r: 82, g: 174, b: 164 }, { r: 182, g: 178, b: 82 }, { r: 126, g: 88, b: 176 }, { r: 196, g: 104, b: 92 }
    ],
    3: [
      { r: 34, g: 204, b: 112 }, { r: 42, g: 156, b: 236 }, { r: 236, g: 96, b: 42 }, { r: 218, g: 42, b: 154 },
      { r: 44, g: 218, b: 218 }, { r: 220, g: 218, b: 52 }, { r: 136, g: 64, b: 232 }, { r: 232, g: 68, b: 82 }
    ],
    4: [
      { r: 10, g: 240, b: 112 }, { r: 12, g: 112, b: 248 }, { r: 248, g: 96, b: 10 }, { r: 246, g: 18, b: 166 },
      { r: 16, g: 238, b: 226 }, { r: 246, g: 226, b: 18 }, { r: 148, g: 18, b: 246 }, { r: 246, g: 30, b: 54 }
    ],
    5: [
      { r: 255, g: 16, b: 16 }, { r: 16, g: 255, b: 16 }, { r: 16, g: 16, b: 255 }, { r: 255, g: 255, b: 16 },
      { r: 16, g: 255, b: 255 }, { r: 255, g: 16, b: 255 }, { r: 255, g: 112, b: 16 }, { r: 112, g: 16, b: 255 }
    ],
    6: [
      { r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, { r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 }, { r: 255, g: 255, b: 0 }, { r: 0, g: 255, b: 255 }, { r: 255, g: 0, b: 255 }
    ],
    7: [
      { r: 255, g: 255, b: 254 }, { r: 1, g: 1, b: 2 }, { r: 255, g: 1, b: 1 }, { r: 1, g: 255, b: 1 },
      { r: 1, g: 1, b: 255 }, { r: 255, g: 254, b: 1 }, { r: 1, g: 255, b: 254 }, { r: 254, g: 1, b: 255 }
    ]
  };

  return palettes[level];
}

function randomInt(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}
