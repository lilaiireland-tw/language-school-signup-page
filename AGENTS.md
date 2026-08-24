# Codex 專案工作規則

每次開始任何工作前，必須先完整閱讀根目錄的 `PROJECT-DEVELOPMENT-LOG.md`，以它作為本專案唯一的進度、交接、風險、架構決策與待辦來源。

每次完成開發、修正、測試、部署、設定變更或重要技術決策後，必須在同一工作中更新 `PROJECT-DEVELOPMENT-LOG.md`：

- 更新最後修改日期與最新狀態。
- 記錄完成內容、驗證結果、未解風險與下一步。
- deployment 必須記錄環境、URL、Worker 名稱、Version ID 與 rollback baseline。
- 維護既有章節，避免建立新的日期版交接文件或內容互相矛盾的副本。
- 不得把任何 secret、token、密碼或正式憑證寫入日誌或 Git。

執行工作前先跑 `git status`，保留並尊重使用者尚未提交的修改。除非使用者明確授權，不得更動 DNS、Nameserver、WordPress production、Cloudflare production route 或整站 routing。
