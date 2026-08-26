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

  const html = await response.text();
  assert.match(html, /<title>愛爾蘭語校直接報名與選校協助｜哩來愛爾蘭<\/title>/i);
  assert.match(html, /提交直接報名需求/);
  assert.match(html, /我需要預約一對一諮詢/);
  assert.match(html, /id="direct-application-form"/);
  assert.match(html, /不只是代辦語校，我們也幫你準備愛爾蘭開局大禮包/);
  assert.match(html, /5 日歐洲地區 eSIM/);
  assert.match(html, /28 日 Three Super Surfer（含愛爾蘭手機門號），價值 20 歐元/);
  assert.match(html, /使用該門號開始申請 IRP、銀行卡、PPSN 等相關文件/);
  assert.match(html, /Lite 正式上線 14 日體驗・Pro 一年份使用權限/);
  assert.match(html, /AI 英語練功系統正式上線 14 日體驗資格/);
  assert.match(html, /AI 英語練功系統，一年份使用權限/);
  assert.match(html, /加贈 ISIC 國際學生證/);
  assert.match(html, /直接報名、不使用選校諮詢者加贈/);
  assert.match(html, /報名 25\+8 長期課程的學生基本上均適用提出申請/);
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
  assert.match(html, /原價 NT\$2,000/);
  assert.match(html, /最低預約週數：1 週/);
  assert.match(html, /入住 4 週以上享長住優惠/);
  assert.match(html, /最低預約週數：4 週/);
  assert.match(html, /入住 8 週以上享長住優惠/);
  assert.doesNotMatch(html, /DUBLIN[\s\S]*最短入住 4 週|CORK[\s\S]*最短入住 2 週/);
  assert.match(html, /入住日前 21 天以上/);
  assert.match(html, /入住日前 14–21 天/);
  assert.match(html, /原定入住日 24 小時前通知 Leevin/);
  assert.match(html, /住宿安排服務費在任何情況下皆不退/);
  assert.match(html, /報名語校並詢問住宿方案/);
  assert.match(html, /不使用一對一選校諮詢者才會加贈 ISIC 國際學生證/);
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
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/i);
});

test("keeps the form handoff contract explicit", async () => {
  const [types, api, data, page, styles, revealController] = await Promise.all([
    readFile(new URL("../app/lib/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/api.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/components/reveal-controller.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(types, /serviceType:\s*"direct_application"\s*\|\s*"consultation"/);
  assert.match(types, /consultationGoal:\s*string/);
  assert.match(types, /isicInitiallyEligible:\s*boolean/);
  assert.doesNotMatch(types, /englishName|leap/i);
  assert.match(api, /DIRECT_APPLICATION_NOTIFICATION_EMAIL\s*=\s*"lilaiireland@gmail.com"/);
  assert.match(api, /isicEligibilityStatus:\s*"pending"/);
  assert.doesNotMatch(api, /leap/i);
  assert.match(data, /"ICOT College Cork"/);
  assert.match(data, /"English Path"/);
  assert.match(data, /"Academic Bridge"/);
  assert.match(data, /"Delfin English School"/);
  assert.match(data, /"Twin English Centre"/);
  assert.doesNotMatch(data, /isicEligible/);
  assert.doesNotMatch(data, /leap/i);
  assert.match(page, /consultationAgreementTexts/);
  assert.match(page, /className="privacy-notice" role="note"/);
  assert.match(page, /聯絡資訊僅供哩來愛爾蘭就本次報名或諮詢與您聯繫使用/);
  assert.match(page, /依個人資料保護法妥善處理/);
  assert.match(page, /getSchoolOptionsForCity/);
  assert.match(page, /partnerSchools\.filter\(\(school\) => school\.city === city\)/);
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
  assert.match(styles, /data-reveal="mask"/);
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
  const isiPosition = page.indexOf('{ name: "ISI Dublin"');
  const babelPosition = page.indexOf('{ name: "Babel Academy of English"');
  const atlasPosition = page.indexOf('{ name: "Atlas Language School"');
  const emeraldPosition = page.indexOf('{ name: "Emerald Cultural Institute"');
  const cesPosition = page.indexOf('{ name: "Centre of English Studies"');
  const erinDublinPosition = page.indexOf('{ name: "Erin College Dublin"');
  const englishPathPosition = page.indexOf('{ name: "English Path"');
  const academicBridgePosition = page.indexOf('{ name: "Academic Bridge"');
  const delfinPosition = page.indexOf('{ name: "Delfin English School"');
  const twinPosition = page.indexOf('{ name: "Twin English Centre"');
  assert.ok(isiPosition < babelPosition && babelPosition < atlasPosition);
  assert.ok(emeraldPosition < cesPosition && cesPosition < erinDublinPosition);
  assert.ok(englishPathPosition > page.indexOf('{ name: "EC English"'));
  assert.ok(englishPathPosition < academicBridgePosition && academicBridgePosition < delfinPosition);
  assert.ok(delfinPosition < twinPosition);
  assert.match(page, /logo-english-path\.png/);
  assert.match(page, /logo-academic-bridge\.png/);
  assert.match(page, /logo-delfin-english-school\.png/);
  assert.match(page, /logo-twin-english-centre\.png/);
  assert.doesNotMatch(page, /查看更多 Dublin 語校|另有 \$\{citySchools\.length - 8\} 間/);
  assert.doesNotMatch(page, /查看全部合作語校/);
  assert.doesNotMatch(page, /englishName|Leap Card|leapCard|leap_/i);
});
