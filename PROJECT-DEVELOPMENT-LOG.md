# 哩來愛爾蘭網站開發日誌

> 本檔案是專案唯一的進度、交接、風險、架構決策與待辦來源。歷史細節由 Git 保存；此處只維護仍有效的資訊。

## 文件規則

- 每次開始工作前完整閱讀本檔案並執行 `git status`。
- 每次完成開發、修正、測試、部署、設定或重要決策後，同步更新本檔案。
- 不建立日期版交接副本，不保留已被取代且無參考價值的長篇規劃。
- 不記錄 secret、token、密碼或正式憑證。
- 未經明確授權，不得更動 DNS、Nameserver、WordPress production、Cloudflare production route 或整站 routing。

## 最新狀態

最後更新：2026-09-03

- 正式網站：https://lilaiireland.com
- Worker 測試網址：https://site-creator-vinext-starter.lilaiireland.workers.dev
- 第一個預定接管 URL：https://lilaiireland.com/language-school-signup/
- Production custom route：**已啟用**，僅接管 `/language-school-signup` 與 `/language-school-signup/*`。
- 正式網站其餘路徑仍由 WordPress 提供；Worker 同時保留 workers.dev 測試網址。
- 2026-09-03 報名頁 SEO 修正已部署：SSR title 改為「愛爾蘭語言學校報名｜25+8打工遊學與選校協助｜哩來愛爾蘭」，description 自然納入愛爾蘭語言學校、25+8 打工遊學、短期語校課程、住宿與選校意圖，並明確不使用「簽證」用語。同步更新唯一 H1 為「報名愛爾蘭語言學校｜已選好學校就從申請開始」與 Hero 首段，Open Graph／Twitter 沿用同一組標題與描述；canonical 保留 `https://lilaiireland.com/language-school-signup/`，正式 hostname 為 `index, follow`、workers.dev 為 `noindex, nofollow`。Worker Version ID `bec3d958-8363-4fa0-a1df-42e0a4842a10`，rollback baseline `8e8c235a-f60f-4d00-bd9f-23d7b457529f`。未變更表單、API、D1、Turnstile、DNS、WordPress 或 Cloudflare routes。
- 2026-08-29 Turnstile 與學生信改版已完成並部署：Cloudflare Dashboard 已設定 `TURNSTILE_SECRET`、`TURNSTILE_SITE_KEY`、`TURNSTILE_HOSTNAMES`，允許的 runtime hostname 僅為 `site-creator-vinext-starter.lilaiireland.workers.dev`、`lilaiireland.com`、`www.lilaiireland.com`，不包含 localhost 或 `127.0.0.1`。前端 widget、公開 runtime config、表單 token 傳遞及 Worker Siteverify 均已上線；固定 action 為 `application_submit`，後端要求 `success=true`、action 與 hostname 相符，Siteverify 異常一律 fail closed。學生確認信已依 `哩來愛爾蘭-郵件設計規範.md` 改為 600px table、品牌色、內容卡片／CTA／結尾結構及 Alex & Arsha 聯合署名，直接報名與諮詢付款分流保持不變。功能最初部署 Version ID 為 `75f319b8-a21b-479c-b7b0-3b62382d7b08`，目前已隨 production routes 發布於 Version ID `8e8c235a-f60f-4d00-bd9f-23d7b457529f`。
- 2026-08-28 圖片顯示診斷：Worker 上的 `faci06-1024x683.jpg`、`Layer-2.png`、`community-seaside.jpg`、`community-extra-01.jpg` 均回傳 HTTP 200 與正確 image Content-Type，Worker 首頁 HTML 也已引用四張圖片；兩個 Leevin 外部介紹頁均回傳 HTTP 200。`lilaiireland.com` 首頁仍是 WordPress，未包含上述新版 HTML，因此正式網域看不到圖片不是資源檔或 React 路徑錯誤，而是 production custom route 尚未啟用。未更動 DNS、WordPress 或 Cloudflare production route。
- D1 報名後端已完成並部署；`POST /api/applications` 已通過 production D1 E2E。
- 2026-08-28 上線前 D1 資料評估：**不需要也不應刪除 production D1 database、table、index、trigger 或 `d1_migrations` 才能上線**。現有部署紀錄確認 production D1 至少有 4 筆明確 QA／E2E／Email template 測試申請及其整合工作；正式 route 尚未啟用。建議在正式 route 開啟前先做即時唯讀盤點與完整 export，確認沒有真實案件後，只刪除測試用 `integration_jobs`／`applications` 並將 `application_reference_sequence.next_value` 重設為 1。D1 清理不會移除已寄 Gmail 或已同步的 Notion 測試頁，Notion 測試頁需另行封存。此輪僅評估與記錄，未更動 D1、Notion、Queue、Email 或 routing。
- 2026-08-28 使用者確認 production D1 維持現況，不執行上線前資料清理；既有測試 application、integration job 與 reference sequence 均保留。此決定不影響網站上線功能，第一筆真實案件會沿用目前下一個 `ST-xxxxxx` 編號。
- 2026-08-28 production route preflight：線上 Worker 的 `/language-school-signup/` 目前回傳 308 至 `/language-school-signup`，接著為 404；SSR HTML 的 CSS／JS 仍使用根路徑 `/_next/...`，表單仍 POST `/api/applications`，favicon／OG／字型／品牌圖片也使用根路徑，canonical 仍為 `https://lilaiireland.com/`。因此目前**不可直接新增 production route**，否則正式目標頁會是 404，且局部路徑接管無法涵蓋根路徑資產與 API。應先完成 `/language-school-signup` base path、API／Static Assets／metadata 對齊，部署最新本機版本至 workers.dev 並通過 QA，再新增只涵蓋該 base path 的 Cloudflare Route；不得使用整站 `lilaiireland.com/*` 或把 apex 設為 Worker Custom Domain。本輪僅唯讀檢查，未變更 route、DNS、WordPress、Worker 或 D1。
- Git：2026-08-28 已將 Noto TC 接入與子集化、直接報名區塊視覺統一、表單下拉規則、頁首官網入口，以及一對一諮詢確認信付款規則等目前全部工作區變更提交至本機 `main`；遠端 repository 尚未設定，因此沒有可推送的 remote。
- Integration consumer 已部署至 workers.dev；正式 Queue producer／consumer 與 Cron 已啟用。學生確認信已依「一對一諮詢／直接報名」分流為品牌 HTML 與 plain-text 版本；Gmail OAuth 寄信、Notion 同步及既有 pending jobs 均已在線上成功完成。
- `ADMIN_API_TOKEN` 已由使用者在 Cloudflare Dashboard 安全輪替；Secret 值未經 Codex、Terminal、Git 或日誌。
- 2026-08-28 Noto TC 已正式接入本機 CSS 並完成網站字元子集化；九個 WOFF2 build 產物合計 1,363,000 bytes，尚未部署。真實瀏覽器 Core Web Vitals／CLS／network trace 因目前未配置 Chrome DevTools MCP，仍待補測。
- 2026-08-28 「已經選好學校，就直接進入報名流程」區塊已在本機完成視覺統一：改用全站一致的白底細框、品牌綠主卡與方形位移陰影，移除原有漸層、大圓角及多套框線混用；尚未部署。
- 2026-08-28 表單下拉選單規則已在本機更新：12 個下拉選單一律以「請選擇」空值起始；直接報名不再提供任何「尚未確定／尚未確認」選項，只有一對一諮詢可以選擇，並已有前後端雙層驗證；尚未部署。
- 2026-08-28 頁首導覽已在本機新增「回到官網」入口；依最新視覺確認，桌面版已改為與「免費階段評估」完全相同的文字型 NAV 樣式，行動版也使用與其他漢堡選單項目相同的樣式，統一連至 `https://lilaiireland.com/` 並保留點擊追蹤；尚未部署。
- 2026-08-28 一對一語校諮詢學生確認信已在本機加入 NT$800 諮詢費、成功報名後可抵訂金、抵達愛爾蘭後全額退回、選定時段保留 24 小時及付款後才正式成立的規則；HTML 與純文字版本均附公司匯款資訊及回覆轉帳證明指示。直接報名信不顯示上述內容；尚未部署、未寄出測試信。

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
- Production 採既有 WordPress origin 前方的 Cloudflare **Route** 做 path-level 接管，不採 apex **Custom Domain**。route 啟用前，Worker 必須在 workers.dev 對 `/language-school-signup` 回傳正確 200，且所有 framework bundle、字型、圖片、OG／favicon 與表單 API 均須收斂於相同 base path 或另有經驗證的精確 route；canonical 必須指向正式 landing URL。

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
- 使用者已決定上線前不清理 production D1，既有測試資料與流水號均保留。若未來另行決定清理，仍只能採「保留 schema／migration history，只清除已確認的測試業務資料」；不得刪除整個 production D1 或 drop tables。清理前必須先 export、即時確認沒有真實申請與未完成 integration job，並記錄可回復基準。

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

