# RGB 马赛克资产游戏

这是一个面向 Steam 长期目标的 RGB 马赛克资产游戏原型。

玩家通过放置玩法挖掘真实 RGB 颜色，把颜色作为可消耗颜料填入像素画布。作品鉴定成功后，会成为平台内唯一数字资产，并可进入平台内市场交易。后续资产模型预留 Steam Inventory / Steam Market 接入能力。

仓库地址：`https://github.com/ml1027175683/MskGames.git`

## 当前阶段

当前仓库处于 MVP 早期原型阶段，重点是先建立可测试、可扩展的前端和核心领域规则。

已覆盖的基础方向：

1. React + TypeScript 前端应用。
2. RGB 颜色、像素矩阵、唯一指纹等核心领域规则。
3. 可测试、可扩展的代码结构。
4. 面向后续资产库、市场和 Steam 集成的设计文档。

## 核心玩法循环

```text
放置挖矿产出 RGB 颜色
-> 颜色进入玩家库存
-> 玩家在 16x16 像素画布上创作
-> 鉴定时消耗作品使用的颜色和平台货币
-> 系统校验像素矩阵唯一性
-> 鉴定成功后生成平台内唯一资产
-> 资产进入平台内市场和榜单
```

## MVP 范围

第一版目标是跑通一个完整的资产闭环，而不是一次性实现完整 Steam 经济系统。

| 模块 | MVP 目标 |
| --- | --- |
| 挖矿 | 放置产出真实 RGB 颜色和少量平台货币 |
| 颜色库存 | 相同 RGB 颜色按数量叠加 |
| 画布 | 第一版固定 `16x16` |
| 创作 | 玩家手动使用库存颜色填充像素 |
| 鉴定 | 消耗颜色和鉴定费，把作品转成唯一资产 |
| 唯一性 | `画布尺寸 + 完整 RGB 像素矩阵` 全平台唯一 |
| 资产 | 鉴定成功后生成平台内资产记录 |
| 交易 | 鉴定资产可以在平台内市场挂售和购买 |
| Steam 预留 | 资产字段预留 Steam Inventory / Steam Market 映射能力 |

## 暂不包含

以下内容不进入当前 MVP：

1. Steam Community Market 真实接入。
2. NFT 铸造或链上转移。
3. RGB 颜色交易。
4. 拍卖、报价或求购系统。
5. 大于 `16x16` 的画布。
6. 真实货币支付。
7. 宣传资产具有投资属性。

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
npm run test:watch
npm run build
npm run preview
```

命令说明：

| 命令 | 作用 |
| --- | --- |
| `npm install` | 安装依赖 |
| `npm run dev` | 启动本地开发服务器 |
| `npm test` | 运行测试 |
| `npm run test:watch` | 以监听模式运行测试 |
| `npm run build` | 执行 TypeScript 检查并构建生产版本 |
| `npm run preview` | 本地预览生产构建 |

## 项目结构

```text
src/
  App.tsx              # 当前前端原型入口
  domain/rgb.ts        # RGB 颜色领域规则
  *.test.tsx / *.test.ts # 测试文件
docs/
  superpowers/specs/   # 游戏设计文档
```

## 项目文档

设计文档：

`docs/superpowers/specs/2026-05-06-rgb-mosaic-asset-game-design.md`

## 开发流程

常规本地开发流程：

```bash
git pull
npm install
npm test
npm run build
```

如果需要启动页面调试：

```bash
npm run dev
```

## 后续路线

后续实现建议按以下顺序推进：

1. 完善 RGB 颜色生成、库存和稀有度规则。
2. 实现 `16x16` 画布编辑和颜色消耗校验。
3. 实现作品鉴定、唯一性指纹和资产生成。
4. 实现平台内资产库、挂售和购买流程。
5. 增加评分、榜单和基础反刷规则。
6. 在资产模型稳定后补充 Steam Inventory / Steam Market 映射字段。
