# 哩來愛爾蘭網站開發日誌

> 本檔案是專案唯一的進度、交接、風險、架構決策與待辦來源。歷史細節由 Git 保存；此處只維護仍有效的資訊。

## 文件規則

- 每次開始工作前完整閱讀本檔案並執行 `git status`。
- 每次完成開發、修正、測試、部署、設定或重要決策後，同步更新本檔案。
- 不建立日期版交接副本，不保留已被取代且無參考價值的長篇規劃。
- 不記錄 secret、token、密碼或正式憑證。
- 未經明確授權，不得更動 DNS、Nameserver、WordPress production、Cloudflare production route 或整站 routing。

## 最新狀態

最後更新：2026-08-25

- 正式網站：https://lilaiireland.com
- Worker 測試網址：https://site-creator-vinext-starter.lilaiireland.workers.dev
- 第一個預定接管 URL：https://lilaiireland.com/language-school-signup/
- Production custom route：**未啟用**
- 正式網站仍由 WordPress 提供；Worker 只在 workers.dev 測試。
- D1 報名後端已完成並部署；`POST /api/applications` 已通過 production D1 E2E。
- Git：已將完成的 `feat/d1-applications-backend` fast-forward 合併到 `main`；目前開發分支為 `feat/integration-jobs-consumer`。
- Integration consumer 程式已在功能分支實作，尚未部署。Cloudflare CLI 登入已恢復，正式 Queue／DLQ 已建立；Gmail／Notion secrets 與整合 E2E 尚未設定／驗證。
- `ADMIN_API_TOKEN` 已由使用者在 Cloudflare Dashboard 安全輪替；Secret 值未經 Codex、Terminal、Git 或日誌。

## 不可變更的邊界

- 保留既有正式 URL、SEO metadata、canonical、HTTP status、structured data 與 sitemap URL。
- 不把 `lilaiireland.com/*` 整站綁到 Worker。
- 正式 route 只能在 workers.dev QA、SEO comparison、防垃圾與 rollback plan 完成後，經明確確認再設定。
- WordPress 保留為 CMS、Media、WooCommerce、會員、訂單、付款、下載權限與未遷移頁面的 origin。
- 第一階段不 Headless 化 `/cart/`、`/checkout/`、`/my-account/`、付款 callback 或下載權限。
- 不執行 `npm audit fix --force`，不提交 secrets。

## 有效架構決策

### 前端與路由

- Vinext、Vite、React App Router 部署於 Cloudflare Workers。
- 固定 UI／品牌圖片使用 Git + Workers Static Assets。
- CMS／文章／商品圖片保留在 WordPress Media。
- 初期只考慮接管：
  - `lilaiireland.com/language-school-signup`
  - `lilaiireland.com/language-school-signup/*`

### 報名資料

- Cloudflare D1 是報名與諮詢資料的唯一真實資料來源。
- 不重複寫入 WordPress MySQL。
- Notion 僅作 CRM projection。
- 公開與管理 API 位於同一 Worker：
  - `POST /api/applications`
  - `GET /api/admin/applications`
  - `GET /api/admin/applications/:id`
  - `PATCH /api/admin/applications/:id`
- 管理 API 使用 Cloudflare Secret `ADMIN_API_TOKEN`。

### 非同步整合

- 每筆 application 建立三種 job：
  - `student_email`
  - `internal_email`
  - `notion_sync`
- Queue payload 只包含 `applicationId`，個資由 consumer 從 D1 讀取。
- Queue 採 at-least-once delivery；D1 claim 保護重複處理。
- 暫時錯誤 exponential backoff；永久錯誤或第五次失敗標為 `dead_letter`。
- Cron 每十分鐘補掃描漏送／到期 job，並回收超過十五分鐘的 stale `processing`。
- Email 使用 Google Workspace service account + domain-wide delegation 呼叫 Gmail API，最小 scope 為 `gmail.send`。
- Notion 以 Submission ID 查重後建立 CRM page，成功後保存 page ID。

## 部署基準

最近一次部署：2026-08-25（Secret-only deployment）

- 環境：workers.dev，連接 production D1
- Worker：`site-creator-vinext-starter`
- URL：https://site-creator-vinext-starter.lilaiireland.workers.dev
- API：https://site-creator-vinext-starter.lilaiireland.workers.dev/api/applications
- Version ID：`327d3375-465d-4772-88ca-35b16c5cde7f`（`ADMIN_API_TOKEN` 輪替，100% traffic）
- 前一個程式版本：`d2e4482a-830f-4c90-a783-f472135ac22b`
- Rollback baseline：`7e902980-5f41-4d30-883b-db62fd3b509d`；若回復舊 version，必須重新確認／輪替 Admin secret
- 原始 QA checkpoint：`5aa3541a-2cf4-43f7-8f40-73f96c69922f`
- Production D1：`lilai-applications-production`
- D1 database ID：`d7b4209c-fce2-4f0d-9b18-3f19c183b430`
- Region：APAC
- Production custom route：未啟用
- Rollback：將 workers.dev traffic 回切 rollback baseline；D1 migration 目前只有 additive table 建立，資料不可透過 Worker rollback 自動移除。

## 已完成

- Vinext compatibility check：100%，無已知 blocker。
- Cloudflare Worker 與 Static Assets 已成功部署。
- D1 migration `0001_create_application_tables.sql` 已套用 production。
- 表單已從 mock submit 改為真實 API。
- 公開 API 具 server-side validation、request size limit、prepared statements 與 UUID idempotency。
- Admin API 具分頁／篩選／詳情／受限欄位更新與 timing-safe token 驗證。
- Production API E2E 已驗證：
  - submission ID：`6615a714-6ad4-40c2-8627-709250243ff9`（非真實測試資料）
  - application 寫入成功
  - 三種 integration jobs 建立成功
