import './styles.css';
import { useEffect, useState } from 'react';
import { REPRESENTATIVE_COLORS, mineColor } from './domain/rgb';
import type { ColorRarity, ColorStack, RepresentativeColor, RgbColor } from './domain/rgb';

const canvasSize = 16;
const pixelCount = canvasSize * canvasSize;
const miningIntervalMs = 1500;

type Page = 'mining' | 'inventory' | 'canvas';
type InventoryTab = 'colors' | 'artworks';
type CanvasZoom = 50 | 100 | 200 | 400 | 800 | 1600 | 3200;

type MiningRecord = {
  id: string;
  color: RgbColor;
  rarity: ColorRarity;
  createdAt: number;
};

type MosaicWork = {
  id: string;
  title: string;
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

const canvasZoomLevels: CanvasZoom[] = [50, 100, 200, 400, 800, 1600, 3200];

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

function App() {
  const [activePage, setActivePage] = useState<Page>('mining');
  const [inventory, setInventory] = useState<ColorStack[]>([]);
  const [selectedColor, setSelectedColor] = useState<RgbColor | null>(null);
  const [minedCount, setMinedCount] = useState(0);
  const [miningRecords, setMiningRecords] = useState<MiningRecord[]>([]);
  const [currentDraft, setCurrentDraft] = useState<MosaicWork>(() => createEmptyDraft());
  const [additionalWorks, setAdditionalWorks] = useState<MosaicWork[]>(() => [createPikachuWork()]);
  const [message, setMessage] = useState('矿机已启动，正在扫描 RGB 光谱。');

  useEffect(() => {
    const interval = window.setInterval(() => {
      const mined = mineColor();
      const record: MiningRecord = {
        id: `${Date.now()}-${Math.random()}`,
        color: mined.color,
        rarity: mined.rarity,
        createdAt: Date.now()
      };

      setInventory((current) => addColorToInventory(current, mined));
      setSelectedColor((current) => current ?? mined.color);
      setMinedCount((current) => current + 1);
      setMiningRecords((current) => [record, ...current].slice(0, 10));
      setMessage(`挖到 ${mined.rarity.label} RGB(${mined.color.r}, ${mined.color.g}, ${mined.color.b})`);
    }, miningIntervalMs);

    return () => window.clearInterval(interval);
  }, []);

  const colorKinds = inventory.filter((item) => item.quantity > 0).length;
  const activeWork = currentDraft;
  const filledPixels = activeWork.pixels.filter(Boolean).length;

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
          additionalWorks={additionalWorks}
          currentDraft={currentDraft}
          inventory={inventory}
          onContinueWork={(work) => {
            setCurrentDraft(work);
            setAdditionalWorks((current) => current.filter((item) => item.id !== work.id));
            setActivePage('canvas');
          }}
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
                <span className={`rarity-badge rarity-${record.rarity.level}`}>等级：{record.rarity.label}</span>
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
  additionalWorks,
  currentDraft,
  inventory,
  onContinueWork,
  onSelectColor,
  selectedColor
}: {
  additionalWorks: MosaicWork[];
  currentDraft: MosaicWork;
  inventory: ColorStack[];
  onContinueWork: (work: MosaicWork) => void;
  onSelectColor: (color: RgbColor) => void;
  selectedColor: RgbColor | null;
}) {
  const [inventoryTab, setInventoryTab] = useState<InventoryTab>('colors');
  const colorCatalog = REPRESENTATIVE_COLORS.map((item) => {
    const owned = inventory.find((stack) => colorKey(stack.color) === colorKey(item.color));

    return {
      ...item,
      quantity: owned?.quantity ?? 0
    };
  });
  const selectedCatalogColor = selectedColor
    ? colorCatalog.find((item) => colorKey(item.color) === colorKey(selectedColor)) ?? colorCatalog[0]
    : colorCatalog[0];
  const artworkInventory = [currentDraft, ...additionalWorks];

  return (
    <section className="steam-inventory panel">
      <div className="inventory-toolbar">
        <div className="inventory-tabs" aria-label="库存类型">
          <button className={inventoryTab === 'colors' ? 'active' : ''} onClick={() => setInventoryTab('colors')} type="button">
            色块库存
          </button>
          <button className={inventoryTab === 'artworks' ? 'active' : ''} onClick={() => setInventoryTab('artworks')} type="button">
            画作库存
          </button>
        </div>
        <input aria-label="库存搜索" placeholder="在库存中搜索 RGB 或作品" />
        <button className="filter-button" type="button">显示高级筛选条件...</button>
      </div>

      {inventoryTab === 'colors' ? (
        <section className="inventory-browser">
          <article>
            <h2>色块库存</h2>
            <div className="item-grid" aria-label="色块库存网格">
              {colorCatalog.map((item) => (
                <ColorCatalogItem
                  item={item}
                  isSelected={colorKey(item.color) === colorKey(selectedCatalogColor.color)}
                  key={colorKey(item.color)}
                  onSelectColor={onSelectColor}
                />
              ))}
            </div>
          </article>
          <ColorDetail item={selectedCatalogColor} />
        </section>
      ) : (
        <section className="inventory-browser">
          <article>
            <h2>画作库存</h2>
            <div className="item-grid artwork-grid" aria-label="画作库存网格">
              {artworkInventory.map((work) => (
                <ArtworkCard key={work.id} onContinueWork={onContinueWork} work={work} />
              ))}
            </div>
          </article>
          <ArtworkDetail currentDraft={currentDraft} onContinueWork={onContinueWork} />
        </section>
      )}
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
  const [canvasZoom, setCanvasZoom] = useState<CanvasZoom>(100);

  function changeCanvasZoom(direction: -1 | 1) {
    setCanvasZoom((current) => {
      const currentIndex = canvasZoomLevels.indexOf(current);
      const nextIndex = Math.max(0, Math.min(canvasZoomLevels.length - 1, currentIndex + direction));

      return canvasZoomLevels[nextIndex];
    });
  }

  return (
    <section className="canvas-layout">
      <aside className="panel">
        <h2>可用色块</h2>
        <p className="panel-copy">选择颜色后点击画布。每次填色都会自动保存为待鉴定作品。</p>
        <ColorInventory inventory={inventory.filter((item) => item.quantity > 0)} onSelectColor={onSelectColor} selectedColor={selectedColor} />
      </aside>

      <section className="canvas-panel panel">
        <div className="panel-heading split-heading">
          <h2>16x16 像素画布</h2>
          <span>{selectedColor ? `当前画笔 ${formatRgb(selectedColor)}` : '未选择颜色'}</span>
        </div>

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

function ColorCatalogItem({
  isSelected,
  item,
  onSelectColor
}: {
  isSelected: boolean;
  item: RepresentativeColor & { quantity: number };
  onSelectColor: (color: RgbColor) => void;
}) {
  return (
    <button
      aria-label={`选择 RGB(${item.color.r}, ${item.color.g}, ${item.color.b}) 等级：${item.rarity.label} 数量：${item.quantity}`}
      className={`catalog-item rarity-border-${item.rarity.level}${isSelected ? ' selected' : ''}${item.quantity === 0 ? ' empty' : ''}`}
      onClick={() => onSelectColor(item.color)}
      type="button"
    >
      <span className="catalog-swatch" style={{ background: formatRgb(item.color) }} />
      <span>RGB({item.color.r}, {item.color.g}, {item.color.b})</span>
      <small>等级：{item.rarity.label}</small>
      <strong>数量：{item.quantity}</strong>
    </button>
  );
}

function ColorDetail({ item }: { item: RepresentativeColor & { quantity: number } }) {
  return (
    <aside className="detail-pane">
      <h2>物品详情</h2>
      <div className="detail-swatch" style={{ background: formatRgb(item.color) }} />
      <h3>RGB({item.color.r}, {item.color.g}, {item.color.b})</h3>
      <p><span>等级：</span>{item.rarity.label}</p>
      <p><span>掉落率：</span>{(item.rarity.dropRate * 100).toFixed(1)}%</p>
      <p><span>库存数量：</span>{item.quantity}</p>
      <p className="panel-copy">可用于 16x16 创作画布。数量为 0 时只作为图鉴展示。</p>
    </aside>
  );
}

function ArtworkDetail({ currentDraft, onContinueWork }: { currentDraft: MosaicWork; onContinueWork: (work: MosaicWork) => void }) {
  const filledPixels = currentDraft.pixels.filter(Boolean).length;

  return (
    <aside className="detail-pane">
      <h2>作品详情</h2>
      <MosaicPreview className="large" currentDraft={currentDraft} label="当前待鉴定作品详情预览" />
      <h3>作品详情：{currentDraft.title}</h3>
      <p><span>状态：</span>待鉴定</p>
      <p><span>画布：</span>{currentDraft.width}x{currentDraft.height}</p>
      <p><span>已填色：</span>{filledPixels}/{pixelCount}</p>
      <button onClick={() => onContinueWork(currentDraft)} type="button">打开画布继续创作</button>
    </aside>
  );
}

function ArtworkCard({
  onContinueWork,
  work
}: {
  onContinueWork: (work: MosaicWork) => void;
  work: MosaicWork;
}) {
  const filledPixels = work.pixels.filter(Boolean).length;

  return (
    <article className="draft-card">
      <MosaicPreview className="card-preview" currentDraft={work} label={`${work.title}缩略图`} />
      <strong>{work.title}</strong>
      <span>{filledPixels}/{pixelCount} 像素已填色</span>
      <button onClick={() => onContinueWork(work)} type="button">继续创作</button>
    </article>
  );
}

function MosaicPreview({
  className = '',
  currentDraft,
  label
}: {
  className?: string;
  currentDraft: MosaicWork;
  label: string;
}) {
  return (
    <div className={`mosaic-preview ${className}`.trim()} aria-label={label}>
      {currentDraft.pixels.map((pixel, index) => (
        <span key={index} style={{ background: pixel ? formatRgb(pixel) : undefined }} />
      ))}
    </div>
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
    title: '当前待鉴定作品',
    status: 'draft',
    width: canvasSize,
    height: canvasSize,
    pixels: createGoblinAvatarPixels(),
    updatedAt: Date.now()
  };
}

function createGoblinAvatarPixels(): Array<RgbColor | null> {
  return createPatternPixels(goblinAvatarPattern, goblinPalette);
}

function createPikachuWork(): MosaicWork {
  return {
    id: 'pikachu-icon',
    title: '皮卡丘像素图标',
    status: 'certified',
    width: canvasSize,
    height: canvasSize,
    pixels: createPatternPixels(pikachuPattern, pikachuPalette),
    updatedAt: Date.now()
  };
}

function createPatternPixels(pattern: string[], palette: Record<string, RgbColor | null>): Array<RgbColor | null> {
  return pattern.flatMap((row) => row.split('').map((token) => palette[token]));
}

function addColorToInventory(inventory: ColorStack[], mined: { color: RgbColor; rarity: ColorRarity }): ColorStack[] {
  const key = colorKey(mined.color);
  const existing = inventory.find((item) => colorKey(item.color) === key);

  if (existing) {
    return inventory.map((item) => (colorKey(item.color) === key ? { ...item, quantity: item.quantity + 1 } : item));
  }

  return [{ color: mined.color, quantity: 1, rarity: mined.rarity }, ...inventory];
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
