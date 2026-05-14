import { describe, expect, it } from 'vitest';
import {
  COLOR_RARITIES,
  REPRESENTATIVE_COLORS,
  createPixelHash,
  getColorRarityScore,
  mineColor,
  stackColors
} from './rgb';

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

  it('定义 7 个颜色掉落等级且总概率为 100%', () => {
    expect(COLOR_RARITIES.map((rarity) => rarity.label)).toEqual([
      '普通',
      '优良',
      '稀有',
      '精粹',
      '史诗',
      '传说',
      '棱晶'
    ]);
    expect(COLOR_RARITIES.reduce((sum, rarity) => sum + rarity.dropRate, 0)).toBeCloseTo(1);
  });

  it('每个等级都有一批代表色用于库存图鉴', () => {
    expect(REPRESENTATIVE_COLORS).toHaveLength(56);

    for (const rarity of COLOR_RARITIES) {
      expect(REPRESENTATIVE_COLORS.filter((item) => item.rarity.level === rarity.level)).toHaveLength(8);
    }
  });

  it('挖矿会先按概率抽取等级再生成合法 RGB', () => {
    const mined = mineColor(() => 0.999);

    expect(mined.rarity.label).toBe('棱晶');
    expect(REPRESENTATIVE_COLORS.some((item) => item.color.r === mined.color.r && item.color.g === mined.color.g && item.color.b === mined.color.b)).toBe(true);
    expect(mined.color.r).toBeGreaterThanOrEqual(0);
    expect(mined.color.r).toBeLessThanOrEqual(255);
    expect(mined.color.g).toBeGreaterThanOrEqual(0);
    expect(mined.color.g).toBeLessThanOrEqual(255);
    expect(mined.color.b).toBeGreaterThanOrEqual(0);
    expect(mined.color.b).toBeLessThanOrEqual(255);
  });
});
