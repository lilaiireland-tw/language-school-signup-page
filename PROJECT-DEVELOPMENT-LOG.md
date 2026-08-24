# 哩來愛爾蘭 Headless Frontend / Cloudflare Workers 開發日誌

> 本檔案是本專案唯一的開發進度與交接來源（Single Source of Truth）。
> Codex 每次開始工作前必須先完整閱讀；每次完成開發、部署、設定或重要決策後，必須更新本檔案。

## 文件維護規則

1. 最新狀態、目前風險與下一步永遠維護在本檔案最前段。
2. 每次開發後更新「最後更新」、「目前狀態」、「完成紀錄」、「待辦」及受影響章節。
3. 每次 deployment 記錄日期、環境、Worker 名稱、URL、Version ID、build／test 結果與 rollback baseline。
4. 完成項目由 `[ ]` 改為 `[x]`，不得只追加新清單而保留互相矛盾的舊狀態。
5. 若實際程式、Cloudflare、WordPress 或 DNS 狀態與本文件不同，先查證，再同步修正文檔。
6. 不在本文件或 Git 中記錄密碼、API key、Cloudflare token、WooCommerce secret 或其他憑證。
7. 不再建立帶日期的交接副本；歷史變更由 Git commit 保存。

## Codex 開始工作時的閱讀順序

1. 完整閱讀本檔案。
2. 閱讀 `README.md` 了解本機啟動方式。
3. 依任務閱讀相關原始碼；表單後端優先看 `app/lib/api.ts`，資料格式看 `app/lib/types.ts`。
4. 執行 `git status`，確認是否有尚未提交的使用者變更。

## 最新狀態快照

- 正式網站：https://lilaiireland.com
- 舊版原型預覽：https://lilai-ireland-language-school-application.hsiad335950.chatgpt.site/
- Worker 測試網址：https://site-creator-vinext-starter.lilaiireland.workers.dev
- Worker 目前 Version ID：`d2e4482a-830f-4c90-a783-f472135ac22b`
- Worker rollback baseline Version ID：`7e902980-5f41-4d30-883b-db62fd3b509d`（原始 QA checkpoint：`5aa3541a-2cf4-43f7-8f40-73f96c69922f`）
- Production custom route：**NOT ENABLED**
- 第一個預定接管 URL：https://lilaiireland.com/language-school-signup/
- 表單狀態：workers.dev 前端已呼叫真實 `POST /api/applications`，並已驗證成功寫入 production D1；Email Queue consumer 與 Notion CRM 尚未實作
- Git：本機 repository 已建立，branch 為 `main`
- 最新 checkpoint commit：`eeca02d chore: checkpoint successful workers.dev deployment`
- 固定圖片：由 Workers Static Assets 部署；CMS 圖片未來使用 WordPress Media
- 表單後端：Cloudflare D1（SQLite semantics）作為唯一真實資料來源；production D1 `lilai-applications-production`（APAC）已建立並套用 migration；Gmail 與 Notion 尚待 Queue 非同步處理。

## 目前最高優先順序

1. 完成 workers.dev 的 responsive、assets、console、network、routing、form 與 metadata QA。
2. 建立 WordPress 原頁 SEO baseline 與 URL inventory。
3. 修正 Windows build scripts並重新執行 build／test。
4. 壓縮大型圖片並驗證 responsive image／Cloudflare Images 實際行為。
5. 將 mock submit 改為正式 API，完成 CRM／資料庫、Email、防垃圾與端對端測試。
6. 所有 QA、SEO comparison 與 rollback plan 完成並取得明確確認後，才設定單一路徑 production route。

## 絕對不可直接執行

- 不改 DNS、Nameserver、既有正式 URL 或 WordPress sitemap。
- 不把 `lilaiireland.com/*` 整站綁到 Worker。
- 不在未驗收前操作 production route。
- 不執行 `npm audit fix --force`。
- 不提交 secrets。
- 不先 Headless 化 WooCommerce checkout、cart、my-account、付款 callback 或下載權限。

---

## 完整專案進度（2026-08-24）

更新日期：2026-08-25
專案：LilaiIreland Website Frontend Migration
目前階段：Vinext 前端與報名 API 已部署到 Cloudflare Workers 測試網址，production D1 E2E 已通過，尚未切正式 WordPress 路由

==================================================
1. 專案目標
==================================================

目前正式網站：
https://lilaiireland.com

既有網站：WordPress

核心限制：
- 既有 SEO 已開始運作
- 所有既有公開 URL 都必須維持不變
- 目標不是搬掉 WordPress，而是逐步把前端顯示層改成程式化前端
- WordPress 仍保留作為：
  - CMS
  - 文章管理
  - WooCommerce
  - 商品
  - 會員
  - 綠界金流
  - 後台管理
  - 既有未遷移頁面的 origin

目前採用方向：

使用者
  ↓
Cloudflare
  ├─ 指定路徑 → Cloudflare Worker / Vinext 前端
  └─ 其他路徑 → 原 WordPress

初期優先從：
/language-school-signup/

開始測試與替換。


==================================================
2. 目前正式網域與 DNS 狀態
==================================================

Cloudflare：
- lilaiireland.com 已成功加入 Cloudflare
- Cloudflare 已顯示：
  Your domain is now protected by Cloudflare
- 代表 Cloudflare 已正式成為 DNS / Proxy 層

網域註冊：
- 網域仍在 WordPress.com 購買
- 沒有把網域轉移到 Cloudflare

目前架構：

Domain Registrar
WordPress.com
      ↓
Nameservers
Cloudflare
      ↓
Origin
WordPress.com hosting

Nameserver：
- 已切到 Cloudflare

DNS 注意事項：
- 已人工核對 WordPress.com 原本 DNS records
- 重要紀錄包括：
  - WordPress root A records
  - www
  - apply
  - admin
  - Google Workspace MX
  - SPF
  - DKIM
  - DMARC
  - Google Site Verification
  - WordPress DKIM / _domainkey records

正式切換 Worker 前，不應任意刪除 DNS records。


==================================================
3. SEO 絕對限制
==================================================

這是整個專案最重要的限制之一。

既有 URL 不可以因為前端遷移而改變。

例如目前存在：
https://lilaiireland.com/language-school-signup/

未來即使由 Worker / Vinext / Next.js render，
網址仍然必須是：
https://lilaiireland.com/language-school-signup/

而不是：
https://apply.lilaiireland.com/
https://lilaiireland.com/new-language-school-signup/

