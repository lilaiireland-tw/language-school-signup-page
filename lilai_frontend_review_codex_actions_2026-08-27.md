# Lilai Ireland 前端主頁檢查與 Codex 修改指示

更新日期：2026-08-27  
適用檔案：目前主前端 `page.tsx`  
目標：在正式把 `/language-school-signup/` 接到 Cloudflare Worker production route 前，修正商業邏輯、資料一致性、SEO、表單安全性、效能與可維護性問題。

---

# 0. 本次修改的既定決策

以下為使用者已確認的商業決策，Codex 不得自行改變：

1. **ISIC checkbox 維持必填。**
   - 不論學生是否主動想申請，只要走「直接報名」流程，哩來都會把 ISIC 作為贈禮／後續申請安排的一部分。
   - 因此不要把 ISIC checkbox 改為 optional。
   - 但文案必須避免宣稱「學生已符合 ISIC 官方資格」，應改成「符合哩來 ISIC 贈禮活動範圍／可進入後續申請流程」，最終核發仍以 ISIC 官方資格與文件審核為準。

2. **免費評估 URL 全站統一為：**

```text
https://lilaiireland.com/consult/
```

不得再使用：

```text
/free-departure-assessment
```

3. **Erin College 暫時從前端顯示與可選清單移除，但保留在程式碼資料中。**
   - 不刪除 Erin College 的資料。
   - 改成可透過狀態欄位控制前端是否顯示。
   - 未來要恢復時只改設定，不需重新手動加回整段資料。

---

# 1. 修改優先級

## P0：正式上 production route 前必須處理

- ISIC eligibility / wording 邏輯
- Direct Application 真正資格邏輯
- Leevin 條款來源與顯示方式
- Erin College 暫停前端顯示
- 表單送出前 payload sanitization
- 所有免費評估 URL 統一

## P1：強烈建議在 production 前完成

- 商業條款集中管理
- 語校資料單一來源
- TrackedLink 不再用 analytics event 名稱推導 business intent
- Privacy Policy 連結
- landingPageUrl 資料最小化
- 未 render 的重要 section 確認與補回

## P2：可以在第一版 production 後持續優化

- Server / Client Component 拆分
- Testimonials animation performance
- Accessibility
- 圖片 CLS / Next Image 策略
- component 拆分與 page.tsx 瘦身

---

# 2. ISIC 商業邏輯修正

## 現況問題

目前：

```ts
const isicEligible = form.serviceType === "direct_application";
```

這個變數同時被拿來表示：

1. 使用者屬於哩來的「直接報名 ISIC 贈禮活動」範圍。
2. 使用者似乎已經符合 ISIC 官方學生資格。

這兩件事不是同一件事。

## 必須修改

把：

```ts
isicEligible
```

拆成更精確的概念，例如：

```ts
const isicOfferIncluded =
  form.serviceType === "direct_application";
```

或：

```ts
const isicGiftProgramEligible =
  form.serviceType === "direct_application";
```

不要使用：

```ts
isicEligible
```

來表示官方資格。

## ISIC checkbox

**維持必填，不要改成 optional。**

Direct Application 第三步仍需要學生確認 ISIC 說明。

但 checkbox wording 建議改為：

```text
我了解選擇直接報名語校、且未使用一對一選校諮詢者，
哩來將 ISIC 國際學生證申請列為本次報名贈禮之一。

我了解最終是否符合 ISIC 申請資格及是否核發，
仍須依 ISIC 官方全日制學生資格、在學證明、身分文件、
照片及其他官方要求完成審核。
```

目的：

```text
強制讓學生知悉贈禮規則
≠
強迫學生聲明自己已符合 ISIC 官方資格
```

## SuccessState 文案

不要：

```text
你目前符合 ISIC 資格
```

建議：

```text
你的直接報名方案包含 ISIC 國際學生證申請贈禮

完成正式報名後，哩來會再提供 ISIC 所需文件說明。
最終核發仍須依 ISIC 官方資格與文件審核結果為準。
```

## DTO / Database

若目前 D1 field 名稱是：

