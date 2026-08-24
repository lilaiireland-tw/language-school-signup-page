# Cloudflare D1 與 DataGrip

## 重要限制

Cloudflare D1 是由 Worker binding、Cloudflare REST API 與 Wrangler 存取的 serverless database，沒有對外開放 SQLite 檔案、JDBC URL、TCP host 或 port。因此 DataGrip 不能直接連到 production D1。

## 方式 A：連接本地 D1（開發時建議）

1. 執行 `npm run db:migrate:local`。
2. 執行過 Wrangler local D1 後，在 `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/` 可找到 `.sqlite` 檔。
3. DataGrip 選擇 **New Data Source > SQLite**。
4. File 選擇該 `.sqlite` 檔案。
5. 建議以 DataGrip 查詢，schema 變更仍只寫在 `migrations/*.sql`。

`.wrangler/` 是可重建的本地狀態並已被 Git 忽略，不是 production backup。

## 方式 B：在 DataGrip 檢視 production snapshot

1. 建立本地備份目錄，且不將含個資的備份提交 Git。
2. 執行：

   ```powershell
   npx.cmd wrangler d1 export lilai-applications-production --remote --output backups/lilai-applications-production.sql
   ```

3. 將 SQL 匯入一個本地 SQLite database。
4. DataGrip 使用 SQLite data source 開啟本地 database。

這是某個時間點的 snapshot，不是 production 即時連線。

## 正式資料的建議管理方式

- 日常視覺化與狀態管理：WordPress 管理外掛呼叫 `/api/admin/applications` API。
- 臨時 SQL 管理：Cloudflare Dashboard D1 Console 或 `wrangler d1 execute --remote`。
- 備份與離線分析：匯出 SQL 後在 DataGrip 開啟本地 SQLite。

不建議為 DataGrip 建立一個可執行任意 SQL 的公開 Worker proxy，因為會擴大個資外洩與破壞資料的風險。
