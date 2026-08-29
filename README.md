# 哩來愛爾蘭｜語校報名與一對一諮詢

哩來愛爾蘭的語校直接報名 Landing Page，提供直接報名、一對一選校諮詢、合作語校、開局支援、Leevin 住宿、Google 評論、FAQ 與多步驟申請表單。

- 正式頁面：https://lilaiireland.com/language-school-signup/
- Worker 測試頁：https://site-creator-vinext-starter.lilaiireland.workers.dev/language-school-signup/
- 交接負責人：Alex
- 專案進度、架構決策、風險、部署與待辦的唯一來源：[`PROJECT-DEVELOPMENT-LOG.md`](PROJECT-DEVELOPMENT-LOG.md)

## 目前狀態

正式頁面已透過 Cloudflare path-level routes 上線，只接管 `/language-school-signup` 與其子路徑；網站其餘頁面仍由 WordPress 提供。請勿將整個 `lilaiireland.com/*` 綁定至 Worker。

目前已上線的主要能力：

- `/language-school-signup` base path 下的 Vinext／React 一頁式前端與 Static Assets
- Cloudflare Turnstile 前後端驗證與每 60 秒 30 次的送出 rate limit
- `POST /language-school-signup/api/applications` 表單 API
- Cloudflare D1 報名資料、`ST-xxxxxx` 對外申請編號與受 token 保護的 Admin API
- Cloudflare Queue 與 Cron 非同步處理
- Gmail API 學生確認信、內部通知信與 Notion CRM projection
- production 與 staging 的 D1、Queue、rate-limit namespace 隔離

最近部署版本、rollback baseline、線上 QA 結果與仍待處理事項，請以開發日誌為準。

## 技術架構

- Node.js `>=22.13.0`、npm 與 `package-lock.json`
- React 19、Next.js 16、TypeScript
- Vinext、Vite、Cloudflare Workers Static Assets
- Cloudflare D1、Queues、Cron Triggers、Rate Limiting 與 Turnstile
- Drizzle ORM／Drizzle Kit
- Gmail API OAuth 2.0、Notion API

```text
瀏覽器表單
  -> Cloudflare Turnstile
  -> Worker API
  -> D1（唯一真實資料來源）
  -> Queue / Cron
     -> Gmail API
     -> Notion CRM（projection）
```

WordPress 保留 CMS、Media、WooCommerce、會員、付款與其他未遷移頁面；申請資料不重複寫入 WordPress MySQL。

## 本機開發

```bash
npm install
npm run dev
```

如需固定使用 `3001` port：

```bash
npm run dev:vinext
```

應用程式使用 `/language-school-signup` base path，因此本機頁面通常位於 `http://localhost:3000/language-school-signup/`（或終端顯示的實際 port）。Production Turnstile hostname 白名單不含 localhost，本機不可用正式憑證完成真實 Turnstile submission。

## 驗證與建置

```bash
npm run lint
npx tsc --noEmit
npm run test:gmail
npm run test:frontend-review
npm run test:staging
npm run test:turnstile
npm run build
node --test tests/rendered-html.test.mjs
```

整合檢查亦可執行：

```bash
npm test
```

Windows 上 Vinext build 完成後可能出現既知的 libuv assertion；請同時確認輸出已顯示 `Build complete`，並以開發日誌所列的後續測試結果判定，不要只看最後一行。

## 資料庫與部署

常用指令：

```bash
npm run db:generate
npm run db:migrate:local
npm run db:migrate:staging
npm run db:backup
npm run types:worker
```

部署與 production migration 會改動外部環境。執行前必須先閱讀開發日誌、確認 `git status`、備份 D1，並取得本次工作所需授權。未經明確授權，不得更動 DNS、Nameserver、WordPress production、Cloudflare production route 或整站 routing。

正式 Worker 為 `site-creator-vinext-starter`，production D1 為 `lilai-applications-production`。完整 bindings、staging 設定及精確 routes 位於 [`wrangler.jsonc`](wrangler.jsonc)。

## Secrets 與 Gmail 授權

正式環境需要的 secret 名稱記錄於 `wrangler.jsonc`，值只能存放於 Cloudflare Secrets，不得寫入 Git、README、開發日誌、D1、瀏覽器或 log。

一次性取得 Gmail refresh token 前，先在 Google Cloud 建立 Desktop app OAuth client、啟用 Gmail API，並將 client JSON 放在專案外或 Git ignored 的位置：

```powershell
npm.cmd run gmail:authorize -- "C:\path\to\client_secret.json"
```

此流程只要求 `https://www.googleapis.com/auth/gmail.send`，使用 PKCE、offline access、明確 consent 與本機 loopback callback。Refresh token 只會在終端顯示一次，應立即手動存入 Cloudflare Secret `GMAIL_REFRESH_TOKEN`。

## 主要目錄

- `app/`：頁面、元件、樣式、表單商業規則與前端 API 整合
- `worker/`：Worker 入口、API routes、驗證、D1 repository、Queue、Gmail、Notion 與 Turnstile
- `migrations/`：D1 schema migrations
- `tests/`：Email、前端規則、Turnstile、staging isolation 與 rendered HTML 回歸測試
- `public/lilai-assets/`：品牌、語校、住宿與開局支援素材
- `scripts/`：Gmail OAuth 授權與字型子集化工具
- `docs/`：開發工具與操作補充文件

## 維護規則

開始工作前必須完整閱讀 [`PROJECT-DEVELOPMENT-LOG.md`](PROJECT-DEVELOPMENT-LOG.md) 並執行 `git status`。完成開發、修正、測試、部署、設定變更或重要技術決策後，必須在同一工作更新該日誌；不得另建互相矛盾的交接文件，也不得提交任何 secret 或正式憑證。
