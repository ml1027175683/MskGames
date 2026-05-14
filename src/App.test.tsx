import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App, { createPatternPixels } from './App';

describe('RGB 马赛克游戏原型', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('默认进入挖矿页并只展示最近 10 条产出记录', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '挖矿控制台' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '色块库存' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '16x16 像素画布' })).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(16500);
    });

    expect(screen.getAllByText('+1')).toHaveLength(10);
    expect(screen.getAllByText(/等级：/)).toHaveLength(10);
  });

  it('库存页分开展示色块库存和马赛克作品库', () => {
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    fireEvent.click(screen.getByRole('button', { name: '库存' }));

    expect(screen.getByRole('button', { name: '色块库存' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '画作库存' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '色块库存' })).toBeInTheDocument();
    expect(screen.getByLabelText('色块库存网格')).toBeInTheDocument();
    expect(screen.getByText('物品详情')).toBeInTheDocument();
    expect(screen.getAllByText('数量：0').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /选择 RGB/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/等级：/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));

    expect(screen.getByRole('heading', { name: '画作库存' })).toBeInTheDocument();
    expect(screen.getByText('当前待鉴定作品')).toBeInTheDocument();
    expect(screen.getByText('作品详情')).toBeInTheDocument();
    expect(screen.getByLabelText('当前待鉴定作品缩略图').children).toHaveLength(256);
    expect(screen.getByText('皮卡丘像素图标')).toBeInTheDocument();
    expect(screen.getByLabelText('皮卡丘像素图标缩略图').children).toHaveLength(256);
    expect(screen.getAllByLabelText(/鉴定状态/)).toHaveLength(2);
    expect(screen.queryByRole('button', { name: '继续创作 皮卡丘像素图标' })).not.toBeInTheDocument();
  });

  it('色块库存可以切换仅显示可用颜色', () => {
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    fireEvent.click(screen.getByRole('button', { name: '库存' }));

    expect(screen.getAllByRole('button', { name: /数量：0/ }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: '仅显示可用颜色' }));

    expect(screen.queryByRole('button', { name: /数量：0/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /数量：1/ }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: '显示全部颜色' }));

    expect(screen.getAllByRole('button', { name: /数量：0/ }).length).toBeGreaterThan(0);
  });

  it('画布页可以切换显示全部库存颜色或仅显示可用颜色', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '画布' }));

    expect(screen.queryByRole('button', { name: /选择 RGB/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '显示全部颜色' }));

    expect(screen.getAllByRole('button', { name: /选择 RGB/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /x0/ }).length).toBeGreaterThan(0);
  });

  it('画作库存通过右侧详情继续创作', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));
    fireEvent.click(screen.getByRole('button', { name: '查看作品 皮卡丘像素图标' }));
    fireEvent.click(screen.getByRole('button', { name: '从详情继续创作 皮卡丘像素图标' }));

    expect(screen.getByRole('heading', { name: '16x16 像素画布' })).toBeInTheDocument();
    expect(screen.getByText('256/256')).toBeInTheDocument();
  });

  it('点击画作卡片只切换详情，详情按钮才进入画布', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));

    fireEvent.click(screen.getByRole('button', { name: '查看作品 皮卡丘像素图标' }));

    expect(screen.getByText('作品详情：皮卡丘像素图标')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '16x16 像素画布' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '从详情继续创作 皮卡丘像素图标' }));

    expect(screen.getByRole('heading', { name: '16x16 像素画布' })).toBeInTheDocument();
    expect(screen.getByText('256/256')).toBeInTheDocument();
  });

  it('未完成作品不能鉴定', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));

    expect(screen.getByText('作品详情：当前待鉴定作品')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '鉴定作品' })).toBeDisabled();
    expect(screen.getByText('作品未完成，无法鉴定')).toBeInTheDocument();
  });

  it('完整作品鉴定后进入资产库并从画作库存移除', async () => {
    vi.useRealTimers();
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));
    fireEvent.click(screen.getByRole('button', { name: '查看作品 皮卡丘像素图标' }));
    fireEvent.click(screen.getByRole('button', { name: '鉴定作品' }));

    expect((await screen.findAllByText('asset-pikachu-icon', undefined, { timeout: 3000 })).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^[a-f0-9]{12}\.\.\.$/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/asset-pikachu-icon-\d{13}/)).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: '查看资产详情' }, { timeout: 3000 }));

    expect(screen.getByRole('heading', { name: '资产详情：皮卡丘像素图标' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));

    expect(screen.queryByRole('button', { name: '查看作品 皮卡丘像素图标' })).not.toBeInTheDocument();
    expect(screen.queryByText('作品详情：皮卡丘像素图标')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看作品 当前待鉴定作品' })).toBeInTheDocument();
  });

  it('点击鉴定作品会在当前页播放像素扫描动画并展示鉴定结果', async () => {
    vi.useRealTimers();
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));
    fireEvent.click(screen.getByRole('button', { name: '查看作品 皮卡丘像素图标' }));
    fireEvent.click(screen.getByRole('button', { name: '鉴定作品' }));

    const scanDialog = await screen.findByRole('dialog', { name: '像素扫描鉴定' });

    expect(scanDialog).toBeInTheDocument();
    expect(screen.getByText('像素扫描鉴定中')).toBeInTheDocument();
    expect(screen.getByText('正在扫描 16x16 像素矩阵')).toBeInTheDocument();
    expect(getComputedStyle(screen.getByLabelText('皮卡丘像素图标扫描预览')).boxSizing).toBe('border-box');
    expect(screen.getByRole('heading', { name: '画作库存' })).toBeInTheDocument();

    expect(await screen.findByText('鉴定成功', undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(within(scanDialog).getByText('资产卡')).toBeInTheDocument();
    expect(within(scanDialog).getByText('作品名称：')).toBeInTheDocument();
    expect(within(scanDialog).getByText('鉴定时间：')).toBeInTheDocument();
    expect(within(scanDialog).getByText('创建者：')).toBeInTheDocument();
    expect(within(scanDialog).getByText('拥有者：')).toBeInTheDocument();
    expect(screen.getAllByText('asset-pikachu-icon').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^[a-f0-9]{12}\.\.\.$/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '查看资产详情' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '关闭鉴定结果' })).toBeInTheDocument();
  });

  it('资产库空状态和鉴定后资产详情跳转', async () => {
    vi.useRealTimers();
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '资产库' }));

    expect(screen.getByRole('heading', { name: '资产库' })).toBeInTheDocument();
    expect(screen.getByText('暂无已鉴定资产')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));
    fireEvent.click(screen.getByRole('button', { name: '查看作品 皮卡丘像素图标' }));
    fireEvent.click(screen.getByRole('button', { name: '鉴定作品' }));
    fireEvent.click(await screen.findByRole('button', { name: '查看资产详情' }, { timeout: 3000 }));

    expect(screen.getByRole('button', { name: '资产库' })).toHaveClass('active');
    expect(screen.getByRole('button', { name: '查看资产 asset-pikachu-icon' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '资产详情：皮卡丘像素图标' })).toBeInTheDocument();
    expect(screen.getByText('资产编号：')).toBeInTheDocument();
    expect(screen.getByText('资产指纹：')).toBeInTheDocument();
    expect(screen.getByText('创建者：')).toBeInTheDocument();
    expect(screen.getByText('拥有者：')).toBeInTheDocument();
    expect(screen.getByText('关联作品：')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '作品操作菜单' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '鉴定作品' })).not.toBeInTheDocument();
  });

  it('没有未鉴定草稿时画作库存显示空状态', () => {
    const certifiedPixels = Array.from({ length: 256 }, () => ({ r: 12, g: 34, b: 56 }));

    window.localStorage.setItem(
      'rgb-mosaic-save-v1',
      JSON.stringify({
        activeWorkId: null,
        artworks: [
          {
            id: 'current-draft',
            title: '哥布林资产来源',
            status: 'certified',
            width: 16,
            height: 16,
            pixels: certifiedPixels,
            updatedAt: 1,
            archivedKey: '12,34,56|'.repeat(256)
          },
          {
            id: 'pikachu-icon',
            title: '皮卡丘资产来源',
            status: 'certified',
            width: 16,
            height: 16,
            pixels: certifiedPixels,
            updatedAt: 2,
            archivedKey: '12,34,56|'.repeat(256)
          }
        ],
        assets: [
          {
            id: 'asset-certified-only',
            workId: 'current-draft',
            title: '哥布林资产来源',
            pixelHash: '12,34,56|'.repeat(256),
            creatorId: 'local-player',
            ownerId: 'local-player',
            certifiedAt: 1
          }
        ],
        inventory: [],
        minedCount: 0,
        selectedArtworkId: 'current-draft'
      })
    );

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));

    expect(screen.getByText('暂无未鉴定草稿')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '查看作品 哥布林资产来源' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '查看作品 皮卡丘资产来源' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '作品详情：哥布林资产来源' })).not.toBeInTheDocument();
  });

  it('资产库可以在多个资产之间切换右侧详情', () => {
    const redPixels = Array.from({ length: 256 }, () => ({ r: 255, g: 0, b: 0 }));
    const bluePixels = Array.from({ length: 256 }, () => ({ r: 0, g: 0, b: 255 }));

    window.localStorage.setItem(
      'rgb-mosaic-save-v1',
      JSON.stringify({
        activeWorkId: null,
        artworks: [
          {
            id: 'current-draft',
            title: '红色资产来源',
            status: 'certified',
            width: 16,
            height: 16,
            pixels: redPixels,
            updatedAt: 1,
            archivedKey: '255,0,0|'.repeat(256)
          },
          {
            id: 'pikachu-icon',
            title: '蓝色资产来源',
            status: 'certified',
            width: 16,
            height: 16,
            pixels: bluePixels,
            updatedAt: 2,
            archivedKey: '0,0,255|'.repeat(256)
          }
        ],
        assets: [
          {
            id: 'asset-red',
            workId: 'current-draft',
            title: '红色资产来源',
            pixelHash: '255,0,0|'.repeat(256),
            creatorId: 'local-player',
            ownerId: 'local-player',
            certifiedAt: 1
          },
          {
            id: 'asset-blue',
            workId: 'pikachu-icon',
            title: '蓝色资产来源',
            pixelHash: '0,0,255|'.repeat(256),
            creatorId: 'local-player',
            ownerId: 'local-player',
            certifiedAt: 2
          }
        ],
        inventory: [],
        minedCount: 0,
        selectedArtworkId: 'current-draft'
      })
    );

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '资产库' }));

    expect(screen.getByRole('button', { name: '查看资产 asset-current-draft' })).toHaveClass('selected');
    expect(screen.getByRole('heading', { name: '资产详情：红色资产来源' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '查看资产 asset-pikachu-icon' }));

    expect(screen.getByRole('button', { name: '查看资产 asset-pikachu-icon' })).toHaveClass('selected');
    expect(screen.getByRole('heading', { name: '资产详情：蓝色资产来源' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '资产详情：红色资产来源' })).not.toBeInTheDocument();
  });

  it('像素矩阵重复的作品不能重复鉴定为第二个资产', async () => {
    vi.useRealTimers();
    const duplicatePixels = Array.from({ length: 256 }, () => ({ r: 12, g: 34, b: 56 }));

    window.localStorage.setItem(
      'rgb-mosaic-save-v1',
      JSON.stringify({
        activeWorkId: 'duplicate-a',
        artworks: [
          {
            id: 'duplicate-a',
            title: '重复矩阵 A',
            status: 'draft',
            width: 16,
            height: 16,
            pixels: duplicatePixels,
            updatedAt: 1
          },
          {
            id: 'duplicate-b',
            title: '重复矩阵 B',
            status: 'draft',
            width: 16,
            height: 16,
            pixels: duplicatePixels,
            updatedAt: 2
          }
        ],
        assets: [],
        inventory: [],
        minedCount: 0,
        selectedArtworkId: 'duplicate-a'
      })
    );

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));
    fireEvent.click(screen.getByRole('button', { name: '查看作品 重复矩阵 A' }));
    fireEvent.click(screen.getByRole('button', { name: '鉴定作品' }));
    fireEvent.click(await screen.findByRole('button', { name: '查看资产详情' }, { timeout: 3000 }));

    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));
    fireEvent.click(screen.getByRole('button', { name: '查看作品 重复矩阵 B' }));
    fireEvent.click(screen.getByRole('button', { name: '鉴定作品' }));

    expect(screen.queryByRole('dialog', { name: '像素扫描鉴定' })).not.toBeInTheDocument();
    expect(await screen.findByText('该像素矩阵已存在，无法重复鉴定。')).toBeInTheDocument();
    expect(within(screen.getByLabelText('重复矩阵 B鉴定状态')).getByText('未鉴定')).toBeInTheDocument();
  });

  it('未鉴定作品可以重命名并同步到库存和画布下拉列表', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));
    fireEvent.click(screen.getByRole('button', { name: '查看作品 当前待鉴定作品' }));
    expect(screen.queryByRole('button', { name: '重命名作品' })).not.toBeInTheDocument();
    fireEvent.doubleClick(screen.getByRole('heading', { name: '作品详情：当前待鉴定作品' }));
    expect(screen.queryByLabelText('作品新名称')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '作品操作菜单' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '重命名' }));
    fireEvent.change(screen.getByLabelText('作品新名称'), { target: { value: '哥布林头像改名' } });
    fireEvent.click(screen.getByRole('button', { name: '确认重命名' }));

    expect(screen.getByText('作品详情：哥布林头像改名')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看作品 哥布林头像改名' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '画布' }));

    expect(screen.getByRole('option', { name: '哥布林头像改名' })).toBeInTheDocument();
  });

  it('已鉴定作品不会留在画作库存中继续重命名', async () => {
    vi.useRealTimers();
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));
    fireEvent.click(screen.getByRole('button', { name: '查看作品 皮卡丘像素图标' }));
    fireEvent.click(screen.getByRole('button', { name: '鉴定作品' }));
    fireEvent.click(await screen.findByRole('button', { name: '查看资产详情' }, { timeout: 3000 }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));

    expect(screen.queryByRole('button', { name: '查看作品 皮卡丘像素图标' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '作品详情：皮卡丘像素图标' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '重命名作品' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('作品新名称')).not.toBeInTheDocument();
  });

  it('编辑皮卡丘后回到画作库存仍保留所有作品并保存到皮卡丘', () => {
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));
    fireEvent.click(screen.getByRole('button', { name: '查看作品 皮卡丘像素图标' }));
    fireEvent.click(screen.getByRole('button', { name: '从详情继续创作 皮卡丘像素图标' }));

    fireEvent.click(screen.getByRole('button', { name: /选择 RGB/ }));
    fireEvent.click(screen.getAllByRole('button', { name: '已填充 rgb(255, 255, 255)' })[0]);

    expect(screen.getByText(/已自动保存到「皮卡丘像素图标」/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));

    expect(screen.getByText('当前待鉴定作品')).toBeInTheDocument();
    expect(screen.getByText('皮卡丘像素图标')).toBeInTheDocument();
    expect(screen.getByText('作品详情：皮卡丘像素图标')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '从详情继续创作 皮卡丘像素图标' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '从详情继续创作 皮卡丘像素图标' }));

    expect(screen.getAllByRole('button', { name: /已填充/ })).toHaveLength(256);
  });

  it('直接进入画布不会自动创建作品，需要命名后才进入编辑', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '画布' }));

    expect(screen.getByText('还没有选择画作')).toBeInTheDocument();
    expect(screen.queryByLabelText('16x16 像素画布')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '新建画作' }));
    expect(screen.getByRole('dialog', { name: '新建画作' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('新作品名称'), { target: { value: '测试新画作' } });
    fireEvent.click(screen.getByRole('button', { name: '确认新建' }));

    const canvas = screen.getByLabelText('16x16 像素画布');

    expect(within(canvas).queryAllByRole('button', { name: /已填充/ })).toHaveLength(0);
    expect(within(canvas).getAllByRole('button', { name: /空像素/ })).toHaveLength(256);
    expect(screen.getByText('0/256')).toBeInTheDocument();
    expect(screen.getByText('正在编辑「测试新画作」。')).toBeInTheDocument();
  });

  it('通过库存继续创作会打开已有的哥布林头像', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));
    fireEvent.click(screen.getByRole('button', { name: '查看作品 当前待鉴定作品' }));
    fireEvent.click(screen.getByRole('button', { name: '从详情继续创作 当前待鉴定作品' }));

    const canvas = screen.getByLabelText('16x16 像素画布');

    expect(within(canvas).getAllByRole('button', { name: /已填充/ })).toHaveLength(150);
    expect(within(canvas).getAllByRole('button', { name: '已填充 rgb(72, 152, 96)' }).length).toBeGreaterThan(0);
    expect(within(canvas).getAllByRole('button', { name: '已填充 rgb(255, 16, 16)' })).toHaveLength(8);
    expect(screen.getByText('150/256')).toBeInTheDocument();
  });

  it('画布页可以从未鉴定画作下拉列表直接进入创作', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '画布' }));
    fireEvent.change(screen.getByLabelText('选择未鉴定画作'), { target: { value: 'current-draft' } });

    const canvas = screen.getByLabelText('16x16 像素画布');

    expect(within(canvas).getAllByRole('button', { name: /已填充/ })).toHaveLength(150);
    expect(screen.getByText('正在编辑「当前待鉴定作品」。')).toBeInTheDocument();
  });

  it('画布初始以 100% 全貌显示并支持 50% 到 3200% 缩放', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '画布' }));

    fireEvent.click(screen.getByRole('button', { name: '新建画作' }));
    fireEvent.change(screen.getByLabelText('新作品名称'), { target: { value: '缩放测试画作' } });
    fireEvent.click(screen.getByRole('button', { name: '确认新建' }));

    const canvas = screen.getByLabelText('16x16 像素画布');
    const stage = screen.getByLabelText('画布显示区域');

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(stage).toHaveAttribute('data-zoom', '100');
    expect(canvas).toHaveAttribute('data-zoom', '100');

    fireEvent.click(screen.getByRole('button', { name: '缩小画布' }));

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(stage).toHaveAttribute('data-zoom', '50');
    expect(canvas).toHaveAttribute('data-zoom', '50');

    fireEvent.click(screen.getByRole('button', { name: '放大画布' }));

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(canvas).toHaveAttribute('data-zoom', '100');

    for (let i = 0; i < 5; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: '放大画布' }));
    }

    expect(screen.getByText('3200%')).toBeInTheDocument();
    expect(canvas).toHaveAttribute('data-zoom', '3200');
    expect(screen.getByRole('button', { name: '放大画布' })).toBeDisabled();
  });

  it('命名创建的新画作填色后自动保存并可继续创作', () => {
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    fireEvent.click(screen.getByRole('button', { name: '画布' }));
    fireEvent.click(screen.getByRole('button', { name: '新建画作' }));
    fireEvent.change(screen.getByLabelText('新作品名称'), { target: { value: '命名草稿' } });
    fireEvent.click(screen.getByRole('button', { name: '确认新建' }));
    fireEvent.click(screen.getByRole('button', { name: /选择 RGB/ }));
    const canvasBeforeFill = screen.getByLabelText('16x16 像素画布');
    const filledPixelsBeforeFill = within(canvasBeforeFill).queryAllByRole('button', { name: /已填充/ }).length;
    fireEvent.click(screen.getAllByRole('button', { name: /空像素/ })[0]);

    const canvas = screen.getByLabelText('16x16 像素画布');

    expect(within(canvas).getAllByRole('button', { name: /已填充/ })).toHaveLength(filledPixelsBeforeFill + 1);
    expect(screen.getByText(/已自动保存到「命名草稿」/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));

    expect(screen.getAllByText('命名草稿').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: '查看作品 命名草稿' }));
    fireEvent.click(screen.getByRole('button', { name: '从详情继续创作 命名草稿' }));

    expect(screen.getByRole('heading', { name: '16x16 像素画布' })).toBeInTheDocument();
  });

  it('未鉴定作品达到 5 个时禁用新建作品', () => {
    render(<App />);

    for (let index = 1; index <= 3; index += 1) {
      fireEvent.click(screen.getByRole('button', { name: '画布' }));
      fireEvent.click(screen.getByRole('button', { name: '新建画作' }));
      fireEvent.change(screen.getByLabelText('新作品名称'), { target: { value: `限制草稿 ${index}` } });
      fireEvent.click(screen.getByRole('button', { name: '确认新建' }));
    }

    fireEvent.click(screen.getByRole('button', { name: '画布' }));

    expect(screen.getByRole('button', { name: '新建画作' })).toBeDisabled();
    expect(screen.getByText('未鉴定作品已达 5 个，请先鉴定或删除草稿。')).toBeInTheDocument();
  });

  it('内置哥布林草稿不能被删除', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));
    fireEvent.click(screen.getByRole('button', { name: '查看作品 当前待鉴定作品' }));

    fireEvent.click(screen.getByRole('button', { name: '作品操作菜单' }));

    expect(screen.getByRole('menuitem', { name: '重命名' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '删除草稿' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看作品 当前待鉴定作品' })).toBeInTheDocument();
  });

  it('删除命名草稿会从库存移除并返还已填颜色', () => {
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    const minedColorButton = screen.getAllByRole('button', { name: /数量：1/ })[0];
    const minedColorName = minedColorButton.textContent?.match(/RGB\((\d+), (\d+), (\d+)\)/)?.[0];

    expect(minedColorName).toBeDefined();

    fireEvent.click(minedColorButton);
    fireEvent.click(screen.getByRole('button', { name: '画布' }));
    fireEvent.click(screen.getByRole('button', { name: '新建画作' }));
    fireEvent.change(screen.getByLabelText('新作品名称'), { target: { value: '可删除草稿' } });
    fireEvent.click(screen.getByRole('button', { name: '确认新建' }));
    fireEvent.click(screen.getByRole('button', { name: /选择 RGB/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /空像素/ })[0]);
    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));
    fireEvent.click(screen.getByRole('button', { name: '查看作品 可删除草稿' }));
    fireEvent.click(screen.getByRole('button', { name: '作品操作菜单' }));
    expect(screen.getByRole('menuitem', { name: '重命名' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: '删除草稿' }));
    fireEvent.click(screen.getByRole('button', { name: '确认删除草稿' }));

    expect(screen.queryByRole('button', { name: '查看作品 可删除草稿' })).not.toBeInTheDocument();
    expect(screen.getByText(/已删除「可删除草稿」，并返还 1 个色块。/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '色块库存' }));

    const escapedMinedColorName = minedColorName?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    expect(screen.getByRole('button', { name: new RegExp(`${escapedMinedColorName}.*数量：1`) })).toBeInTheDocument();
  });

  it('删除当前画布草稿后画布回到未选择状态', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '画布' }));
    fireEvent.click(screen.getByRole('button', { name: '新建画作' }));
    fireEvent.change(screen.getByLabelText('新作品名称'), { target: { value: '当前画布草稿' } });
    fireEvent.click(screen.getByRole('button', { name: '确认新建' }));
    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));
    fireEvent.click(screen.getByRole('button', { name: '查看作品 当前画布草稿' }));
    fireEvent.click(screen.getByRole('button', { name: '从详情继续创作 当前画布草稿' }));
    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));
    fireEvent.click(screen.getByRole('button', { name: '作品操作菜单' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '删除草稿' }));
    fireEvent.click(screen.getByRole('button', { name: '确认删除草稿' }));
    fireEvent.click(screen.getByRole('button', { name: '画布' }));

    expect(screen.getByText('还没有选择画作')).toBeInTheDocument();
    expect(screen.queryByLabelText('16x16 像素画布')).not.toBeInTheDocument();
  });

  it('重新打开应用后会恢复本地保存的画作', () => {
    const firstRender = render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '画布' }));
    fireEvent.click(screen.getByRole('button', { name: '新建画作' }));
    fireEvent.change(screen.getByLabelText('新作品名称'), { target: { value: '持久化草稿' } });
    fireEvent.click(screen.getByRole('button', { name: '确认新建' }));
    firstRender.unmount();

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));

    expect(screen.getByRole('button', { name: '查看作品 持久化草稿' })).toBeInTheDocument();
  });

  it('重新打开应用后会恢复已鉴定资产库', async () => {
    vi.useRealTimers();
    const firstRender = render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));
    fireEvent.click(screen.getByRole('button', { name: '查看作品 皮卡丘像素图标' }));
    fireEvent.click(screen.getByRole('button', { name: '鉴定作品' }));
    fireEvent.click(await screen.findByRole('button', { name: '查看资产详情' }, { timeout: 3000 }));
    firstRender.unmount();

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '资产库' }));

    expect(screen.getByRole('button', { name: '查看资产 asset-pikachu-icon' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '资产详情：皮卡丘像素图标' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));

    expect(screen.queryByRole('button', { name: '查看作品 皮卡丘像素图标' })).not.toBeInTheDocument();
  });

  it('本地存档缺少内置哥布林时会自动补回', () => {
    window.localStorage.setItem(
      'rgb-mosaic-save-v1',
      JSON.stringify({
        activeWorkId: 'pikachu-icon',
        artworks: [],
        assets: [],
        inventory: [],
        minedCount: 0,
        selectedArtworkId: 'pikachu-icon'
      })
    );

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));

    expect(screen.getByRole('button', { name: '查看作品 当前待鉴定作品' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看作品 皮卡丘像素图标' })).toBeInTheDocument();
  });

  it('本地存档损坏时回退默认画作', () => {
    window.localStorage.setItem('rgb-mosaic-save-v1', '{bad json');

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));

    expect(screen.getByRole('button', { name: '查看作品 当前待鉴定作品' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看作品 皮卡丘像素图标' })).toBeInTheDocument();
  });

  it('覆盖已填像素时消耗新颜色并返还旧颜色', () => {
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    let minedColorButton = screen.getAllByRole('button', { name: /数量：1/ }).find((button) => !button.textContent?.includes('RGB(72, 152, 96)'));

    while (!minedColorButton) {
      act(() => {
        vi.advanceTimersByTime(1600);
      });
      minedColorButton = screen.getAllByRole('button', { name: /数量：1/ }).find((button) => !button.textContent?.includes('RGB(72, 152, 96)'));
    }

    const minedColorName = minedColorButton.textContent?.match(/RGB\((\d+), (\d+), (\d+)\)/)?.[0];

    expect(minedColorName).toBeDefined();

    fireEvent.click(minedColorButton);
    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    const greenBefore = Number(screen.getByRole('button', { name: /RGB\(72, 152, 96\).*数量：\d+/ }).textContent?.match(/数量：(\d+)/)?.[1] ?? '0');
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));
    fireEvent.click(screen.getByRole('button', { name: '查看作品 当前待鉴定作品' }));
    fireEvent.click(screen.getByRole('button', { name: '从详情继续创作 当前待鉴定作品' }));
    fireEvent.click(screen.getAllByRole('button', { name: '已填充 rgb(72, 152, 96)' })[0]);

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '色块库存' }));

    const escapedMinedColorName = minedColorName?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    expect(screen.getByRole('button', { name: new RegExp(`${escapedMinedColorName}.*数量：0`) })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(`RGB\\(72, 152, 96\\).*数量：${greenBefore + 1}`) })).toBeInTheDocument();
  });

  it('像素图案必须是 16x16 且只能使用调色板里的标记', () => {
    const palette = {
      '.': null,
      R: { r: 255, g: 0, b: 0 }
    };

    expect(() => createPatternPixels(['R'], palette)).toThrow('像素图案必须包含 16 行');
    expect(() => createPatternPixels(Array.from({ length: 16 }, () => 'R'), palette)).toThrow('像素图案第 1 行必须包含 16 个标记');
    expect(() => createPatternPixels(['X...............', ...Array.from({ length: 15 }, () => '................')], palette)).toThrow('像素图案包含未知标记 X');
  });
});