```ts
isicInitiallyEligible
```

建議評估 migration / alias 為：

```ts
isicGiftIncluded
```

如果 production D1 已存在且不希望立即 migration：

```ts
// 保留 DB 舊欄位，避免破壞既有資料
isicInitiallyEligible: isicGiftProgramEligible
```

但 TypeScript domain layer 應改用清楚名稱，並留下註解說明 legacy field。

---

# 3. Direct Application 資格邏輯

## 現況問題

Direct Application 目前仍允許：

```text
preferredCity = 尚未確定
preferredSchool = 尚未確定
courseDuration = 尚未確定
```

但頁面主張：

```text
已經大致選好
直接開始報名
```

這會造成產品語意不一致。

## 建議邏輯

Direct Application 不一定要「所有資料完全確定」，但至少應符合：

```text
已決定愛爾蘭
+
至少知道城市或語校方向
+
有大約出發時間
+
不需要完整多校比較
```

### 建議建立：

```ts
function evaluateDirectApplicationReadiness(form) {
  ...
}
```

回傳：

```ts
type DirectApplicationReadiness = {
  ready: boolean;
  requiresConsultationReview: boolean;
  reasons: string[];
};
```

## 建議規則

例如：

```ts
const hasCityDirection =
  form.preferredCity &&
  form.preferredCity !== "尚未確定";

const hasSchoolDirection =
  form.preferredSchool &&
  form.preferredSchool !== "尚未確定";

const needsFullComparison =
  form.decisionStage === "我仍需要完整比較不同學校或城市";
```

Direct Application 可以允許：

```text
城市確定、學校尚未完全確定
```

但如果：

```text
城市 = 尚未確定
學校 = 尚未確定
而且 decisionStage = 仍需要完整比較
```

應明確導向 consultation。

## UX 建議

如果使用者第三步選：

```text
我仍需要完整比較不同學校或城市
```

目前只顯示 recommendation card，但仍能繼續提交 direct application。

推薦做法：

允許提交，但在 application record 標記：

```ts
requiresConsultationReview: true
```

後端／CRM 顯示：

```text
Direct application submitted
Needs consultation review
```

這樣不會硬擋客戶，但內部不會誤以為這是純 direct applicant。

---

# 4. Erin College 暫時前端隱藏，但保留程式資料

## 既定決策

Erin College：

```text
暫時不顯示在前端
暫時不可從報名表選取
但資料保留在 codebase
```

## 不要直接刪除

不要刪除：

```ts
{ name: "Erin College Dublin", ... }
{ name: "Erin College Cork", ... }
```

## 建議改資料模型

將語校資料加入狀態：

```ts
type SchoolStatus =
  | "active"
  | "review"
  | "paused";

type PartnerSchool = {
  name: string;
  city: string;
  logo: string;
  logoSize?: string;
  status: SchoolStatus;
  visible: boolean;
  directApplicationEligible: boolean;
  longTermEligible?: boolean;
  lastVerifiedAt?: string;
};
```

Erin：

```ts
{
  name: "Erin College Dublin",
  city: "Dublin",
  logo: "logo-erin-college.png",
  logoSize: "large",
  status: "review",
  visible: false,
  directApplicationEligible: false,
}
```

```ts
{
  name: "Erin College Cork",
  city: "Cork",
  logo: "logo-erin-college.png",
  logoSize: "large",
  status: "review",
  visible: false,
  directApplicationEligible: false,
}
```

## 前端顯示

PartnerSchoolSection：

```ts
const visiblePartnerSchools =
  partnerSchools.filter((school) => school.visible);
```

城市數量、卡片、tab counter 都只能計算：

```ts
visible === true
```

## 表單選項

Direct Application school options：

```ts
const getSchoolOptionsForCity = (city: string) => [
  ...partnerSchools
    .filter(
      (school) =>
        school.city === city &&
        school.visible &&
        school.directApplicationEligible
    )
    .map((school) => school.name),
  ...nonCitySchoolOptions,
];
```

這樣未來要重新顯示 Erin 只需要：

