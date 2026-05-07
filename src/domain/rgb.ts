export type RgbColor = {
  r: number;
  g: number;
  b: number;
};

export type ColorStack = {
  color: RgbColor;
  quantity: number;
};

export type PixelMatrixInput = {
  width: number;
  height: number;
  pixels: RgbColor[];
};

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

function colorKey(color: RgbColor): string {
  return `${color.r},${color.g},${color.b}`;
}
