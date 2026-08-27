# 哩來愛爾蘭網站開發日誌

> 本檔案是專案唯一的進度、交接、風險、架構決策與待辦來源。歷史細節由 Git 保存；此處只維護仍有效的資訊。

## 文件規則

- 每次開始工作前完整閱讀本檔案並執行 `git status`。
- 每次完成開發、修正、測試、部署、設定或重要決策後，同步更新本檔案。
- 不建立日期版交接副本，不保留已被取代且無參考價值的長篇規劃。
- 不記錄 secret、token、密碼或正式憑證。
- 未經明確授權，不得更動 DNS、Nameserver、WordPress production、Cloudflare production route 或整站 routing。

## 最新狀態

最後更新：2026-08-27

- 正式網站：https://lilaiireland.com
- Worker 測試網址：https://site-creator-vinext-starter.lilaiireland.workers.dev
- 第一個預定接管 URL：https://lilaiireland.com/language-school-signup/
- Production custom route：**未啟用**
- 正式網站仍由 WordPress 提供；Worker 只在 workers.dev 測試。
- D1 報名後端已完成並部署；`POST /api/applications` 已通過 production D1 E2E。
- Git：目前位於 `feat/frontend-review-carousel`，包含本輪前端 UX、表單、動態效果與 Google 評論輪播更新；尚未合併到 `main`。
- Integration consumer 已部署至 workers.dev；正式 Queue producer／consumer 與 Cron 已啟用。學生確認信已依「一對一諮詢／直接報名」分流為品牌 HTML 與 plain-text 版本；Gmail OAuth 寄信、Notion 同步及既有 pending jobs 均已在線上成功完成。
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
- `applications.id` 維持 UUID 作為內部主鍵、Queue payload、外鍵與冪等識別；`applications.reference_code` 是對外顯示與查詢用的遞增編號，格式為 `ST-000001`。

### 非同步整合

- 每筆 application 建立三種 job：
  - `student_email`
  - `internal_email`
  - `notion_sync`
- Queue payload 只包含 `applicationId`，個資由 consumer 從 D1 讀取。
- Queue 採 at-least-once delivery；D1 claim 保護重複處理。
- 暫時錯誤 exponential backoff；永久錯誤或第五次失敗標為 `dead_letter`。
- Cron 每十分鐘補掃描漏送／到期 job，並回收超過十五分鐘的 stale `processing`。
- Email 使用 `lilaiireland@gmail.com` 的 Gmail API OAuth 2.0 offline refresh token；不使用 Google Workspace、service account、impersonation 或 domain-wide delegation。
- Gmail OAuth scope 僅允許 `https://www.googleapis.com/auth/gmail.send`；refresh token 透過一次性的帳號擁有者授權流程取得。
- `GMAIL_CLIENT_ID`、`GMAIL_CLIENT_SECRET`、`GMAIL_REFRESH_TOKEN`、`GMAIL_SENDER_EMAIL` 僅存在 Cloudflare Secrets；Worker 每次 Queue 處理時以 refresh token 換取短效 access token，不將 token 寫入 D1、瀏覽器、API response 或 log。
- Notion 以 Submission ID 查重後建立 CRM page，成功後保存 page ID。

## 部署基準

最近一次部署：2026-08-27（Frontend review adaptation）

- 環境：workers.dev，連接 production D1
- Worker：`site-creator-vinext-starter`
- URL：https://site-creator-vinext-starter.lilaiireland.workers.dev
- API：https://site-creator-vinext-starter.lilaiireland.workers.dev/api/applications
- Version ID：`be14c334-958d-4c53-9ec8-8a8db4c975ec`（100% traffic）
- Rollback baseline：`f4c43d42-193e-4ab7-8dd2-cbee11be72b7`
- 部署前 D1 備份：`backups/pre-reference-code-migration-2026-08-27.sql`（11,403 bytes，僅存本機且已被 Git ignore）
- 原始 QA checkpoint：`5aa3541a-2cf4-43f7-8f40-73f96c69922f`
- Production D1：`lilai-applications-production`
- D1 database ID：`d7b4209c-fce2-4f0d-9b18-3f19c183b430`
- Region：APAC
- Production custom route：未啟用
- Rollback：將 workers.dev traffic 回切 rollback baseline；D1 migration 目前只有 additive table 建立，資料不可透過 Worker rollback 自動移除。