最近一次部署：2026-09-03（報名頁 SEO metadata 與首屏文案）

- 環境：production custom routes + workers.dev，連接 production D1
- Worker：`site-creator-vinext-starter`
- URL：https://lilaiireland.com/language-school-signup/
- workers.dev：https://site-creator-vinext-starter.lilaiireland.workers.dev/language-school-signup/
- API：https://lilaiireland.com/language-school-signup/api/applications
- Version ID：`bec3d958-8363-4fa0-a1df-42e0a4842a10`（100% traffic）
- Worker code rollback baseline：`8e8c235a-f60f-4d00-bd9f-23d7b457529f`
- 部署前 D1 備份：`backups/pre-reference-code-migration-2026-08-27.sql`（11,403 bytes，僅存本機且已被 Git ignore）
- 原始 QA checkpoint：`5aa3541a-2cf4-43f7-8f40-73f96c69922f`
- Production D1：`lilai-applications-production`
- D1 database ID：`d7b4209c-fce2-4f0d-9b18-3f19c183b430`
- Region：APAC
- Production custom routes：`lilaiireland.com/language-school-signup`、`lilaiireland.com/language-school-signup/*`
- Rollback：程式異常可回切 Worker code baseline；若需撤除正式網址接管，必須從 `wrangler.jsonc` 移除上述兩條 routes 後重新部署，單純 Worker version rollback 不保證移除 route triggers。D1 migration 目前只有 additive table 建立，資料不可透過 Worker rollback 自動移除。

## 已完成