不要因為 frontend migration 任意：
- 修改 slug
- 建立不必要的 301
- 改 canonical
- 改文章 URL
- 改商品 URL
- 改 category URL

SEO migration 時至少必須保持：
- URL
- <title>
- meta description
- canonical
- H1
- robots / indexability
- structured data
- internal links
- HTTP status code
- sitemap 中的 URL
- Open Graph metadata
- featured image / OG image
- Rank Math 既有重要 SEO metadata（若有）

任何正式 URL 接管前，先比較：
WordPress 原頁
vs
Worker 新頁


==================================================
4. 目前前端技術狀態
==================================================

目前專案技術：

Vinext
Vite
Cloudflare Vite Plugin
Wrangler
Cloudflare Workers
React / Next-compatible App Router

專案目前名稱：
site-creator-vinext-starter

目前專案結構已有：
- App Router
- 1 page
- 1 layout
- Tailwind CSS
- lucide-react
- next/headers
- next/navigation


==================================================
5. Vinext compatibility check
==================================================

已執行：
npx vinext check

結果：

Overall: 100% compatible
7 supported
0 partial
0 issues

支援項目：

Imports: 2/2 fully supported
✓ next/headers
✓ next/navigation

Libraries: 2/2 compatible
✓ tailwindcss
✓ lucide-react

Project structure:
✓ App Router
✓ 1 page
✓ 1 layout

目前 Vinext compatibility 沒有已知阻塞問題。


==================================================
6. Cloudflare Vinext 初始化
==================================================

已完成 Cloudflare deployment setup。

專案已具備：
- wrangler.jsonc
- vite.config.ts

曾遇到：
Missing Cloudflare deployment setup: Wrangler config.
Run `vinext init --platform=cloudflare` first.

此問題已處理。


==================================================
7. Cloudflare Workers.dev
==================================================

Cloudflare 帳號已建立 workers.dev subdomain。

帳號 workers.dev namespace：
lilaiireland.workers.dev

這個網址目前作為正式網域切換前的獨立測試環境。


==================================================
8. KV cache 問題紀錄
==================================================

Vinext 初始化後，wrangler.jsonc 曾出現 placeholder：
<your-kv-namespace-id>

導致部署失敗：
KV namespace '<your-kv-namespace-id>' is not valid.

以及：
Method not allowed for this authentication scheme

Vinext build 本身當時已成功，只是 KV cache binding 有問題。

目前已完成調整，最終 Worker 可以成功 deploy。

後續如果要使用真正 Vinext KV cache，
可建立正式 KV namespace，再把 binding 加回來：
VINEXT_KV_CACHE

目前不要再次填入 placeholder ID。

如果目前專案沒有真的需要 ISR / data cache，
可以暫時不啟用 KV。


==================================================
9. Cloudflare Images
==================================================

部署過程曾出現：
The Cloudflare image optimizer requires an `IMAGES` Images binding.

當時 Vinext fallback：
serving images unoptimized

後續 deploy log 中 Worker 已辨識：
env.IMAGES

後續請確認：
- Cloudflare Images binding 是否真的需要
- Next Image / Vinext Image optimizer 是否正常
- 若不需要 Cloudflare Images，可避免增加不必要複雜度


==================================================
10. 目前最重要進度：Worker 已成功部署
==================================================

已成功執行：
npx @vinext/cloudflare deploy

部署成功結果：
Deployed site-creator-vinext-starter triggers

目前測試 URL：
https://site-creator-vinext-starter.lilaiireland.workers.dev

Current Version ID：
5aa3541a-2cf4-43f7-8f40-73f96c69922f

目前狀態：
- Cloudflare Workers deploy：成功
- workers.dev 測試 URL：成功建立
- 正式 lilaiireland.com route：尚未切換


==================================================
11. Static assets 狀態
==================================================

最近一次 deploy 已成功上傳大量 frontend assets。

包含：
- /lilai-assets/
- /_next/static/
- /og.png
- favicon
- school logos
- community images
- gift/support images
- Google logo
- Lilai logo

部署紀錄顯示：
Uploaded 53 files
Success

部分已確認存在的 assets：

/lilai-assets/lilai-logo.png
/lilai-assets/google-logo.png
/lilai-assets/community-walk.jpg
/lilai-assets/community-seaside.jpg
/lilai-assets/community-extra-01.jpg
/lilai-assets/community-extra-02.jpg

/lilai-assets/schools/logo-isi-learning.png
/lilai-assets/schools/logo-atlas-language-school.png
/lilai-assets/schools/logo-ned-college.png
/lilai-assets/schools/logo-icot-college.png
/lilai-assets/schools/logo-eli-schools.png
/lilai-assets/schools/logo-erin-college.png
/lilai-assets/schools/logo-emerald-cultural-institute.png
/lilai-assets/schools/logo-cork-english-college.png
/lilai-assets/schools/logo-babel-academy.png
/lilai-assets/schools/logo-liffey-college.png

Codex 接手後請先用 browser / network tab 檢查：
- 所有主要 asset 回 200
- 沒有 404 static asset
- 沒有 CSS load failure
- 沒有 JS chunk failure
- 沒有 RSC request failure


==================================================
12. Vite warnings
==================================================

目前 build 可以成功，但仍有 Vite warning：

JSON import "./.openai/hosting.json" without import attributes

以及：

import "./build/sites-vite-plugin" without a file extension

Vinext / Vite 提醒未來：
configLoader: 'native'
可能成為預設。

目前不是 deployment blocker。

Codex 可以在不破壞專案的前提下修正：
- JSON import 加 import attributes
- plugin import 補 extension

但不要為了清 warning 大幅重構 vite.config.ts。


==================================================
13. npm / dependency 狀態
==================================================

曾經執行：
npm audit fix --force

導致多個 dependency 被強制更新，包括：
- Next
- React server DOM
- Vite
- Vinext
- Cloudflare Vite Plugin
- Drizzle Kit
- Wrangler

曾出現 peer dependency warnings。

因此後續請：
不要再次盲目執行 npm audit fix --force

優先原則：
1. build success
2. runtime success
3. deployment success

高於：
npm audit = 0

若要處理 vulnerabilities，先判斷：
- 是否只是 dev dependency
- 是否進 production bundle
- 是否真的需要該 dependency
- 是否能安全升級


==================================================
14. Windows 開發環境問題
==================================================

本機環境：
Windows
Git Bash / MINGW64

