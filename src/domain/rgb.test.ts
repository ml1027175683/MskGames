import { describe, expect, it } from 'vitest';
import { createPixelHash, getColorRarityScore, stackColors } from './rgb';

describe('RGB 颜色领域规则', () => {
  it('会把相同 RGB 颜色按数量叠加', () => {
    const stacks = stackColors([
      { r: 255, g: 0, b: 0 },
      { r: 12, g: 98, b: 201 },
      { r: 255, g: 0, b: 0 }
    ]);

    expect(stacks).toEqual([
      { color: { r: 255, g: 0, b: 0 }, quantity: 2 },
      { color: { r: 12, g: 98, b: 201 }, quantity: 1 }
    ]);
  });

  it('相同尺寸和相同有序像素矩阵会生成相同唯一指纹', async () => {
    const pixels = [
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 },
      { r: 12, g: 98, b: 201 },
      { r: 255, g: 0, b: 0 }
    ];

    await expect(createPixelHash({ width: 2, height: 2, pixels })).resolves.toBe(
      await createPixelHash({ width: 2, height: 2, pixels })
    );
  });

  it('相同像素但尺寸不同会生成不同唯一指纹', async () => {
    const pixels = [
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 },
      { r: 12, g: 98, b: 201 },
      { r: 255, g: 0, b: 0 }
    ];

    await expect(createPixelHash({ width: 2, height: 2, pixels })).resolves.not.toBe(
      await createPixelHash({ width: 4, height: 1, pixels })
    );
  });

  it('极端且高饱和 RGB 会得到更高稀有度分数', () => {
    expect(getColorRarityScore({ r: 255, g: 0, b: 0 })).toBeGreaterThan(
      getColorRarityScore({ r: 128, g: 128, b: 128 })
    );
  });
});
