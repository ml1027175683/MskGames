import './styles.css';
import { useEffect, useState } from 'react';
import type { ColorStack, RgbColor } from './domain/rgb';

const canvasSize = 16;
const pixelCount = canvasSize * canvasSize;
const miningIntervalMs = 1500;

function App() {
  const [inventory, setInventory] = useState<ColorStack[]>([]);
  const [selectedColor, setSelectedColor] = useState<RgbColor | null>(null);
  const [pixels, setPixels] = useState<Array<RgbColor | null>>(() => Array(pixelCount).fill(null));
  const [minedCount, setMinedCount] = useState(0);
  const [log, setLog] = useState<string[]>(['矿机已启动，正在扫描 RGB 光谱。']);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const color = createRandomColor();

      setInventory((current) => addColorToInventory(current, color));
      setSelectedColor((current) => current ?? color);
      setMinedCount((current) => current + 1);
      pushLog(setLog, `挖到 RGB(${color.r}, ${color.g}, ${color.b})`);
    }, miningIntervalMs);

    return () => window.clearInterval(interval);
  }, []);

  const colorKinds = inventory.filter((item) => item.quantity > 0).length;
  const filledPixels = pixels.filter(Boolean).length;

  function fillPixel(index: number) {
    if (!selectedColor) {
      pushLog(setLog, '请先选择一个库存颜色。');
      return;
    }

    const selectedKey = colorKey(selectedColor);
    const selectedStack = inventory.find((item) => colorKey(item.color) === selectedKey);

    if (!selectedStack || selectedStack.quantity <= 0) {
      pushLog(setLog, '库存不足，等待矿机产出更多颜色。');
      return;
    }

    setPixels((current) => current.map((pixel, pixelIndex) => (pixelIndex === index ? selectedColor : pixel)));
    setInventory((current) =>
      current.map((item) =>
        colorKey(item.color) === selectedKey ? { ...item, quantity: item.quantity - 1 } : item
      )
    );
    pushLog(setLog, `像素 #${index + 1} 已填充，库存已消耗 1 个颜色。`);
  }

  return (
    <main className="game-shell">
      <section className="status-bar" aria-label="游戏状态">
        <div>
          <p className="eyebrow">Live RGB Mining</p>
          <h1>RGB 马赛克矿场</h1>
        </div>

        <div className="status-grid">
          <StatusItem label="挖矿状态" value="自动挖矿中" />
          <StatusItem label="已挖颜色" value={String(minedCount)} />
          <StatusItem label="库存种类" value={String(colorKinds)} />
          <StatusItem label="已填像素" value={`${filledPixels}/${pixelCount}`} />
        </div>
      </section>

      <section className="game-layout">
        <aside className="panel mining-panel" aria-label="挖矿和库存">
          <div className="panel-heading">
            <span className="pulse" aria-hidden="true" />
            <h2>自动挖矿中</h2>
          </div>
          <p className="panel-copy">每 {miningIntervalMs / 1000} 秒自动获得一个真实 RGB 颜色。点击库存颜色，把它刷到右侧画布。</p>

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
                    onClick={() => setSelectedColor(item.color)}
                    type="button"
                  >
                    <span className="swatch" style={{ background: rgb }} />
                    <span>选择 RGB({item.color.r}, {item.color.g}, {item.color.b})</span>
                    <strong>x{item.quantity}</strong>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="canvas-panel panel">
          <div className="panel-heading split-heading">
            <h2>16x16 像素画布</h2>
            <span>{selectedColor ? `当前画笔 ${formatRgb(selectedColor)}` : '未选择颜色'}</span>
          </div>

          <div className="pixel-canvas" aria-label="16x16 像素画布">
            {pixels.map((pixel, index) => (
              <button
                aria-label={pixel ? `已填充 ${formatRgb(pixel)}` : `空像素 ${index + 1}`}
                className="pixel"
                key={index}
                onClick={() => fillPixel(index)}
                style={{ background: pixel ? formatRgb(pixel) : undefined }}
                type="button"
              />
            ))}
          </div>
        </section>

        <aside className="panel log-panel" aria-label="操作日志">
          <h2>矿场日志</h2>
          <ol>
            {log.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ol>
        </aside>
      </section>
    </main>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <article className="status-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function addColorToInventory(inventory: ColorStack[], color: RgbColor): ColorStack[] {
  const key = colorKey(color);
  const existing = inventory.find((item) => colorKey(item.color) === key);

  if (existing) {
    return inventory.map((item) => (colorKey(item.color) === key ? { ...item, quantity: item.quantity + 1 } : item));
  }

  return [{ color, quantity: 1 }, ...inventory];
}

function createRandomColor(): RgbColor {
  return {
    r: randomChannel(),
    g: randomChannel(),
    b: randomChannel()
  };
}

function randomChannel(): number {
  return Math.floor(Math.random() * 256);
}

function colorKey(color: RgbColor): string {
  return `${color.r},${color.g},${color.b}`;
}

function formatRgb(color: RgbColor): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function pushLog(setLog: (updater: (current: string[]) => string[]) => void, message: string) {
  setLog((current) => [message, ...current].slice(0, 8));
}

export default App;
