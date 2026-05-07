import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('应用首页', () => {
  it('展示游戏核心循环和 MVP 状态', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /RGB 马赛克资产游戏/ })).toBeInTheDocument();
    expect(screen.getByText('放置挖矿')).toBeInTheDocument();
    expect(screen.getByText('16x16 画布')).toBeInTheDocument();
    expect(screen.getByText('唯一资产鉴定')).toBeInTheDocument();
    expect(screen.getByText('平台内交易')).toBeInTheDocument();
  });
});