## 已完成

- 2026-08-27 frontend review 適配版本 workers.dev 發布：使用 Wrangler 4.124.0 與 `dist/server/wrangler.json` 部署至既有 Worker `site-creator-vinext-starter`，URL `https://site-creator-vinext-starter.lilaiireland.workers.dev`，Version ID `be14c334-958d-4c53-9ec8-8a8db4c975ec`（100% traffic），rollback baseline `f4c43d42-193e-4ab7-8dd2-cbee11be72b7`。保留 production D1 `lilai-applications-production`、Queue producer／consumer、Cron 與既有 secrets，未啟用或更動 production custom route。線上 smoke test：首頁 HTTP 200、新的直接報名適用對象及服務邊界內容存在、Erin College 與舊 `free-departure-assessment` URL 均未出現。部署前驗證：frontend review tests 6/6、Gmail／Email tests 13/13、rendered HTML tests 2/2、TypeScript 成功、lint 0 errors／20 個既有 warnings、Wrangler dry-run 與 `git diff --check` 成功；build 五個環境與 prerender 均顯示完成，最後仍有 Windows 既知 libuv assertion。
- 2026-08-27 frontend review 建議適配與安全修正：完整檢視 `lilai_frontend_review_codex_actions_2026-08-27.md`，在不更動既有 D1 schema、Queue 冪等、Gmail／Notion integration 與 production routing 的前提下，落實可直接適配的 P0／P1 項目。新增品牌連結、商業條款、合作語校單一資料源；Erin College 保留於資料集但標記 review、從畫面與直接報名選項隱藏；統一免費評估 URL；直接報名 readiness 明確允許「城市或學校方向」，完整比較需求導向諮詢；client 與 server 雙層清除非作用模式欄位，landing URL 不保存 query/hash；ISIC 改為「方案含贈送、仍須官方審核」並保留送出確認；隱私政策改為可點擊連結；新增適合／不適合直接報名與服務邊界區塊；評論輪播在離開 viewport 或頁籤隱藏時暫停；internal notification 補上 decision stage／consultation goal。住宿取消比例未自行修改，改集中管理並清楚標示合作方案與正式報價條款優先。新增 frontend business logic／server validation tests；驗證 `test:frontend-review` 6/6、Gmail／Email tests 13/13、rendered HTML tests 2/2、TypeScript 成功、lint 0 errors、Wrangler 4.124.0 dry-run 成功、`git diff --check` 成功；build 已完成所有五個環境與 prerender，最後仍遇既有 Windows libuv assertion。Wrangler debug log 因 sandbox 權限顯示 EPERM，但 dry-run bundle／bindings 檢查完成且 exit 0。未部署，最新 Version ID `f4c43d42-193e-4ab7-8dd2-cbee11be72b7` 與 rollback baseline `eb0cfa98-da5d-4b74-bcd2-58b887efcfa1` 不變。高風險的 `page.tsx` 大型 component 拆分與 server/client boundary 重構刻意延後至獨立分支；`requiresConsultationReview` 暫不新增 D1 欄位，先以既有 decision stage、internal email 與 analytics context 支援人工判斷，避免未經部署授權的 migration。
- 2026-08-27 學生確認 Email 客製化與實際寄送：新增明確 `StudentConfirmationEmailData` DTO、application mapper、集中品牌／預約連結 constants，以及獨立 student／internal templates；學生信依 `service_type` 分流。一對一諮詢信顯示 Google Calendar 預約按鈕與 plain-text URL；直接報名信說明基本資料確認後 5 個工作天內寄送學校正式報名表。HTML 採 640px table layout、inline CSS、UTF-8、繁體中文品牌 Header、資料摘要、淺綠說明卡與深綠下一步區塊；空值隱藏、住宿值轉成可讀文字，學生信不包含內部 CRM 欄位。Gmail sender 顯示名稱更新為 `Lilai Ireland｜哩來愛爾蘭`，MIME 保留 RFC 2047 subject／sender encoding 與 multipart alternative。驗證：`npm.cmd run test:gmail` 13/13、`npx.cmd tsc --noEmit` 成功、`npm.cmd run lint` 0 errors／20 個既有 warnings、Wrangler dry-run 成功、`git diff --check` 成功；build 顯示 Build complete 後仍有 Windows 既知 libuv assertion。部署環境 workers.dev、Worker `site-creator-vinext-starter`、URL `https://site-creator-vinext-starter.lilaiireland.workers.dev`、Version ID `f4c43d42-193e-4ab7-8dd2-cbee11be72b7`（100%）、rollback baseline `eb0cfa98-da5d-4b74-bcd2-58b887efcfa1`；production custom route 未啟用。受控 E2E 建立測試諮詢 `ST-000004`（收件人 `lilaiireland@gmail.com`）：`student_email` succeeded／attempts 1／Gmail message ID `1a042835d60c84ec`，`internal_email` succeeded／attempts 1／message ID `1a042835c86dd953`，`notion_sync` succeeded／attempts 1；無 retry 或 error。測試資料明確標示為 Email template test；workers.dev 仍直連 production D1，此為既有 QA 污染風險。Cloudflare Email／Workers／Wrangler skill 規範要求的 secret 隔離、UTF-8 MIME 與 Worker 部署流程均已遵循。

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
  - Gmail API OAuth 2.0 refresh-token grant 與 HTML／plain-text 郵件
  - Notion Submission ID 去重與 page 建立
  - D1 claim、成功／失敗／dead-letter 狀態、provider/page ID
  - retry、補掃描與 stale processing recovery