- 2026-09-03 報名頁 SEO metadata 與首屏主題訊號更新：`app/layout.tsx` 的 SSR title、meta description、Open Graph 及 Twitter metadata 已對齊「愛爾蘭語言學校報名」主意圖，文案統一區分 25+8 打工遊學與短期語校課程，不使用容易造成代辦誤解的「簽證」用語。`app/page.tsx` 的唯一 H1、Hero 首段與使用者手動簡化的訂金後協助說明已同步。Rendered HTML 測試新增 title、description、canonical、robots、Open Graph、唯一 H1、主題文案、無 meta keywords 及無 undefined／null 斷言。驗證：TypeScript 成功；frontend business logic 7/7；Turnstile 3/3；lint 0 errors／20 個既有 warnings；Vinext 五階段與 prerender 顯示 Build complete，Windows 結尾仍有已知 libuv assertion；獨立 rendered HTML 2/2 與 Wrangler dry-run 通過。環境：production custom routes + workers.dev，連接 production D1；Worker `site-creator-vinext-starter`；正式 URL `https://lilaiireland.com/language-school-signup/`；Version ID `bec3d958-8363-4fa0-a1df-42e0a4842a10`（100% traffic）；rollback baseline `8e8c235a-f60f-4d00-bd9f-23d7b457529f`。線上 QA：正式頁 HTTP 200，title、description、canonical、Open Graph、單一 H1 與 `index, follow` 正確；workers.dev 維持 `noindex, nofollow`。無尾斜線 URL 目前也回傳 200，但 canonical 統一指向有尾斜線 URL；若要改為單次永久轉址，需另行授權 routing 修正。未變更 DNS、Nameserver、WordPress、Cloudflare route 定義、D1 資料、Queue 或 secrets。

- 2026-08-29 根目錄 README 依目前正式進度重整：移除過期的 ChatGPT 預覽網址、尚未部署與尚未設定 production route 等錯誤敘述，改列正式／workers.dev URL、已上線功能、現行 Vinext／Cloudflare／D1／Queue／Gmail／Notion／Turnstile 架構、base path 本機開發方式、實際測試指令、資料庫／部署授權邊界、Secrets 安全規則與主要目錄。README 明確指向本日誌作為唯一進度與部署基準來源。驗證：逐項對照 `package.json`、`wrangler.jsonc`、`vite.config.ts`、Worker 文件與本日誌；`git diff --check` 通過。僅修改文件，未執行部署，未變更 DNS、Nameserver、WordPress、Cloudflare route、D1、Queue 或 secrets。