- Integration consumer 功能分支已完成程式：
  - 新申請 enqueue
  - Queue consumer
  - Gmail API OAuth JWT 與 HTML／plain-text 郵件
  - Notion Submission ID 去重與 page 建立
  - D1 claim、成功／失敗／dead-letter 狀態、provider/page ID
  - retry、補掃描與 stale processing recovery

## 最新驗證

2026-08-25，`feat/integration-jobs-consumer`：

- `wrangler types`：成功，Queue 與 secrets bindings 已生成。
- `npx tsc --noEmit`：成功（本次重新驗證）。
- `npm run lint`：0 errors、20 warnings；主要為既有 `<img>` 效能提示與未使用 import。
- `npm run build:vinext`：Build complete（本次重新驗證）。
- `node --test tests/rendered-html.test.mjs`：2 tests passed。
- `wrangler deploy --dry-run --config dist/server/wrangler.json`：成功，Queue、D1、Images、Assets 與 vars bindings 均納入產物。
- `wrangler check startup --config dist/server/wrangler.json`：成功；本機 profile active CPU 約 43.8 ms，產生的暫時 profile 已移除、不提交 Git。
- 本機 Vinext Worker 使用 `dist/server/wrangler.json` 時，D1 persistence 位於 `dist/server/.wrangler/state`，與根設定預設的 `.wrangler/state` 不同；已對實際 runtime state 套用 `0001_create_application_tables.sql`，並確認 `applications`、`integration_jobs` 與 `d1_migrations` 存在。
- 本機表單 E2E：`POST /api/applications` 回傳 201，application 與三種 integration jobs 均成功寫入 runtime D1；Queue 已消費訊息，但因本機 Gmail／Notion 測試憑證無效，三種 job 依設計進入 `dead_letter`，尚未驗證外部服務成功路徑。
- 已確認 build 產生的 `dist/server/wrangler.json` 包含 Queue producer、consumer、DLQ、Cron、D1 與所需變數。
- 已知非 blocker：
  - Vite native config import warning。
  - prerender 階段 KV cache／image optimizer binding fallback。
  - Windows 結束時 libuv assertion。
  - 上述 libuv assertion 會讓 `npm test` 在 build 完成後提前以 exit 1 結束；獨立執行 rendered HTML tests 已全部通過，CI／非 Windows 環境仍需再確認整體 test script。
  - 本地缺少正式 secrets，因此 build 顯示 missing secrets warning。
  - Windows sandbox／權限設定可能讓 Wrangler 無法寫入使用者目錄的 debug log（`EPERM`）；目前 CLI 操作本身仍可成功。

## 未解風險與阻塞

- Cloudflare CLI OAuth session 已重新登入成功。
- 正式 Queue `lilai-application-integrations` 與 DLQ `lilai-application-integrations-dlq` 已建立；consumer 尚未部署，因此目前 producers／consumers 仍為 0。
- 尚需由 Google Workspace Super Admin：
  - 建立／確認專用寄件 mailbox `application@lilaiireland.com`。
  - 對 service account 啟用 domain-wide delegation。
  - 僅授權 `https://www.googleapis.com/auth/gmail.send`。
- 尚需準備 Cloudflare Secrets：
  - `GMAIL_SERVICE_ACCOUNT_EMAIL`
  - `GMAIL_PRIVATE_KEY`
  - `NOTION_TOKEN`
  - `NOTION_DATABASE_ID`
- Notion database 必須分享給 integration，且 properties 至少精確包含：`Name`、`Submission ID`、`Service Type`、`Email`、`Phone`、`Submitted At`。
- 舊 production jobs 在 consumer 部署與 Cron 啟用前仍會保持 `pending`。
- workers.dev 目前直接寫 production D1；應建立 staging D1，避免 QA 污染正式資料。
- Turnstile 與 rate limiting 尚未完成，不可開啟正式廣告流量或 production route。

## 下一步計畫

1. 由使用者在本機以新 `ADMIN_API_TOKEN` 驗證 Admin API；不得將 token 貼入 Codex、命令歷史或 Git。
2. 由安全互動方式設定 Gmail 與 Notion secrets，不在命令列參數、Git 或日誌暴露值。
3. 確認 Notion property schema 與 Gmail domain-wide delegation。
4. Dry run、部署 workers.dev，記錄新 Version ID 與 rollback baseline。
5. 由 Cron enqueue 既有 pending jobs；驗證三種 job 轉為 `succeeded`，並核對兩封 Email 與 Notion page。
6. 若有永久設定錯誤，修正後提供受保護的人工重送流程，不直接改寫成功紀錄。
7. 建立 staging D1，再加入 Turnstile 與 rate limiting。
8. 完成 responsive／assets／console／network／form／metadata QA 與 WordPress SEO baseline。
9. 經明確驗收後，才評估單一路徑 production route。

## Git 工作方式

- `main`：已驗證、可回復的穩定基準。
- 新功能：從最新 `main` 建立 `feat/<topic>`。
- 修正：從最新 `main` 建立 `fix/<topic>`。
- 功能完成且測試通過後，以 fast-forward 或清楚的 merge commit 合併回 `main`。
- 合併前保持工作區乾淨並更新本日誌；不把未完成或未驗證的功能直接留在 `main`。
- 遠端 repository 狀態仍待確認；推送或刪除遠端分支前需先檢查 remote。