- Gmail authentication migration 已在 `feat/gmail-oauth-refresh-token` 完成程式與 mock tests：
  - 移除 service-account JWT、RSA private-key signing、impersonation 與 domain-wide delegation。
  - 以 refresh-token grant 向 Google token endpoint 取得短效 access token。
  - Gmail send 改用 `users/me/messages/send`，provider message ID 仍寫回既有 integration job。
  - `invalid_client`、`invalid_grant`、`unauthorized_client` 與 Gmail 401／403 視為永久錯誤；network、429、5xx 沿用既有 retry/backoff。
  - 新增一次性 Desktop OAuth owner authorization 腳本：隨機 loopback port、PKCE S256、state 驗證、僅 `gmail.send`、`access_type=offline`、`prompt=consent`；refresh token 只印至 terminal，不寫磁碟，access token 不輸出。

## 最新驗證

- 2026-08-27 易讀申請編號與 production D1／workers.dev 發布：新增 additive D1 migration `0002_add_application_reference_codes.sql`，依既有資料建立時間回填 `ST-000001` 起的 `reference_code`，並以 D1 sequence singleton + AFTER INSERT trigger 原子配置後續流水號及 unique index 防止重複；內部 UUID 主鍵、Queue payload、integration job 外鍵與 Idempotency-Key 均維持不變。學生信與內部通知信的「申請編號」、新建 Notion CRM 的 Submission ID、公開 API `submissionId` 皆改用 `reference_code`；Notion 同步在查新編號後仍以 UUID fallback 查找舊頁面，避免既有 pending job 重複建頁；Admin API `q` 搜尋新增 `reference_code`。隔離 D1 驗證：0001/0002 migration 均成功，連續兩筆 insert 分別取得 `ST-000001`、`ST-000002`；隔離狀態已清除。Production D1 migration 前完整備份為 `backups/pre-reference-code-migration-2026-08-27.sql`（11,403 bytes、Git ignored）；0002 remote migration 成功，既有 3 筆回填 `ST-000001` 至 `ST-000003`，缺漏 0、重複 0、next value 4。使用 Wrangler 4.124.0 部署至 Worker `site-creator-vinext-starter`，URL `https://site-creator-vinext-starter.lilaiireland.workers.dev`，Version ID `eb0cfa98-da5d-4b74-bcd2-58b887efcfa1`（100% traffic），rollback baseline `e0880b03-27db-4dc2-bc55-f8cc2ab0266e`；未變更 production custom route。線上以既有非真實 E2E UUID 執行 duplicate smoke test，HTTP 200 回傳 `submissionId: ST-000001`、`duplicate: true`；驗證後 applications 3、integration jobs 9、next value 4 均未變，未新增資料、寄信或 Notion job。驗證：`npx.cmd tsc --noEmit` 成功；`npm.cmd run lint` 0 errors／20 個既有 warnings；Gmail tests 9/9、rendered HTML tests 2/2、Wrangler deploy dry-run 與 `git diff --check` 通過；build 顯示 Build complete 後仍以既知 Windows libuv assertion 結束。

