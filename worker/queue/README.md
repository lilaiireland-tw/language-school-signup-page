# Queue integration consumer

`consumer.ts` 以 `applicationId` 作為 Queue payload，從 D1 讀取三種工作：

- `student_email`：以 `lilaiireland@gmail.com` 的 OAuth 2.0 offline refresh token 取得短效 access token，再呼叫 Gmail API；不使用 Google Workspace 或 domain-wide delegation。
- `internal_email`：寄送內部通知信。
- `notion_sync`：以 Submission ID 查重後建立 Notion CRM page。

處理採 at-least-once 與 D1 claim，成功寫入 provider/page ID；暫時錯誤以 exponential backoff 重試，永久錯誤或第五次失敗進 `dead_letter`。Cron 每十分鐘補掃描漏送或到期工作，並回收超過十五分鐘的 stale `processing` lease。
