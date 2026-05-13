# RGB 马赛克资产游戏

![RGB 马赛克资产游戏海报](docs/assets/rgb-mosaic-poster.svg)

这是一个面向 Steam 长期目标的 RGB 马赛克资产游戏原型。

玩家通过放置玩法挖掘真实 RGB 颜色，把颜色作为可消耗颜料填入像素画布。作品鉴定成功后，会成为平台内唯一数字资产，并可进入平台内市场交易。后续资产模型预留 Steam Inventory / Steam Market 接入能力。

仓库地址：`https://github.com/ml1027175683/MskGames.git`

## 当前原型状态

当前仓库已经具备一个可运行、可测试的网页 MVP 原型，重点是验证基础玩法闭环和前端交互：自动挖矿、颜色库存、画作库存、独立画布、自动保存、作品继续创作、像素扫描鉴定和平台内资产生成。

当前版本还不是完整经济系统。平台内市场、Steam 接入和真实交易仍属于后续路线。

## 当前已实现

| 模块 | 当前能力 |
| --- | --- |
| 挖矿 | 默认进入挖矿页，系统自动产出 RGB 色块 |
| 产出记录 | 挖矿页只展示最近 10 条产出记录 |
| 颜色稀有度 | 7 级稀有度：普通、优良、稀有、精粹、史诗、传说、棱晶 |
| 代表色图鉴 | 7 个等级共 56 个代表色，未拥有颜色显示数量 0 |
| 库存 | Steam 风格库存界面，分为色块库存和画作库存 |
| 色块库存 | 相同 RGB 按数量叠放，可查看颜色等级和库存数量 |
| 画作库存 | 内置哥布林和皮卡丘像素作品，画作卡片只展示信息和鉴定状态 |
| 作品详情 | 右侧详情面板集中承载继续创作、鉴定、重命名和删除入口 |
| 新建画作 | 新建作品必须命名，未鉴定草稿最多 5 个 |
| 画布 | 独立 `16x16` 像素画布，共 256 个像素 |
| 填色 | 选择已拥有颜色后点击像素填色，并消耗库存数量；覆盖像素会返还旧颜色 |
| 自动保存 | 填色后自动保存当前编辑作品，无保存按钮 |
| 缩放 | 画布支持 `50%`、`100%`、`200%`、`400%`、`800%`、`1600%`、`3200%` |
| 鉴定 | 完整作品可播放像素扫描鉴定，并生成唯一平台内资产 |
| 草稿删除 | 用户新建未鉴定草稿可删除，并返还已填颜色；内置作品和已鉴定作品不可删除 |
| 本地保存 | 保存颜色库存、画作、资产、当前选中作品和挖矿总数 |
| 测试 | 使用 Vitest + Testing Library 覆盖核心页面和 RGB 领域规则 |

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

当前原型已经覆盖从挖矿到鉴定生成资产的主要交互。平台内市场、榜单和 Steam 接入仍在后续实现范围。

## MVP 范围与长期规划

第一版目标是跑通一个完整的资产闭环，而不是一次性实现完整 Steam 经济系统。

| 模块 | 当前状态 | MVP / 后续目标 |
| --- | --- | --- |
| 挖矿 | 已有网页原型 | 放置产出真实 RGB 颜色和少量平台货币 |
| 颜色库存 | 已有网页原型 | 相同 RGB 颜色按数量叠加，支持筛选和消耗校验 |
| 画布 | 已有 `16x16` 原型 | 第一版固定 `16x16`，后续再考虑更大画布 |
| 创作 | 已有填色和自动保存 | 玩家手动使用库存颜色填充像素 |
| 画作库存 | 已有多作品展示和继续创作 | 稳定管理草稿、已鉴定作品和归档作品 |
| 鉴定 | 已有扫描弹窗原型 | 后续补充鉴定费用、失败状态和更完整的资产校验 |
| 唯一性 | 已有像素指纹校验 | `画布尺寸 + 完整 RGB 像素矩阵` 全平台唯一 |
| 资产 | 已有平台内资产记录 | 后续补充资产详情页、转移记录和市场字段 |
| 交易 | 未实现 | 鉴定资产可以在平台内市场挂售和购买 |
| Steam 预留 | 设计文档预留 | 资产字段预留 Steam Inventory / Steam Market 映射能力 |

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
| 样式 | CSS |
| 桌面客户端 | Tauri |
| 包管理 | npm |

## 本地运行

Windows PowerShell 环境下建议使用 `npm.cmd`，避免系统脚本执行策略拦截 `npm.ps1`。