- 2026-08-27 Leevin 住宿圖片穩定性與 workers.dev 部署：Hostel 公共空間與 Student 房間圖片由 Leevin WordPress 外部 URL 改為專案 Static Assets `/lilai-assets/leevin/faci06-1024x683.jpg` 與 `/lilai-assets/leevin/Layer-2.png`，避免上游圖片網址失效造成前端空白；保留既有替代文字、lazy loading、版面與外部住宿介紹連結。使用 Wrangler 4.124.0 與 `dist/server/wrangler.json` 部署至 Worker `site-creator-vinext-starter`，URL `https://site-creator-vinext-starter.lilaiireland.workers.dev`，Version ID `e0880b03-27db-4dc2-bc55-f8cc2ab0266e`（100% traffic），rollback baseline `bb1e505e-d825-4a01-b63a-f66a25000662`；未變更 production custom route。驗證：兩個圖片檔案均存在且非空；`npx.cmd tsc --noEmit` 成功；`npm.cmd run lint` 0 errors／20 個既有 warnings；`node --test tests/rendered-html.test.mjs` 2/2 通過；Wrangler deploy dry-run 與 `git diff --check` 通過；build 顯示 Build complete 後仍以既知 Windows libuv assertion 結束。線上 smoke test：首頁 HTTP 200 且引用兩個本機路徑；JPEG 與 PNG 均回傳 HTTP 200、正確 Content-Type 及完整檔案大小。

- 2026-08-27 `feat/frontend-review-carousel` workers.dev 部署：使用 Wrangler 4.124.0 與 `dist/server/wrangler.json` 部署至既有 Worker `site-creator-vinext-starter`，URL `https://site-creator-vinext-starter.lilaiireland.workers.dev`，Version ID `bb1e505e-d825-4a01-b63a-f66a25000662`（100% traffic），rollback baseline `a03e7505-f83d-4dae-b052-481bf28d4d8c`。部署保留 production D1 `lilai-applications-production`、Queue producer／consumer、Cron 與既有 secrets，未啟用 production custom route。線上 smoke test：首頁 HTTP 200，HTML 含 Reese 第四則評論及 `testimonial-carousel` 控制。部署前驗證：Gmail tests 9/9、rendered HTML tests 2/2、TypeScript 成功、lint 0 errors／20 個既有 warnings、Wrangler deploy dry-run 成功、`git diff --check` 成功；build 顯示 Build complete 後仍以既知 Windows libuv assertion 結束。

- 2026-08-27 Google 評論第四則輪播修正：保留使用者新增的 ID 4（Reese）評論；上一則／下一則操作時暫停自動位移，依目前位置四捨五入對齊至明確的相鄰卡片，避免 `requestAnimationFrame` 自動輪播與 smooth scroll 同時改寫 `scrollLeft` 而產生卡頓或無法順暢前往下一則。循環基準改讀第一組評論的實際寬度，不再假設總捲動寬度恰為兩等分。驗證：`npx.cmd tsc --noEmit` 成功；`npm.cmd run lint` 0 errors／20 個既有 warnings；`node --test tests/rendered-html.test.mjs` 2/2 通過；`git diff --check` 通過。已包含於上述 workers.dev Version ID `bb1e505e-d825-4a01-b63a-f66a25000662`。

- 2026-08-27 學弟妹評論輪播控制：在既有水平自動輪播下方新增可鍵盤操作的上一則／下一則圓形箭頭按鈕，每次依實際卡片寬度移動一張；向左在起點時利用既有重複卡片組無縫回繞，reduced-motion 下改用即時捲動。按鈕具繁中 aria-label 與 `aria-controls`，未修改任何評論內容。驗證：`npx.cmd tsc --noEmit` 成功；`npm.cmd run lint` 0 errors／20 個既有 warnings；`node --test tests/rendered-html.test.mjs` 2/2 通過；本機 `http://localhost:3001/` 已透過 HMR 更新且伺服器持續運行。未部署，production Version ID 與 rollback baseline 不變。

