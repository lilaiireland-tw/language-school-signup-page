# 哩來愛爾蘭 Headless Frontend｜Alex 開發交接

更新日期：2026-08-24  
目前階段：Vinext 前端已部署至 Cloudflare Workers 測試環境，尚未接管正式 WordPress 路由。

## 目前最重要的結論

新前端已成功存在於 Cloudflare Workers，但仍處於安全測試階段。

- 正式網站：https://lilaiireland.com
- Worker 測試網址：https://site-creator-vinext-starter.lilaiireland.workers.dev
- QA／rollback baseline Version ID：`5aa3541a-2cf4-43f7-8f40-73f96c69922f`
- 正式 custom route：**尚未啟用**
- 第一個預定接管頁面：`https://lilaiireland.com/language-school-signup/`
- 表單目前仍為模擬成功，**尚未寄信、寫入資料庫或建立 CRM 紀錄**

目前不可直接把 `lilaiireland.com/*` 綁到 Worker，也不要改 DNS、Nameserver、既有 URL 或 WordPress sitemap。

## 1. 架構與不可破壞範圍

```text
Domain registrar：WordPress.com
        ↓
Nameservers / DNS / Proxy：Cloudflare
        ↓
指定且已驗收的路徑：Cloudflare Worker / Vinext
其他所有路徑：WordPress.com origin
```

WordPress 長期保留 CMS、文章、媒體、ACF、CPT、WooCommerce、會員、Email、綠界金流及尚未遷移頁面。第一階段不要 Headless 化 `/cart/`、`/checkout/`、`/my-account/`、payment callback 或下載權限。

正式切換第一階段只應考慮：

```text
lilaiireland.com/language-school-signup
lilaiireland.com/language-school-signup/*
```

其他 `lilaiireland.com/*` 必須繼續回到 WordPress。

## 2. 已完成進度

- [x] `lilaiireland.com` 已加入 Cloudflare，Cloudflare Nameserver 已啟用
- [x] 原 WordPress 仍在線並繼續作為 origin
- [x] 已人工核對 WordPress、Google Workspace、SPF、DKIM、DMARC 等重要 DNS records
- [x] Vinext compatibility：100%（7 supported、0 partial、0 issues）
- [x] 已建立 `wrangler.jsonc`、`vite.config.ts`
- [x] workers.dev namespace 已建立：`lilaiireland.workers.dev`
- [x] Vinext production build 成功
- [x] Cloudflare Worker 成功部署
- [x] 最近一次部署上傳 53 個靜態檔案
- [x] KV placeholder 已停用，避免無效 namespace 阻塞部署
- [x] Cloudflare Images binding 已出現在 Wrangler 設定中

Worker 名稱仍是 `site-creator-vinext-starter`；正式化時建議改為 `lilai-web`，但不應先於 QA 與版本基準保護。

## 3. 本機啟動與已知環境問題

需求：Node.js 22.13 或更新版本。

```bash
npm install
npm run dev
npm test
```

目前 `package.json` 的 `build` 與 `start` 使用 Unix 形式設定 `WRANGLER_LOG_PATH`，在 Windows PowerShell／cmd 可能失敗。應改用 `cross-env`，或確認 `vite.config.ts` 內的 project-local Wrangler 設定足夠後移除 script-level 環境變數。

曾執行 `npm audit fix --force` 並強制更新多個核心 dependency。不要再次盲目執行；以 build、runtime、deployment 穩定為優先。

## 4. SEO 與 URL 絕對限制

既有公開 URL 不可因前端遷移而改變。正式接管前必須比較 WordPress 原頁與 Worker 新頁：

- HTTP status 與 trailing slash
- title、description、canonical、H1
- robots、structured data、internal links
- sitemap URL、Open Graph、featured image
- Rank Math 既有重要 metadata（若有）

目前 `app/layout.tsx` canonical 仍為 `https://lilaiireland.com/`。若此頁正式位於 `/language-school-signup/`，上線前必須改為：

```text
https://lilaiireland.com/language-school-signup/
```

正式切換前可使用 `NEXT_PUBLIC_NOINDEX=true`；正式上線時需確認已移除或設為 `false`。不可自行新增不必要的 301、修改 slug 或更動 WordPress sitemap。

## 5. workers.dev QA 驗收

正式 route 啟用前，需完成並記錄：

- Desktop、Mobile、Tablet；Chrome、Edge、Safari
- Layout、字體、圖片、Hero、Cards、Buttons、動畫、overflow、responsive
- CTA、外部連結、YouTube、Google review、表單步驟與驗證
- Console、hydration、RSC、500、redirect loop
- CSS、JS chunk、圖片與其他 assets 是否全數回 200
- title、description、canonical、H1、OG、robots、structured data、HTTP status

QA 結果應記錄於 `docs/workers-dev-qa.md`；目前尚未建立。

## 6. 表單與後端串接

前端、手機版、表單步驟、欄位驗證、語校、圖片與成功畫面已完成。關鍵檔案：

- `app/lib/api.ts`：目前等待 700ms 後直接回傳成功
- `app/lib/types.ts`：完整 payload 型別
- `app/page.tsx`：驗證、送出、成功畫面與內容
- `app/lib/data.ts`：語校、課程與評論
- `app/lib/analytics.ts`：只推入 `window.dataLayer`，尚需 GTM／GA4 接收
- `app/layout.tsx`：SEO、canonical、Open Graph、noindex

