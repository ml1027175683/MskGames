import './styles.css';
import { useEffect, useState } from 'react';
import type { ColorStack, RgbColor } from './domain/rgb';

const canvasSize = 16;
const pixelCount = canvasSize * canvasSize;
const miningIntervalMs = 1500;

type Page = 'mining' | 'inventory' | 'canvas';

type MiningRecord = {
  id: string;
  color: RgbColor;
  createdAt: number;
};

type MosaicWork = {
  id: string;
  status: 'draft' | 'certified' | 'archived';
  width: number;
  height: number;
  pixels: Array<RgbColor | null>;
  updatedAt: number;
  archivedKey?: string;
};

const pageLabels: Record<Page, string> = {
  mining: '挖矿',
  inventory: '库存',
  canvas: '画布'
};

function App() {
  const [activePage, setActivePage] = useState<Page>('mining');
  const [inventory, setInventory] = useState<ColorStack[]>([]);
  const [selectedColor, setSelectedColor] = useState<RgbColor | null>(null);
  const [minedCount, setMinedCount] = useState(0);
  const [miningRecords, setMiningRecords] = useState<MiningRecord[]>([]);
  const [currentDraft, setCurrentDraft] = useState<MosaicWork>(() => createEmptyDraft());
  const [message, setMessage] = useState('矿机已启动，正在扫描 RGB 光谱。');

  useEffect(() => {
    const interval = window.setInterval(() => {
      const color = createRandomColor();
      const record: MiningRecord = {
        id: `${Date.now()}-${Math.random()}`,
        color,
        createdAt: Date.now()
      };

      setInventory((current) => addColorToInventory(current, color));
      setSelectedColor((current) => current ?? color);
      setMinedCount((current) => current + 1);
      setMiningRecords((current) => [record, ...current].slice(0, 10));
      setMessage(`挖到 RGB(${color.r}, ${color.g}, ${color.b})`);
    }, miningIntervalMs);

    return () => window.clearInterval(interval);
  }, []);

  const colorKinds = inventory.filter((item) => item.quantity > 0).length;
  const filledPixels = currentDraft.pixels.filter(Boolean).length;

  function fillPixel(index: number) {
    if (!selectedColor) {
      setMessage('请先选择一个库存颜色。');
      return;
    }

    const selectedKey = colorKey(selectedColor);
    const selectedStack = inventory.find((item) => colorKey(item.color) === selectedKey);

    if (!selectedStack || selectedStack.quantity <= 0) {
      setMessage('库存不足，等待矿机产出更多颜色。');
      return;
    }

    setCurrentDraft((current) => ({
      ...current,
      pixels: current.pixels.map((pixel, pixelIndex) => (pixelIndex === index ? selectedColor : pixel)),
      updatedAt: Date.now()
    }));
    setInventory((current) =>
      current.map((item) =>
        colorKey(item.color) === selectedKey ? { ...item, quantity: item.quantity - 1 } : item
      )
    );
    setMessage(`像素 #${index + 1} 已填充，已自动保存到待鉴定作品。`);
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

      <nav className="page-tabs" aria-label="页面导航">
        {(Object.keys(pageLabels) as Page[]).map((page) => (
          <button
            className={activePage === page ? 'active' : ''}
            key={page}
            onClick={() => setActivePage(page)}
            type="button"
          >
            {pageLabels[page]}
          </button>
        ))}
      </nav>

      {activePage === 'mining' && <MiningPage minedCount={minedCount} records={miningRecords} />}
      {activePage === 'inventory' && (
        <InventoryPage
          currentDraft={currentDraft}
          inventory={inventory}
          onContinueDraft={() => setActivePage('canvas')}
          onSelectColor={setSelectedColor}
          selectedColor={selectedColor}
        />
      )}
      {activePage === 'canvas' && (
        <CanvasPage
          currentDraft={currentDraft}
          inventory={inventory}
          message={message}
          onFillPixel={fillPixel}
          onSelectColor={setSelectedColor}
          selectedColor={selectedColor}
        />
      )}
    </main>
  );
}

