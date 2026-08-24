# D1 migrations

這裡存放 Cloudflare D1 的版本化 SQL migration。

第一階段預計建立：

- `applications`: 報名與諮詢資料，唯一資料來源。
- `integration_jobs`: Gmail、內部通知與 Notion 同步狀態。

正式資料庫建立後，所有 schema 變更都透過新 migration，不直接手動修改 production table。
