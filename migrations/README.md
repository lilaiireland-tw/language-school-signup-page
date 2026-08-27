# D1 migrations

這裡存放 Cloudflare D1 的版本化 SQL migration。

第一階段預計建立：

- `applications`: 報名與諮詢資料，唯一資料來源。
- `applications.reference_code`: 對外顯示與查詢用的流水編號（例如 `ST-000001`）；內部 UUID `id` 保留作為主鍵、外鍵與冪等識別。
- `integration_jobs`: Gmail、內部通知與 Notion 同步狀態。

正式資料庫建立後，所有 schema 變更都透過新 migration，不直接手動修改 production table。