- 2026-08-27 一頁式網站動態節奏：新增無第三方依賴的共用 `RevealController`，以單一 IntersectionObserver（threshold 0.12、bottom root margin -12%）控制一次性 `reveal-up`、`reveal-stagger`、`reveal-mask` 與申請流程 timeline progression，觸發後立即 unobserve。SectionHeading 與品牌／住宿文字採區塊 reveal；語校、一般服務、開局支援及住宿卡片群採 80ms stagger；住宿與品牌照片採 clip-path mask；申請流程先延伸主線再依序顯示步驟；Hero 內容與 CTA 不延遲，僅既有黃色裝飾線展開。表單、導航、FAQ 內容與主要 CTA 排除於入口動畫。手機縮短 duration／stagger 並降低位移，`prefers-reduced-motion` 下不啟用觀察器且 CSS 強制立即呈現。未修改任何文案、功能、API、資料庫或 production routing。驗證：`npx.cmd tsc --noEmit` 成功；`npm.cmd run lint` 0 errors／20 個既有 warnings；最新 build 顯示 Build complete 後仍有 Windows 既知 libuv assertion；build 後 `node --test tests/rendered-html.test.mjs` 2/2 通過；`git diff --check` 通過。本機 `npm.cmd run dev:vinext` 已於 `http://localhost:3001/` 啟動並確認 HTTP 200。未部署，production Version ID 與 rollback baseline 不變。

- 2026-08-27 桌面版 SectionHeading 排版：標題容器上限由 720px 放寬為 900px，使 49px 桌面字級下的「從提交需求到正式開課，流程很清楚」可自然維持單行；標題加入 `text-wrap: balance` 改善必須換行時的分行比例，副標題仍限制於 720px，左對齊變體維持原對齊。未變更內容、API、資料庫或 production routing。驗證：`npx.cmd tsc --noEmit` 成功；`npm.cmd run lint` 0 errors／20 個既有 warnings；`node --test tests/rendered-html.test.mjs` 2/2 通過。未部署，production Version ID 與 rollback baseline 不變。

- 2026-08-27 表單語校依城市篩選：沿用「哩來合作語校」既有 `partnerSchools` 城市標記，直接報名表單的學校下拉選單只顯示所選城市的校區及「其他指定學校／尚未確定」；切換城市會清除不屬於新城市的既有學校與自訂學校值，送出前亦會再次驗證城市與學校是否相符。「其他／尚未確定」不顯示四個既有城市的校區。未變更 API、資料庫或 production routing。驗證：`npx.cmd tsc --noEmit` 成功；`npm.cmd run lint` 0 errors／20 個既有 warnings；`node --test tests/rendered-html.test.mjs` 2/2 通過。未部署，production Version ID 與 rollback baseline 不變。

- 2026-08-27 表單聯絡資料隱私提醒：第一步「你的聯絡資料」加入用途限定、個資法遵循與不任意向無關第三方揭露的提示卡；未採用無法絕對保證的「不會有資料外流風險」用語。未變更表單欄位、API、資料庫或 production routing。驗證：`npx.cmd tsc --noEmit` 成功；`npm.cmd run lint` 0 errors／20 個既有 warnings；`node --test tests/rendered-html.test.mjs` 2/2 通過。未部署，production Version ID 與 rollback baseline 不變。

2026-08-26，`main`：