```bash
npm.cmd install
npm.cmd run dev
```

macOS、Linux 或没有 PowerShell 脚本限制的环境可以使用常规 npm 命令：

```bash
npm install
npm run dev
```

启动后按终端输出访问本地 Vite 地址。

## 常用命令

Windows PowerShell：

```bash
npm.cmd install
npm.cmd run dev
npm.cmd test
npm.cmd run test:watch
npm.cmd run build
npm.cmd run preview
npm.cmd run tauri:dev
npm.cmd run tauri:build
```

命令说明：

| 命令 | 作用 |
| --- | --- |
| `npm.cmd install` | 安装依赖 |
| `npm.cmd run dev` | 启动本地开发服务器 |
| `npm.cmd test` | 运行测试 |
| `npm.cmd run test:watch` | 以监听模式运行测试 |
| `npm.cmd run build` | 执行 TypeScript 检查并构建生产版本 |
| `npm.cmd run preview` | 本地预览生产构建 |
| `npm.cmd run tauri:dev` | 启动 Tauri 桌面开发窗口 |
| `npm.cmd run tauri:build` | 构建 Windows 桌面客户端 |

## 桌面客户端

当前项目已经加入 Tauri 桌面壳，可把现有 React/Vite 前端封装为 Windows 桌面客户端。

桌面开发和打包需要先安装 Rust 工具链，并确保 Windows WebView2 Runtime 可用：

```bash
rustc --version
cargo --version
```

安装环境后可运行：

```bash
npm.cmd run tauri:dev
npm.cmd run tauri:build
```

Tauri 构建产物通常位于：

```text
src-tauri/target/release/
src-tauri/target/release/bundle/
```

第一版桌面客户端只封装当前网页 MVP，不包含 Steam SDK、自动更新、后端云存档或安装器美化。

## 交互说明

1. 默认进入挖矿页，矿机会自动产出 RGB 色块。
2. 进入库存页后，可在色块库存中查看 56 个代表色图鉴和已有数量。
3. 库存页切换到画作库存后，可查看哥布林、皮卡丘和玩家新建作品。
4. 点击画作卡片会切换右侧作品详情，操作集中在详情面板中。
5. 未鉴定作品可以从详情继续创作，完整作品可以播放像素扫描并鉴定成资产。
6. 作品重命名和删除入口位于详情右上角 `...` 菜单；已鉴定作品名称锁定。
7. 顶部进入画布不会自动新建作品，需要命名新建或选择未鉴定作品。
8. 在画布页选择一个可用色块，再点击像素即可填色。
9. 每次填色会自动保存，不需要点击保存按钮。
10. 画布缩放默认 `100%`，可在 `50%` 到 `3200%` 之间调整。

## 项目结构

```text
src/
  App.tsx                 # 当前前端原型入口和页面交互
  App.test.tsx            # 页面级行为测试
  styles.css              # 页面布局、库存、画布和像素预览样式
  domain/
    rgb.ts                # RGB 颜色、稀有度、代表色和像素哈希领域规则
    rgb.test.ts           # RGB 领域规则测试
docs/
  assets/                 # README 海报和视觉说明资源
  superpowers/specs/      # 游戏设计文档
src-tauri/                # Tauri 桌面客户端配置和 Rust 入口
```

## 项目文档

设计文档：

`docs/superpowers/specs/2026-05-06-rgb-mosaic-asset-game-design.md`

海报视觉说明：

`docs/assets/rgb-mosaic-poster-philosophy.md`

## 开发与验证流程

常规本地开发流程：

```bash
git pull
npm.cmd install
npm.cmd test
npm.cmd run build
```

如果需要启动页面调试：

```bash
npm.cmd run dev
```

当前推荐在提交前至少运行：

```bash
npm.cmd test
npm.cmd run build
```

## 后续路线

后续实现建议按以下顺序推进：

1. 增加资产详情页，展示资产来源、像素指纹、创建者、拥有者和鉴定记录。
2. 实现平台内资产库、挂售和购买流程。
3. 增加评分、榜单和基础反刷规则。
4. 补充创作体验，例如颜色筛选、画布辅助网格和更清晰的库存不足提示。
5. 在资产模型稳定后补充 Steam Inventory / Steam Market 映射字段。

## 风险边界

当前项目是游戏玩法与资产系统原型，不承诺任何真实交易、投资收益或外部平台接入。Steam、市场和链上相关内容均为长期技术预留，不代表当前版本已经具备这些能力。
