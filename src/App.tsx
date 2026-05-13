import './styles.css';
import { useEffect, useState } from 'react';
import type { CSSProperties, FormEvent, KeyboardEvent } from 'react';
import { REPRESENTATIVE_COLORS, createPixelHash, mineColor } from './domain/rgb';
import type { ColorRarity, ColorStack, RepresentativeColor, RgbColor } from './domain/rgb';

const canvasSize = 16;
const pixelCount = canvasSize * canvasSize;
const miningIntervalMs = 1500;
const maxDraftWorks = 5;
const saveKey = 'rgb-mosaic-save-v1';
const builtInWorkIds = new Set(['current-draft', 'pikachu-icon']);
let blankDraftSequence = 0;

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

type MosaicAsset = {
  id: string;
  workId: string;
  title: string;
  pixelHash: string;
  creatorId: string;
  ownerId: string;
  certifiedAt: number;
};

type CertificationScan = {
  asset?: MosaicAsset;
  phase: 'scanning' | 'complete';
  work: MosaicWork;
};

type SavedGame = {
  activeWorkId: string | null;
  artworks: MosaicWork[];
  assets: MosaicAsset[];
  inventory: ColorStack[];
  minedCount: number;
  selectedArtworkId: string;
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
  const initialGame = loadSavedGame();
  const [activePage, setActivePage] = useState<Page>('mining');
  const [inventory, setInventory] = useState<ColorStack[]>(initialGame.inventory);
  const [selectedColor, setSelectedColor] = useState<RgbColor | null>(null);
  const [minedCount, setMinedCount] = useState(initialGame.minedCount);
  const [miningRecords, setMiningRecords] = useState<MiningRecord[]>([]);
  const [artworks, setArtworks] = useState<MosaicWork[]>(initialGame.artworks);
  const [assets, setAssets] = useState<MosaicAsset[]>(initialGame.assets);
  const [activeWorkId, setActiveWorkId] = useState<string | null>(initialGame.activeWorkId);
  const [selectedArtworkId, setSelectedArtworkId] = useState(initialGame.selectedArtworkId);
  const [certificationScan, setCertificationScan] = useState<CertificationScan | null>(null);
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

  useEffect(() => {
    saveGame({ activeWorkId, artworks, assets, inventory, minedCount, selectedArtworkId });
  }, [activeWorkId, artworks, assets, inventory, minedCount, selectedArtworkId]);

  const colorKinds = inventory.filter((item) => item.quantity > 0).length;
  const activeWork = activeWorkId ? artworks.find((work) => work.id === activeWorkId) ?? null : null;
  const selectedArtwork = artworks.find((work) => work.id === selectedArtworkId) ?? activeWork ?? artworks[0];
  const filledPixels = activeWork?.pixels.filter(Boolean).length ?? 0;
  const draftWorks = artworks.filter((work) => work.status === 'draft');
  const draftWorkCount = draftWorks.length;

  function openPage(page: Page) {
    if (page === 'canvas') {
      setActiveWorkId(null);
      setMessage('请新建作品或从库存继续创作。');
      setActivePage('canvas');
      return;
    }

    setActivePage(page);
  }

  function createNamedWork(title: string) {
    const normalizedTitle = title.trim();

    if (draftWorkCount >= maxDraftWorks) {
      setMessage('未鉴定作品已达 5 个，请先鉴定或删除草稿。');
      return;
    }

    if (!normalizedTitle) {
      setMessage('请先输入作品名称。');
      return;
    }

    const blankDraft = createBlankDraft(normalizedTitle);

    setArtworks((current) => [blankDraft, ...current]);
    setActiveWorkId(blankDraft.id);
    setSelectedArtworkId(blankDraft.id);
    setMessage(`正在编辑「${blankDraft.title}」。`);
  }

  function continueWork(work: MosaicWork) {
    if (work.status === 'certified') {
      setMessage('作品已鉴定，不能继续编辑。');
      return;
    }

    setActiveWorkId(work.id);
    setSelectedArtworkId(work.id);
    setActivePage('canvas');
  }

  function renameWork(work: MosaicWork, title: string) {
    const normalizedTitle = title.trim();

    if (work.status === 'certified') {
      setMessage('已鉴定资产名称已锁定。');
      return;
    }

    if (!normalizedTitle) {
      setMessage('请先输入作品名称。');
      return;
    }

    setArtworks((current) =>
      current.map((item) => (item.id === work.id ? { ...item, title: normalizedTitle, updatedAt: Date.now() } : item))
    );
    setMessage(`作品已重命名为「${normalizedTitle}」。`);
  }

  function deleteDraft(work: MosaicWork) {
    if (work.status !== 'draft') {
      setMessage('已鉴定资产不能删除。');
      return;
    }

    if (builtInWorkIds.has(work.id)) {
      setMessage('内置画作不能删除。');
      return;
    }

    const refundColors = work.pixels.filter((pixel): pixel is RgbColor => Boolean(pixel));
    const remainingWorks = artworks.filter((item) => item.id !== work.id);
    const fallbackWork = remainingWorks[0] ?? null;

    setInventory((current) => refundColors.reduce((next, color) => addColorToInventory(next, { color, rarity: findColorRarity(color) }), current));
    setArtworks(remainingWorks);
    setActiveWorkId((current) => (current === work.id ? null : current));
    setSelectedArtworkId((current) => (current === work.id ? fallbackWork?.id ?? '' : current));
    setMessage(`已删除「${work.title}」，并返还 ${refundColors.length} 个色块。`);
  }

  function selectCanvasDraft(workId: string) {
    const work = artworks.find((item) => item.id === workId);

    if (!work || work.status !== 'draft') {
      return;
    }

    setActiveWorkId(work.id);
    setSelectedArtworkId(work.id);
    setMessage(`正在编辑「${work.title}」。`);
  }

  async function certifyWork(work: MosaicWork) {
    const filledPixels = work.pixels.filter(Boolean).length;

    if (certificationScan?.phase === 'scanning') {
      setMessage('正在鉴定作品，请等待扫描完成。');
      return;
    }

    if (work.status === 'certified') {
      setMessage('作品已鉴定。');
      return;
    }

    if (filledPixels !== pixelCount) {
      setMessage('作品未完成，无法鉴定。');
      return;
    }

    const pixels = work.pixels.filter((pixel): pixel is RgbColor => Boolean(pixel));
    const pixelHash = await createPixelHash({ width: work.width, height: work.height, pixels });
    const alreadyCertified = assets.some((asset) => asset.pixelHash === pixelHash);

    if (alreadyCertified) {
      setMessage('该像素矩阵已存在，无法重复鉴定。');
      return;
    }

    setCertificationScan({ phase: 'scanning', work });

    const certifiedAt = Date.now();
    const asset: MosaicAsset = {
      id: `asset-${work.id}-${certifiedAt}`,
      workId: work.id,
      title: work.title,
      pixelHash,
      creatorId: 'local-player',
      ownerId: 'local-player',
      certifiedAt
    };
    const certifiedWork: MosaicWork = {
      ...work,
      status: 'certified',
      archivedKey: pixelHash,
      updatedAt: certifiedAt
    };

    window.setTimeout(() => {
      setAssets((current) => [asset, ...current]);
      setArtworks((current) => current.map((item) => (item.id === work.id ? certifiedWork : item)));
      setCertificationScan({ asset, phase: 'complete', work: certifiedWork });
      setMessage(`「${work.title}」已鉴定为唯一资产。`);
    }, 1600);
  }

  function fillPixel(index: number) {
    if (!activeWork) {
      setMessage('请先新建作品或从库存继续创作。');
      return;
    }

    if (!selectedColor) {
      setMessage('请先选择一个库存颜色。');
      return;
    }

    const selectedKey = colorKey(selectedColor);
    const selectedStack = inventory.find((item) => colorKey(item.color) === selectedKey);
    const previousColor = activeWork.pixels[index];

    if (!selectedStack || selectedStack.quantity <= 0) {
      setMessage('库存不足，等待矿机产出更多颜色。');
      return;
    }

    setArtworks((current) =>
      current.map((work) =>
        work.id === activeWork.id
          ? {
              ...work,
              pixels: work.pixels.map((pixel, pixelIndex) => (pixelIndex === index ? selectedColor : pixel)),
              updatedAt: Date.now()
            }
          : work
      )
    );
    setInventory((current) => updateInventoryForPixelFill(current, selectedColor, previousColor));
    setMessage(`像素 #${index + 1} 已填充，已自动保存到「${activeWork.title}」。`);
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
            onClick={() => openPage(page)}
            type="button"
          >
            {pageLabels[page]}
          </button>
        ))}
      </nav>

      {activePage !== 'canvas' ? <p className="global-message">{message}</p> : null}

      {activePage === 'mining' && <MiningPage minedCount={minedCount} records={miningRecords} />}
      {activePage === 'inventory' && (
        <InventoryPage
          artworks={artworks}
          inventory={inventory}
          assets={assets}
          onCertifyWork={certifyWork}
          onContinueWork={continueWork}
          onDeleteDraft={deleteDraft}
          onRenameWork={renameWork}
          onSelectArtwork={setSelectedArtworkId}
          onSelectColor={setSelectedColor}
          selectedArtwork={selectedArtwork}
          selectedColor={selectedColor}
        />
      )}
      {activePage === 'canvas' && (
        <CanvasPage
          currentDraft={activeWork}
          draftWorkCount={draftWorkCount}
          draftWorks={draftWorks}
          inventory={inventory}
          maxDraftWorks={maxDraftWorks}
          message={message}
          onCreateWork={createNamedWork}
          onFillPixel={fillPixel}
          onSelectCanvasDraft={selectCanvasDraft}
          onSelectColor={setSelectedColor}
          selectedColor={selectedColor}
        />
      )}
      {certificationScan ? (
        <CertificationScanModal
          onClose={() => setCertificationScan(null)}
          onViewAsset={() => {
            setSelectedArtworkId(certificationScan.work.id);
            setActivePage('inventory');
            setCertificationScan(null);
          }}
          scan={certificationScan}
        />
      ) : null}
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
  artworks,
  inventory,
  assets,
  onCertifyWork,
  onContinueWork,
  onDeleteDraft,
  onRenameWork,
  onSelectArtwork,
  onSelectColor,
  selectedArtwork,
  selectedColor
}: {
  artworks: MosaicWork[];
  inventory: ColorStack[];
  assets: MosaicAsset[];
  onCertifyWork: (work: MosaicWork) => void;
  onContinueWork: (work: MosaicWork) => void;
  onDeleteDraft: (work: MosaicWork) => void;
  onRenameWork: (work: MosaicWork, title: string) => void;
  onSelectArtwork: (workId: string) => void;
  onSelectColor: (color: RgbColor) => void;
  selectedArtwork: MosaicWork;
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
  const artworkInventory = artworks;

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
                <ArtworkCard isSelected={work.id === selectedArtwork.id} key={work.id} onSelectArtwork={onSelectArtwork} work={work} />
              ))}
            </div>
          </article>
          <ArtworkDetail
            asset={assets.find((item) => item.workId === selectedArtwork.id)}
            currentDraft={selectedArtwork}
            onCertifyWork={onCertifyWork}
            onContinueWork={onContinueWork}
            onDeleteDraft={onDeleteDraft}
            onRenameWork={onRenameWork}
          />
        </section>
      )}
    </section>
  );
}

