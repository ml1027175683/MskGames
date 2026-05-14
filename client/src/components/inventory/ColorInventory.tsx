import type { ColorStack, RgbColor } from '../../domain/rgb';
import { colorKey } from '../../domain/rgb';
import { formatRgb } from '../common/MosaicPreview';

export function ColorInventory({
  inventory,
  onSelectColor,
  selectedColor
}: {
  inventory: ColorStack[];
  onSelectColor: (color: RgbColor) => void;
  selectedColor: RgbColor | null;
}) {
  return (
    <div className="inventory" aria-label="颜色库存">
      {inventory.length === 0 ? (
        <p className="empty-state">正在等待第一块颜色矿石...</p>
      ) : (
        inventory.map((item) => {
          const rgb = formatRgb(item.color);
          const isSelected = selectedColor ? colorKey(selectedColor) === colorKey(item.color) : false;

          return (
            <button
              className={`inventory-item${isSelected ? ' selected' : ''}`}
              disabled={item.quantity <= 0}
              key={colorKey(item.color)}
              onClick={() => onSelectColor(item.color)}
              type="button"
            >
              <span className="swatch" style={{ background: rgb }} />
              <span>
                选择 RGB({item.color.r}, {item.color.g}, {item.color.b})
                {item.rarity ? <small>等级：{item.rarity.label}</small> : null}
              </span>
              <strong>x{item.quantity}</strong>
            </button>
          );
        })
      )}
    </div>
  );
}
