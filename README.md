# 哩來愛爾蘭｜語校直接報名 Landing Page

這是哩來愛爾蘭的一頁式語校報名網站，包含直接報名、一對一選校諮詢、合作語校、開局支援、Leevin 住宿、Google 評論、FAQ 與多步驟表單。

- 線上預覽：https://lilai-ireland-language-school-application.hsiad335950.chatgpt.site/
- 交接負責人：Alex
- 完整進度與交接說明：請先閱讀 `PROJECT-DEVELOPMENT-LOG.md`

## 技術環境

- Node.js 22.13 或更新版本
- React 19、Next.js 16、TypeScript
- vinext、Vite、Cloudflare Worker
- npm（請保留 `package-lock.json`）

## 本機啟動

```bash
npm install
npm run dev
```

終端機會顯示本機網址，通常是 `http://localhost:3000` 或相近連接埠。

## 檢查

```bash
npm test
```

這會先建立正式版本，再檢查重要文案、連結、合作語校、表單欄位與素材是否仍存在。

## 正式建置

```bash
npm run build
```

## 一次性取得 Gmail refresh token

先在 Google Cloud 建立 **Desktop app** OAuth client、啟用 Gmail API，並下載 client JSON 到專案外或已忽略的位置。接著執行：

```powershell
npm.cmd run gmail:authorize -- "C:\path\to\client_secret.json"
```

腳本只要求 `https://www.googleapis.com/auth/gmail.send`，使用 PKCE、`access_type=offline`、`prompt=consent` 與本機 loopback callback。它不會寫入 refresh token 或 access token；refresh token 只在終端顯示一次，請立即手動存入 Cloudflare Secret `GMAIL_REFRESH_TOKEN`。不要把 client JSON 或 token 提交 Git。

## 主要位置

- `app/page.tsx`：頁面內容、區塊、互動與表單畫面
- `app/globals.css`：全站樣式與響應式版面
- `app/lib/data.ts`：合作語校、課程與評論資料
- `app/lib/types.ts`：表單 payload 型別
- `app/lib/api.ts`：表單送出整合點，目前呼叫同網域 `POST /api/applications`
- `app/lib/analytics.ts`：推送至 `window.dataLayer` 的追蹤事件
- `public/lilai-assets/`：品牌、學校與開局支援圖片
- `tests/rendered-html.test.mjs`：關鍵內容回歸檢查
- `scripts/generate-gmail-refresh-token.mjs`：一次性 Gmail Desktop OAuth owner authorization 工具
- `worker/index.ts`：Cloudflare Worker 入口

## 重要提醒

目前 workers.dev 表單會呼叫 Worker API 並寫入 production D1。Email Queue consumer 與 Notion CRM 程式已完成但尚未部署；在 Gmail／Notion secrets 與 E2E 驗證完成前，integration jobs 會停在 `pending`。尚未設定 `lilaiireland.com` production route。
