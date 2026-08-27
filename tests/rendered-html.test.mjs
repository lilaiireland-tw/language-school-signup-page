import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Lilai Ireland application page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = (await response.text()).replaceAll("<!-- -->", "");
  assert.match(html, /<title>愛爾蘭語校直接報名與選校協助｜哩來愛爾蘭<\/title>/i);
  assert.match(html, /提交直接報名需求/);
  assert.match(html, /已經選好學校，就直接進入報名流程/);
  assert.match(html, /直接報名限定加贈/);
  assert.match(html, /訂金付款前/);
  assert.match(html, /通過確認後才會收到付款通知/);
  assert.match(html, /直接從申請開始，將省略這些流程/);
  assert.match(html, /正式報名服務不會因此減少/);
  assert.match(html, /我需要預約一對一諮詢/);
  assert.match(html, /id="direct-application-form"/);
  assert.match(html, /不只是代辦語校，我們也幫你準備愛爾蘭開局大禮包/);
  assert.match(html, /5 日歐洲地區 eSIM/);
  assert.match(html, /28 日 Three Super Surfer（含愛爾蘭手機門號），價值 20 歐元/);
  assert.match(html, /使用該門號開始申請 IRP、銀行卡、PPSN 等相關文件/);
  assert.match(html, /Lite 正式上線 14 日體驗・Pro 一年份使用權限/);
  assert.match(html, /AI 英語練功系統/);
  assert.match(html, /加贈 ISIC 國際學生證（僅限 25\+8 學生）/);
  assert.match(html, /直接報名、不使用選校諮詢者加贈/);
  assert.match(html, /僅限報名 25\+8 長期課程的學生提出申請/);
  assert.match(html, /12 個月國際學生身分/);
  assert.match(html, /ISIC 全日制學生資格/);
  assert.match(html, /Mad Egg 20% 折扣/);
  assert.match(html, /FlixBus 單張票 9 折、兩張票 85 折/);
  assert.match(html, /Guinness Storehouse 標準票價減 €6\.50/);
  assert.match(html, /<details class="isic-benefit-examples"><summary>看看 ISIC 可以省在哪裡/);
  assert.match(html, /\/lilai-assets\/gift-support\/isic-card\.png/);
  assert.match(html, /id="accommodation-support"/);
  assert.match(html, /語校之外，也先幫你把落地住宿接好/);
  assert.match(html, /Leevin Stay Hostel/);
  assert.match(html, /Leevin Stay Student/);
  assert.match(html, /可使用廚房準備餐食/);
  assert.match(html, /報價已包含 Wi-Fi、帳單與每週清潔，不另收費/);
  assert.match(html, /href="https:\/\/leevinstay\.com\/leevin-hostel-dublin\/"[^>]*>查看 Stay Hostel 簡介與房型照片/);
  assert.match(html, /href="https:\/\/leevinstay\.com\/stay-student\/"[^>]*>查看 Stay Student 簡介與房型照片/);
  assert.match(html, /通常比語校代訂或住宿平台的公開方案更優惠/);
  assert.match(html, /NT\$1,500/);
  assert.match(html, /原價 (?:<!-- -->)?NT\$2,000/);
  assert.match(html, /最低預約週數：1 週/);
  assert.match(html, /入住 4 週以上享長住優惠/);
  assert.match(html, /最低預約週數：4 週/);
  assert.match(html, /入住 8 週以上享長住優惠/);
  assert.doesNotMatch(html, /DUBLIN[\s\S]*最短入住 4 週|CORK[\s\S]*最短入住 2 週/);
  assert.match(html, /入住日前 21 天以上/);
  assert.match(html, /入住日前 14–21 天/);
  assert.match(html, /原定入住日 24 小時前通知 Leevin/);
  assert.match(html, /住宿安排服務費不退/);
  assert.match(html, /報名語校並詢問住宿方案/);
  assert.match(html, /才會加贈 ISIC 國際學生證（僅限 25\+8 學生）/);
  assert.doesNotMatch(html, /比官網報價更優惠|Viva Ireland|Leevin Hostel|Leevin Student Accommodation|落地過渡與短期住宿|較穩定住宿期間|Wi-Fi、帳單與每週清潔依實際方案提供/);
  assert.equal((html.match(/2026 愛爾蘭出發前 30 件必做清單/g) ?? []).length, 2);
  assert.doesNotMatch(html, /抵達前後常見問題整理|Web App 測試資格|Lite 測試資格|預計 8 月開放 Web App 測試版|Leap Card|護照英文姓名/);
  assert.doesNotMatch(html, /\/lilai-assets\/gift-support\/handbooks-photo\.png/);
  assert.match(html, /\/lilai-assets\/gift-support\/job-guide\.png/);
  assert.match(html, /\/lilai-assets\/gift-support\/billion-connect-esim\.png/);
  assert.match(html, /\/lilai-assets\/gift-support\/three-super-surfer\.png/);
  assert.match(html, /\/lilai-assets\/gift-support\/relai-ai-system\.png/);
  assert.match(html, /href="#direct-application-form"[^>]*>直接報名語校/);
  assert.doesNotMatch(html, /已經決定要出發？我要報名語校/);
  assert.match(html, /花人生不到1%的時間，就能體驗到這些事！/);
  assert.match(html, /說明會精華片段/);
  assert.match(html, /aria-label="社群與聯絡方式"/);
  assert.match(html, /aria-label="Email：lilaiireland@gmail.com"/);
  assert.match(html, /1 分鐘看懂什麼是 25\+8！/);
  assert.match(html, /為什麼學長姐、學弟妹都超推！/);
  assert.match(html, /i\.ytimg\.com\/vi\/4OHtEJxV62U\/hqdefault\.jpg/);
  assert.match(html, /看說明會精華片段/);
  assert.doesNotMatch(html, /youtube-nocookie\.com\/embed\/4OHtEJxV62U/);
  assert.doesNotMatch(html, /顧問|免費諮詢/);
  assert.doesNotMatch(html, /Erin College/);
  assert.doesNotMatch(html, /free-departure-assessment/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/i);
});