曾遇到：
WRANGLER_LOG_PATH=.wrangler/wrangler.log

Windows npm script 無法直接執行的問題。

錯誤：
'WRANGLER_LOG_PATH' 不是內部或外部命令

建議統一使用：
cross-env

例如：

"dev": "cross-env WRANGLER_LOG_PATH=.wrangler/wrangler.log vinext dev"
"build": "cross-env WRANGLER_LOG_PATH=.wrangler/wrangler.log vinext build"

或移除不必要的 WRANGLER_LOG_PATH。


==================================================
15. 原始 UI / 前端來源
==================================================

目前已有一套 HTML / CSS / JS UI prototype。

原始檔案曾包含：
- index.html
- styles.css
- script.js
- assets/

UI 內容包含：
- Hero
- Lilai brand
- Alex / Arsha
- Flight route animation
- CTA
- YouTube
- Pain points
- Journey levels
- Student reviews
- Language school routes
- Support cards
- Community carousel
- Final CTA

原始 JS 功能包含：
- CTA mapping
- IntersectionObserver reveal
- horizontal auto scroll
- number count-up
- flight route animation
- journey level interaction
- magnetic buttons
- school cards
- school logo stack
- mobile school popover

Codex 接手後應將這些功能整理成 component-based frontend，
不要重新塞回 WordPress Custom HTML。


==================================================
16. WordPress 最終角色
==================================================

長期規劃：

WordPress = Headless CMS + commerce backend

WordPress 留下：
- /wp-admin
- Posts
- Pages
- Media
- ACF
- Custom Post Types
- Taxonomies
- WooCommerce
- Orders
- Users
- Payment
- ECPay
- Downloads
- Email

Cloudflare / Vinext 前端負責：
- Frontend rendering
- UI
- Interaction
- SEO pages
- School filters
- Landing pages
- Article frontend（後期）
- Product frontend（後期）


==================================================
17. API 整合方向
==================================================

後續逐步接 WordPress REST API。

公開資料可先使用：
/wp-json/wp/v2/posts
/wp-json/wp/v2/pages
/wp-json/wp/v2/categories
/wp-json/wp/v2/tags
/wp-json/wp/v2/media

WooCommerce 公開商品展示可考慮：
/wp-json/wc/store/v1/products

不要把以下資料硬寫進 source code：
- WordPress admin password
- WooCommerce secret
- Application Password
- API secret
- Cloudflare token

私密資訊使用：
- .env
- .env.local
- Cloudflare Secrets

並加入 .gitignore。


==================================================
18. 第一階段正式路由目標
==================================================

目前優先完成：
https://lilaiireland.com/language-school-signup/

新的 Vinext / Worker frontend 必須接管這個原有 URL。

