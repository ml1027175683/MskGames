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
  });

  it('库存页分开展示色块库存和马赛克作品库', () => {
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    fireEvent.click(screen.getByRole('button', { name: '库存' }));

    expect(screen.getByRole('heading', { name: '色块库存' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '马赛克作品库' })).toBeInTheDocument();
    expect(screen.getByText('待鉴定')).toBeInTheDocument();
    expect(screen.getByText('已鉴定')).toBeInTheDocument();
    expect(screen.getByText('已归档')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /选择 RGB/ })).toBeInTheDocument();
  });

  it('画布填色后自动保存到待鉴定作品并可继续创作', () => {
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    fireEvent.click(screen.getByRole('button', { name: '画布' }));
    fireEvent.click(screen.getByRole('button', { name: /选择 RGB/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /空像素/ })[0]);

    const canvas = screen.getByLabelText('16x16 像素画布');

    expect(within(canvas).getByRole('button', { name: /已填充/ })).toBeInTheDocument();
    expect(screen.getByText(/已自动保存到待鉴定作品/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '库存' }));

    expect(screen.getByText('当前待鉴定作品')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '继续创作' }));

    expect(screen.getByRole('heading', { name: '16x16 像素画布' })).toBeInTheDocument();
  });
});