```ts
visible: true
directApplicationEligible: true
status: "active"
```

不要重新加 code。

---

# 5. 免費評估 URL 全站統一

## 唯一正確 URL

```text
https://lilaiireland.com/consult/
```

## 現況

目前已有：

```ts
const assessmentUrl = "https://lilaiireland.com/consult/";
```

但 `SeminarHighlightsSection` 仍出現：

```tsx
<TrackedLink
  href="/free-departure-assessment"
```

## 必須修改

全部改用：

```ts
assessmentUrl
```

例如：

```tsx
<TrackedLink
  href={assessmentUrl}
  event="seminar_free_assessment_click"
  className="text-link"
>
  免費出發評估
</TrackedLink>
```

## 搜尋 codebase

Codex 請執行全專案搜尋：

```text
/free-departure-assessment
free-departure-assessment
```

以及其他可能的舊 URL。

任何「免費出發評估 / 免費階段評估」全部指向：

```text
https://lilaiireland.com/consult/
```

---

# 6. Leevin 條款與商業規則

## 問題

目前 AccommodationSupportSection 將退款規則 hardcode：

```ts
const cancellationRows = [
  ["入住日前 21 天以上", "住宿費全額退還"],
  ["入住日前 14–21 天", "退還住宿費 50%"],
  ["入住日前 14 天以內", "住宿費不退"],
  ["No-show（未通知未到）", "住宿費不退"],
];
```

同時又有：

```text
Hostel 最低 1 週
Stay Student 最低 4 週
長住優惠
NT$1,500 安排服務費
```

這些都是高風險商業條款，不應散落在 UI component。

## 修改原則

**哩來與 Leevin 的正式合作／代理條款，才是合作方案的 source of truth。**

Codex 不要自行根據 Leevin retail website 猜退款規則。

## 建議建立

```text
lib/commercial-terms.ts
```

例如：

```ts
export const LEEVIN_TERMS = {
  serviceFeeTwd: 1500,
  serviceFeeOriginalTwd: 2000,
  serviceFeeRefundable: false,

  hostel: {
    minimumWeeks: 1,
    longStayDiscountFromWeeks: 4,
  },

  student: {
    minimumWeeks: 4,
    longStayDiscountFromWeeks: 8,
  },

  cancellationPolicy: [
    // source of truth: Lilai-Leevin partner agreement
  ],
};
```

## 頁面文字

如果合作方案條款與 Leevin 官網散客條款不同，需明確寫：

```text
以下為哩來愛爾蘭合作訂房方案之取消與退款規則，
與 Leevin 官網散客／其他通路方案可能不同。
實際仍以學生收到的正式住宿確認文件與報價條款為準。
```

## Codex 任務

不要自己修改退款比例。

若 repo 沒有正式合作條款 source，保留現值但加註：

```ts
// IMPORTANT:
// Source of truth must be Lilai-Leevin partner agreement.
// Do not update from public retail terms without business approval.
```

---

# 7. 商業條款不要在 JSX 重複 hardcode

## 現況

以下內容在很多地方重複：

```text
NT$6,000
NT$3,000
7 日
NT$800
NT$1,000
NT$1,500
NT$2,000
ISIC
訂金退還
```

例如：

- Hero
- DirectApplicationOffer
- ServicePathComparison
- ApplicationProcess
- agreementTexts
- SuccessState
- FAQ
- FinalCTA
- AccommodationSupportSection

未來只改一處很容易漏。

## 建議建立

```text
lib/commercial-terms.ts
```

例如：

```ts
export const DIRECT_APPLICATION_TERMS = {
  standardDepositTwd: 6000,
  promoDepositTwd: 3000,
  promoDeadlineDays: 7,
};

export const CONSULTATION_TERMS = {
  priceTwd: 800,
  originalPriceTwd: 1000,
};

export const ACCOMMODATION_TERMS = {
  arrangementFeeTwd: 1500,
  arrangementFeeOriginalTwd: 2000,
};
```

---

# 8. 付款通知文案統一

## 現況問題

SuccessState：