- `wrangler types`：成功，Queue 與 secrets bindings 已生成。
- `npx tsc --noEmit`：成功（本次重新驗證）。
- `npm run lint`：0 errors、20 warnings；主要為既有 `<img>` 效能提示與未使用 import。
- `npm run build:vinext`：Build complete（本次重新驗證）。
- `node --test tests/rendered-html.test.mjs`：2 tests passed。
- `wrangler deploy --dry-run --config dist/server/wrangler.json`：成功，Queue、D1、Images、Assets 與 vars bindings 均納入產物。
- `wrangler check startup --config dist/server/wrangler.json`：成功；本機 profile active CPU 約 43.8 ms，產生的暫時 profile 已移除、不提交 Git。
- `feat/gmail-oauth-refresh-token`：`npx tsc --noEmit` 成功；`npm run lint` 0 errors、20 個既有 warnings，沒有新增 lint errors。
- `npm run test:gmail`：9 tests passed，涵蓋 token request/response、永久與暫時 OAuth 錯誤、Gmail success、401/403、429/5xx、base64url、UTF-8 寄件人顯示名稱與既有 exponential retry delay。
- Gmail production-secret smoke test：使用未切換正式流量、無 Queue／Cron 的 Worker version preview，對既有 `internal_email` job `8b6c7c4a-fdcf-4b5b-bf8a-9e3aa87cd8c3` 完成 OAuth refresh-token exchange 與 Gmail API 寄送；D1 狀態為 `succeeded`、attempts `1`、provider message ID `1a03941fb9c1340e`、`last_error` 空白。測試預覽 Version ID：`5fd011bc-9417-4ac6-893c-1b5d610b92c9`；未分配正式 traffic，rollback baseline 不變。
- Gmail smoke test 實收確認成功；修正 `From` 寄件人顯示名稱亂碼，將「哩來愛爾蘭」改為 RFC 2047 UTF-8 Base64 encoded-word，並新增 MIME header regression test；此修正已包含於最新部署。
- 合併前完整 gate：Gmail tests 9/9、build complete、rendered HTML tests 2/2、TypeScript 成功、lint 0 errors／20 個既有 warnings、Wrangler deploy dry-run 成功、`git diff --check` 成功。Windows build 結束時仍出現既知 libuv assertion，因此 HTML tests 另行執行並通過。
- 2026-08-26 `wrangler secret list` 只讀確認：`ADMIN_API_TOKEN`、四項 Gmail secrets、`NOTION_TOKEN`、`NOTION_DATABASE_ID` 均存在；另有非 deployment gate 必要的 `INTERNAL_NOTIFICATION_EMAIL` secret。此檢查只驗證名稱存在，不讀取值，也尚未驗證 Notion API 權限或 database schema。
- 2026-08-26 Notion 唯讀 production-secret smoke test：透過未分配正式 traffic、無 D1／Queue／Cron 的 Worker version preview 呼叫現行 `Notion-Version: 2022-06-28` retrieve database 與 query database API；token、database ID、integration read/query 權限均成功，未建立或修改 CRM page。`Name` 為 `title`、`Email` 為 `email`；尚缺 `Submission ID` (`rich_text`)、`Service Type` (`select`)、`Phone` (`phone_number`)、`Submitted At` (`date`)。Preview Version ID：`49f613c6-6210-4469-b844-b3951cc2f91d`，未部署正式 traffic，rollback baseline 不變。
- 2026-08-26 Notion schema recheck：相同唯讀 preview 再次 retrieve/query 成功，`schemaReady: true`；`Name` (`title`)、`Submission ID` (`rich_text`)、`Service Type` (`select`)、`Email` (`email`)、`Phone` (`phone_number`)、`Submitted At` (`date`) 六項全部符合。仍未建立或修改 CRM page，Insert content 權限尚待寫入 smoke test。
- 2026-08-26 Notion production-secret write smoke test：透過無 D1／Queue／Cron、未分配正式 traffic 的 preview，直接執行 production `syncApplicationToNotion()`；以非真實資料成功建立測試 page，第二次相同 `Submission ID` 回傳同一 page ID（冪等通過），最後成功 archive 清理。Preview Version ID：`675ba2a6-9383-4d46-9dd0-31d51289d679`；未部署正式 traffic，rollback baseline 不變。
- 2026-08-26 完整 gate：Gmail tests 9/9、build complete、rendered HTML tests 2/2、TypeScript 成功、lint 0 errors／20 個既有 warnings、Wrangler deploy dry-run 成功。Windows build 結束仍有既知 libuv assertion，但產物與獨立 HTML tests 均成功。
- 2026-08-26 workers.dev 部署成功：Version ID `a03e7505-f83d-4dae-b052-481bf28d4d8c` 接管 100% traffic；首頁 HTTP 200，Queue 為 1 producer／1 consumer。部署後 production D1 六筆 integration jobs 全部成功：`internal_email` 2、`student_email` 2、`notion_sync` 2，均為 `succeeded`。
- `npm run deploy:vinext` 因 `--experimental-warm-cdn-cache` 未設定 `VINEXT_KV_CACHE` 而在上傳前停止；本次改用 `wrangler deploy --config dist/server/wrangler.json` 成功部署。後續應修正 deploy script 或正式配置 KV binding，避免操作流程分歧。
- 部署前隔離性核對：production D1 為 `internal_email` pending 1／succeeded 1、`student_email` pending 2、`notion_sync` pending 2；正式 Queue／DLQ producers 與 consumers 為 0；當時 Worker 100% traffic 為 `327d3375-465d-4772-88ca-35b16c5cde7f`。部署後狀態見上方最新驗證。
- OAuth migration 後 `npm run build:vinext` Build complete、rendered HTML 2 tests passed、Wrangler deploy dry-run 成功。
- 已確認 build 產物只要求 `GMAIL_CLIENT_ID`、`GMAIL_CLIENT_SECRET`、`GMAIL_REFRESH_TOKEN`、`GMAIL_SENDER_EMAIL`、`NOTION_TOKEN`、`NOTION_DATABASE_ID`；舊 service-account secrets 不再存在。
- `node --check scripts/generate-gmail-refresh-token.mjs`、變更範圍 ESLint、TypeScript 與 Gmail tests：成功；正式 credentials 已透過隔離 smoke test 驗證，未輸出或記錄任何 token。
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