function MiningPage({ minedCount, records }: { minedCount: number; records: MiningRecord[] }) {
  return (
    <section className="page-grid mining-page">
      <article className="panel mining-console">
        <div className="panel-heading">
          <span className="pulse" aria-hidden="true" />
          <h2>挖矿控制台</h2>
        </div>
        <p className="panel-copy">矿机持续运行，产出的 RGB 色块会自动进入库存。这里只保留最近 10 条产出记录。</p>
        <div className="console-meter">
          <span>总产出</span>
          <strong>{minedCount}</strong>
        </div>
      </article>

      <article className="panel records-panel">
        <h2>最近 10 条产出记录</h2>
        {records.length === 0 ? (
          <p className="empty-state">等待第一条 RGB 产出...</p>
        ) : (
          <ol className="record-list">
            {records.map((record) => (
              <li key={record.id}>
                <span className="swatch" style={{ background: formatRgb(record.color) }} />
                <span>RGB({record.color.r}, {record.color.g}, {record.color.b})</span>
                <time>{formatTime(record.createdAt)}</time>
                <strong>+1</strong>
              </li>
            ))}
          </ol>
        )}
      </article>
    </section>
  );
}

function InventoryPage({
  currentDraft,
  inventory,
  onContinueDraft,
  onSelectColor,
  selectedColor
}: {
  currentDraft: MosaicWork;
  inventory: ColorStack[];
  onContinueDraft: () => void;
  onSelectColor: (color: RgbColor) => void;
  selectedColor: RgbColor | null;
}) {
  return (
    <section className="inventory-page">
      <article className="panel">
        <h2>色块库存</h2>
        <ColorInventory inventory={inventory} onSelectColor={onSelectColor} selectedColor={selectedColor} />
      </article>

      <article className="panel mosaic-library">
        <h2>马赛克作品库</h2>
        <div className="mosaic-columns">
          <MosaicColumn title="待鉴定">
            <DraftCard currentDraft={currentDraft} onContinueDraft={onContinueDraft} />
          </MosaicColumn>
          <MosaicColumn title="已鉴定">
            <p className="empty-state">暂无已鉴定作品。</p>
          </MosaicColumn>
          <MosaicColumn title="已归档">
            <p className="empty-state">归档后会显示 msk://asset/&lt;密钥&gt;。</p>
          </MosaicColumn>
        </div>
      </article>
    </section>
  );
}

function CanvasPage({
  currentDraft,
  inventory,
  message,
  onFillPixel,
  onSelectColor,
  selectedColor
}: {
  currentDraft: MosaicWork;
  inventory: ColorStack[];
  message: string;
  onFillPixel: (index: number) => void;
  onSelectColor: (color: RgbColor) => void;
  selectedColor: RgbColor | null;
}) {
  return (
    <section className="canvas-layout">
      <aside className="panel">
        <h2>可用色块</h2>
        <p className="panel-copy">选择颜色后点击画布。每次填色都会自动保存为待鉴定作品。</p>
        <ColorInventory inventory={inventory} onSelectColor={onSelectColor} selectedColor={selectedColor} />
      </aside>

      <section className="canvas-panel panel">
        <div className="panel-heading split-heading">
          <h2>16x16 像素画布</h2>
          <span>{selectedColor ? `当前画笔 ${formatRgb(selectedColor)}` : '未选择颜色'}</span>
        </div>

        <div className="pixel-canvas" aria-label="16x16 像素画布">
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

        <p className="autosave-message">{message}</p>
      </section>
    </section>
  );
}

function ColorInventory({
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
              <span>选择 RGB({item.color.r}, {item.color.g}, {item.color.b})</span>
              <strong>x{item.quantity}</strong>
            </button>
          );
        })
      )}
    </div>
  );
}

function MosaicColumn({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="mosaic-column">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function DraftCard({ currentDraft, onContinueDraft }: { currentDraft: MosaicWork; onContinueDraft: () => void }) {
  const filledPixels = currentDraft.pixels.filter(Boolean).length;

  return (
    <article className="draft-card">
      <div className="mosaic-preview" aria-hidden="true">
        {currentDraft.pixels.slice(0, 64).map((pixel, index) => (
          <span key={index} style={{ background: pixel ? formatRgb(pixel) : undefined }} />
        ))}
      </div>
      <strong>当前待鉴定作品</strong>
      <span>{filledPixels}/{pixelCount} 像素已填色</span>
      <button onClick={onContinueDraft} type="button">继续创作</button>
    </article>
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

function createEmptyDraft(): MosaicWork {
  return {
    id: 'current-draft',
    status: 'draft',
    width: canvasSize,
    height: canvasSize,
    pixels: Array(pixelCount).fill(null),
    updatedAt: Date.now()
  };
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

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(timestamp);
}

export default App;