```text
收到付款通知
哩來會透過 Email 寄送 NT$6,000 訂金通知
```

下一步：

```text
7 日內完成付款
優惠為 NT$3,000
```

對學生容易產生：

```text
所以到底要付 6,000 還是 3,000？
```

## 建議全站統一

```text
通過資格確認後，我們會寄送訂金付款通知。

於付款通知所載優惠期限內完成付款，
應付訂金為 NT$3,000；

逾期未完成付款，
訂金將恢復為 NT$6,000，
且學校名額、價格與方案需重新確認。
```

不要寫：

```text
寄送 NT$6,000 訂金通知
```

---

# 9. Partner School 必須改成 Single Source of Truth

## 現況

目前同時有：

```ts
allSchoolOptions
partnerSchools
```

不同資料來源會造成：

```text
卡片有學校
但表單沒有

或

表單有學校
但卡片沒有
```

## 建議

統一：

```text
lib/schools.ts
```

唯一資料結構：

```ts
export type School = {
  id: string;
  name: string;
  city: "Dublin" | "Cork" | "Galway" | "Limerick";
  logo: string;
  logoSize?: string;

  status: "active" | "review" | "paused";
  visible: boolean;
  directApplicationEligible: boolean;

  courseTypes?: string[];
  longTermEligible?: boolean;
  lastVerifiedAt?: string;
};
```

PartnerSchoolSection 與 Form 都從這份資料 derive。

---

# 10. TrackedLink 不要用 Analytics Event 推導 Business Logic

## 現況

```ts
const intent =
  event.includes("consultation")
    ? "consultation"
    : "direct_application";
```

以及：

```ts
if (event.includes("accommodation"))
```

問題：

```text
analytics event name
竟然控制表單 business intent
```

未來只要 rename event 就可能靜默壞掉。

## 建議 API

```ts
type TrackedLinkProps = {
  href: string;
  event: string;
  intent?: "consultation" | "direct_application";
  accommodationIntent?: boolean;
  className?: string;
  children: ReactNode;
};
```

Analytics naming 與 business behavior 完全分離。

---

# 11. Form mode 切換後必須 sanitize payload

## 現況

`chooseServiceType()` 使用：

```ts
...current
```

會保留大量先前模式的資料。

例如：

```text
Direct
→ 填 preferredSchool
→ 切 Consultation
→ UI 不再顯示 preferredSchool
→ 舊值仍可能留在 form object
```

## 建議

建立：

```text
lib/application/sanitize.ts
```

```ts
function sanitizeApplicationPayload(
  form: DirectApplicationFormData
): DirectApplicationFormData
```

Submit 前只送目前 serviceType 真正需要的欄位。

---

# 12. Privacy Policy 必須是可點連結

## 現況

```text
我同意哩來愛爾蘭依隱私權政策處理本次報名所需資料。
```

但 checkbox 內沒有直接 link。

## 建議

改成：

```text
我已閱讀並同意《隱私權政策》，
並同意哩來愛爾蘭處理本次報名所需資料。
```

《隱私權政策》連到：

```text
https://lilaiireland.com/agreement/
```

---

# 13. Landing Page URL 資料最小化

## 現況

```ts
landingPageUrl: window.location.href
```

會保存完整 query string。

## 建議

只保留：

```ts
const safeLandingPageUrl =
  `${window.location.origin}${window.location.pathname}`;
```

UTM / Ads attribution 已經另外保存：

```text
utmSource
utmMedium
utmCampaign
utmContent
utmTerm
gclid
```

因此 landingPageUrl 不需要保存 arbitrary query string。

---

# 14. 未 render 的 Section 要確認

目前已存在：

```ts
AudienceQualificationSection()
ServiceBoundarySection()
```

但 `Home()` 沒有 render。

## 建議資訊架構

推薦：

```tsx
<HeroSection />
<AudienceQualificationSection />
<DirectApplicationOffer />
<PartnerSchoolSection />
<ServicePathComparison />
<ServiceBoundarySection />
<ApplicationProcess />
```

若沒有其他產品決策阻止，建議加回 Home。

---

# 15. Server / Client Component 拆分