- 易讀申請編號已發布；Worker rollback 不會自動移除 additive `reference_code` schema、sequence table 或 trigger。若需回退 Worker，可回切 `e0880b03-27db-4dc2-bc55-f8cc2ab0266e`，D1 schema 保留不影響舊版 Worker。

- Cloudflare CLI OAuth session 已重新登入成功。
- 正式 Queue `lilai-application-integrations` 與 DLQ `lilai-application-integrations-dlq` 已建立；主 Queue 已有 1 producer／1 consumer，consumer 與 Cron 正常運作。
- Cloudflare deployment secrets gate：
  - `GMAIL_CLIENT_ID`
  - `GMAIL_CLIENT_SECRET`
  - `GMAIL_REFRESH_TOKEN`
  - `GMAIL_SENDER_EMAIL`（必須為 `lilaiireland@gmail.com`）
  - `NOTION_TOKEN`
  - `NOTION_DATABASE_ID`
- Gmail 四項 secrets、`NOTION_TOKEN` 與 `NOTION_DATABASE_ID` 均已存在於 Cloudflare；Gmail refresh token 已通過實際寄送，Notion token、database ID 與 read/query 權限亦已通過唯讀 smoke test。OAuth credential JSON 與 token 不寫入 Git 或日誌。
- Notion database 的 read/query、六個必要 properties、Insert/Update content 權限、production payload、Submission ID 冪等與 archive 清理均已通過隔離 smoke test。
- `deploy:vinext` 目前依賴尚未配置的 `VINEXT_KV_CACHE`；在修正前需使用標準 Wrangler deploy command。
- workers.dev 目前直接寫 production D1；應建立 staging D1，避免 QA 污染正式資料。
- Turnstile 與 rate limiting 尚未完成，不可開啟正式廣告流量或 production route。

## 下一步計畫

1. 由使用者在本機以新 `ADMIN_API_TOKEN` 驗證 Admin API；不得將 token 貼入 Codex、命令歷史或 Git。
2. Notion 隔離寫入、冪等與清理 smoke test 已完成。
3. Gmail OAuth offline authorization、production-secret send smoke test，以及 Notion read/query/schema/write 驗證均已完成。
4. workers.dev 部署、Version ID／rollback baseline 記錄與既有 pending jobs 消化均已完成。
5. 執行一筆全新的受控 production 表單 E2E，核對使用者信、內部信、Notion CRM page 與 D1 provider IDs。
6. 若有永久設定錯誤，修正後提供受保護的人工重送流程，不直接改寫成功紀錄。
7. 修正 `deploy:vinext` 的 KV cache binding／參數後，建立 staging D1，再加入 Turnstile 與 rate limiting。
8. 完成 responsive／assets／console／network／form／metadata QA 與 WordPress SEO baseline。
9. 經明確驗收後，才評估單一路徑 production route。

## Git 工作方式

- `main`：已驗證、可回復的穩定基準。
- 新功能：從最新 `main` 建立 `feat/<topic>`。
- 修正：從最新 `main` 建立 `fix/<topic>`。
- 功能完成且測試通過後，以 fast-forward 或清楚的 merge commit 合併回 `main`。
- 合併前保持工作區乾淨並更新本日誌；不把未完成或未驗證的功能直接留在 `main`。
- 遠端 repository 狀態仍待確認；推送或刪除遠端分支前需先檢查 remote。
