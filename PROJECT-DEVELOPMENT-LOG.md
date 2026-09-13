# 哩來愛爾蘭網站開發日誌

> 本檔案是唯一的進度、交接、風險、架構決策與待辦來源；過時細節請查 Git 歷史。

## 文件規則

開始前完整閱讀本檔案並執行 `git status`；每次變更、測試、部署或決策後同步更新。

不得記錄 secret、token、密碼或正式憑證；不得建立日期版交接副本。

未經明確授權，不得變更 DNS、Nameserver、WordPress production、Cloudflare production route 或整站 routing。

## 目前狀態

最後更新：2026-09-13。

正式頁面為 `https://lilaiireland.com/language-school-signup/`，其他路徑維持由 WordPress 提供；workers.dev 測試頁使用同一路徑。

Cloudflare 只接管 `/language-school-signup` 與 `/language-school-signup/*`，不得改為全網域 route 或 apex Custom Domain。

2026-09-13：所有諮詢入口 CTA 已統一並部署；一般入口為「預約一對一語校諮詢」，固定行動列為「預約一對一諮詢」，並保留 form intent、錨點與 analytics。

2026-09-12：Cork 加入 `SEDA College`；EC English 與 Limerick Language Centre 保留資料但均為 `review`、不可見、不可直接申請。

Google Ads 僅在成功建立 application 後，依 `direct_application` 或 `consultation` 觸發去重 conversion；不可在載入或點擊時觸發。

## 架構與資料流

Vinext、Vite、React App Router 以 Cloudflare Worker 部署；靜態 UI 與資產由 Git + Workers Static Assets 提供。

WordPress 維持 CMS、Media、WooCommerce、會員、訂單、付款與未遷移頁面的 origin。

Cloudflare D1 是報名／諮詢唯一真實來源；Notion 是 CRM projection，禁止重複寫入 WordPress MySQL；公開 API 為 `POST /api/applications`。

每筆申請建立三種 Queue job，payload 僅帶 `applicationId`；採 D1 claim、指數退避、最多五次與 dead-letter。

Gmail OAuth 與 Notion 憑證僅存 Cloudflare Secrets；Turnstile 在 D1／Queue 前 fail-closed 驗證 hostname 與 action，公開表單另有 rate limit。

## 部署基準

最近一次部署：2026-09-13（諮詢 CTA 統一）。

環境為 production custom routes + workers.dev，連接 production D1 `lilai-applications-production`；Worker `site-creator-vinext-starter` 為 Version `12b84469-612a-4ca7-a0a3-83b8ca172060`（100% traffic），rollback baseline 為 `71609254-e3cd-48dc-a722-060531b213f9`。

Worker rollback 不會回復 D1 資料或 migration；若需撤除正式接管，必須自 `wrangler.jsonc` 移除兩條 route 後重新部署。

## 驗證與本機開發

2026-09-13 已通過 TypeScript、frontend business logic 10/10、rendered HTML 2/2、Wrangler dry-run 與 `git diff --check`；lint 為 0 errors／20 個既有 warnings；正式唯讀 smoke test 為 HTTP 200 且兩種 CTA 文案皆存在，未送出表單。

本機使用 `npm.cmd run dev:vinext`，網址為 `http://localhost:3001/language-school-signup/`；常用檢查為 TypeScript、frontend review、lint 與 rendered HTML test。

Windows Vinext build 結尾的 libuv assertion、Vite config、KV cache 與 image optimizer warning 均為既知非 blocker；以產物與獨立 rendered HTML test 判定。

## 未解風險與下一步

1. 正式網址需真人完成一次 Turnstile 解題與受控表單 E2E；會建立 D1 資料、Queue job、Email 與 Notion CRM，必須先取得明確授權。

2. 一般 QA 請使用隔離 staging Worker，避免 workers.dev 直接寫入 production D1 或觸發 Email、Notion。

3. 配置瀏覽器效能工具後補測 Noto 字型、CLS、LCP、network waterfall 與 responsive 視覺；新增字元後必要時重跑 `scripts/subset-site-fonts.py`。

4. `deploy:vinext` 仍缺 `VINEXT_KV_CACHE`；部署時使用標準 Wrangler 指令，並回寫新 Version ID 與 rollback baseline。

## Git 工作方式

`main` 是已驗證、可回復基準；合併前完成相關驗證與本日誌更新，推送前先確認 remote。
