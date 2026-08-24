# Routes

- `POST /api/applications`: 驗證並建立報名資料。
- `GET /api/admin/applications`: WordPress 管理員報名清單。
- `GET /api/admin/applications/:id`: 報名詳細資料。
- `PATCH /api/admin/applications/:id`: 更新 CRM 狀態與內部備註。

Route handler 不直接寫複雜 SQL；資料存取放在 `repositories/`，流程放在 `services/`。

## 管理 API 驗證

三個 `/api/admin/*` endpoint 都需要：

```http
Authorization: Bearer <ADMIN_API_TOKEN>
```

Token 只存在 Cloudflare Secret 與 WordPress server-side，不存在瀏覽器或 Git。

## 清單參數

`GET /api/admin/applications` 支援 `status`、`serviceType`、`q`、`limit`、`offset`；`limit` 最大 100。

## 可更新欄位

`PATCH /api/admin/applications/:id` 只允許 `crmStatus`、`assignedTo`、`internalNotes`、`isicEligibilityStatus`、`isicNotes`。