## 現況

整個：

```tsx
page.tsx
```

最上方：

```tsx
"use client";
```

代表整頁都會進 client hydration。

## 建議

`page.tsx` 改回 Server Component。

只有真的互動的 component：

```text
MultiStepApplicationForm
PartnerSchoolTabs
TestimonialsCarousel
SeminarVideo
RevealController
MobileMenu
```

使用 `"use client"`。

---

# 16. Testimonials Carousel Performance

## 現況

`requestAnimationFrame()` 持續執行：

```ts
row.scrollLeft += delta * 0.03;
```

即使 TestimonialsSection 已經離開 viewport，
animation loop 仍然存在。

## 建議

增加 IntersectionObserver：

```text
只有 carousel 在 viewport 時才 auto-scroll
```

如果：

```text
document.hidden === true
```

也 pause。

建議再增加使用者可手動「暫停自動輪播」的 control。

---

# 17. Home Page Component 結構建議

目前 `page.tsx` 已經非常大。

建議拆：

```text
app/
└─ language-school-signup/
   └─ page.tsx

components/
└─ language-school-signup/
   ├─ LandingHeader.tsx
   ├─ HeroSection.tsx
   ├─ AudienceQualificationSection.tsx
   ├─ DirectApplicationOffer.tsx
   ├─ PartnerSchoolSection.tsx
   ├─ ServicePathComparison.tsx
   ├─ ServiceBoundarySection.tsx
   ├─ ApplicationProcess.tsx
   ├─ WhyLilaiSection.tsx
   ├─ AccommodationSupportSection.tsx
   ├─ GiftPackageSection.tsx
   ├─ SeminarHighlightsSection.tsx
   ├─ MultiStepApplicationForm.tsx
   ├─ BrandProofSection.tsx
   ├─ TestimonialsSection.tsx
   ├─ FAQAccordion.tsx
   ├─ FinalCTA.tsx
   └─ LandingFooter.tsx
```

資料：

```text
lib/
├─ schools.ts
├─ commercial-terms.ts
├─ brand-links.ts
├─ application/
│  ├─ validation.ts
│  ├─ sanitize.ts
│  └─ readiness.ts
└─ analytics/
```

---

# 18. Brand URL / Links 集中管理

建議集中：

```text
lib/brand-links.ts
```

例如：

```ts
export const BRAND_LINKS = {
  website: "https://lilaiireland.com",
  assessment: "https://lilaiireland.com/consult/",
  consultation: "#direct-application-form",
  privacy: "https://lilaiireland.com/agreement/",
  about: "https://lilaiireland.com/about/",
  instagram: "...",
  threads: "...",
  youtube: "...",
  googleReviews: "...",
};
```

---

# 19. 表單 Validation 補強

建議加入合理 maxLength：

```text
chineseName: 100
email: 254
phone: 40
lineId: 100
customSchool: 200
additionalNotes: 2000
```

Server-side validation 仍是 source of truth。

---

# 20. UTM / Analytics

目前：

```text
utm_source
utm_medium
utm_campaign
utm_content
utm_term
gclid
```

方向合理。

建議：

1. 不把這些顯示回學生。
2. Server side whitelist。
3. 限制 field length。
4. CRM 可以保存 attribution，但不要進 student confirmation email。

---

# 21. SEO / Production Route Gate

正式接：

```text
https://lilaiireland.com/language-school-signup/
```

之前必須比較 WordPress 原頁與 Worker：

```text
HTTP status
title
meta description
canonical
robots
H1
Open Graph
structured data
internal links
```

網址不能改。

---

# 22. 建議 Home Section 順序

推薦最終順序：

```text
1. Hero
2. 你適不適合直接報名
3. Direct Application 優惠
4. Partner Schools
5. Direct vs Consultation
6. Direct Application 服務邊界
7. Application Process
8. Why Lilai
9. Leevin Accommodation
10. Opening Support / Gift Package
11. Seminar Highlights
12. Application Form
13. Brand / Community Proof
14. Testimonials
15. FAQ
16. Final CTA
17. Footer
```