function CanvasPage({
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
  const [newWorkTitle, setNewWorkTitle] = useState('');
  const hasReachedDraftLimit = draftWorkCount >= maxDraftWorks;

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
        <h2>可用色块</h2>
        <p className="panel-copy">选择颜色后点击画布。每次填色都会自动保存为待鉴定作品。</p>
        <ColorInventory inventory={inventory.filter((item) => item.quantity > 0)} onSelectColor={onSelectColor} selectedColor={selectedColor} />
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
            <select
              aria-label="选择未鉴定画作"
              onChange={(event) => onSelectCanvasDraft(event.target.value)}
              value={currentDraft?.id ?? ''}
            >
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
            <input
              autoFocus
              id="new-work-title"
              onChange={(event) => setNewWorkTitle(event.target.value)}
              placeholder="输入作品名称"
              value={newWorkTitle}
            />
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

function ArtworkDetail({
  asset,
  currentDraft,
  onCertifyWork,
  onContinueWork,
  onDeleteDraft,
  onRenameWork
}: {
  asset?: MosaicAsset;
  currentDraft: MosaicWork;
  onCertifyWork: (work: MosaicWork) => void;
  onContinueWork: (work: MosaicWork) => void;
  onDeleteDraft: (work: MosaicWork) => void;
  onRenameWork: (work: MosaicWork, title: string) => void;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [nextTitle, setNextTitle] = useState(currentDraft.title);
  const filledPixels = currentDraft.pixels.filter(Boolean).length;
  const isComplete = filledPixels === pixelCount;
  const isCertified = currentDraft.status === 'certified';
  const canDeleteDraft = !isCertified && !builtInWorkIds.has(currentDraft.id);
  const assetDisplayId = asset ? `asset-${currentDraft.id}` : null;

  function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRenameWork(currentDraft, nextTitle);
    setIsRenaming(false);
  }

  function startRename() {
    if (isCertified) {
      return;
    }

    setNextTitle(currentDraft.title);
    setIsRenaming(true);
    setIsActionsMenuOpen(false);
    setIsConfirmingDelete(false);
  }

  function cancelRename() {
    setNextTitle(currentDraft.title);
    setIsRenaming(false);
  }

  function handleRenameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      cancelRename();
    }
  }

  return (
    <aside className="detail-pane">
      <div className="detail-pane-header">
        <h2>作品详情</h2>
        {!isCertified ? (
          <div className="detail-actions-menu">
            <button aria-label="作品操作菜单" className="menu-trigger" onClick={() => setIsActionsMenuOpen((current) => !current)} type="button">...</button>
            {isActionsMenuOpen ? (
              <div className="compact-menu" role="menu">
                {!isConfirmingDelete ? (
                  <>
                    <button onClick={startRename} role="menuitem" type="button">重命名</button>
                    {canDeleteDraft ? <button className="danger-menu-item" onClick={() => setIsConfirmingDelete(true)} role="menuitem" type="button">删除草稿</button> : null}
                  </>
                ) : (
                  <div className="compact-confirm">
                    <span>确认删除？</span>
                    <button className="danger-menu-item" onClick={() => onDeleteDraft(currentDraft)} type="button">确认删除草稿</button>
                    <button onClick={() => setIsConfirmingDelete(false)} type="button">取消</button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <MosaicPreview className="large" currentDraft={currentDraft} label="当前待鉴定作品详情预览" />
      {!isCertified && isRenaming ? (
        <form className="rename-form inline-title-form" onSubmit={submitRename}>
          <label>
            <span>作品新名称</span>
            <input aria-label="作品新名称" onChange={(event) => setNextTitle(event.target.value)} onKeyDown={handleRenameKeyDown} value={nextTitle} />
          </label>
          <div className="detail-actions">
            <button type="submit">确认重命名</button>
            <button onClick={cancelRename} type="button">取消</button>
          </div>
        </form>
      ) : (
        <div className="detail-title-row">
          <h3>
            作品详情：{currentDraft.title}
          </h3>
        </div>
      )}
      <p className="work-status">状态：<span className={`status-pill ${isCertified ? 'certified' : 'draft'}`}>{isCertified ? '已鉴定' : '待鉴定'}</span></p>
      <p><span>画布：</span>{currentDraft.width}x{currentDraft.height}</p>
      <p><span>已填色：</span>{filledPixels}/{pixelCount}</p>
      {isCertified ? <p className="certification-message">已鉴定资产名称已锁定</p> : null}
      {asset ? (
        <div className="asset-summary">
          <p><span>资产编号：</span><strong>{assetDisplayId}</strong></p>
          <p><span>资产指纹：</span><code>{asset.pixelHash.slice(0, 12)}...</code></p>
          <p><span>鉴定时间：</span><strong>{new Date(asset.certifiedAt).toLocaleString()}</strong></p>
          <p><span>创建者：</span><strong>{asset.creatorId}</strong></p>
          <p><span>拥有者：</span><strong>{asset.ownerId}</strong></p>
        </div>
      ) : null}
      {!isComplete && !isCertified ? <p className="certification-message">作品未完成，无法鉴定</p> : null}
      {!isCertified ? <button disabled={!isComplete} onClick={() => onCertifyWork(currentDraft)} type="button">鉴定作品</button> : null}
      {!isCertified ? <button aria-label={`从详情继续创作 ${currentDraft.title}`} onClick={() => onContinueWork(currentDraft)} type="button">打开画布继续创作</button> : null}
    </aside>
  );
}

function CertificationScanModal({
  onClose,
  onViewAsset,
  scan
}: {
  onClose: () => void;
  onViewAsset: () => void;
  scan: CertificationScan;
}) {
  const assetDisplayId = scan.asset ? `asset-${scan.work.id}` : null;

  return (
    <div className="scan-overlay" role="dialog" aria-modal="true" aria-label="像素扫描鉴定">
      <section className="scan-modal">
        <div className="scan-copy">
          <p className="eyebrow">Certification Scanner</p>
          <h2>{scan.phase === 'complete' ? '鉴定成功' : '像素扫描鉴定中'}</h2>
          <p>{scan.phase === 'complete' ? '像素矩阵已生成唯一资产指纹' : `正在扫描 ${scan.work.width}x${scan.work.height} 像素矩阵`}</p>
        </div>

        <div className={`scan-preview ${scan.phase}`}>
          <MosaicPreview className="scan-artwork" currentDraft={scan.work} label={`${scan.work.title}扫描预览`} style={{ boxSizing: 'border-box' }} />
          <span className="scan-line" aria-hidden="true" />
        </div>

        {scan.asset ? (
          <div className="scan-result">
            <h3>资产卡</h3>
            <p><span>作品名称：</span><strong>{scan.asset.title}</strong></p>
            <p><span>资产编号：</span><strong>{assetDisplayId}</strong></p>
            <p><span>资产指纹：</span><code>{scan.asset.pixelHash.slice(0, 12)}...</code></p>
            <p><span>鉴定时间：</span><strong>{new Date(scan.asset.certifiedAt).toLocaleString()}</strong></p>
            <p><span>创建者：</span><strong>{scan.asset.creatorId}</strong></p>
            <p><span>拥有者：</span><strong>{scan.asset.ownerId}</strong></p>
          </div>
        ) : null}

        {scan.phase === 'complete' ? (
          <div className="scan-actions">
            <button onClick={onViewAsset} type="button">查看资产详情</button>
            <button onClick={onClose} type="button">关闭鉴定结果</button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ArtworkCard({
  isSelected,
  onSelectArtwork,
  work
}: {
  isSelected: boolean;
  onSelectArtwork: (workId: string) => void;
  work: MosaicWork;
}) {
  const filledPixels = work.pixels.filter(Boolean).length;

  return (
    <button
      aria-label={`查看作品 ${work.title}`}
      className={`draft-card${isSelected ? ' selected' : ''}`}
      onClick={() => onSelectArtwork(work.id)}
      type="button"
    >
      <MosaicPreview className="card-preview" currentDraft={work} label={`${work.title}缩略图`} />
      <strong>{work.title}</strong>
      <span>{filledPixels}/{pixelCount} 像素已填色</span>
      <div className="draft-card-actions" aria-label={`${work.title}鉴定状态`}>
        <span className={`work-card-status ${work.status === 'certified' ? 'certified' : 'draft'}`}>
          {work.status === 'certified' ? '已鉴定' : '未鉴定'}
        </span>
      </div>
    </button>
  );
}

function MosaicPreview({
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

function createBlankDraft(title: string): MosaicWork {
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

function createGoblinAvatarPixels(): Array<RgbColor | null> {
  return createPatternPixels(goblinAvatarPattern, goblinPalette);
}

function createPikachuWork(): MosaicWork {
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

function createInitialGame(): SavedGame {
  const artworks = [createEmptyDraft(), createPikachuWork()];

  return {
    activeWorkId: 'current-draft',
    artworks,
    assets: [],
    inventory: [],
    minedCount: 0,
    selectedArtworkId: 'current-draft'
  };
}

function loadSavedGame(): SavedGame {
  try {
    const rawSave = window.localStorage.getItem(saveKey);

    if (!rawSave) {
      return createInitialGame();
    }

    const parsed = JSON.parse(rawSave) as Partial<SavedGame>;

    if (!isSavedGame(parsed)) {
      return createInitialGame();
    }

    return normalizeSavedGame(parsed);
  } catch {
    return createInitialGame();
  }
}

function normalizeSavedGame(game: SavedGame): SavedGame {
  const artworks = [...game.artworks];

  if (!artworks.some((work) => work.id === 'current-draft')) {
    artworks.push(createEmptyDraft());
  }

  if (!artworks.some((work) => work.id === 'pikachu-icon')) {
    artworks.push(createPikachuWork());
  }

  const activeWorkId = game.activeWorkId && artworks.some((work) => work.id === game.activeWorkId) ? game.activeWorkId : null;
  const selectedArtworkId = artworks.some((work) => work.id === game.selectedArtworkId) ? game.selectedArtworkId : artworks[0]?.id ?? '';

  return {
    ...game,
    activeWorkId,
    artworks,
    selectedArtworkId
  };
}

function saveGame(game: SavedGame) {
  window.localStorage.setItem(saveKey, JSON.stringify(game));
}

function isSavedGame(value: Partial<SavedGame>): value is SavedGame {
  return (
    Array.isArray(value.artworks) &&
    Array.isArray(value.assets) &&
    Array.isArray(value.inventory) &&
    typeof value.minedCount === 'number' &&
    typeof value.selectedArtworkId === 'string' &&
    (typeof value.activeWorkId === 'string' || value.activeWorkId === null)
  );
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

function addColorToInventory(inventory: ColorStack[], mined: { color: RgbColor; rarity: ColorRarity }): ColorStack[] {
  const key = colorKey(mined.color);
  const existing = inventory.find((item) => colorKey(item.color) === key);

  if (existing) {
    return inventory.map((item) => (colorKey(item.color) === key ? { ...item, quantity: item.quantity + 1 } : item));
  }

  return [{ color: mined.color, quantity: 1, rarity: mined.rarity }, ...inventory];
}

function updateInventoryForPixelFill(
  inventory: ColorStack[],
  selectedColor: RgbColor,
  previousColor: RgbColor | null
): ColorStack[] {
  const selectedKey = colorKey(selectedColor);
  const previousKey = previousColor ? colorKey(previousColor) : null;
  const hasPreviousColor = previousKey ? inventory.some((item) => colorKey(item.color) === previousKey) : false;

  const updatedInventory = inventory.map((item) => {
    const itemKey = colorKey(item.color);
    let quantity = item.quantity;

    if (itemKey === selectedKey) {
      quantity -= 1;
    }

    if (previousKey && itemKey === previousKey) {
      quantity += 1;
    }

    return { ...item, quantity };
  });

  if (previousColor && previousKey && !hasPreviousColor) {
    return [...updatedInventory, { color: previousColor, quantity: 1 }];
  }

  return updatedInventory;
}

function findColorRarity(color: RgbColor): ColorRarity {
  return REPRESENTATIVE_COLORS.find((item) => colorKey(item.color) === colorKey(color))?.rarity ?? REPRESENTATIVE_COLORS[0].rarity;
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
