# Queue integration consumer

`consumer.ts` 以 `applicationId` 作為 Queue payload，從 D1 讀取三種工作：

- `student_email`：透過 Google Workspace service account + domain-wide delegation 呼叫 Gmail API。
- `internal_email`：寄送內部通知信。
- `notion_sync`：以 Submission ID 查重後建立 Notion CRM page。

處理採 at-least-once 與 D1 claim，成功寫入 provider/page ID；暫時錯誤以 exponential backoff 重試，永久錯誤或第五次失敗進 `dead_letter`。Cron 每十分鐘補掃描漏送或到期工作，並回收超過十五分鐘的 stale `processing` lease。