---

# 23. Codex 不應做的事情

不要：

```text
自行改 pricing
自行改 Leevin refund percentage
把 ISIC checkbox 改 optional
刪掉 Erin College code
改正式 SEO URL
把 assessment 改成其他 URL
修改 DNS
修改 Nameserver
直接綁 lilaiireland.com/*
npm audit fix --force
把 secrets 放 repo
```

---

# 24. Codex 修改後測試

至少：

```bash
npx tsc --noEmit
npm run lint
npm run build:vinext
```

以及現有 tests。

新增／更新 tests：

### School status

```text
Erin visible=false 不出現在 partner school cards
Erin 不出現在 direct application dropdown
Erin record 仍存在 school dataset
```

### URLs

```text
所有 free assessment CTA
→ https://lilaiireland.com/consult/
```

### Direct readiness

```text
fully ready direct applicant
partial direct applicant
needs full consultation
```

### ISIC

```text
direct application → ISIC agreement required
consultation → ISIC agreement not required
ISIC wording 不宣稱官方資格已通過
```

### Payload

```text
consultation 不帶 direct-only stale fields
direct application 不帶 consultation-only stale fields
landingPageUrl 不含 query string
```

### Commercial terms

```text
UI pricing 全部從 central constants derive
```

---

# 25. 完成條件

- [ ] ISIC checkbox 仍為 Direct Application 必填。
- [ ] ISIC 不再被程式稱為「官方資格已符合」。
- [ ] 免費評估 URL 全部統一為 `https://lilaiireland.com/consult/`。
- [ ] Erin College 前端完全不可見。
- [ ] Erin College 不可從 direct application 選取。
- [ ] Erin College 資料仍保存在 codebase。
- [ ] Direct Application readiness 有明確判斷。
- [ ] 需要完整比較者會標記為 consultation review。
- [ ] Leevin 商業條款集中管理。
- [ ] Pricing / deposit / fees 不再散落 hardcode。
- [ ] Partner schools 有 single source of truth。
- [ ] Analytics event 不再控制 business intent。
- [ ] Submit payload 依 serviceType sanitize。
- [ ] Privacy Policy checkbox 有可點連結。
- [ ] landingPageUrl 不保存任意 query params。
- [ ] `AudienceQualificationSection` / `ServiceBoundarySection` 已確認是否應 render。
- [ ] Testimonials 離開 viewport 時停止 animation。
- [ ] 無新 TypeScript error。
- [ ] 無新 lint error。
- [ ] Vinext production build 成功。
- [ ] workers.dev QA 通過後才考慮 production route。

---

# 26. 建議 Codex 執行順序

```text
1. 建 branch
   fix/frontend-business-logic-review

2. 建 central config
   schools.ts
   commercial-terms.ts
   brand-links.ts

3. Erin visibility/status refactor

4. Assessment URL cleanup

5. ISIC naming / wording refactor
   保留 mandatory checkbox

6. Direct readiness logic

7. sanitize payload

8. Privacy / landing URL minimization

9. 加回／確認 Qualification + Boundary sections

10. TrackedLink intent refactor

11. Testimonials performance

12. Server/Client component refactor
    （若本次修改風險過大，可獨立下一個 branch）

13. tests

14. tsc / lint / build

15. 更新 PROJECT-DEVELOPMENT-LOG.md

16. commit
```

建議 commit：

```text
fix: align direct application business logic
fix: centralize school visibility and assessment routes
refactor: centralize commercial terms and form sanitization
perf: pause testimonial carousel outside viewport
docs: update frontend production review status
```

---

# 27. 核心產品原則

這個頁面的主要 conversion 不是：

```text
讓所有人都直接付訂金
```

而是：

```text
讓已經準備好的學生快速進報名
+
讓還沒準備好的學生自然進入諮詢
+
讓所有條款、費用、服務範圍足夠清楚
```

任何修改都應優先維持：

```text
清楚
透明
降低學生決策阻力
降低售後爭議
不破壞 SEO
不破壞既有 D1 / Queue / Email / Notion 架構
```
