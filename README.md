# RGB 马赛克资产游戏

这是一个面向 Steam 长期目标的 RGB 马赛克资产游戏代码库。

玩家通过放置玩法挖掘真实 RGB 颜色，把颜色作为可消耗颜料填入像素画布。作品鉴定成功后，会成为平台内唯一数字资产，并可进入平台内市场交易。后续资产模型预留 Steam Inventory / Steam Market 接入能力。

## 当前阶段

当前仓库处于 MVP 早期骨架阶段，目标是先建立：

1. React + TypeScript 前端应用。
2. RGB 颜色、像素矩阵、唯一指纹等核心领域规则。
3. 可测试、可扩展的代码结构。
4. 后续上传 GitHub 的基础仓库配置。

## 技术栈

| 类型 | 技术 |
| --- | --- |
| 前端 | Vite + React + TypeScript |
| 测试 | Vitest + Testing Library |
| 包管理 | npm |

## 常用命令

```bash
npm install
npm run dev
npm test
npm run build
```

## 项目文档

设计文档：

`docs/superpowers/specs/2026-05-06-rgb-mosaic-asset-game-design.md`

## GitHub 上传准备

仓库已包含 `.gitignore`、`README.md`、基础项目配置和设计文档。后续可以创建 GitHub 远程仓库后执行：

```bash
git remote add origin <你的 GitHub 仓库地址>
git branch -M main
git push -u origin main
```
