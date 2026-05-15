# MskGames 后端 API 文档

## 基础信息

Base URL：

```text
http://localhost:8080
```

当前阶段已接入账号系统。登录或注册成功后，业务接口需要携带 token：

```text
Authorization: Bearer <token>
```

响应格式：`application/json`。

## 账号

### 注册

```http
POST /api/v1/auth/register
```

请求体：

```json
{
  "username": "alice",
  "displayName": "Alice",
  "password": "secret123"
}
```

成功响应：

```json
{
  "user": {
    "id": 2,
    "username": "alice",
    "displayName": "Alice"
  },
  "token": "session-token"
}
```

### 登录

```http
POST /api/v1/auth/login
```

请求体：

```json
{
  "username": "alice",
  "password": "secret123"
}
```

成功响应：

```json
{
  "user": {
    "id": 2,
    "username": "alice",
    "displayName": "Alice"
  },
  "token": "session-token"
}
```

## 健康检查

### 服务健康检查

```http
GET /health
```

成功响应：

```json
{
  "status": "ok"
}
```

### 数据库健康检查

```http
GET /health/db
```

成功响应：

```json
{
  "database": "ok"
}
```

数据库不可用时：

```json
{
  "database": "error"
}
```

HTTP 状态码：`503 Service Unavailable`。

## 挖矿

### 执行一次挖矿

```http
POST /api/v1/mining/tick
Authorization: Bearer <token>
```

说明：

1. 为默认用户产出一个 RGB 色块。
2. 写入 `mining_records`。
3. 写入或更新 `color_inventory`。
4. 如果同一用户已有相同 RGB，库存数量加 1。

请求体：无。

成功响应：

```json
{
  "red": 231,
  "green": 76,
  "blue": 60,
  "rarity": "legendary"
}
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `red` | number | RGB 红色通道，0-255 |
| `green` | number | RGB 绿色通道，0-255 |
| `blue` | number | RGB 蓝色通道，0-255 |
| `rarity` | string | 稀有度 |

失败响应：

```json
{
  "error": "failed to mine color"
}
```

HTTP 状态码：`500 Internal Server Error`。

## 库存

### 查询色块库存

```http
GET /api/v1/inventory/colors
Authorization: Bearer <token>
```

说明：查询默认用户当前持有的 RGB 色块库存。

成功响应：

```json
{
  "items": [
    {
      "color": {
        "red": 231,
        "green": 76,
        "blue": 60,
        "rarity": "legendary"
      },
      "quantity": 3
    }
  ]
}
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `items` | array | 色块库存列表 |
| `items[].color.red` | number | RGB 红色通道，0-255 |
| `items[].color.green` | number | RGB 绿色通道，0-255 |
| `items[].color.blue` | number | RGB 蓝色通道，0-255 |
| `items[].color.rarity` | string | 稀有度 |
| `items[].quantity` | number | 当前持有数量 |

失败响应：

```json
{
  "error": "failed to list colors"
}
```

HTTP 状态码：`500 Internal Server Error`。

## curl 示例

PowerShell：

```powershell
curl.exe http://localhost:8080/health
curl.exe http://localhost:8080/health/db
curl.exe -X POST http://localhost:8080/api/v1/auth/register -H "Content-Type: application/json" -d "{\"username\":\"alice\",\"displayName\":\"Alice\",\"password\":\"secret123\"}"
curl.exe -X POST http://localhost:8080/api/v1/mining/tick -H "Authorization: Bearer <token>"
curl.exe http://localhost:8080/api/v1/inventory/colors -H "Authorization: Bearer <token>"
```

## 当前限制

1. 暂无分页。
2. 暂无 OpenAPI/Swagger 自动生成。
3. 挖矿色池是后端最小实现，后续需要和前端代表色规则完全对齐。