正式流程：

```text
表單 → POST /api/applications → 後端重驗
→ honeypot / rate limit / 視需要 Turnstile
→ CRM 或資料庫
→ 通知 lilaiireland@gmail.com
→ 學生確認信
→ 回傳 submissionId
```

前端只能在 API 真正成功後顯示成功畫面；失敗時需保留內容並允許重試。

- `direct_application`：直接報名，需學校、課程、年月、週數及 ISIC 初步標記
- `consultation`：一對一諮詢，可尚未決定學校，需記錄諮詢目標

後端應產生 `submissionId`、`createdAt`、`status`、`isicEligibilityStatus`、`isicNotes`。

## 7. 資安、隱私與分析

- API key、密碼、Cloudflare token、WooCommerce secret、Email／CRM 憑證不可寫入前端或 commit
- 使用 `.env`／`.env.local` 與 Cloudflare Secrets；repo 只可提供無值的 `.env.example`
- 後端重驗格式、長度與允許值，輸出至 Email／CRM 前需安全編碼
- 公開表單不可收護照等敏感證件
- 定義個資保存、存取、匯出、刪除及同意文案版本
- GTM／GA4 不可接收姓名、Email、電話或自由輸入內容
- UTM／`gclid` 應正確保存於名單系統

## 8. 外部素材與 Cloudflare

- 學校 Logo：`public/lilai-assets/schools/`
- 活動素材：`public/lilai-assets/gift-support/`
- 社群分享圖：`public/og.png`
- Leevin 外部圖片正式版前應確認授權並考慮自家託管
- ISIC、學校及合作品牌素材使用權需由團隊確認
- Cloudflare Images optimizer 是否必要仍需 QA
- KV 目前沒有有效 namespace；未確認需要 ISR／data cache 前，不要加入 placeholder ID

## 9. Git 與追蹤文件

截至本次更新前，本資料夾不是 Git repository，雖已有 `.gitignore`，但沒有本機版本歷史。本次交接確認後應建立本地 Git checkpoint；不會自動推送遠端。

`.gitignore` 至少需涵蓋 `node_modules/`、`dist/`、`.next/`、`.vinext/`、`.wrangler/`、`.env*`、`*.log`。

尚待建立：

- `docs/current-deployment-state.md`
- `docs/workers-dev-qa.md`
- `docs/url-preservation-plan.md`

## 10. 下一步與里程碑

### Milestone 1：保護現況並完成 QA

- [ ] 建立本地 Git checkpoint 與 private GitHub repository
- [ ] 建立 deployment state、QA、URL preservation 文件
- [ ] 完成 responsive、assets、console、network、routing、metadata QA
- [ ] 修正 Windows build scripts並重新跑 build／test
- [ ] 評估 Vite JSON import 與 extension warnings，不為清 warning 大幅重構

### Milestone 2：完成表單端對端功能

- [ ] 將 mock submit 改成正式 API
- [ ] 接 CRM 或資料庫，寄內部通知與學生確認信
- [ ] 加入後端驗證、rate limit、honeypot，視需要加入 Turnstile
- [ ] 兩種 service type 各完成一次端對端測試
- [ ] 串接 GTM／GA4 並確認不傳送個資

### Milestone 3：保留 SEO 接管單一路徑

- [ ] 擷取 WordPress 原頁完整 SEO baseline
- [ ] 從 sitemap 與公開 REST API 建立 URL inventory
- [ ] 將新頁路由與 canonical 對齊 `/language-school-signup/`
- [ ] 完成差異表、上線與 rollback checklist
- [ ] 經明確確認後才設定單一路徑 production route

### Milestone 4：可重複使用的 Headless 架構

- [ ] Worker 改名 `lilai-web`
- [ ] 拆分 `components/`、`features/`、`lib/wordpress/`、`lib/seo/`
- [ ] 串接 WordPress REST API，再逐頁遷移
- [ ] WooCommerce 結帳、會員、付款及下載流程維持 WordPress

## 11. 正式上線驗收

- Worker 在主要裝置／瀏覽器可用且無關鍵錯誤
- 主要 assets 全部回 200
- 表單資料確實寫入指定系統，內部與學生均收到 Email
- API 失敗不誤顯示成功，也不清空內容
- 兩種 service type 正確區分；UTM／gclid 正確保存；分析平台無個資
- URL、canonical、metadata、robots、structured data、OG 符合既定 SEO 策略
- 僅接管 `/language-school-signup/`，其他 WordPress／WooCommerce 路徑不受影響
- rollback 步驟可執行，且已記錄 deployment Version ID

## 12. 操作原則

1. 不改既有正式 URL、DNS、Nameserver 或 WordPress sitemap。
2. 不一次把整站切到 Worker。
3. 不直接操作 production route，除非 QA、SEO comparison、rollback plan 完成且取得明確確認。
4. 不執行 `npm audit fix --force`。
5. 不 commit secrets；重要改動先建立可回復版本。
6. 每次部署前 build／test，部署後記錄 Version ID。
7. 若需 redirect，先列出原因與 SEO 影響，不可自行新增。
