import { MosaicPreview } from '../common/MosaicPreview';
import type { CertificationScan } from '../../types/game';

export function CertificationScanModal({
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
