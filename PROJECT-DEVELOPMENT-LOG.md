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
- Worker rollback／QA baseline Version ID：`5aa3541a-2cf4-43f7-8f40-73f96c69922f`
- Production custom route：**NOT ENABLED**
- 第一個預定接管 URL：https://lilaiireland.com/language-school-signup/
- 表單狀態：前端完成，目前仍為 mock submit，尚未寄信、寫入資料庫或建立 CRM 紀錄
- Git：本機 repository 已建立，branch 為 `main`
- 最新 checkpoint commit：`eeca02d chore: checkpoint successful workers.dev deployment`
- 固定圖片：由 Workers Static Assets 部署；CMS 圖片未來使用 WordPress Media

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

更新日期：2026-08-24
專案：LilaiIreland Website Frontend Migration
目前階段：Vinext 前端已成功部署到 Cloudflare Workers 測試網址，尚未切正式 WordPress 路由

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