最終 Cloudflare routing：
lilaiireland.com/language-school-signup
lilaiireland.com/language-school-signup/*

其他 URL：
lilaiireland.com/*

仍然回 WordPress。

不要把整個 lilaiireland.com/* 直接綁到 Worker。


==================================================
19. 正式 Worker Route 前的驗收條件
==================================================

Codex 不應直接切正式 route。

先完成 workers.dev 測試。

必測：
- Desktop
- Mobile
- Tablet
- Safari
- Chrome
- Edge

UI：
- Layout
- Typography
- Images
- Hero
- Cards
- Buttons
- Animations
- Responsive
- Overflow

Functional：
- CTA links
- Forms
- Client-side JS
- RSC
- API
- YouTube embed
- External links
- Google review link

Technical：
- Console errors
- Network 404
- JS chunk 404
- CSS 404
- Image 404
- hydration error
- RSC error
- 500
- redirect loop

SEO：
- title
- meta description
- canonical
- H1
- OG image
- robots
- structured data
- trailing slash behavior
- HTTP status


==================================================
20. 正式切換 /language-school-signup/ 前
==================================================

Codex 必須先抓取目前 WordPress 正式頁面：
https://lilaiireland.com/language-school-signup/

紀錄：
- status code
- canonical
- title
- description
- OG
- robots
- H1
- structured data
- internal links

新 Worker page 必須逐項對照。

原 URL 不得改。


==================================================
21. Git / GitHub 狀態
==================================================

目前尚未確認正式 GitHub repository 已建立。

建議立即建立：
Private GitHub Repository

名稱可用：
lilaiireland-frontend
或
lilaiireland-web

Git 策略：

main
→ production / stable

develop
→ optional integration branch

feature/*
→ feature branches

目前至少：
local git + GitHub private remote
都應該有。

.gitignore 至少：

node_modules/
dist/
.next/
.wrangler/
.env
.env.local
.env.*
*.log

可以 commit：
.env.example

但只能放 variable names，不能放 secrets。


==================================================
22. 建議 Codex 現在立刻做的任務
==================================================

Priority 1 — 建立安全版本基準

1. 檢查：
git status

2. 若尚未 git init：
git init

3. 建立 .gitignore

4. 確認沒有：
- API key
- WordPress password
- Cloudflare token
- WooCommerce secret

5. 建立目前「成功 deploy」checkpoint commit

建議 commit：
chore: checkpoint successful workers.dev deployment


Priority 2 — workers.dev QA

正式測試：
https://site-creator-vinext-starter.lilaiireland.workers.dev

使用 browser 檢查：
- responsive
- assets
- UI
- console
- network
- routing
- form
- metadata

建立：
docs/workers-dev-qa.md


Priority 3 — Rename Worker

目前 Worker：
site-creator-vinext-starter

這是 starter 名稱，不適合 production。

建議未來改成：
lilai-web

如果只做單頁，也可以：
lilai-language-school-signup

但若之後逐步接管整站，建議：
lilai-web


Priority 4 — Refactor frontend

建議整理為：

app/
├─ layout.tsx
├─ page.tsx
└─ language-school-signup/
   └─ page.tsx

components/
├─ ui/
├─ layout/
├─ sections/
└─ shared/

features/
├─ language-school-signup/
└─ schools/

lib/
├─ wordpress/
├─ woocommerce/
├─ seo/
└─ utils/

public/
└─ lilai-assets/

styles/


==================================================
23. 建議後續正式前端架構
==================================================

最終逐步走向：

Cloudflare
├─ Worker frontend
│  ├─ homepage
│  ├─ landing pages
│  ├─ school pages
│  ├─ article frontend
│  └─ product frontend
│
└─ WordPress origin
   ├─ wp-admin
   ├─ checkout
   ├─ cart
   ├─ my-account
   ├─ WooCommerce
   ├─ ECPay
   └─ 未遷移 pages

第一階段不要 Headless：
- /cart/
- /checkout/
- /my-account/
- payment callback
- 下載權限

這些先留 WooCommerce。


==================================================
24. Codex 的工作原則
==================================================

請 Codex 遵守：

1. 不要改既有正式 URL
2. 不要一次把整站切到 Worker
3. 不要破壞 WordPress
4. 不要改 DNS
5. 不要改 Nameserver
6. 不要直接操作 production route，除非明確確認
7. 不要用 npm audit fix --force
8. 不要把 secrets commit
9. 所有重要改動先 commit
10. 每個正式 deployment 前先 build
11. 每次 deployment 後記錄 Version ID
12. 新前端 metadata 要跟原 URL SEO 對齊
13. 舊 URL 有排名時，優先保持內容與 semantic structure
14. 若需 redirect，必須先列出理由，不可自行新增
15. 不要改 WordPress sitemap URL，除非 migration strategy 已確認


==================================================
25. Codex 下一步執行任務
==================================================

先執行：
git status

然後建立：
docs/current-deployment-state.md
docs/workers-dev-qa.md
docs/url-preservation-plan.md

current-deployment-state.md 需記錄：

Worker URL:
https://site-creator-vinext-starter.lilaiireland.workers.dev

Version ID:
5aa3541a-2cf4-43f7-8f40-73f96c69922f

Production custom route:
NOT ENABLED


workers-dev-qa.md：
對 workers.dev 進行全面 QA。


url-preservation-plan.md：
從：
https://lilaiireland.com/sitemap_index.xml

開始盤點目前 SEO URLs。

若可公開存取，也讀取：

/wp-json/wp/v2/posts?per_page=100
/wp-json/wp/v2/pages?per_page=100
/wp-json/wp/v2/categories?per_page=100
/wp-json/wp/v2/tags?per_page=100
/wp-json/wc/store/v1/products

建立完整 URL inventory。


==================================================
26. Codex 最優先目標
==================================================

Milestone 1：
workers.dev 上的 language-school-signup 完整可用

Milestone 2：
在完全不改 URL 與 SEO 的條件下接管：
https://lilaiireland.com/language-school-signup/

Milestone 3：
建立可重複使用的 Headless frontend 架構

Milestone 4：
逐頁從 WordPress frontend 遷移到 Worker frontend


==================================================
27. 目前最新狀態摘要
==================================================

[✅] WordPress 正式網站仍在線
[✅] Cloudflare 帳號建立
[✅] lilaiireland.com 已接到 Cloudflare
[✅] Cloudflare Nameserver active
[✅] 原 WordPress 繼續當 origin
[✅] Vinext compatibility 100%
[✅] Cloudflare deployment config 已初始化
[✅] workers.dev subdomain 已建立
[✅] Vinext production build 成功
[✅] 靜態 assets 已上傳
[✅] Cloudflare Worker 已成功 deploy
[✅] workers.dev 測試 URL 已取得

[⏳] workers.dev 全站 QA
[⏳] GitHub private repo
[⏳] Worker 正式命名整理
[⏳] SEO metadata comparison
[⏳] URL inventory
[⏳] WordPress REST API integration
[⏳] /language-school-signup/ 正式 Worker Route
[⏳] 後續整站 Headless migration


==================================================
28. 現在可用的測試網址
==================================================

https://site-creator-vinext-starter.lilaiireland.workers.dev

Current Version：
5aa3541a-2cf4-43f7-8f40-73f96c69922f

此版本可作為目前 rollback / QA baseline。


==================================================
29. 最重要提醒
==================================================

目前已達成：

「新前端成功存在於 Cloudflare Workers」

但尚未達成：

「新前端已接管 lilaiireland.com 正式 URL」

因此目前仍然是安全測試階段。

不要直接把 root route 設成：
lilaiireland.com/*

第一個正式路由只應考慮：
lilaiireland.com/language-school-signup
lilaiireland.com/language-school-signup/*

而且必須在 workers.dev QA 與 SEO comparison 完成後才執行。


==================================================
30. 圖片部署現況與優化策略
==================================================

目前大部分網站圖片位於：
public/lilai-assets/

目前部署流程：

public/lilai-assets/*
  ↓
Vinext build
  ↓
dist/client/*
  ↓
Wrangler deploy
  ↓
Cloudflare Workers Static Assets

wrangler.jsonc 目前設定：
- assets.directory = dist/client
- assets.binding = ASSETS
- not_found_handling = none

因此每次部署 Worker 時，public 內的固定圖片會一起進入 client build，並上傳為 Cloudflare Workers Static Assets。圖片路徑目前包括：

/lilai-assets/lilai-logo.png
/lilai-assets/alex-arsha-cutout.png
/lilai-assets/schools/*
/lilai-assets/gift-support/*
/lilai-assets/community-*.jpg
/og.png
/favicon.svg

目前 public 共約 43 個檔案，總大小約 11.95 MB。整體規模不大，繼續使用 Workers Static Assets 是合理且簡單的做法，目前不需要為這批固定素材導入 R2。

目前主要問題不是部署方式，而是部分原始圖片檔案偏大，且頁面主要使用一般 <img>：

- job-guide.png 約 2.4 MB
- og.png 約 1.9 MB
- 部分 community 圖片接近 1 MB
- 一般 <img> 不會自動取得完整的 responsive image / dynamic transformation 效果

雖然 wrangler.jsonc 已有 IMAGES binding，vite.config.ts 也設定 Vinext imagesOptimizer，但目前 JSX 大多使用一般 <img>，因此不可假設所有圖片都已經過 Cloudflare Images 自動縮圖、轉 WebP 或 AVIF。必須透過實際 Network response、Content-Type、尺寸與請求 URL 驗證。

建議採用混合式圖片架構：

1. Git + Cloudflare Workers Static Assets

適合：
- 品牌 Logo
- 語校 Logo
- favicon
- UI 裝飾
- Landing Page 固定素材
- 固定活動卡片圖
- 預設 OG 圖
- Alex / Arsha 固定人物圖

理由：
- 圖片與程式版本一起管理
- deploy 與 rollback 時能保持一致
- 不依賴 WordPress origin 才能顯示
- Cloudflare 可直接在 edge 提供靜態資產

2. WordPress Media Library

適合：
- 文章 featured image
- 部落格內文圖片
- 學校介紹頁照片
- 商品圖片
- 最新活動內容圖片
- 需要由非工程人員在 WordPress 後台更換的素材

未來 Worker frontend 可透過 WordPress REST API 取得 media URL。這些圖片屬於 CMS 內容，不應全部複製進 Git。

3. Cloudflare Images / R2

Cloudflare Images 適合：
- 需要依裝置動態 resize
- 需要 WebP / AVIF 轉換
- 同一原圖需要多種尺寸與裁切
- 未來圖片量明顯增加

R2 適合：
- 大量獨立媒體檔案
- 使用者上傳內容
- 圖片生命週期不應綁定 frontend deploy
- 需要 S3-compatible object storage

目前只有約 12 MB 固定素材，不需要立刻加入 R2。Cloudflare Images transformation 可能有用量與計費，正式啟用前需確認實際需求、cache 行為與方案。

目前另有第三方圖片 hotlink：

https://leevinstay.com/wp-content/uploads/2025/09/faci06-1024x683.jpg
https://leevinstay.com/wp-content/uploads/2026/04/Layer-2.png

風險：
- 對方換檔名或刪除圖片會直接破圖
- 對方可能限制 hotlink
- 無法控制 cache、格式與圖片大小
- 素材授權與長期可用性需確認

正式版建議在取得書面使用許可後，將這類圖片改由自家 WordPress Media、Workers Static Assets 或未來的 R2 管理。YouTube 官方縮圖可繼續使用官方來源。

圖片優化優先順序：

Priority 1：
- 壓縮 job-guide.png、og.png 與接近 1 MB 的 community 圖片
- 視圖片用途輸出 WebP / AVIF，保留合理品質
- 確認 OG 圖仍符合社群平台相容性

Priority 2：
- 為大圖加入 srcset / sizes
- 保持非首屏圖片 loading="lazy"
- Hero / LCP 圖片不可一律 lazy load
- 明確設定 width / height 或 aspect-ratio，降低 layout shift

Priority 3：
- 驗證 Vinext next/image 與 Cloudflare Images binding
- 檢查實際請求是否有 resize / format optimization
- 確認 transformation cache 與 fallback 行為
- 驗證穩定後，再逐步把合適圖片從 <img> 改為 Image component

Priority 4：
- WordPress REST API 整合時，將 CMS 圖片與固定 UI 圖片分開
- 不要把所有 WordPress Media 複製進 frontend repo
- 不要把所有固定 UI 素材搬回 WordPress

圖片架構結論：

固定 UI / 品牌素材
→ Git + Cloudflare Workers Static Assets

CMS / 文章 / 商品內容圖片
→ WordPress Media Library

大量獨立媒體或使用者上傳
→ 未來視需要使用 R2

動態縮圖、格式轉換與多尺寸輸出
→ 視成本與需求使用 Cloudflare Images

目前做法可以繼續使用，但正式 route 上線前必須完成大型圖片壓縮、responsive image 與 Network QA。


==================================================
31. 表單資料庫、Email 與 Notion CRM 初版規劃（部分已被第 32 章取代）
==================================================

狀態：初版曾建議 D1 與可選 Email provider；使用者後續明確指定 MySQL 與公司 Gmail。資料庫與 Email 技術選擇以第 32 章為準。本章的 Queue、Notion、idempotency、安全及驗收原則仍有效。

架構決策：

瀏覽器表單
  ↓ POST /api/applications
Cloudflare Worker API
  ├─ Server-side validation / honeypot / rate limit / Turnstile（視需要）
  ├─ INSERT Cloudflare D1（唯一真實資料來源）
  └─ enqueue submissionId
       ↓
Cloudflare Queue consumer
  ├─ 寄學生確認信
  ├─ 寄內部通知信至 lilaiireland@gmail.com
  ├─ 呼叫 Notion API 建立或更新 CRM page
  └─ 回寫 D1 的 email_status / notion_status / notion_page_id / error

核心原則：

- 客人資料先成功寫入 D1，API 才回傳成功與 submissionId。
- Email 或 Notion 暫時失敗，不可讓已保存的表單資料消失。
- Email 與 Notion 由 Queue 非同步執行並可重試。
- D1 是 source of truth；Notion 是方便團隊操作的 CRM projection，不是唯一資料庫。
- Notion 不會直接讀取 D1 SQL；Worker consumer 必須使用 Notion API 建立或更新資料庫 page。
- 所有同步必須具備 idempotency，避免 Queue retry 造成重複寄信或重複建立 Notion page。

建議技術選擇：

- SQL：Cloudflare D1（SQLite semantics），與現有 Worker 同帳號、低流量可 scale-to-zero。
- ORM / migration：沿用現有 Drizzle ORM 與 drizzle-kit。
- 非同步：Cloudflare Queues；設定 retry 與 Dead Letter Queue。
- Email 首選：Cloudflare Email Service Workers binding（若帳號方案與網域已符合寄送條件）。
- Email 備選：既有 Email provider 的 HTTPS API，例如 Resend / Postmark；API key 僅存 Cloudflare Secret。
- CRM：Notion Integration + Notion API；CRM database 需分享給 integration，並具 Insert Content／Update Content capability。

成本判斷（以 2026-08-24 官方文件為準，正式啟用前仍需重新核對）：

- D1 Free：每日包含 5 million rows read、100,000 rows written，總 storage 5 GB；一般表單名單量通常遠低於此範圍。
- Queues Free：每日 10,000 operations，訊息通常包含 write / read / delete 三次操作；低流量表單通常足夠。
- Cloudflare Email Sending：寄送任意客戶地址需要 Workers Paid；Paid 每月包含 3,000 封，超量依官方費率計算。
- 因 Email Sending 需要 Workers Paid，最低成本需比較：Workers Paid + Cloudflare Email Service，或 Workers Free + 外部 Email API free tier。選擇時以寄送可靠性、網域驗證、日後維護與實際月寄送量為準，不只看零元方案。

建議 D1 tables：

1. applications
- id / submission_id：UUID，primary key
- service_type
- chinese_name / email / phone / line_id / current_location
- preferred_city / preferred_school / custom_school / course_type
- expected_start_month / course_duration / class_schedule
- accommodation_needed / partner_accommodation_interest
- quote_status / decision_stage / consultation_goal / budget_range
- additional_notes / discovery_source
- utm_source / utm_medium / utm_campaign / utm_content / utm_term / gclid / landing_page_url
- agreements_json / agreement_version / consented_at
- isic_initially_eligible / isic_eligibility_status / isic_notes
- crm_status（預設 new）
- created_at / updated_at

2. integration_jobs
- id
- application_id
- job_type：student_email / internal_email / notion_sync
- status：pending / processing / succeeded / failed / dead_letter
- attempts / last_error / next_retry_at
- provider_message_id / notion_page_id
- created_at / updated_at / completed_at
- UNIQUE(application_id, job_type)，作為 idempotency 保護

可在 applications 直接保存彙總狀態：
- student_email_status
- internal_email_status
- notion_sync_status
- notion_page_id
- last_integration_error

API 規格：

POST /api/applications

流程：
1. 解析 JSON 並限制 request size。
2. 後端重新驗證必填、Email、長度、enum 與 agreements；不可相信前端驗證。
3. 驗證 honeypot / rate limit；正式廣告流量前加入 Turnstile。
4. 產生 submissionId，使用 transaction 寫入 applications 與 integration_jobs。
5. 將只包含 submissionId 的小訊息送入 Queue；不要把完整個資放進 Queue payload。
6. 回傳 201：{ ok: true, submissionId }。
7. 重複 request 使用 Idempotency-Key 或 submission token，避免連點造成重複名單。

不可把 Email 或 Notion 同步成功當作 API 成功的必要條件。只要 D1 已安全保存即可顯示「已收到」；Email 可在成功畫面標示「確認信將寄至你的信箱，若數分鐘未收到請檢查垃圾郵件」。

Email 規劃：

學生確認信依 service_type 使用兩個 template：
- direct_application：摘要城市、學校、課程、預計月份、週數、submissionId 與下一步。
- consultation：摘要城市方向、諮詢目標、預計時間、submissionId 與後續聯絡方式。

內部通知信寄到 lilaiireland@gmail.com，主旨格式：
- [網站新名單] 直接報名｜姓名｜城市｜學校
- [網站新名單] 一對一諮詢｜姓名｜城市方向

Email 必須：
- 同時提供 HTML 與 plain text。
- from 使用已驗證的 lilaiireland.com 地址，例如 application@lilaiireland.com。
- reply-to 可設為 lilaiireland@gmail.com 或正式客服信箱。
- 不寄送密碼、護照或敏感證件。
- 保存 provider message ID、send status 與錯誤；不要把完整 Email body 寫進一般 log。
- SPF / DKIM / DMARC 與寄送網域必須驗證。

Notion CRM 規劃：

Notion database 建議 properties：
- Name（title）
- Submission ID（rich text，唯一對照）
- Status（status：New / Contacted / Qualified / Quoted / Deposit Pending / Enrolled / Closed Lost）
- Service Type（select）
- Email（email）
- Phone（phone）
- LINE / Instagram（rich text）
- City / School / Course（select 或 rich text）
- Expected Start / Duration / Budget（對應欄位）
- Accommodation（select）
- Source / UTM Campaign（select / rich text）
- ISIC Eligible（checkbox）
- Submitted At（date）
- D1 Record ID（rich text）

同步方式：
1. Queue consumer 用 submissionId 查 D1。
2. 若 applications.notion_page_id 已存在，更新該 page；否則先以 Submission ID 查重，再建立 page。
3. 成功後把 Notion page ID / URL 回寫 D1。
4. Notion 429 / 5xx 使用 exponential backoff；權限或 schema mismatch 標記 failed 並告警，不可無限重試。
5. Notion 中的人工作業狀態若要回寫 D1，屬第二階段；可用 scheduled sync 或 Notion webhook，第一版先做 D1 → Notion 單向同步。

安全與個資：

- D1、Queue、Email、Notion 只由 Worker server-side 存取。
- NOTION_TOKEN、Email provider key、Turnstile secret 使用 Wrangler Secret／Cloudflare Secrets，不進 Git、不貼在日誌。
- Notion integration 僅分享 CRM database，採最小權限；不要給整個 workspace 權限。
- API response 不回傳完整 application record。
- 設定個資保存期限、刪除／匯出流程、內部存取權限與 audit trail。
- 一般 logs 不記姓名、Email、電話、additional_notes 或完整 request body。

實作階段：

Phase 0 — 決策與帳號準備
- [ ] 確認每月預估表單量與 Email 量。
- [ ] 決定 Cloudflare Email Service 或外部 provider。
- [ ] 確認寄件地址、reply-to、學生與內部 Email 文案。
- [ ] 提供 Notion CRM database URL / ID 與欄位 schema；建立最小權限 integration。
- [ ] 確認個資保存與刪除政策。

Phase 1 — D1 與 API
- [ ] 建立 dev / production D1 database（不可共用測試資料）。
- [ ] 加入 D1 binding，建立 Drizzle schema 與 migrations。
- [ ] 實作 POST /api/applications 與 server-side validation。
- [ ] 加入 idempotency、honeypot、rate limit 與安全 logging。
- [ ] 前端改呼叫真實 API，實作成功、失敗、timeout 與 retry UX。

Phase 2 — Queue 與 Email
- [ ] 建立 integration queue 與 Dead Letter Queue。
- [ ] 設定 Email sending domain / binding 或 provider secret。
- [ ] 建立 direct_application / consultation 的 HTML + text templates。
- [ ] 實作學生確認信與內部通知信，保存 message ID / status。
- [ ] 測試成功、temporary failure、permanent bounce、duplicate delivery。

Phase 3 — Notion CRM
- [ ] 對照並鎖定 Notion database property schema。
- [ ] 實作 create / update / deduplicate。
- [ ] 保存 notion_page_id，處理 rate limit、權限錯誤與 schema mismatch。
- [ ] 用測試 CRM database 驗證後才切正式 database。

Phase 4 — QA 與上線
- [ ] 直接報名與諮詢各做完整 E2E。
- [ ] 驗證 D1 record、兩封 Email、Notion page 與狀態回寫。
- [ ] 驗證 API 失敗不清空表單，外部整合失敗不遺失名單。
- [ ] 驗證 spam / rate limit / Turnstile、個資 logs、secret 管理。
- [ ] 建立重送、人工補同步、DLQ 處理與 rollback runbook。
- [ ] workers.dev 驗收後才考慮 production route。

開始實作前需要使用者提供／確認：

- 每月預估表單與 Email 數量。
- 希望的寄件地址與 reply-to。
- Email provider 選擇；若使用既有 provider，只需確認 provider 名稱與建立 Cloudflare Secret，不要把 key 寫進對話或 source code。
- Notion CRM database 的 URL / ID、現有 properties 與希望的 status 流程。
- 是否需要 D1 → Notion 單向同步，或第二階段也要 Notion status 回寫 D1。
- 隱私權政策、同意文案版本與個資保存期限。


==================================================
32. 最新資料庫與 Email 技術需求（2026-08-24）
==================================================

使用者決策：
- Production 不使用 D1 / SQLite，改用 MySQL。
- MySQL 必須維持輕量成本，但保留未來擴充能力。
- Transactional Email 必須由公司 Google Workspace Gmail 信箱寄出。

建議架構：

Cloudflare Worker API
  ↓
Cloudflare Hyperdrive（connection pooling / secure connectivity）
  ↓
Managed MySQL（source of truth）

Queue consumer
  ├─ Gmail API messages.send
  └─ Notion API CRM sync

MySQL：
- Worker 不應對 MySQL 建立未受管理的大量直接連線；使用 Cloudflare Hyperdrive。
- Driver 使用 mysql2 3.13.0 以上，Promise API；ORM 可將現有 Drizzle 從 d1 adapter 改為 mysql2 adapter。
- 每個 request 建立邏輯 connection，底層 pool 交由 Hyperdrive 管理。
- 表單寫入與立即讀回使用 cache-disabled Hyperdrive，避免 read-after-write stale data。
- 建立 dev / production 兩套 database、credentials 與 Hyperdrive binding。
- MySQL provider 尚未決定；候選需比較 managed backup、TLS、region、SLA、升級路徑與最低月費。
- 不建議自行在廉價 VPS 維護 MySQL production，除非團隊願意負責 patch、backup、restore、monitoring、failover 與安全。

MySQL provider 建議順序：
1. 輕量起步：Aiven MySQL Developer（或 Free 僅供 dev / prototype），再透過 Hyperdrive。
2. 更重視 MySQL-native scale workflow：PlanetScale Vitess + Hyperdrive，成本較高但擴充與 schema workflow 完整。
3. 已深度使用 Google Cloud：Cloud SQL for MySQL + Hyperdrive；管理成熟，但 instance 持續計費，通常不是最低成本。
4. Railway 可作早期低流量環境，但 production 前需確認 backup、availability target、region 與長期費用。

Gmail API：
- Google API key 本身不能授權寄信；Gmail messages.send 需要 OAuth 2.0 access token。
- 最小 OAuth scope 使用 https://www.googleapis.com/auth/gmail.send。
- 公司 Google Workspace 自動化首選：建立專用寄件帳號（例如 application@lilaiireland.com）＋ Google Cloud service account ＋ Workspace Admin domain-wide delegation，只授權 gmail.send，並 impersonate 該寄件帳號。
- 若不使用 domain-wide delegation，可用一次性管理員 OAuth consent 取得 refresh token；但帳號撤權、密碼／安全政策變動與 token lifecycle 維護較麻煩。
- service account private key / OAuth client secret / refresh token 必須存 Cloudflare Secret，不得使用 NEXT_PUBLIC_*、不得進 Git 或日誌。
- Queue consumer 建立 RFC 2822 MIME email，base64url encode 後呼叫 Gmail API users.messages.send。
- 寄件 From 必須是被 impersonate 的 Workspace mailbox 或其已設定 send-as alias。
- Gmail 適合目前低量 transactional confirmation；仍受 Workspace sending limits、bounce 與反垃圾政策約束，不應用於大量行銷信。

開始實作前待確認：
- MySQL provider 與預算上限。
- 預期每月 submissions、查詢量與資料保存年限。
- 是否要求 production SLA / automated backup / point-in-time recovery。
- Google Workspace 是否有 Super Admin 可設定 domain-wide delegation。
- 專用寄件信箱與 reply-to。
- 是否接受 service account domain-wide delegation；若否，改採 OAuth refresh token。


==================================================
33. D1 後端架構定案與分支起點（2026-08-24）
==================================================

此章取代第 32 章的 MySQL 資料庫決策；第 32 章保留為討論歷程。Gmail API 的 OAuth 2.0、Cloudflare Secret 與 Queue 原則仍有效。

最終決策：
- 報名與諮詢資料使用 Cloudflare D1（SQLite semantics）。
- D1 是報名系統唯一真實資料來源（source of truth）。
- 不把同一份報名資料重複寫入 WordPress MySQL。
- WordPress 後台未來安裝自訂管理外掛，透過受保護的 Worker Admin API 查詢與更新 D1。
- Notion 是 CRM projection，不是主資料庫。
- 後端使用 Cloudflare Workers + TypeScript，不另外部署 FastAPI、Flask、VPS 或獨立 Node.js server。
- 前端、公開 API 與管理 API 部署在目前同一個 Worker。

預定路由：
- `POST /api/applications`：公開表單提交。
- `GET /api/admin/applications`：WordPress 管理員清單。
- `GET /api/admin/applications/:id`：報名詳情。
- `PATCH /api/admin/applications/:id`：更新 CRM 狀態與內部備註。

後端目錄分層已建立：
- `worker/routes/`：HTTP request / response。
- `worker/validation/`：server-side schema 與欄位驗證。
- `worker/services/`：應用流程。
- `worker/repositories/`：D1 SQL 與資料存取。
- `worker/queue/`：Gmail、內部通知與 Notion 非同步工作。
- `worker/shared/`：後端共用工具。
- `migrations/`：版本化 D1 SQL migrations。

Git checkpoint：
- 新分支：`feat/d1-applications-backend`
- 本階段只建立目錄職責與架構說明，尚未建立 Cloudflare 正式 D1 database，也尚未部署 API。

下一步：
1. 設計 `applications` 與 `integration_jobs` schema，建立第一個 D1 migration。
2. 建立 development / production D1，在 Wrangler 設定 `DB` binding。
3. 實作 `POST /api/applications`：server-side validation、idempotency 與錯誤回應。
4. 將 `app/lib/api.ts` 的 mock submit 改成真實 API request。
5. 本地 migration、build 與 API integration test 通過後，才套用 production migration 與部署。


==================================================
34. D1 schema 與報名 API 實作（2026-08-24）
==================================================

已完成：
- 建立 `migrations/0001_create_application_tables.sql`。
- `applications` table 已包含報名、諮詢、UTM、同意版本、ISIC、CRM 狀態、分派顧問與內部備註。
- `integration_jobs` table 已定義學生確認信、內部通知與 Notion 同步的狀態、重試、provider ID 與錯誤記錄。
- 建立必要 index、foreign key、CHECK constraint 與 JSON validity constraint。
- 建立 D1 repository、application service、server-side validation、HTTP response 與 admin auth 層。
- 前端 `app/lib/api.ts` 已從 mock submit 改為真實 `POST /api/applications`。
- 表單 API 失敗時保留表單並在頁面顯示錯誤，不誤顯示成功。
- Wrangler 已設定 `DB` binding、`ADMIN_API_TOKEN` required secret、migrations directory 與 observability。
- 已生成 `worker-configuration.d.ts`，Worker 使用生成的 Cloudflare binding types。

已實作 API：
- `POST /api/applications`：server-side validation、request size limit、prepared statements、UUID idempotency、D1 batch 建立報名與三種 integration jobs。
- `GET /api/admin/applications`：分頁、CRM status、service type 與關鍵字篩選。
- `GET /api/admin/applications/:id`：取得單筆詳情。
- `PATCH /api/admin/applications/:id`：限定更新 CRM status、分派顧問、內部備註、ISIC status 與備註。
- 管理 API 使用 Bearer `ADMIN_API_TOKEN`，以 SHA-256 與 timing-safe comparison 驗證。

驗證結果：
- `npx tsc --noEmit`：pass。
- `npm run lint`：0 errors；仍有專案原有的 `<img>`、unused import 與 generated type warning。
- `npm run build:vinext`：build complete；仍有已知 Vite config、KV prerender cache、image optimizer prerender warning，Windows process 結束時有 libuv assertion。
- 本地 D1 integration test：新增回 201、同 idempotency key 回 200 duplicate、admin list/detail/PATCH 皆回 200，PATCH 後 `crm_status=contacted`。
- 測試資料只存於已被 Git 忽略的 `.wrangler/` local D1。

DataGrip：
- 已新增 `docs/D1-DATAGRIP.md`。
- DataGrip 不能透過 JDBC/TCP 直接連 production D1，因 D1 不提供 host / port / JDBC URL。
- 開發時可用 DataGrip SQLite data source 開啟 `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite`。
- production 可透過 Wrangler 匯出 SQL，匯入本地 SQLite 後由 DataGrip 檢視；這是 snapshot，不是即時連線。

尚未完成／不可部署：
- `wrangler.jsonc` 的 D1 database ID 仍是 placeholder，尚未建立 production D1。
- production `ADMIN_API_TOKEN` 尚未建立；不可把測試 token 使用於 production。
- Turnstile / rate limit 尚未加入，公開 API 不可在無機器人防護下切 production route。
- Queue consumer、Gmail API、Notion API 與 WordPress 管理外掛尚未實作。

下一步：
1. 在 Cloudflare 建立 development / production D1，寫回真實 database ID。
2. 建立 production `ADMIN_API_TOKEN` Cloudflare Secret。
3. 加入 Turnstile 與公開 endpoint rate limiting。
4. 在 development D1 套用 migration，部署 workers.dev 後重做 API E2E。
5. 開發 Queue + Gmail + Notion，最後開發 WordPress 管理外掛。


==================================================
35. Production D1 建立、workers.dev 部署與 E2E（2026-08-25）
==================================================

最新狀態：
- Production D1：`lilai-applications-production`。
- D1 database ID：`d7b4209c-fce2-4f0d-9b18-3f19c183b430`。
- D1 region：APAC；本次查詢由 HKG colo primary 服務。
- Worker：`site-creator-vinext-starter`。
- workers.dev URL：https://site-creator-vinext-starter.lilaiireland.workers.dev
- API URL：https://site-creator-vinext-starter.lilaiireland.workers.dev/api/applications
- 新 Worker Version ID：`d2e4482a-830f-4c90-a783-f472135ac22b`，已佈署 100% workers.dev traffic。
- Rollback baseline：`7e902980-5f41-4d30-883b-db62fd3b509d`；原始 QA checkpoint 仍為 `5aa3541a-2cf4-43f7-8f40-73f96c69922f`。
- Production custom route：未啟用；本次未變更 DNS、Nameserver、WordPress 或 `lilaiireland.com` routing。

完成內容：
- 在 Cloudflare 建立 production D1，將 Wrangler `DB` binding 由 placeholder 改為真實 production D1。
- 遠端套用 `0001_create_application_tables.sql`，驗證 `applications` 與 `integration_jobs` 存在。
- 移除 `vite.config.ts` 額外的 placeholder D1，修正 build 產物出現兩個 `DB` binding 的問題。
- 以不落地的高熵隨機值建立 production `ADMIN_API_TOKEN` Cloudflare Secret；值未輸出、未寫入 Git 或日誌。
- 更新 worker types、database npm scripts、README 與 DataGrip 文件。

驗證結果：
- `npx tsc --noEmit`：pass。
- `npm run build:vinext`：build complete；仍有已知 Vite native config、KV prerender cache、image optimizer prerender 與 Windows libuv 結束訊息，部署不受阻擋。
- Worker startup time：36 ms。
- Production API E2E：`POST /api/applications` 成功，`duplicate=false`。
- E2E submission ID：`6615a714-6ad4-40c2-8627-709250243ff9`；資料為明確標示的非真實測試資料，保留作為上線驗證記錄。
- 遠端 D1 查詢確認 application 為 `service_type=direct_application`、`crm_status=new`。
- 同一 application 的 `student_email`、`internal_email`、`notion_sync` 三筆 jobs 皆建立且為 `pending`。

未解風險：
- Email / Notion Queue consumer 尚未實作，因此 integration jobs 不會被消化，也不會實際寄信。
- Turnstile 與 rate limiting 尚未加入；workers.dev 可作受控測試，不可在此狀態下開啟正式網域廣告流量。
- DataGrip 無法用 JDBC/TCP 直接連 production D1；只能開啟 Wrangler export 後的本地 SQLite snapshot，不是即時連線。
- 目前 workers.dev 前端直接寫 production D1；後續應建立獨立 staging D1，避免一般 QA 污染 production data。

下一步：
1. 以瀏覽器實際完整填寫直接報名與諮詢表單，再從 Cloudflare D1 Console 或 Wrangler 查詢核對。
2. 加入 Turnstile 與 rate limiting 後才評估 production custom route。
3. 實作 Queue consumer、Gmail API 與 Notion sync，將 pending jobs 轉成 succeeded / failed / dead_letter。
4. 建立 staging D1 與測試資料清理流程。
