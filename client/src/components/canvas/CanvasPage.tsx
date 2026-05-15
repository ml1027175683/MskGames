import { useState } from 'react';
import type { FormEvent } from 'react';
import { COLOR_RARITIES, REPRESENTATIVE_COLORS, colorKey } from '../../domain/rgb';
import type { ColorStack, RepresentativeColor, RgbColor } from '../../domain/rgb';
import type { CanvasZoom, MosaicWork } from '../../types/game';
import { formatRgb } from '../common/MosaicPreview';
import { ColorInventory } from '../inventory/ColorInventory';

const canvasZoomLevels: CanvasZoom[] = [50, 100, 200, 400, 800, 1600, 3200];
type CanvasColorEntry = ColorStack & RepresentativeColor;

export function CanvasPage({
  currentDraft,
  draftWorkCount,
  draftWorks,
  inventory,
  maxDraftWorks,
  message,
  onCreateWork,
  onFillPixel,
  onSelectCanvasDraft,
  onSelectColor,
  selectedColor
}: {
  currentDraft: MosaicWork | null;
  draftWorkCount: number;
  draftWorks: MosaicWork[];
  inventory: ColorStack[];
  maxDraftWorks: number;
  message: string;
  onCreateWork: (title: string) => void;
  onFillPixel: (index: number) => void;
  onSelectCanvasDraft: (workId: string) => void;
  onSelectColor: (color: RgbColor) => void;
  selectedColor: RgbColor | null;
}) {
  const [canvasZoom, setCanvasZoom] = useState<CanvasZoom>(100);
  const [isNewWorkModalOpen, setIsNewWorkModalOpen] = useState(false);
  const [showAllCanvasColors, setShowAllCanvasColors] = useState(false);
  const [newWorkTitle, setNewWorkTitle] = useState('');
  const hasReachedDraftLimit = draftWorkCount >= maxDraftWorks;
  const backendOnlyColors: CanvasColorEntry[] = inventory
    .filter((stack) => !REPRESENTATIVE_COLORS.some((item) => colorKey(item.color) === colorKey(stack.color)))
    .map((stack) => ({ color: stack.color, quantity: stack.quantity, rarity: stack.rarity ?? COLOR_RARITIES[0] }));
  const canvasColorCatalog: CanvasColorEntry[] = [...backendOnlyColors, ...REPRESENTATIVE_COLORS.map((item) => {
    const owned = inventory.find((stack) => colorKey(stack.color) === colorKey(item.color));

    return {
      ...item,
      quantity: owned?.quantity ?? 0
    };
  })];
  const canvasColors = showAllCanvasColors ? canvasColorCatalog : canvasColorCatalog.filter((item) => item.quantity > 0);

  function changeCanvasZoom(direction: -1 | 1) {
    setCanvasZoom((current) => {
      const currentIndex = canvasZoomLevels.indexOf(current);
      const nextIndex = Math.max(0, Math.min(canvasZoomLevels.length - 1, currentIndex + direction));

      return canvasZoomLevels[nextIndex];
    });
  }

  function submitNewWork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreateWork(newWorkTitle);
    setNewWorkTitle('');
    setIsNewWorkModalOpen(false);
  }

  return (
    <section className="canvas-layout">
      <aside className="panel">
        <div className="section-heading-row">
          <h2>可用色块</h2>
          <button className="filter-toggle" onClick={() => setShowAllCanvasColors((current) => !current)} type="button">
            {showAllCanvasColors ? '仅显示可用颜色' : '显示全部颜色'}
          </button>
        </div>
        <p className="panel-copy">选择颜色后点击画布。每次填色都会自动保存为待鉴定作品。</p>
        <ColorInventory inventory={canvasColors} onSelectColor={onSelectColor} selectedColor={selectedColor} />
      </aside>

      <section className="canvas-panel panel">
        <div className="panel-heading split-heading">
          <h2>16x16 像素画布</h2>
          <span>{selectedColor ? `当前画笔 ${formatRgb(selectedColor)}` : '未选择颜色'}</span>
        </div>

        <div className="canvas-work-actions">
          <button disabled={hasReachedDraftLimit} onClick={() => setIsNewWorkModalOpen(true)} type="button">新建画作</button>
          <label>
            <span>选择未鉴定画作</span>
            <select aria-label="选择未鉴定画作" onChange={(event) => onSelectCanvasDraft(event.target.value)} value={currentDraft?.id ?? ''}>
              <option value="">从未鉴定作品中选择</option>
              {draftWorks.map((work) => (
                <option key={work.id} value={work.id}>{work.title}</option>
              ))}
            </select>
          </label>
        </div>

        {hasReachedDraftLimit ? <p className="limit-message">未鉴定作品已达 5 个，请先鉴定或删除草稿。</p> : null}

        {!currentDraft ? (
          <div className="canvas-empty-state">
            <h3>还没有选择画作</h3>
            <p>点击新建画作，或从上方未鉴定画作列表直接进入创作。</p>
          </div>
        ) : (
          <>
            <div className="canvas-tools" aria-label="画布缩放控制">
              <button aria-label="缩小画布" disabled={canvasZoom === 50} onClick={() => changeCanvasZoom(-1)} type="button">
                <span className="magnifier-icon zoom-out" aria-hidden="true" />
              </button>
              <span className="zoom-percent">{canvasZoom}%</span>
              <button aria-label="放大画布" disabled={canvasZoom === 3200} onClick={() => changeCanvasZoom(1)} type="button">
                <span className="magnifier-icon zoom-in" aria-hidden="true" />
              </button>
            </div>

            <div className="canvas-stage" aria-label="画布显示区域" data-zoom={canvasZoom}>
              <div className="pixel-canvas" aria-label="16x16 像素画布" data-zoom={canvasZoom}>
                {currentDraft.pixels.map((pixel, index) => (
                  <button
                    aria-label={pixel ? `已填充 ${formatRgb(pixel)}` : `空像素 ${index + 1}`}
                    className="pixel"
                    key={index}
                    onClick={() => onFillPixel(index)}
                    style={{ background: pixel ? formatRgb(pixel) : undefined }}
                    type="button"
                  />
                ))}
              </div>
            </div>
          </>
        )}

        <p className="autosave-message">{message}</p>
      </section>
      {isNewWorkModalOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="新建画作">
          <form className="new-work-modal" onSubmit={submitNewWork}>
            <h2>新建画作</h2>
            <label htmlFor="new-work-title">新作品名称</label>
            <input autoFocus id="new-work-title" onChange={(event) => setNewWorkTitle(event.target.value)} placeholder="输入作品名称" value={newWorkTitle} />
            <div className="modal-actions">
              <button onClick={() => setIsNewWorkModalOpen(false)} type="button">取消</button>
              <button disabled={newWorkTitle.trim().length === 0} type="submit">确认新建</button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
