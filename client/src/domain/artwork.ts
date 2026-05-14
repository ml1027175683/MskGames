import type { RgbColor } from './rgb';
import type { MosaicAsset, MosaicWork } from '../types/game';

export const canvasSize = 16;
export const pixelCount = canvasSize * canvasSize;

let blankDraftSequence = 0;

const goblinPalette: Record<string, RgbColor | null> = {
  '.': null,
  B: { r: 1, g: 1, b: 2 },
  K: { r: 0, g: 0, b: 0 },
  G: { r: 72, g: 152, b: 96 },
  L: { r: 34, g: 204, b: 112 },
  R: { r: 255, g: 16, b: 16 },
  Y: { r: 246, g: 226, b: 18 },
  P: { r: 126, g: 88, b: 176 }
};

const goblinAvatarPattern = [
  '................',
  '......KKKK......',
  '....KKGGGGKK....',
  '...KGGLGGLGGK...',
  '..KGGGLLLLGGGK..',
  '.KGGKRRKKRRKGGK.',
  'KGGGKRRKKRRKGGGK',
  'KGGGGGKKKKGGGGGK',
  'KGGGGGYYYYGGGGGK',
  '.KGGGGGKKGGGGGK.',
  '..KGGGPPPPGGGK..',
  '...KKGPPPPGKK...',
  '....KGGGGGGK....',
  '.....KGGGGK.....',
  '......KKKK......',
  '................'
];

const pikachuPalette: Record<string, RgbColor | null> = {
  W: { r: 255, g: 255, b: 255 },
  K: { r: 0, g: 0, b: 0 },
  Y: { r: 255, g: 255, b: 16 },
  R: { r: 255, g: 16, b: 16 }
};

const pikachuPattern = [
  'WWWWWWWWWWWWWWWW',
  'WWWWKWWWWWWKWWWW',
  'WWWKKWWWWWWKKWWW',
  'WWWKYYWWWWYYKWWW',
  'WWWKYYYYYYYYKWWW',
  'WWWYYYYYYYYYYWWW',
  'WWYYYYYYYYYYYYWW',
  'WWYYKKYYYYKKYYWW',
  'WWYYKKYYYYKKYYWW',
  'WWYYYRRYYRRYYYWW',
  'WWWYYYYKKYYYYWWW',
  'WWWYYYYYYYYYYWWW',
  'WWWWYYYYYYYYWWWW',
  'WWWWKYYYYYYKWWWW',
  'WWWWKKWWWWKKWWWW',
  'WWWWWWWWWWWWWWWW'
];

export function createEmptyDraft(): MosaicWork {
  return {
    id: 'current-draft',
    title: '当前待鉴定作品',
    status: 'draft',
    width: canvasSize,
    height: canvasSize,
    pixels: createGoblinAvatarPixels(),
    updatedAt: Date.now()
  };
}

export function createBlankDraft(title: string): MosaicWork {
  const createdAt = Date.now();
  blankDraftSequence += 1;

  return {
    id: `blank-draft-${createdAt}-${blankDraftSequence}`,
    title,
    status: 'draft',
    width: canvasSize,
    height: canvasSize,
    pixels: Array.from({ length: pixelCount }, () => null),
    updatedAt: createdAt
  };
}

export function createGoblinAvatarPixels(): Array<RgbColor | null> {
  return createPatternPixels(goblinAvatarPattern, goblinPalette);
}

export function createPikachuWork(): MosaicWork {
  return {
    id: 'pikachu-icon',
    title: '皮卡丘像素图标',
    status: 'draft',
    width: canvasSize,
    height: canvasSize,
    pixels: createPatternPixels(pikachuPattern, pikachuPalette),
    updatedAt: Date.now()
  };
}

export function createPatternPixels(pattern: string[], palette: Record<string, RgbColor | null>): Array<RgbColor | null> {
  if (pattern.length !== canvasSize) {
    throw new Error(`像素图案必须包含 ${canvasSize} 行`);
  }

  return pattern.flatMap((row, rowIndex) => {
    if (row.length !== canvasSize) {
      throw new Error(`像素图案第 ${rowIndex + 1} 行必须包含 ${canvasSize} 个标记`);
    }

    return row.split('').map((token) => {
      if (!(token in palette)) {
        throw new Error(`像素图案包含未知标记 ${token}`);
      }

      return palette[token];
    });
  });
}

export function formatAssetDisplayId(asset: MosaicAsset): string {
  return `asset-${asset.workId}`;
}