- 2026-08-29 正式報名頁 production routes 上線：在 `wrangler.jsonc` 版本化兩條精確路由 `lilaiireland.com/language-school-signup` 與 `lilaiireland.com/language-school-signup/*`，並明確設定 `workers_dev: true`，避免啟用 custom routes 時關閉原測試網址。未使用 `lilaiireland.com/*`，不接管整站。環境：production custom routes + workers.dev；Worker `site-creator-vinext-starter`；正式 URL `https://lilaiireland.com/language-school-signup/`；Version ID `8e8c235a-f60f-4d00-bd9f-23d7b457529f`；Worker code rollback baseline `75f319b8-a21b-479c-b7b0-3b62382d7b08`。線上 QA：正式頁與 workers.dev 均 HTTP 200、正式 canonical 正確且無 noindex、CSS bundle HTTP 200、Turnstile config action 正確且 site key 存在、無 token POST HTTP 403；首頁與 `/agreement/` HTTP 200 且仍由 WordPress.com 回應，相似但未匹配的 `/language-school-signup-unrelated` 仍由 WordPress.com 回傳 404。Build 五階段與 prerender 完成，Wrangler dry-run 及 `git diff --check` 通過；Windows 結尾仍有已知 libuv assertion。未修改 DNS、Nameserver、WordPress、D1 資料、Queue 或 secrets。
- 2026-08-29 Turnstile 與學生確認信 production 部署：前端僅從 `/language-school-signup/api/turnstile-config` 取得可公開 site key 與固定 action `application_submit`，表單送出附帶一次性 token；Worker 在任何 D1 寫入、Queue 或 Email 工作前呼叫 Cloudflare Siteverify，並嚴格核對 action 與 `TURNSTILE_HOSTNAMES`。允許 hostname 不含 localhost／`127.0.0.1`；驗證缺漏、錯誤、逾時或網路異常全部 fail closed。學生信依郵件設計規範改為 600px 品牌 table layout，保留直接報名／一對一諮詢分流、NT$800 與 24 小時付款規則、匯款資訊及轉帳證明指示，署名統一為 Alex & Arsha。環境：workers.dev（production D1／Queue／Cron）；Worker `site-creator-vinext-starter`；URL `https://site-creator-vinext-starter.lilaiireland.workers.dev/language-school-signup/`；Version ID `75f319b8-a21b-479c-b7b0-3b62382d7b08`（100% traffic）；rollback baseline `c7fd415f-df1a-4c6b-a930-42b1b4a17f39`，功能導入前含完整 Turnstile secrets 的 baseline 為 `ee92fb99-9836-4055-a6f8-c07e2b4b6f53`。線上 QA：landing HTTP 200、runtime config action 正確且 site key 存在、無 token POST 回傳 HTTP 403 且未進入 D1／寄信。驗證：Turnstile 3/3、Gmail／Email 13/13、frontend 7/7、staging 1/1、rendered HTML 2/2、TypeScript、Wrangler dry-run 與 `git diff --check` 通過；changed-files lint 0 errors／17 warnings；Vinext 五階段與 prerender 顯示 Build complete，結尾仍有 Windows 已知 libuv assertion。未啟用 production custom route，未變更 DNS、Nameserver、WordPress 或 D1 資料。
- 2026-08-28 workers.dev 上線前路徑版本部署：Vinext 以 `vite.config.ts` 的 `nextConfig` 正式啟用 `/language-school-signup` base path 與 trailing slash；CSS／JS、Noto WOFF2、品牌圖片、favicon／OG 與公開表單 API 全部收斂至同一子路徑。canonical 固定為 `https://lilaiireland.com/language-school-signup/`，僅正式 hostname 可 index，workers.dev 維持 `noindex, nofollow`。Worker 子路徑只公開 `POST /api/applications`，不把 Admin API 掛到公開 landing path；新增 Cloudflare Workers Rate Limiting binding，production 與 staging 使用不同 namespace，公開送出端點每個 location 限制 30 requests／60 秒並在超限時回傳 429 與 `Retry-After: 60`。環境：workers.dev（production D1／Queue／Cron）；Worker `site-creator-vinext-starter`；URL `https://site-creator-vinext-starter.lilaiireland.workers.dev/language-school-signup/`；Version ID `ced74dd8-e95d-4992-9ca7-ab399ab54886`；rollback baseline `962c7ea7-25d6-4657-8140-5b849c815eca`。線上唯讀 QA：landing 200、Worker 根路徑 404、Noto Regular 200 `font/woff2`、logo 200 `image/png`、公開 API GET 405；HTML 包含子路徑 bundles／assets、正式 canonical 與 workers.dev noindex。TypeScript、Gmail／Email 13/13、frontend 7/7、staging 1/1、rendered HTML 2/2、Wrangler dry-run 與 `git diff --check` 通過；lint 0 errors／20 個既有 warnings；Vinext 五階段與 prerender Build complete，結尾仍有 Windows 已知 libuv assertion。Turnstile 尚待網域與安全憑證建立確認；production Route、DNS、Nameserver 與 WordPress 均未變更。
- 2026-08-28 production custom route 上線前唯讀診斷：依 Cloudflare 官方 Route matching 規則及線上 HTTP 檢查，確認現有 Worker 根頁 `/` 為 200，但 `/language-school-signup/` 回傳 308 並導向沒有對應 app route 的 `/language-school-signup` 404；回傳 HTML 顯示 `/_next/static/...` 根路徑 bundle、`/favicon.svg`、root-host OG image 與錯誤的首頁 canonical。程式亦確認表單以絕對根路徑 `/api/applications` 送出。現況若只建立 `lilaiireland.com/language-school-signup*` Route，會把正式 URL 接到 404；若只建立較窄 path Route，根路徑資產／API 仍會落回 WordPress。Vinext 1.0.0-beta.7 本機相容表標示支援 `basePath` 與 `trailingSlash`，建議先以 `/language-school-signup` base path 收斂頁面與資產、同步調整 Worker API routing、canonical／OG URL，再部署最新版並驗證目標 path、query string、資產、表單、Email／Notion、404 邊界與 WordPress 未接管頁。Cloudflare 官方文件確認既有外部 origin 的局部接管應使用 Route，且 route 所在 hostname 必須已有 Cloudflare proxied DNS；本輪未新增、修改或刪除任何 Cloudflare Route／Custom Domain／DNS／WordPress 設定，也未部署 Worker。
- 2026-08-28 production D1 上線前資料清理評估：專案 migration 顯示 `applications` 是主資料，`integration_jobs` 以外鍵關聯，`application_reference_sequence` 獨立保存下一個 `ST-xxxxxx` 流水號；因此單純刪除申請資料不會自動將流水號歸 1。部署日誌與本機 pre-migration export 可確認既有資料均為 QA／E2E／Email template 測試用途，且至少 4 筆測試申請曾進入 production D1；整合工作已寄送 Gmail 並建立 Notion projection。結論為「上線不要求清空整庫」，但若尚無任何真實申請，建議切換正式 route 前做一次受控測試資料清理：先取得即時 aggregate／job 狀態與完整 D1 export，再只刪除測試 application／job、重設 reference sequence，保留 schema、trigger、index 與 `d1_migrations`；Notion 測試頁另行封存，已寄信件不可撤回。本輪嘗試以 Wrangler 4.124.0 執行 production D1 唯讀 aggregate，但非互動環境沒有 `CLOUDFLARE_API_TOKEN`，因此未取得即時結果；沒有要求、讀取或輸出 credential，也未執行任何 `DELETE`、`DROP`、migration、restore、Notion、Queue、Email、deploy 或 route 變更。Cloudflare 官方文件確認 D1 可先用 Wrangler export 保留完整 SQL，production backend 另有 Time Travel point-in-time recovery；實際清理仍須在操作前取得當下備份與確認結果。
- 2026-08-28 一對一諮詢學生確認信付款與匯款資訊：僅在 `service_type=consultation` 的學生 HTML／plain-text 確認信加入「需先支付 NT$800 諮詢費；成功報名學校後可抵訂金；抵達愛爾蘭後諮詢費全額退回」，並明確說明選定時段保留 24 小時、完成付款後預約才正式成立、逾期未付款自動釋出。匯款資料集中保留於 server-side Email constants，信件顯示已核准的公司銀行／分行、帳號與戶名，並要求學生完成後直接回覆 Email 附上轉帳證明；直接報名信明確排除付款規則、匯款資料與預約連結。800 元沿用既有 `CONSULTATION_TERMS.priceTwd`，新增 `bookingHoldHours: 24` 作為單一期限來源。回歸測試同時檢查 HTML 與純文字內容及 direct/consultation 分流。驗證：Gmail／Email 13/13、frontend business logic 7/7、staging isolation 1/1、rendered HTML 2/2、TypeScript、Wrangler generated-config dry-run、`git diff --check` 均通過；lint 0 errors／20 個既有 warnings；Vinext 五階段與 prerender Build complete，最後仍出現 Windows 既知 libuv assertion。Wrangler 受限環境 debug log 顯示 EPERM，但 bundle／bindings dry-run 完成且 exit 0。未部署、未寄出測試信，production Worker、Queue、Gmail credentials、custom route、DNS、WordPress、D1 與 API 均未變更。
- 2026-08-28 本機 `main` 全部進度同步：依使用者明確授權，將目前工作區的 Noto TC CSS／九個子集 WOFF2 與重建腳本、直接報名服務邊界視覺、表單「請選擇」與不確定選項分流、Worker server validation、頁首「回到官網」入口、諮詢學生信付款／匯款規則，以及所有相關測試與本日誌一併提交至本機 `main`。提交前完整 gate 為 Gmail／Email 13/13、frontend business logic 7/7、staging isolation 1/1、rendered HTML 2/2、TypeScript、Wrangler generated-config dry-run、`git diff --check` 全數通過，lint 0 errors／20 個既有 warnings；Vinext Build complete 後仍出現 Windows 既知 libuv assertion。遠端 repository 尚未設定，因此無 remote 可推送；未部署，production Worker Version ID `1deaaa0e-a1af-44a6-af2f-0b1d9a04a76d` 與 rollback baseline `be14c334-958d-4c53-9ec8-8a8db4c975ec` 不變。
- 2026-08-28 頁首「回到官網」導覽入口：桌面版與「免費階段評估」共用既有 `nav-link` 文字型 NAV 樣式，移除原先過度醒目的白底品牌綠膠囊按鈕；行動版仍置於漢堡選單第一項，但已移除專屬淺綠底與框線，改為與其他選單項目完全相同的樣式。兩個入口共用 `BRAND_LINKS.website`，官網 canonical 補齊尾端 `/` 為 `https://lilaiireland.com/`，點擊事件統一為 `official_site_return_click`，並在原分頁返回官網。新增 SSR 數量／網址、source markup、樣式一致性與品牌網址回歸測試；另將既有 AI 英語練功系統 Lite／Pro 測試預期同步為目前已啟用的 `visible: true`，與使用者既定狀態及頁面實作一致。驗證：rendered HTML 2/2、frontend business logic 7/7、staging isolation 1/1、Gmail／Email 13/13、TypeScript、Wrangler generated-config dry-run、`git diff --check` 均通過；lint 0 errors／20 個既有 warnings；Noto 網站子集重新產生 9/9；Vinext 五階段與 prerender Build complete，最後仍出現 Windows 既知 libuv assertion。Wrangler 在受限環境無法寫入使用者目錄 debug log，但 dry-run bundle／bindings 檢查完成且 exit 0。已納入本機 `main` 最新提交，尚未部署；production Worker、custom route、DNS、WordPress、D1 與 API 均未變更；目前未配置真實瀏覽器工具，因此尚未補做各 viewport 的視覺 snapshot。
- 2026-08-28 直接報名／一對一諮詢下拉規則統一：移除諮詢模式及 `intent=consultation` 初始載入時自動填入「尚未確定」的行為，12 個 `<select>` 均以空值「請選擇」呈現，包含原本顯示「選填」的來源欄位。直接報名的城市與學校選項移除「尚未確定」，並同步將課程、出發時間、週數、時段、住宿與預算的「尚未確定／尚未確認」限制為一對一諮詢模式；從諮詢切回直接報名時會清除這些不適用值。合作語校區塊說明亦改為城市或學校未定者應選一對一諮詢。Worker validation 新增防繞過規則：直接報名若提交上述不確定值，回傳 422 與對應欄位錯誤；一對一諮詢仍可正常提交。新增回歸測試涵蓋八個直接報名受限欄位、諮詢允許路徑、學校選項來源與 12/12「請選擇」placeholder；因學生可見文案變更，已重新產生並驗證 Noto 網站子集 9/9。驗證：rendered HTML 2/2、frontend business logic 7/7、staging isolation 1/1、Gmail／Email 13/13、TypeScript、Wrangler dry-run、`git diff --check` 均通過；lint 維持 0 errors／20 個既有 warnings；Vinext 五階段與 prerender Build complete，最後仍有 Windows 既知 libuv assertion。已納入本機 `main` 最新提交，尚未部署；production Worker、custom route、DNS、WordPress 與 D1 均未變更。
- 2026-08-28 直接報名服務邊界圖卡視覺統一：保留全部既有文案、CTA、追蹤事件與商業規則，僅重新編排 `ServiceBoundarySection` markup 與 CSS。上方「適合直接報名」主卡改用既有方案卡的白底、2px 品牌綠框與 12px 方形淺綠位移陰影；ISIC 贈禮卡改為白底細框搭配單一黃色頂線及標籤，不再使用大面積黃綠漸層。下方「訂金付款前」與「流程差異」合併為同一白底資訊容器，以細分隔線、統一方形圖示框和一致間距建立層級；三個省略流程由獨立小白框改為三欄品牌綠頂線條列，手機版自然轉為單欄。新增 SSR 結構與 CSS 視覺契約回歸測試，避免漸層或舊式混搭樣式回歸。驗證：rendered HTML 2/2、frontend business logic 6/6、staging isolation 1/1、Gmail／Email 13/13、TypeScript、Wrangler dry-run、`git diff --check` 均通過；lint 維持 0 errors／20 個既有 warnings；Vinext 五階段與 prerender Build complete，最後仍有 Windows 既知 libuv assertion。已納入本機 `main` 最新提交，尚未部署；production Worker、custom route、DNS、WordPress、D1 與 API 均未變更。
- 2026-08-28 Noto TC CSS 接入與效能瘦身：在 `app/globals.css` 為 Noto Sans TC 400／500／600／700／800／900 與 Noto Serif TC 400／700／900 建立九個 self-hosted `@font-face`，使用專案限定 family 名稱、`font-display: swap` 與既有系統 fallback；Sans／Serif CSS variables 已切換至本機字型首位，不加入會強制首屏下載的 preload。新增 `scripts/subset-site-fonts.py`，從被 Git ignore 的原始 TTF 與目前 `app/` 實際字元可重現產生網站子集，保留 Latin-1；九檔均可由 FontTools 重開、`wOF2` 檔頭與 OS/2 字重正確，Sans 每檔 1,240 glyph、Serif 每檔 1,241 glyph。字型總量由 29,331,216 bytes 降至 1,363,000 bytes，減少 27,968,216 bytes（約 95.4%）；未涵蓋的使用者輸入字元會由 CSS 系統中文字型 fallback。新增 rendered CSS 回歸檢查，驗證九個 face、swap、字重端點與 variables。驗證：rendered HTML 2/2、frontend business logic 6/6、staging isolation 1/1、Gmail／Email 13/13、TypeScript、Wrangler dry-run、`git diff --check` 均通過；lint 維持 0 errors／20 個既有 warnings；Vinext 五階段與 prerender Build complete，最後仍有 Windows 既知 libuv assertion。build 產物含 9 個有效 WOFF2，合計同為 1,363,000 bytes。因目前沒有 `chrome-devtools` MCP，無法執行真實瀏覽器 Core Web Vitals、CLS、network waterfall 與視覺 snapshot；已納入本機 `main` 最新提交，尚未部署；production Worker、custom route、DNS 與 WordPress 均未變更。
- 2026-08-28 部署字型資產轉換與分支對齊：確認所有既有功能分支均已包含於 `main` 歷史，`main` 的 `30c13a9` 是最新提交；先前工作目錄只是被切回其祖先 `feat/staging-isolation-hide-ai-support`（`74b7e91`），現已安全切回 `main`，未使用 reset、未覆蓋任何修改。使用本機 Python 3.12.9、FontTools 4.63.0 與 Brotli 1.2.0，將使用者提供的 9 個完整繁中字集 TTF 轉為 `public/fonts/` 下的 WOFF2：Noto Sans TC 400／500／600／700／800／900，以及 Noto Serif TC 400／700／900。逐檔以 FontTools 重新開啟驗證，9/9 均為 WOFF2、OS/2 字重正確；Sans 每檔 20,812 glyph、Serif 每檔 20,803 glyph，合計 29,331,216 bytes，並附 Google Fonts 官方 `OFL.txt`。原始 `/font/` 已加入 `.gitignore`，不會提交；目前僅完成部署資產轉換，尚未加入 `@font-face`、切換頁面字體或部署。
- 2026-08-28 workers.dev 全量更新部署：將本機 `main` 已完成的 staging 隔離、AI 英語練功系統重新顯示、隱私權政策連結、桌面標題斷句、直接報名區塊重構、Leevin／生活圈圖片修正、ISIC 僅限 25+8 標示，以及本輪頁尾營運單位「築夢愛爾國際留遊學顧問」一併建置並部署至既有 Worker `site-creator-vinext-starter`。因營運單位正式名稱含「顧問」，將 rendered HTML 測試由禁止整頁任何「顧問」字樣收斂為禁止舊「留學顧問／免費諮詢」定位，避免合法公司名稱造成誤判。環境：workers.dev（連接 production D1 `lilai-applications-production`、正式 Queue consumer 與 Cron）；URL `https://site-creator-vinext-starter.lilaiireland.workers.dev`；Version ID `1deaaa0e-a1af-44a6-af2f-0b1d9a04a76d`；rollback baseline `be14c334-958d-4c53-9ec8-8a8db4c975ec`。未變更 production custom route、DNS、Nameserver 或 WordPress。部署前驗證：Gmail／Email 13/13、frontend business logic 6/6、staging isolation 1/1、rendered HTML 2/2、TypeScript 成功、lint 0 errors／20 個既有 warnings、Vinext build complete、Wrangler dry-run 與 `git diff --check` 通過；build 結束仍有 Windows 既知 libuv assertion。部署後唯讀 smoke test：首頁 HTTP 200，最新頁尾與「僅限 25+8」內容存在；`GET /api/applications` 回傳 HTTP 405 與 `Allow: POST`，未建立 D1 測試資料、未觸發 Email 或 Notion。
- 2026-08-28 本輪變更提交與本機 main 同步：納入 staging D1／測試 Queue 隔離、使用者重新啟用 AI 英語練功系統、隱私權政策連結、桌面標題斷句、直接報名區塊正向重構與訂金規則、Leevin／生活圈圖片可見性、生活圈原圖比例與非重疊 hover、ISIC 僅限 25+8 標示，以及所有相關測試。合併前驗證：Gmail／Email 13/13、frontend business logic 6/6、staging isolation 1/1、rendered HTML 2/2、TypeScript 成功、lint 0 errors／20 個既有 warnings、`git diff --check` 通過；最新 Vinext build 五階段與 prerender 完成後仍有 Windows 既知 libuv assertion。本輪只進行 Git commit 與本機 `main` 同步，未執行 Wrangler deploy、未變更 production Worker、custom route、DNS 或 WordPress。
- 2026-08-28 ISIC 國際學生證 25+8 適用標示統一：所有學生可見的主要 ISIC／國際學生證文案均加上「（僅限 25+8 學生）」，涵蓋直接報名方案卡、服務邊界贈禮卡、圖片替代文字、表單提示與必要同意事項、送出成功畫面、開局支援卡、FAQ 與底部 CTA；原本「25+8 基本上適用」改為明確的「僅限報名 25+8 長期課程學生提出申請」，並保留仍須通過 ISIC 官方全日制資格與文件審核的條件。未更動 D1 欄位、API validation 或表單提交流程。Vinext 五階段 build 與 prerender 完成後仍出現 Windows 既知 libuv assertion；重建後 rendered HTML tests 2/2、TypeScript、`git diff --check` 通過。本地預覽 `http://localhost:3000/`，未部署、未 commit。
- 2026-08-28 品牌生活圈照片取消重疊與 hover 質感：`.community-collage` 由絕對定位重疊改為有 20px gap 的上下 Grid，主圖維持 3:2 全寬、側圖維持 4:3 並右對齊（桌面 76%、平板 70%、手機 82%），兩張圖不再互相遮蓋。figcaption 加入 `z-index: 2`，確保「城市探索與出遊／哩來生活圈」標籤完整可見。Hover 僅將當前圖片內容於其 overflow 容器內放大至 1.045，搭配 3px 上浮與陰影加深，不改變 layout、不覆蓋另一張照片。驗證：rendered HTML tests 2/2、TypeScript、`git diff --check` 通過；本地預覽 `http://localhost:3000/`。未部署、未 commit。
- 2026-08-28 品牌生活圈照片原始比例修正：讀取原始素材確認 `community-seaside.jpg` 為 1206×804（3:2）、`community-extra-01.jpg` 為 2200×1650（4:3）；原 CSS 將兩圖塞入接近直式的固定高度容器，造成 `object-fit: cover` 大幅裁掉左右人物。主圖容器改用 `aspect-ratio: 3 / 2`、側圖改用 `aspect-ratio: 4 / 3` 並取消固定高度；依桌面、平板與手機分別調整 collage min-height、圖片寬度與重疊比例，使群像保留完整且維持既有拼貼視覺。驗證：rendered HTML tests 2/2、TypeScript、`git diff --check` 通過；本地 dev server 維持於 `http://localhost:3000/`。未部署、未 commit。
- 2026-08-28 Leevin 與生活圈圖片本地不可見修正：確認四個本機 Static Assets URL（`faci06-1024x683.jpg`、`Layer-2.png`、`community-seaside.jpg`、`community-extra-01.jpg`）在 `localhost:3000` 均回傳 HTTP 200、正確 JPEG／PNG Content-Type 與完整檔案大小，排除路徑及檔案問題。共同原因為四個圖片容器皆被 `RevealController` 套用 `data-reveal="mask"`，CSS 會先以 `clip-path: inset(0 100% 0 0)` 完全裁切；當 IntersectionObserver、HMR 或前端 hydration 未觸發時會永久空白。已取消住宿與生活圈圖片的 mask reveal 綁定並移除相關 CSS；另在 `.accommodation-photo` 與 `.community-photo` 加入 `clip-path: none !important`、`opacity: 1` fail-safe，避免瀏覽器新舊 JS/CSS 快取混用時再次被遮蔽。保留標準 public root `<img src="/lilai-assets/...">`，未改用不必要的 base64 或外站來源。驗證：rendered HTML tests 2/2、TypeScript、`git diff --check` 通過；本地 dev server 維持於 `http://localhost:3000/`。未部署、未 commit，production Worker 與 route 均未變。
- 2026-08-28 直接報名服務邊界區塊正向重構（本地）：原灰色「直接報名不包含」卡片改為「已經選好學校，就直接進入報名流程」的正向定位；依序呈現適合直接報名者、ISIC 國際學生證申請贈禮、訂金付款前五項確認、付款通知與優惠訂金規則、使用者指定的「直接從申請開始，將省略這些流程」，以及正式報名服務不會減少的說明。保留原有訂金流程界線：通過確認後才寄付款通知，期限內訂金由正式原價降為活動價，完成訂金後才正式啟動名額、報價、文件、校方聯繫、付款與行前支援。視覺由灰色次等卡改為白色／淺綠／米黃品牌卡，主要 CTA 改為直接報名，諮詢作為尚未選定學校者的次要入口。同步尊重使用者已重新顯示 AI 英語練功系統的本地變更並更新對應測試預期。驗證：本地 `http://localhost:3000/` 最新 HTML 五項新內容均存在；`npx.cmd tsc --noEmit` 成功；lint 0 errors／20 個既有 warnings；Vinext 五階段 build 與 prerender 完成後仍出現 Windows 既知 libuv assertion；重建後 rendered HTML tests 2/2、`git diff --check` 通過。未部署、未 commit，production Worker 與 route 均未變。
- 2026-08-28 開局支援與住宿標題桌面斷句修正：開局大禮包標題容器由 900px 放寬至 1080px，桌面標題使用 `clamp(32px, 3vw, 40px)`；住宿 heading grid 改為 `1.55fr / .45fr`、右欄最小 280px、gap 48px，桌面標題使用 `clamp(32px, 3vw, 44px)`。兩者僅在 1001px 以上使用 `white-space: nowrap`，確保全螢幕不出現不自然斷句；1000px 以下維持既有響應式自然換行。新增 CSS 回歸測試；`node --test tests/rendered-html.test.mjs` 2/2、`npx.cmd tsc --noEmit` 通過。未部署、未 commit，production Worker 與 route 均未變。
- 2026-08-28 品牌生活圈標題桌面斷句修正：將 `.brand-proof-grid` 桌面欄寬由 `.86fr / 1.14fr` 調整為 `1.15fr / .85fr`，gap 由 72px 收斂為 56px，標題字級改為 `clamp(34px, 3.5vw, 48px)`；1001px 以上以 `white-space: nowrap` 保留 JSX 指定的兩行「不只把你送到學校，／而是陪你在愛爾蘭開始生活」，1000px 以下維持既有單欄與自然換行，避免手機溢出。新增斷句與 CSS 回歸測試；`node --test tests/rendered-html.test.mjs` 2/2、`npx.cmd tsc --noEmit` 通過。未部署、未 commit，production Worker 與 route 均未變。
- 2026-08-28 表單隱私權政策連結：直接報名與一對一諮詢的同意文字均透過集中設定 `BRAND_LINKS.privacy` 連至 `https://lilaiireland.com/agreement/`，另加入明確的品牌綠色、底線、hover 與鍵盤 focus 樣式，維持新分頁開啟及 `noopener noreferrer`。新增網址與 markup 回歸測試；`node --test tests/rendered-html.test.mjs` 2/2、`npx.cmd tsc --noEmit` 通過。未部署、未 commit，production Worker 與 route 均未變。
- 2026-08-28 staging D1／Queue 隔離（AI 顯示狀態已更新）：自 `main` 建立 `feat/staging-isolation-hide-ai-support`。Cloudflare 新增 APAC D1 `lilai-applications-staging`（ID `370f3f4a-a1dd-40d7-8e2d-097fe835747f`）並成功套用 `0001`、`0002` migrations；新增 Queue `lilai-application-integrations-staging`（ID `f62e020fe96b4686ab9bf9359dc0ca33`）與 DLQ `lilai-application-integrations-staging-dlq`（ID `82caf4609792491286168164373935aa`）。`wrangler.jsonc` 新增 `env.staging`，使用獨立 Worker `site-creator-vinext-starter-staging`、獨立 D1／Queue，consumer 與 Cron 均停用，亦不要求 Gmail／Notion secrets；staging 僅累積 pending jobs，不寄 Email、不寫 Notion。staging Worker URL `https://site-creator-vinext-starter-staging.lilaiireland.workers.dev`，Version ID `0fb3d2d1-8303-4a6d-bb44-fb22e8308cd5`；production Worker Version ID `be14c334-958d-4c53-9ec8-8a8db4c975ec` 與 production custom route 均未變。隔離 smoke test：首頁 HTTP 200；建立明確 staging QA consultation `ST-000001`，staging D1 為 1 application、三類 integration job 各 1 筆 pending；staging Queue 為 1 producer／0 consumer；production D1 維持 4 applications。AI 英語練功系統曾以 `visible: false` 隱藏但素材與 renderer 全程保留；使用者其後已將主卡片重新啟用，目前前端會顯示 AI 英語練功系統，Lite／Pro package item 與活動說明仍依現有 `visible` 設定控制。新增 staging config regression test，避免日後誤綁 production D1／Queue。驗證：staging config 1/1、frontend business logic 6/6、Gmail／Email 13/13、rendered HTML 2/2、TypeScript 成功、lint 0 errors／20 個既有 warnings、staging Wrangler dry-run 與 `git diff --check` 成功；staging build五個環境與 prerender 均完成，最後仍有 Windows 既知 libuv assertion。
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
- production workers.dev 仍直接寫 production D1 並啟動 Email／Notion consumer；一般 QA 應優先使用已隔離的 staging Worker，避免測試資料污染正式 D1 或寄出通知。
- Worker rate limiting、Turnstile production 驗證與正式單一路徑 route 均已完成並部署。仍應由真人在正式網址完成一次 Turnstile 解題與表單端到端 smoke test；目前未配置瀏覽器自動化工具。Turnstile widget metadata 的 API 自動核對腳本因未提供具 `Account.Turnstile:Edit` 權限的 API token 而未執行，但 Worker secret 名稱、runtime config 與 fail-closed 403 已在線上驗證。
- Noto 字型已完成程式碼與 build 產物驗證，但真實瀏覽器字型 network requests、CLS、LCP 與各 breakpoint 視覺截圖尚未量測；需配置 Chrome DevTools MCP 後補做。網站文案新增不在現有子集內的字元時，需以保留於本機 `/font/` 的原始 TTF 重新執行 `python scripts/subset-site-fonts.py`。