test("keeps the form handoff contract explicit", async () => {
  const [types, api, data, schools, brandLinks, page, styles, revealController, referenceMigration, applicationService, gmail, internalEmail, notion, repository] = await Promise.all([
    readFile(new URL("../app/lib/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/api.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/schools.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/brand-links.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/components/reveal-controller.tsx", import.meta.url), "utf8"),
    readFile(new URL("../migrations/0002_add_application_reference_codes.sql", import.meta.url), "utf8"),
    readFile(new URL("../worker/services/application-service.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/gmail/send.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/email/templates/internal-notification.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/queue/notion.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/repositories/application-repository.ts", import.meta.url), "utf8"),
  ]);

  assert.match(types, /serviceType:\s*"direct_application"\s*\|\s*"consultation"/);
  assert.match(types, /consultationGoal:\s*string/);
  assert.match(types, /isicInitiallyEligible:\s*boolean/);
  assert.doesNotMatch(types, /englishName|leap/i);
  assert.match(api, /DIRECT_APPLICATION_NOTIFICATION_EMAIL\s*=\s*"lilaiireland@gmail.com"/);
  assert.match(api, /isicEligibilityStatus:\s*"pending"/);
  assert.match(api, /\^ST-\\d\{6,\}\$/);
  assert.match(api, /submissionId:\s*result\.submissionId/);
  assert.doesNotMatch(api, /leap/i);
  assert.match(referenceMigration, /reference_code TEXT/);
  assert.match(referenceMigration, /printf\('ST-%06d'/);
  assert.match(referenceMigration, /CREATE UNIQUE INDEX applications_reference_code_idx/);
  assert.match(referenceMigration, /CREATE TRIGGER applications_assign_reference_code/);
  assert.match(applicationService, /referenceCode:\s*application\.reference_code/);
  assert.match(gmail, /mapApplicationToStudentEmailData/);
  assert.match(internalEmail, /\["申請編號", application\.reference_code\]/);
  assert.doesNotMatch(internalEmail, /\["申請編號", application\.id\]/);
  assert.match(notion, /equals:\s*application\.reference_code/);
  assert.match(notion, /content:\s*application\.reference_code/);
  assert.match(repository, /reference_code LIKE/);
  assert.match(schools, /"ICOT College Cork"/);
  assert.match(schools, /"English Path"/);
  assert.match(schools, /"Academic Bridge"/);
  assert.match(schools, /"Delfin English School"/);
  assert.match(schools, /"Twin English Centre"/);
  assert.doesNotMatch(data, /isicEligible/);
  assert.doesNotMatch(data, /leap/i);
  assert.match(page, /consultationAgreementTexts/);
  assert.doesNotMatch(page, /boundary-no/);
  assert.doesNotMatch(page, /<h3><X \/> 直接報名不包含<\/h3>/);
  assert.match(page, /title:\s*"AI 英語練功系統"[\s\S]*?visible:\s*true/);
  assert.match(page, /AI 英語練功系統正式上線 14 日體驗資格[\s\S]*?visible:\s*false/);
  assert.match(page, /AI 英語練功系統，一年份使用權限[\s\S]*?visible:\s*false/);
  assert.match(page, /className="privacy-notice" role="note"/);
  assert.match(page, /className="privacy-policy-link" href=\{BRAND_LINKS\.privacy\} target="_blank" rel="noopener noreferrer"/);
  assert.match(brandLinks, /privacy:\s*"https:\/\/lilaiireland\.com\/agreement\/"/);
  assert.match(page, /不只把你送到學校，<br \/>而是陪你在愛爾蘭開始生活/);
  assert.match(styles, /\.brand-proof-grid\s*\{[^}]*grid-template-columns:\s*1\.15fr \.85fr/);
  assert.match(styles, /@media \(min-width:\s*1001px\)[\s\S]*?\.brand-proof-copy h2\s*\{\s*white-space:\s*nowrap;/);
  assert.match(styles, /\.accommodation-heading-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1\.55fr\) minmax\(280px, \.45fr\)/);
  assert.match(styles, /@media \(min-width:\s*1001px\)[\s\S]*?\.accommodation-heading-grid \.section-heading h2\s*\{[^}]*white-space:\s*nowrap/);
  assert.match(styles, /\.gift-support-section \.section-heading\s*\{\s*max-width:\s*1080px/);
  assert.match(styles, /@media \(min-width:\s*1001px\)[\s\S]*?\.gift-support-section \.section-heading h2\s*\{[^}]*white-space:\s*nowrap/);
  assert.match(page, /src="\/lilai-assets\/leevin\/faci06-1024x683\.jpg"/);
  assert.match(page, /src="\/lilai-assets\/leevin\/Layer-2\.png"/);
  assert.doesNotMatch(page, /leevinstay\.com\/wp-content\/uploads/);
  assert.match(page, /聯絡資訊僅供哩來愛爾蘭就本次報名或諮詢與您聯繫使用/);
  assert.match(page, /依個人資料保護法妥善處理/);
  assert.match(page, /getSchoolOptionsForCity/);
  assert.match(schools, /item\.city === city && item\.visible && item\.directApplicationEligible/);
  assert.match(page, /const schoolOptions = getSchoolOptionsForCity\(form\.preferredCity\)/);
  assert.match(page, /preferredSchool: "", customSchool: ""/);
  assert.match(page, /請選擇此城市的語校/);
  assert.match(styles, /\.section-heading\s*\{[^}]*max-width:\s*900px/);
  assert.match(styles, /\.section-heading h2, \.form-intro h2\s*\{[^}]*text-wrap:\s*balance/);
  assert.match(styles, /\.section-heading p, \.form-intro p\s*\{[^}]*max-width:\s*720px/);
  assert.match(page, /<RevealController \/>/);
  assert.match(page, /const scrollTestimonials = \(direction: -1 \| 1\)/);
  assert.match(page, /aria-label="查看上一則評論"/);
  assert.match(page, /aria-label="查看下一則評論"/);
  assert.match(page, /aria-controls="testimonial-carousel"/);
  assert.match(page, /pauseUntilRef\.current = performance\.now\(\)/);
  assert.match(page, /const currentCard = Math\.round\(currentPosition \/ distance\)/);
  assert.match(page, /row\.scrollTo\(\{ left: \(currentCard \+ direction\) \* distance/);
  assert.match(page, /currentPosition \+= resetPoint/);
  assert.match(styles, /\.testimonial-controls button/);
  assert.match(revealController, /IntersectionObserver/);
  assert.match(revealController, /threshold:\s*0\.12/);
  assert.match(revealController, /rootMargin:\s*"0px 0px -12% 0px"/);
  assert.match(revealController, /observer\.unobserve\(entry\.target\)/);
  assert.match(revealController, /prefers-reduced-motion:\s*reduce/);
  assert.match(styles, /data-reveal="up"/);
  assert.match(styles, /data-reveal="stagger"/);
  assert.doesNotMatch(revealController, /mask:\s*\["\.accommodation-photo", "\.community-photo"\]/);
  assert.doesNotMatch(styles, /data-reveal="mask"/);
  assert.match(styles, /\.accommodation-photo\s*\{[^}]*clip-path:\s*none !important;[^}]*opacity:\s*1;/);
  assert.match(styles, /\.community-photo\s*\{[^}]*clip-path:\s*none !important;[^}]*opacity:\s*1;/);
  assert.match(styles, /\.community-photo-main\s*\{[^}]*aspect-ratio:\s*3 \/ 2;/);
  assert.match(styles, /\.community-photo-side\s*\{[^}]*aspect-ratio:\s*4 \/ 3;/);
  assert.match(styles, /\.community-collage\s*\{[^}]*display:\s*grid;[^}]*gap:\s*20px/);
  assert.match(styles, /\.community-photo\s*\{[^}]*position:\s*relative;/);
  assert.match(styles, /\.community-photo:hover img\s*\{\s*transform:\s*scale\(1\.045\);/);
  assert.match(styles, /\.community-photo figcaption\s*\{[^}]*z-index:\s*2;/);
  assert.match(styles, /data-reveal="timeline"/);
  assert.match(styles, /@keyframes reveal-line/);
  assert.doesNotMatch(revealController, /application-form|faq-list|final-actions|hero-actions|site-header/);
  assert.match(page, /lilai-form-intent/);
  assert.match(page, /lilai-accommodation-intent/);
  assert.match(page, /partnerAccommodationInterest:\s*"兩者都想了解"/);
  assert.match(page, /4OHtEJxV62U\?autoplay=1&amp;rel=0&amp;playsinline=1|4OHtEJxV62U\?autoplay=1&rel=0&playsinline=1/);
  assert.match(page, /citySchools\.slice\(0, 8\)/);
  assert.match(page, /查看更多語校/);
  assert.match(page, /收合語校/);
  const isiPosition = schools.indexOf('"ISI Dublin"');
  const babelPosition = schools.indexOf('"Babel Academy of English"');
  const atlasPosition = schools.indexOf('"Atlas Language School"');
  const emeraldPosition = schools.indexOf('"Emerald Cultural Institute"');
  const cesPosition = schools.indexOf('"Centre of English Studies"');
  const erinDublinPosition = schools.indexOf('"Erin College Dublin"');
  const englishPathPosition = schools.indexOf('"English Path"');
  const academicBridgePosition = schools.indexOf('"Academic Bridge"');
  const delfinPosition = schools.indexOf('"Delfin English School"');
  const twinPosition = schools.indexOf('"Twin English Centre"');
  assert.ok(isiPosition < babelPosition && babelPosition < atlasPosition);
  assert.ok(emeraldPosition < cesPosition && cesPosition < erinDublinPosition);
  assert.ok(englishPathPosition > schools.indexOf('"EC English"'));
  assert.ok(englishPathPosition < academicBridgePosition && academicBridgePosition < delfinPosition);
  assert.ok(delfinPosition < twinPosition);
  assert.match(schools, /logo-english-path\.png/);
  assert.match(schools, /logo-academic-bridge\.png/);
  assert.match(schools, /logo-delfin-english-school\.png/);
  assert.match(schools, /logo-twin-english-centre\.png/);
  assert.doesNotMatch(page, /查看更多 Dublin 語校|另有 \$\{citySchools\.length - 8\} 間/);
  assert.doesNotMatch(page, /查看全部合作語校/);
  assert.doesNotMatch(page, /englishName|Leap Card|leapCard|leap_/i);
});
