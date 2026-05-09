import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('RGB 马赛克游戏原型', () => {
  beforeEach(() => {
    vi.useFakeTimers();
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
  });

  it('默认待鉴定作品是一张 16x16 哥布林头像', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '画布' }));

    const canvas = screen.getByLabelText('16x16 像素画布');
    const filledPixels = within(canvas).getAllByRole('button', { name: /已填充/ });

    expect(filledPixels).toHaveLength(150);
    expect(within(canvas).getAllByRole('button', { name: '已填充 rgb(72, 152, 96)' }).length).toBeGreaterThan(0);
    expect(within(canvas).getAllByRole('button', { name: '已填充 rgb(255, 16, 16)' })).toHaveLength(8);
    expect(screen.getByText('150/256')).toBeInTheDocument();
  });

  it('画布初始以 100% 全貌显示并支持 50% 到 3200% 缩放', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '画布' }));

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

  it('画布填色后自动保存到待鉴定作品并可继续创作', () => {
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    fireEvent.click(screen.getByRole('button', { name: '画布' }));
    fireEvent.click(screen.getByRole('button', { name: /选择 RGB/ }));
    const canvasBeforeFill = screen.getByLabelText('16x16 像素画布');
    const filledPixelsBeforeFill = within(canvasBeforeFill).getAllByRole('button', { name: /已填充/ }).length;
    fireEvent.click(screen.getAllByRole('button', { name: /空像素/ })[0]);

    const canvas = screen.getByLabelText('16x16 像素画布');

    expect(within(canvas).getAllByRole('button', { name: /已填充/ })).toHaveLength(filledPixelsBeforeFill + 1);
    expect(screen.getByText(/已自动保存到待鉴定作品/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '库存' }));
    fireEvent.click(screen.getByRole('button', { name: '画作库存' }));

    expect(screen.getAllByText('当前待鉴定作品').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: '继续创作' }));

    expect(screen.getByRole('heading', { name: '16x16 像素画布' })).toBeInTheDocument();
  });
});