## 下一步計畫

1. 由使用者在本機以新 `ADMIN_API_TOKEN` 驗證 Admin API；不得將 token 貼入 Codex、命令歷史或 Git。
2. Notion 隔離寫入、冪等與清理 smoke test 已完成。
3. Gmail OAuth offline authorization、production-secret send smoke test，以及 Notion read/query/schema/write 驗證均已完成。
4. workers.dev 部署、Version ID／rollback baseline 記錄與既有 pending jobs 消化均已完成。
5. 執行一筆全新的受控 production 表單 E2E，核對使用者信、內部信、Notion CRM page 與 D1 provider IDs。
6. 若有永久設定錯誤，修正後提供受保護的人工重送流程，不直接改寫成功紀錄。
7. Turnstile production widget／secret、前端 token、server-side Siteverify、hostname／action 驗證與失敗測試均已完成並部署；正式 route 前補做真實瀏覽器成功解題 E2E。`deploy:vinext` 的 KV cache binding／參數仍需另行修正。
8. 配置 Chrome DevTools MCP 後，補做 Noto 字型的 desktop／mobile 視覺、Core Web Vitals、CLS 與 network waterfall；再完成其餘 responsive／assets／console／network／form／metadata QA 與 WordPress SEO baseline。
9. 單一路徑 production route 已上線並完成 HTTP／資產／API／WordPress 邊界 QA；由真人在正式網址完成一次 Turnstile 成功解題及受控表單 E2E。

## Git 工作方式

- `main`：已驗證、可回復的穩定基準。
- 新功能：從最新 `main` 建立 `feat/<topic>`。
- 修正：從最新 `main` 建立 `fix/<topic>`。
- 功能完成且測試通過後，以 fast-forward 或清楚的 merge commit 合併回 `main`。
- 合併前保持工作區乾淨並更新本日誌；不把未完成或未驗證的功能直接留在 `main`。
- 遠端 repository 狀態仍待確認；推送或刪除遠端分支前需先檢查 remote。
