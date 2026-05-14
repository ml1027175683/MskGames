import type { CSSProperties } from 'react';
import type { MosaicWork } from '../../types/game';
import type { RgbColor } from '../../domain/rgb';

export function MosaicPreview({
  className = '',
  currentDraft,
  label,
  style
}: {
  className?: string;
  currentDraft: MosaicWork;
  label: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`mosaic-preview ${className}`.trim()} aria-label={label} style={style}>
      {currentDraft.pixels.map((pixel, index) => (
        <span key={index} style={{ background: pixel ? formatRgb(pixel) : undefined }} />
      ))}
    </div>
  );
}

export function formatRgb(color: RgbColor): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}
