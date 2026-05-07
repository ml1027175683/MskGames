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

  it('进入页面后自动挖矿并展示库存', () => {
    render(<App />);

    expect(screen.getAllByText('自动挖矿中').length).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(screen.getByText('已挖颜色')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /选择 RGB/ })).toBeInTheDocument();
  });

  it('可以选择库存颜色并填充 16x16 画布', () => {
    render(<App />);

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    fireEvent.click(screen.getByRole('button', { name: /选择 RGB/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /空像素/ })[0]);

    const canvas = screen.getByLabelText('16x16 像素画布');

    expect(within(canvas).getByRole('button', { name: /已填充/ })).toBeInTheDocument();
    expect(screen.getByText(/库存已消耗/)).toBeInTheDocument();
  });
});
