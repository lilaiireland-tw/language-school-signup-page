# Cloudflare Worker backend

這個目錄是官方網站的後端程式入口。前端與 API 會一起部署到同一個 Cloudflare Worker，不需要另外架設 FastAPI、Flask 或 VPS。

## 資料流

```text
網站表單
  -> POST /api/applications
  -> Cloudflare Worker
  -> Cloudflare D1 (source of truth)
  -> Cloudflare Queue
     -> Gmail API
     -> Notion API
```

WordPress 管理員外掛將透過受保護的管理 API 讀取與更新 D1，不會把報名資料重複寫入 WordPress MySQL。

## 目錄職責

- `index.ts`: Worker 入口、頂層路由分派與 Vinext handler。
- `routes/`: HTTP API 與狀態碼。
- `validation/`: 伺服器端輸入驗證。
- `services/`: 報名、Gmail、Notion 應用流程。
- `repositories/`: D1 SQL 與資料存取。
- `queue/`: 非同步工作、重試與 dead-letter 處理。
- `shared/`: 後端共用回應、錯誤與工具。

## 安全原則

- D1 只透過 Worker binding 存取。
- Gmail、Notion、Turnstile 憑證只存在 Cloudflare Secrets。
- 公開表單 API 要有後端驗證、防重複與機器人防護。
- 管理 API 使用獨立驗證，不把 Cloudflare API Token 傳給瀏覽器。
