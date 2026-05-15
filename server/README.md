# MskGames Go 后端

后端采用接近 Java MVC 的分层结构，并使用 Go 标准库 HTTP 服务。

## 目录结构

```text
server/
  cmd/api/          # 启动入口
  cmd/migrate/      # 数据库迁移入口
  config/           # YAML 配置文件
  internal/config/  # 配置加载和环境变量覆盖
  internal/controller/
  internal/service/
  internal/repository/
  internal/model/
  internal/router/
  internal/middleware/
  internal/db/      # MySQL 初始化
  migrations/       # 数据库迁移脚本
```

## 配置

默认读取 `config/app.yaml`。

敏感信息不要写入代码或提交历史。生产环境通过环境变量覆盖：

```bash
SERVER_PORT=8080
MYSQL_HOST=120.77.93.47
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=<服务器环境变量配置>
MYSQL_DATABASE=rgb_mosaic
```

## 本地运行

```bash
go mod tidy
go test ./...
go run ./cmd/api
```

Windows PowerShell 启动脚本：

```powershell
.\start-api.ps1
```

如果 PowerShell 禁止运行 `.ps1` 脚本，使用 CMD 启动脚本：

```powershell
.\start-api.cmd
```

也可以临时绕过当前进程的 PowerShell 执行策略：

```powershell
powershell -ExecutionPolicy Bypass -File .\start-api.ps1
```

如果当前终端没有设置 `MYSQL_PASSWORD`，脚本会提示输入。`config/app.yaml` 中的数据库密码会被读取，但同名环境变量优先级更高。

## 数据库迁移

核心表迁移文件：

```text
migrations/001_create_core_tables.sql
```

包含表：

1. `users`：用户基础信息。
2. `color_inventory`：用户 RGB 色块库存。
3. `artworks`：画作草稿和鉴定状态。
4. `artwork_pixels`：画作像素矩阵。
5. `assets`：已鉴定资产。
6. `mining_records`：挖矿产出记录。

关键约束：

1. `assets.pixel_hash` 全局唯一，防止重复像素矩阵重复鉴定。
2. `artwork_pixels` 通过 `(artwork_id, x_position, y_position)` 保证同一作品同一坐标只有一个像素。
3. `color_inventory` 通过 `(user_id, red_value, green_value, blue_value)` 保证同一用户同一 RGB 只保留一条库存记录。

手动执行迁移示例：

```bash
mysql -h 120.77.93.47 -P 3306 -u root -p < migrations/001_create_core_tables.sql
```

Go 迁移入口：

```bash
go run ./cmd/migrate
```

`cmd/migrate` 会读取 `config/app.yaml`，再使用 `MYSQL_*` 环境变量覆盖敏感配置，并按文件名顺序执行 `migrations/*.sql`。

不要把 MySQL 密码写入命令历史、代码或文档。

## 健康检查

```text
GET /health
GET /health/db
```

## API 文档

当前 API 文档：

```text
docs/api.md
```
