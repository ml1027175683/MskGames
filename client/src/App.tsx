import './styles.css';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { REPRESENTATIVE_COLORS, colorKey, createPixelHash, mineColor } from './domain/rgb';
import { createBlankDraft, formatAssetDisplayId, pixelCount } from './domain/artwork';
import { isSavedGame, loadSavedGame, normalizeSavedGame, saveGame } from './storage/localGameStorage';
import { MosaicPreview, formatRgb } from './components/common/MosaicPreview';
import { CertificationScanModal } from './components/certification/CertificationScanModal';
import { CanvasPage } from './components/canvas/CanvasPage';
import type { ColorRarity, ColorStack, RepresentativeColor, RgbColor } from './domain/rgb';
import type { AssetSortOrder, CertificationScan, InventoryTab, MiningRecord, MosaicAsset, MosaicWork, Page, SavedGame } from './types/game';

const miningIntervalMs = 1500;
const maxDraftWorks = 5;
const builtInWorkIds = new Set(['current-draft', 'pikachu-icon']);

const pageLabels: Record<Page, string> = {
  mining: '挖矿',
  inventory: '库存',
  canvas: '画布'
};

function App() {
  const initialGame = loadSavedGame();
  const [activePage, setActivePage] = useState<Page>('mining');
  const [inventory, setInventory] = useState<ColorStack[]>(initialGame.inventory);
  const [selectedColor, setSelectedColor] = useState<RgbColor | null>(null);
  const [minedCount, setMinedCount] = useState(initialGame.minedCount);
  const [miningRecords, setMiningRecords] = useState<MiningRecord[]>([]);
  const [artworks, setArtworks] = useState<MosaicWork[]>(initialGame.artworks);
  const [assets, setAssets] = useState<MosaicAsset[]>(initialGame.assets);
  const [inventoryTab, setInventoryTab] = useState<InventoryTab>('colors');
  const [activeWorkId, setActiveWorkId] = useState<string | null>(initialGame.activeWorkId);
  const [selectedArtworkId, setSelectedArtworkId] = useState(initialGame.selectedArtworkId);
  const [selectedAssetId, setSelectedAssetId] = useState(initialGame.assets[0]?.id ?? '');
  const [certificationScan, setCertificationScan] = useState<CertificationScan | null>(null);
  const [message, setMessage] = useState('矿机已启动，正在扫描 RGB 光谱。');
  const importInputRef = useRef<HTMLInputElement | null>(null);

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
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? assets[0] ?? null;
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
      setSelectedAssetId(asset.id);
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

  function createSaveSnapshot(): SavedGame {
    return {
      activeWorkId,
      artworks,
      assets,
      inventory,
      minedCount,
      selectedArtworkId
    };
  }

  function applySavedGame(game: SavedGame) {
    const normalized = normalizeSavedGame(game);

    setInventory(normalized.inventory);
    setMinedCount(normalized.minedCount);
    setArtworks(normalized.artworks);
    setAssets(normalized.assets);
    setActiveWorkId(normalized.activeWorkId);
    setSelectedArtworkId(normalized.selectedArtworkId);
    setSelectedAssetId(normalized.assets[0]?.id ?? '');
  }

  function exportSave() {
    const payload = JSON.stringify(createSaveSnapshot(), null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `rgb-mosaic-save-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMessage('存档已导出。');
  }

  async function importSave(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<SavedGame>;

      if (!isSavedGame(parsed)) {
        setMessage('存档文件无效，未导入。');
        return;
      }

      applySavedGame(parsed);
      setMessage('存档已导入。');
    } catch {
      setMessage('存档文件无效，未导入。');
    } finally {
      event.target.value = '';
    }
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
        <div className="save-actions" aria-label="存档操作">
          <button onClick={exportSave} type="button">导出存档</button>
          <button onClick={() => importInputRef.current?.click()} type="button">导入存档</button>
          <input
            ref={importInputRef}
            accept="application/json,.json"
            aria-label="导入存档文件"
            className="visually-hidden-file"
            onChange={importSave}
            type="file"
          />
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
          inventoryTab={inventoryTab}
          onCertifyWork={certifyWork}
          onContinueWork={continueWork}
          onDeleteDraft={deleteDraft}
          onRenameWork={renameWork}
          onSelectAsset={setSelectedAssetId}
          onSelectArtwork={setSelectedArtworkId}
          onSelectColor={setSelectedColor}
          onSelectInventoryTab={setInventoryTab}
          selectedAsset={selectedAsset}
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
            if (certificationScan.asset) {
              setSelectedAssetId(certificationScan.asset.id);
            }
            setInventoryTab('assets');
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
  inventoryTab,
  onCertifyWork,
  onContinueWork,
  onDeleteDraft,
  onRenameWork,
  onSelectAsset,
  onSelectArtwork,
  onSelectColor,
  onSelectInventoryTab,
  selectedAsset,
  selectedArtwork,
  selectedColor
}: {
  artworks: MosaicWork[];
  inventory: ColorStack[];
  assets: MosaicAsset[];
  inventoryTab: InventoryTab;
  onCertifyWork: (work: MosaicWork) => void;
  onContinueWork: (work: MosaicWork) => void;
  onDeleteDraft: (work: MosaicWork) => void;
  onRenameWork: (work: MosaicWork, title: string) => void;
  onSelectAsset: (assetId: string) => void;
  onSelectArtwork: (workId: string) => void;
  onSelectColor: (color: RgbColor) => void;
  onSelectInventoryTab: (tab: InventoryTab) => void;
  selectedAsset: MosaicAsset | null;
  selectedArtwork: MosaicWork;
  selectedColor: RgbColor | null;
}) {
  const [showOnlyOwnedColors, setShowOnlyOwnedColors] = useState(false);
  const [colorSearchQuery, setColorSearchQuery] = useState('');
  const [artworkSearchQuery, setArtworkSearchQuery] = useState('');
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [assetSortOrder, setAssetSortOrder] = useState<AssetSortOrder>('newest');
  const colorCatalog = REPRESENTATIVE_COLORS.map((item) => {
    const owned = inventory.find((stack) => colorKey(stack.color) === colorKey(item.color));

    return {
      ...item,
      quantity: owned?.quantity ?? 0
    };
  });
  const normalizedColorSearch = colorSearchQuery.trim().toLowerCase().replaceAll(' ', '');
  const visibleColorCatalog = colorCatalog.filter((item) => {
    const matchesAvailability = !showOnlyOwnedColors || item.quantity > 0;

    if (!matchesAvailability) {
      return false;
    }

    if (!normalizedColorSearch) {
      return true;
    }

    return [colorKey(item.color), item.rarity.label.toLowerCase()].some((value) => value.includes(normalizedColorSearch));
  });
  const selectedCatalogColor = selectedColor
    ? visibleColorCatalog.find((item) => colorKey(item.color) === colorKey(selectedColor)) ?? visibleColorCatalog[0] ?? colorCatalog[0]
    : visibleColorCatalog[0] ?? colorCatalog[0];
  const artworkInventory = artworks.filter((work) => work.status === 'draft');
  const normalizedArtworkSearch = artworkSearchQuery.trim().toLowerCase();
  const visibleArtworkInventory = artworkInventory.filter((work) => {
    if (!normalizedArtworkSearch) {
      return true;
    }

    return [work.title, work.id].some((value) => value.toLowerCase().includes(normalizedArtworkSearch));
  });
  const visibleSelectedArtwork = visibleArtworkInventory.find((work) => work.id === selectedArtwork.id) ?? visibleArtworkInventory[0] ?? null;
  const normalizedAssetSearch = assetSearchQuery.trim().toLowerCase();
  const visibleAssets = assets
    .filter((asset) => {
      if (!normalizedAssetSearch) {
        return true;
      }

      return [asset.title, formatAssetDisplayId(asset), asset.pixelHash].some((value) => value.toLowerCase().includes(normalizedAssetSearch));
    })
    .sort((left, right) => (assetSortOrder === 'newest' ? right.certifiedAt - left.certifiedAt : left.certifiedAt - right.certifiedAt));
  const visibleSelectedAsset = visibleAssets.find((asset) => asset.id === selectedAsset?.id) ?? visibleAssets[0] ?? null;

  return (
    <section className="steam-inventory panel">
      <div className="inventory-toolbar">
        <div className="inventory-tabs" aria-label="库存类型">
          <button className={inventoryTab === 'colors' ? 'active' : ''} onClick={() => onSelectInventoryTab('colors')} type="button">
            色块库存
          </button>
          <button className={inventoryTab === 'artworks' ? 'active' : ''} onClick={() => onSelectInventoryTab('artworks')} type="button">
            画作库存
          </button>
          <button className={inventoryTab === 'assets' ? 'active' : ''} onClick={() => onSelectInventoryTab('assets')} type="button">
            资产库
          </button>
        </div>
      </div>

      {inventoryTab === 'colors' ? (
        <section className="inventory-browser">
          <article>
            <div className="section-heading-row">
              <h2>色块库存</h2>
              <div className="inventory-section-tools">
                <input
                  aria-label="搜索色块"
                  onChange={(event) => setColorSearchQuery(event.target.value)}
                  placeholder="搜索 RGB / 稀有度"
                  value={colorSearchQuery}
                />
                <button className="filter-toggle" onClick={() => setShowOnlyOwnedColors((current) => !current)} type="button">
                  {showOnlyOwnedColors ? '显示全部颜色' : '仅显示可用颜色'}
                </button>
              </div>
            </div>
            {visibleColorCatalog.length === 0 ? (
              <p className="empty-state">{colorSearchQuery.trim() ? '没有匹配的色块' : '暂无可用颜色'}</p>
            ) : (
              <div className="item-grid" aria-label="色块库存网格">
                {visibleColorCatalog.map((item) => (
                  <ColorCatalogItem
                    item={item}
                    isSelected={colorKey(item.color) === colorKey(selectedCatalogColor.color)}
                    key={colorKey(item.color)}
                    onSelectColor={onSelectColor}
                  />
                ))}
              </div>
            )}
          </article>
          <ColorDetail item={selectedCatalogColor} />
        </section>
      ) : inventoryTab === 'artworks' ? (
        <section className="inventory-browser">
          <article>
            <div className="section-heading-row">
              <h2>画作库存</h2>
              <div className="inventory-section-tools single-tool">
                <input
                  aria-label="搜索画作"
                  onChange={(event) => setArtworkSearchQuery(event.target.value)}
                  placeholder="搜索作品名 / ID"
                  value={artworkSearchQuery}
                />
              </div>
            </div>
            {artworkInventory.length === 0 ? (
              <p className="empty-state">暂无未鉴定草稿</p>
            ) : visibleArtworkInventory.length === 0 ? (
              <p className="empty-state">没有匹配的画作</p>
            ) : (
              <div className="item-grid artwork-grid" aria-label="画作库存网格">
                {visibleArtworkInventory.map((work) => (
                  <ArtworkCard isSelected={work.id === visibleSelectedArtwork?.id} key={work.id} onSelectArtwork={onSelectArtwork} work={work} />
                ))}
              </div>
            )}
          </article>
          {visibleSelectedArtwork ? (
            <ArtworkDetail
              asset={assets.find((item) => item.workId === visibleSelectedArtwork.id)}
              currentDraft={visibleSelectedArtwork}
              onCertifyWork={onCertifyWork}
              onContinueWork={onContinueWork}
              onDeleteDraft={onDeleteDraft}
              onOpenAsset={(assetId) => {
                onSelectAsset(assetId);
                onSelectInventoryTab('assets');
              }}
              onRenameWork={onRenameWork}
            />
          ) : (
            <aside className="detail-pane">
              <h2>作品详情</h2>
              <p className="empty-state">请选择未鉴定草稿</p>
            </aside>
          )}
        </section>
      ) : (
        <section className="inventory-browser">
          <article>
            <div className="asset-library-heading">
              <h2>资产库</h2>
              <div className="asset-library-tools">
                <input
                  aria-label="搜索资产"
                  onChange={(event) => setAssetSearchQuery(event.target.value)}
                  placeholder="搜索资产名 / 编号 / 指纹"
                  value={assetSearchQuery}
                />
                <select aria-label="资产排序" onChange={(event) => setAssetSortOrder(event.target.value as AssetSortOrder)} value={assetSortOrder}>
                  <option value="newest">最新鉴定优先</option>
                  <option value="oldest">最早鉴定优先</option>
                </select>
              </div>
            </div>
            {assets.length === 0 ? (
              <p className="empty-state">暂无已鉴定资产</p>
            ) : visibleAssets.length === 0 ? (
              <p className="empty-state">没有匹配的资产</p>
            ) : (
              <div className="item-grid artwork-grid" aria-label="资产库网格">
                {visibleAssets.map((asset) => {
                  const work = artworks.find((item) => item.id === asset.workId);

                  return <AssetCard asset={asset} isSelected={asset.id === visibleSelectedAsset?.id} key={asset.id} onSelectAsset={onSelectAsset} work={work} />;
                })}
              </div>
            )}
          </article>
          <AssetDetail asset={visibleSelectedAsset} work={visibleSelectedAsset ? artworks.find((item) => item.id === visibleSelectedAsset.workId) : undefined} />
        </section>
      )}
    </section>
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

function AssetCard({
  asset,
  isSelected,
  onSelectAsset,
  work
}: {
  asset: MosaicAsset;
  isSelected: boolean;
  onSelectAsset: (assetId: string) => void;
  work?: MosaicWork;
}) {
  return (
    <button
      aria-label={`查看资产 ${formatAssetDisplayId(asset)}`}
      className={`draft-card asset-card${isSelected ? ' selected' : ''}`}
      onClick={() => onSelectAsset(asset.id)}
      type="button"
    >
      {work ? <MosaicPreview className="card-preview" currentDraft={work} label={`${asset.title}资产缩略图`} /> : <div className="asset-placeholder">RGB</div>}
      <strong>{asset.title}</strong>
      <span>{formatAssetDisplayId(asset)}</span>
      <small>{asset.pixelHash.slice(0, 12)}...</small>
      <small>鉴定于 {new Date(asset.certifiedAt).toLocaleDateString()}</small>
    </button>
  );
}

function AssetDetail({ asset, work }: { asset: MosaicAsset | null; work?: MosaicWork }) {
  if (!asset) {
    return (
      <aside className="detail-pane asset-detail-pane">
        <h2>资产详情</h2>
        <p className="empty-state">请选择资产</p>
      </aside>
    );
  }

  return (
    <aside className="detail-pane asset-detail-pane">
      <h2>资产详情</h2>
      {work ? <MosaicPreview className="large" currentDraft={work} label={`${asset.title}资产详情预览`} /> : null}
      <h3>资产详情：{asset.title}</h3>
      <p className="work-status">状态：<span className="status-pill certified">已鉴定资产</span></p>
      <div className="asset-summary asset-detail-list">
        <p><span>资产编号：</span><strong>{formatAssetDisplayId(asset)}</strong></p>
        <p><span>资产指纹：</span><code>{asset.pixelHash}</code></p>
        <p><span>创建者：</span><strong>{asset.creatorId}</strong></p>
        <p><span>拥有者：</span><strong>{asset.ownerId}</strong></p>
        <p><span>鉴定时间：</span><strong>{new Date(asset.certifiedAt).toLocaleString()}</strong></p>
        <p><span>关联作品：</span><strong>{asset.workId}</strong></p>
        <p><span>画布尺寸：</span><strong>{work ? `${work.width}x${work.height}` : '未知'}</strong></p>
      </div>
    </aside>
  );
}

function ArtworkDetail({
  asset,
  currentDraft,
  onCertifyWork,
  onContinueWork,
  onDeleteDraft,
  onOpenAsset,
  onRenameWork
}: {
  asset?: MosaicAsset;
  currentDraft: MosaicWork;
  onCertifyWork: (work: MosaicWork) => void;
  onContinueWork: (work: MosaicWork) => void;
  onDeleteDraft: (work: MosaicWork) => void;
  onOpenAsset: (assetId: string) => void;
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
      {isCertified && asset ? (
        <button aria-label={`查看资产详情：${currentDraft.title}`} onClick={() => onOpenAsset(asset.id)} type="button">
          查看资产详情
        </button>
      ) : null}
      {!isComplete && !isCertified ? <p className="certification-message">作品未完成，无法鉴定</p> : null}
      {!isCertified ? <button disabled={!isComplete} onClick={() => onCertifyWork(currentDraft)} type="button">鉴定作品</button> : null}
      {!isCertified ? <button aria-label={`从详情继续创作 ${currentDraft.title}`} onClick={() => onContinueWork(currentDraft)} type="button">打开画布继续创作</button> : null}
    </aside>
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

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <article className="status-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
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

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(timestamp);
}

export default App;
