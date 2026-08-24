"use client";

import {
  ArrowRight,
  AtSign,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Coffee,
  FileCheck2,
  Gift,
  Globe2,
  HeartHandshake,
  Info,
  Landmark,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Play,
  PlaySquare,
  Route,
  ShieldCheck,
  Sparkles,
  RadioTower,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { submitDirectApplication } from "./lib/api";
import { trackEvent } from "./lib/analytics";
import { courseOptions, schoolOptions, testimonials } from "./lib/data";
import type { DirectApplicationFormData } from "./lib/types";

const consultationUrl = "#direct-application-form";
const assessmentUrl = "https://lilaiireland.com/consult/";
const websiteUrl = "https://lilaiireland.com";
const googleReviewUrl = "https://g.page/r/CWJ8OfbyjJMKEBE/review";

const initialForm: DirectApplicationFormData = {
  serviceType: "direct_application",
  chineseName: "",
  email: "",
  phone: "",
  lineId: "",
  currentLocation: "",
  preferredCity: "",
  preferredSchool: "",
  customSchool: "",
  courseType: "",
  expectedStartMonth: "",
  courseDuration: "",
  classSchedule: "",
  accommodationNeeded: "",
  partnerAccommodationInterest: "",
  quoteStatus: "",
  decisionStage: "",
  consultationGoal: "",
  budgetRange: "",
  additionalNotes: "",
  discoverySource: "",
  agreements: {},
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmContent: "",
  utmTerm: "",
  gclid: "",
  landingPageUrl: "",
  isicInitiallyEligible: false,
};

const cn = (...values: Array<string | false | undefined>) => values.filter(Boolean).join(" ");

function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <a href="#top" className="logo" aria-label="哩來愛爾蘭首頁區塊">
      <img className={cn("logo-image", inverse && "logo-image-inverse")} src="/lilai-assets/lilai-logo.png" alt="" />
      <span>
        <strong className={inverse ? "text-white" : "text-primary-dark"}>哩來愛爾蘭</strong>
        <small className={inverse ? "text-white/65" : "text-muted"}>Lilai Ireland</small>
      </span>
    </a>
  );
}

function TrackedLink({ href, event, className, children }: { href: string; event: string; className?: string; children: ReactNode }) {
  return <a href={href} className={className} onClick={() => {
    trackEvent(event, { destination: href }, `${event}:${href}`);
    if (href === "#direct-application-form") {
      const intent = event.includes("consultation") ? "consultation" : "direct_application";
      window.dispatchEvent(new CustomEvent("lilai-form-intent", { detail: { intent } }));
      if (event.includes("accommodation")) {
        window.dispatchEvent(new CustomEvent("lilai-accommodation-intent"));
      }
    }
  }}>{children}</a>;
}

export function LandingHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="頁首行動選單">
          <TrackedLink href={assessmentUrl} event="free_assessment_click" className="nav-link">免費階段評估</TrackedLink>
          <TrackedLink href={consultationUrl} event="consultation_redirect_click" className="nav-link">我需要選校諮詢</TrackedLink>
          <TrackedLink href="#direct-application-form" event="direct_application_start" className="button button-primary button-small">直接開始報名</TrackedLink>
        </nav>
        <div className="mobile-nav">
          <TrackedLink href="#direct-application-form" event="direct_application_start" className="button button-primary button-compact">直接報名</TrackedLink>
          <details className="menu-details">
            <summary aria-label="開啟其他選項"><Menu size={22} /></summary>
            <div className="menu-panel">
              <TrackedLink href={assessmentUrl} event="free_assessment_click">免費階段評估</TrackedLink>
              <TrackedLink href={consultationUrl} event="consultation_redirect_click">我需要選校諮詢</TrackedLink>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export function TrustBadge({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return <div className="trust-badge"><Icon size={18} aria-hidden="true" /><span>{children}</span></div>;
}

export function HeroSection() {
  return (
    <section className="hero section" id="top">
      <div className="shell hero-grid">
        <div>
          <span className="eyebrow"><Sparkles size={16} /> 已經有出發計畫？不用先排諮詢</span>
          <h1><span className="hero-title-line">已經大致選好愛爾蘭語校？</span><span className="hero-title-line hero-title-accent">直接開始報名更快</span></h1>
          <p className="hero-copy">如果你已經確認想前往愛爾蘭，也大致知道學校、城市或課程方向，可以直接提交報名需求。哩來確認條件與方案後，將協助你完成報價、申請、付款、文件與行前準備。</p>
          <div className="hero-actions">
            <div>
              <TrackedLink href="#direct-application-form" event="hero_direct_application_click" className="button button-primary button-large">直接提交報名需求 <ArrowRight size={19} /></TrackedLink>
              <small>現在不需付款，先確認報名資格與學校。</small>
            </div>
            <div>
              <TrackedLink href={consultationUrl} event="hero_consultation_click" className="button button-secondary button-large">我還需要協助選校</TrackedLink>
              <small>該費用會於開課後連同訂金完整退還。</small>
            </div>
          </div>
          <TrackedLink href={assessmentUrl} event="free_assessment_click" className="text-link">還不確定愛爾蘭是否適合你？先做免費階段評估 <ArrowRight size={16} /></TrackedLink>
          <div className="trust-row">
            <TrustBadge icon={MapPin}>愛爾蘭在地學長姐</TrustBadge>
            <TrustBadge icon={FileCheck2}>語校報價與申請協助</TrustBadge>
            <TrustBadge icon={HeartHandshake}>行前與抵達支援</TrustBadge>
            <TrustBadge icon={ShieldCheck}>訂金開課後依約退還</TrustBadge>
          </div>
        </div>
        <div className="hero-visual" aria-label="哩來愛爾蘭在地學長姐 Alex 與 Arsha">
          <div className="route-lines" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="georgian-door" aria-hidden="true"><div className="door-fan"><span /><span /><span /><span /><span /></div><div className="door-panel"><i /><i /><b /></div></div>
          <img className="mentor-cutout" src="/lilai-assets/alex-arsha-cutout.png" alt="哩來愛爾蘭在地學長姐 Alex 與 Arsha" />
          <div className="mentor-caption"><span>IRELAND, ON THE GROUND</span><strong>Alex &amp; Arsha</strong><small>在愛爾蘭生活的學長姐</small></div>
          <div className="visual-pin"><MapPin size={18} /> DUBLIN</div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, subtitle, align = "center" }: { eyebrow?: string; title: string; subtitle?: string; align?: "center" | "left" }) {
  return <div className={cn("section-heading", align === "left" && "section-heading-left")}>
    {eyebrow && <span className="eyebrow">{eyebrow}</span>}
    <h2>{title}</h2>{subtitle && <p>{subtitle}</p>}
  </div>;
}

export function DirectApplicationOffer() {
  return (
    <section className="section section-soft">
      <div className="shell">
        <SectionHeading eyebrow="直接報名限定" title="已經準備好了，直接報名更划算" subtitle="通過直接報名資格確認後，在付款通知指定期限內完成訂金，即可享有直接報名限定權益。" />
        <div className="offer-grid">
          <article className="offer-card offer-card-featured">
            <span className="card-label">7 日報名優惠</span>
            <p className="old-price">訂金原價 <s>NT$6,000</s></p>
            <h3>7 日內完成付款<br /><strong>NT$3,000</strong></h3>
            <p>通過資格確認並收到付款通知後，於信件所載期限內完成付款，即享訂金半價。</p>
            <div className="note-box"><Info size={18} /><span>訂金將於學生正式抵達愛爾蘭並開始就讀已報名課程後，依報名條款退還。</span></div>
          </article>
          <article className="offer-card"><span className="card-label">直接報名、不使用選校諮詢者加贈</span><BadgeCheck className="card-icon" /><h3>加贈 ISIC 國際學生證</h3><p>報名 25+8 長期課程的學生基本上均適用提出申請；通過 ISIC 全日制學生資格與文件審核後，可取得 12 個月國際學生身分、使用數位學生證並查看全球學生優惠。</p><a className="text-link offer-terms-link" href="#opening-support">查看開局支援內容</a></article>
          <article className="offer-card"><span className="card-label">愛爾蘭開局支援系統</span><Gift className="card-icon" /><h3>開局大禮包 Lite／Pro</h3><p>不只協助送出語校申請，也把行前、落地、網路、求職與英文練習資源準備好。</p><a className="text-link offer-terms-link" href="#opening-support">查看 Lite／Pro 支援內容</a></article>
        </div>
        <div className="center-cta"><TrackedLink href="#direct-application-form" event="direct_application_start" className="button button-primary button-large">取得直接報名資格 <ArrowRight size={19} /></TrackedLink><p>提交表單後，通過確認才會收到付款通知，現在不需付款。</p><small>七日優惠期限以付款通知中所載截止日期為準。課程、贈禮與資格依正式活動與報名條款為準。</small></div>
      </div>
    </section>
  );
}

function GiftPackageList({ items }: { items: string[] }) { return <ul className="gift-content-list">{items.map(item => <li key={item}><Check size={17} />{item}</li>)}</ul>; }

function SupportCardMedia({ type }: { type: "handbooks" | "job" | "network" | "ai" | "isic" }) {
  if (type === "handbooks") return <div className="support-card-media support-card-media-handbooks"><img className="handbook-page handbook-page-pre" src="/lilai-assets/gift-support/pre-departure-handbook-page.png" alt="愛爾蘭行前手冊預覽" loading="lazy" /><img className="handbook-page handbook-page-arrival" src="/lilai-assets/gift-support/arrival-handbook-page.png" alt="愛爾蘭開局手冊預覽" loading="lazy" /></div>;
  if (type === "job") return <div className="support-card-media support-card-media-wide"><img src="/lilai-assets/gift-support/job-guide.png" alt="服務業求職攻略手冊封面" loading="lazy" /></div>;
  if (type === "network") return <div className="support-card-media support-card-media-network"><figure><span>4 週以上短期課程</span><img src="/lilai-assets/gift-support/billion-connect-esim.png" alt="Billion Connect 歐洲地區 eSIM" loading="lazy" /></figure><figure><span>25+8 長期課程</span><img src="/lilai-assets/gift-support/three-super-surfer.png" alt="28 日 Three Super Surfer 方案" loading="lazy" /></figure></div>;
  if (type === "isic") return <div className="support-card-media support-card-media-isic"><img src="/lilai-assets/gift-support/isic-card.png" alt="ISIC 國際學生證示意圖" loading="lazy" /></div>;
  return <div className="support-card-media support-card-media-wide support-card-media-ai"><img src="/lilai-assets/gift-support/relai-ai-system.png" alt="ReLai AI 英語練功系統介面預覽" loading="lazy" /></div>;
}

export function AudienceQualificationCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return <article className="qualification-card"><span className="icon-circle"><Icon size={23} /></span><h3>{title}</h3><p>{children}</p></article>;
}

export function AudienceQualificationSection() {
  return <section className="section"><div className="shell"><SectionHeading title="你不一定需要先花時間諮詢" subtitle="如果以下多數描述符合你，就可以直接進入報名流程。" /><div className="four-grid"><AudienceQualificationCard icon={MapPin} title="已經決定前往愛爾蘭">你不是還在比較不同國家，而是已經有明確的愛爾蘭出發計畫。</AudienceQualificationCard><AudienceQualificationCard icon={Landmark} title="已大致選好城市或學校">你已經知道想去 Dublin、Cork，或已有心儀的語言學校。</AudienceQualificationCard><AudienceQualificationCard icon={BriefcaseBusiness} title="已有大約的時間與預算">不需要每個細節都確定，但已有可執行的出發時間與資金規劃。</AudienceQualificationCard><AudienceQualificationCard icon={BookOpenCheck} title="不需要完整選校分析">你只需要確認課程、報價、名額及報名細節，不需要重新比較多間學校。</AudienceQualificationCard></div><div className="info-banner"><Info size={22} /><p><strong>還有少量問題並不影響直接報名。</strong>完成訂金後，哩來仍會協助處理申請、付款、文件與出發流程中的必要問題。</p></div></div></section>;
}

const partnerSchools = [
  { name: "ISI Dublin", city: "Dublin", logo: "logo-isi-learning.png" },
  { name: "Babel Academy of English", city: "Dublin", logo: "logo-babel-academy.png" },
  { name: "Atlas Language School", city: "Dublin", logo: "logo-atlas-language-school.png", logoSize: "large" },
  { name: "NED College", city: "Dublin", logo: "logo-ned-college.png" },
  { name: "NED College Limerick", city: "Limerick", logo: "logo-ned-college.png" },
  { name: "ICOT College", city: "Dublin", logo: "logo-icot-college.png" },
  { name: "ICOT College Cork", city: "Cork", logo: "logo-icot-college.png" },
  { name: "ELI Schools", city: "Dublin", logo: "logo-eli-schools.png" },
  { name: "Emerald Cultural Institute", city: "Dublin", logo: "logo-emerald-cultural-institute.png", logoSize: "large" },
  { name: "Centre of English Studies", city: "Dublin", logo: "logo-centre-of-english-studies.png" },
  { name: "Erin College Dublin", city: "Dublin", logo: "logo-erin-college.png", logoSize: "large" },
  { name: "Liffey College", city: "Dublin", logo: "logo-liffey-college.png" },
  { name: "Apollo Language Centre", city: "Dublin", logo: "logo-apollo-language-centre.png" },
  { name: "SEDA College", city: "Dublin", logo: "logo-seda-college.png" },
  { name: "Everest English", city: "Dublin", logo: "logo-everest-english.png" },
  { name: "Active Language Learning", city: "Dublin", logo: "logo-active-language-learning.png", logoSize: "active" },
  { name: "ATC Language Schools", city: "Dublin", logo: "logo-atc-language-schools.png", logoSize: "large" },
  { name: "EC English", city: "Dublin", logo: "logo-ec-english.png" },
  { name: "English Path", city: "Dublin", logo: "logo-english-path.png" },
  { name: "Academic Bridge", city: "Dublin", logo: "logo-academic-bridge.png" },
  { name: "Delfin English School", city: "Dublin", logo: "logo-delfin-english-school.png" },
  { name: "Twin English Centre", city: "Dublin", logo: "logo-twin-english-centre.png" },
  { name: "Erin College Cork", city: "Cork", logo: "logo-erin-college.png", logoSize: "large" },
  { name: "Cork English College", city: "Cork", logo: "logo-cork-english-college.png" },
  { name: "Bridge Mills Galway", city: "Galway", logo: "logo-bridge-mills-galway.png" },
  { name: "Limerick Language Centre", city: "Limerick", logo: "logo-limerick-language-centre.png" },
];

export function PartnerSchoolSection() {
  const cities = ["Dublin", "Cork", "Galway", "Limerick"];
  const [activeCity, setActiveCity] = useState("Dublin");
  const [showAllDublin, setShowAllDublin] = useState(false);
  const citySchools = partnerSchools.filter((school) => school.city === activeCity);
  const visibleSchools = activeCity === "Dublin" && !showAllDublin ? citySchools.slice(0, 8) : citySchools;

  return <section className="section partner-schools-section"><div className="shell"><SectionHeading eyebrow="PARTNER SCHOOLS" title="哩來合作語校" subtitle="以下語校皆可在報名表中直接指定；如果還沒決定，也可以先選擇「尚未確定」，由我們確認適合的下一步。" /><div className="school-city-tabs" role="tablist" aria-label="依城市查看合作語校">{cities.map((city) => <button type="button" role="tab" aria-selected={activeCity === city} aria-controls="partner-school-panel" className={cn("school-city-tab", activeCity === city && "is-active")} key={city} onClick={() => { setActiveCity(city); setShowAllDublin(false); }}>{city}<span>{partnerSchools.filter((school) => school.city === city).length}</span></button>)}</div><div className="partner-school-grid" id="partner-school-panel" role="tabpanel">{visibleSchools.map((school) => <article className="partner-school-card" key={`${school.name}-${school.city}`}><div className={cn("partner-school-logo", school.logoSize && `partner-school-logo-${school.logoSize}`)}>{school.logo ? <img src={`/lilai-assets/schools/${school.logo}`} alt={`${school.name} 校徽`} loading="lazy" /> : <strong className="partner-school-wordmark" aria-hidden="true">{school.name.split(" ").map((word) => word[0]).join("").slice(0, 4).toUpperCase()}</strong>}</div><div><h3>{school.name}</h3><span><MapPin size={13} />{school.city}</span></div></article>)}</div>{activeCity === "Dublin" && citySchools.length > 8 && <div className="partner-school-actions"><button type="button" className="button button-secondary" aria-expanded={showAllDublin} aria-controls="partner-school-panel" onClick={() => setShowAllDublin((current) => !current)}>{showAllDublin ? "收合語校" : "查看更多語校"}</button></div>}<p className="partner-school-note">合作課程、開課日、名額與最新報價，仍以哩來向校方確認後提供的資訊為準。</p></div></section>;
}

function BulletList({ items, muted = false }: { items: string[]; muted?: boolean }) {
  return <ul className={cn("check-list", muted && "muted-list")}>{items.map((item) => <li key={item}><Check size={17} aria-hidden="true" />{item}</li>)}</ul>;
}

export function ServicePathComparison() {
  return <section className="section section-tint" id="consultation"><div className="shell"><SectionHeading title="選擇符合你目前進度的方式" /><div className="path-grid">
    <article className="path-card path-primary"><span className="card-label">推薦給已做好前期研究的人</span><h3>直接報名語校</h3><p className="list-label">適合你，如果你：</p><BulletList items={["已決定前往愛爾蘭", "已大致確認城市或學校", "有預計出發時間", "不需要完整語校比較"]} /><div className="divider" /><p className="list-label">流程開始後包含：</p><BulletList items={["學校與課程可行性確認", "最新報價與名額確認", "語校申請與文件協助", "校方付款流程說明", "入學文件追蹤", "行前與抵達支援", "符合資格者享直接報名限定禮"]} /><TrackedLink href="#direct-application-form" event="direct_application_start" className="button button-primary button-block">提交直接報名需求 <ArrowRight size={18} /></TrackedLink><small>7 日內完成付款，訂金 NT$3,000；正式開課後依約退還。</small></article>
    <article className="path-card path-secondary"><span className="card-label card-label-muted">適合仍需要完整比較的人</span><h3>一對一語校諮詢</h3><p className="list-label">適合你，如果你：</p><BulletList items={["還在比較不同城市", "不知道應該選哪間學校", "希望進行完整預算與方案分析", "需要個人化選校與決策建議"]} muted /><div className="divider" /><p className="list-label">諮詢包含：</p><BulletList items={["一對一需求訪談", "城市與語校比較", "課程、時段與預算分析", "出發方案與下一步建議"]} muted /><p className="consult-price">NT$800<span>／次（原價NT$1,000／次）</span></p><TrackedLink href={consultationUrl} event="consultation_redirect_click" className="button button-secondary button-block">預約一對一語校諮詢</TrackedLink><small>該費用會於開課後連同訂金完整退還，等於沒花諮詢費！</small></article>
  </div></div></section>;
}

export function ServiceBoundarySection() {
  return <section className="section"><div className="shell narrow-shell"><SectionHeading title="直接報名前，我們會先確認哪些事情？" /><div className="boundary-grid"><article className="boundary-card boundary-yes"><h3><CheckCircle2 /> 訂金付款前，哩來會協助</h3><BulletList items={["確認是否符合直接報名條件", "確認學校與課程是否能夠申請", "確認預計出發時間與基本需求", "說明訂金、報價與後續流程", "簡短核對必要報名細節"]} /></article><article className="boundary-card boundary-no"><h3><X /> 直接報名不包含</h3><BulletList items={["多間語校完整比較", "不同城市的完整生活分析", "個人化預算規劃", "多輪方案修改", "完整線上一對一選校諮詢"]} muted /></article></div><div className="clarification"><ShieldCheck size={28} /><p><strong>完成訂金後，哩來將正式啟動報名服務，</strong>並協助處理課程確認、正式報價、申請文件、付款流程、校方聯繫與行前準備中的合理問題。</p></div><div className="center"><TrackedLink href={consultationUrl} event="consultation_redirect_click" className="button button-secondary">我需要完整選校協助</TrackedLink></div></div></section>;
}

const processSteps = [
  ["提交直接報名需求", "填寫大致的學校、課程、出發時間與聯絡資料。"],
  ["確認資格與方案", "哩來會確認你的條件、合作範圍、學校名額及報名可行性。"],
  ["簡短核對必要細節", "我們會透過 LINE 或 Email 確認學校、課程、日期與付款相關資訊。此階段不包含完整選校諮詢。"],
  ["7 日內完成訂金", "收到付款通知後，在指定期限內完成付款，訂金由 NT$6,000 優惠為 NT$3,000。"],
  ["正式啟動報名服務", "完成語校申請、校方付款、入學文件與行前準備。學生正式抵達並開課後，訂金依約退還。"],
];

export function ApplicationProcess() {
  return <section className="section section-dark"><div className="shell"><SectionHeading title="從提交需求到正式開課，流程很清楚" /><ol className="timeline">{processSteps.map(([title, text], index) => <li key={title}><span className="step-number">{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol></div></section>;
}

const agreementTexts = [
  "我已大致確認想報名的學校、課程或方案，並了解訂金付款前的直接報名確認，不包含多間語校比較、城市分析、完整預算規劃或個人化選校諮詢。",
  "我了解提交此表單不代表正式報名成立，哩來將先確認資格、學校名額與方案可行性。",
  "我了解通過確認後，將收到訂金付款通知；於通知所載期限內完成付款，訂金由原價 NT$6,000 優惠為 NT$3,000，逾期則恢復為 NT$6,000。",
  "我了解完成訂金付款後，哩來才會正式啟動語校報名與後續服務。",
  "我了解訂金將於我正式抵達愛爾蘭並開始就讀已報名課程後，依正式報名條款所載條件、方式與時間退還。",
  "我同意哩來愛爾蘭依隱私權政策處理本次報名所需資料。",
];
const consultationAgreementTexts = [
  "我了解提交此表單是登記一對一語校諮詢需求，不代表預約已完成，也不會立即產生付款。",
  "我了解哩來會先檢視我的需求，並透過 Email 聯絡後續可預約方式、時間與付款資訊。",
  "我同意哩來愛爾蘭依隱私權政策處理本次諮詢所需資料。",
];
const isicAgreement = "我了解 ISIC 國際學生證為選擇直接報名語校、不使用一對一選校諮詢者的加贈項目，仍須符合 ISIC 全日制學生資格並提供官方要求的在學證明、身分與照片等文件；最終是否核發依 ISIC 審核結果為準。";

type Errors = Record<string, string>;
const requiredByStep: Record<DirectApplicationFormData["serviceType"], Record<number, string[]>> = {
  direct_application: { 1: ["chineseName", "email", "phone", "currentLocation"], 2: ["preferredCity", "preferredSchool", "courseType", "expectedStartMonth", "courseDuration", "accommodationNeeded"], 3: ["decisionStage", "budgetRange"] },
  consultation: { 1: ["chineseName", "email", "phone", "currentLocation"], 2: ["preferredCity", "courseType", "expectedStartMonth", "courseDuration", "accommodationNeeded"], 3: ["consultationGoal", "budgetRange"] },
};

function Field({ label, name, required, error, children, hint }: { label: string; name: string; required?: boolean; error?: string; children: ReactNode; hint?: string }) {
  return <div className={cn("field", error && "field-error")}><label htmlFor={name}>{label}{required && <span aria-hidden="true">＊</span>}</label>{children}{hint && <small>{hint}</small>}{error && <p className="error-text" id={`${name}-error`} role="alert">{error}</p>}</div>;
}

export function SuccessState({ isicEligible, serviceType }: { isicEligible: boolean; serviceType: DirectApplicationFormData["serviceType"] }) {
  if (serviceType === "consultation") return <div className="success-panel" role="status"><div className="success-icon"><CheckCircle2 size={38} /></div><span className="eyebrow">諮詢需求已成功送出</span><h2>已收到你的一對一諮詢需求</h2><p>即使你還沒決定城市、語校或課程也沒關係。哩來會先閱讀你的需求，再透過 Email 聯絡適合的下一步。</p><ol className="success-steps">{[
    ["檢視你的需求", "我們會先了解你的出發方向、預算與最想解決的問題。"],
    ["Email 聯絡", "哩來會寄送後續可預約方式、時段與付款資訊。"],
    ["確認諮詢安排", "完成預約後，再進行城市、語校、課程與預算的個人化討論。"],
  ].map(([title, text], index) => <li key={title}><span>{index + 1}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol><div className="reminder"><Mail size={20} />請留意 Email 與垃圾郵件匣。</div><div className="success-actions"><a href={websiteUrl} className="button button-primary">返回哩來愛爾蘭官網</a></div></div>;
  return <div className="success-panel" role="status"><div className="success-icon"><CheckCircle2 size={38} /></div><span className="eyebrow">需求已成功送出</span><h2>已收到你的直接報名需求</h2><p>感謝你提交資料。哩來會先確認你選擇的學校、課程、預計入學時間與基本報名條件。</p><ol className="success-steps">{[
    ["資格與方案確認", "我們會檢查資料、合作範圍與學校名額。"],
    ["簡短細節核對", "若有尚未確認的必要資訊，我們會透過 LINE 或 Email 與你聯絡。"],
    ["收到付款通知", "通過確認後，我們會透過 Email 寄送 NT$6,000 訂金通知與明確優惠截止日期。"],
    ["7 日內完成付款", "於付款通知所載期限內完成付款，訂金優惠為 NT$3,000，完成後正式啟動報名服務。"],
  ].map(([title, text], index) => <li key={title}><span>{index + 1}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol><div className="reminder"><Mail size={20} />請留意 Email、LINE 與垃圾郵件匣。</div>{isicEligible && <div className="isic-success"><BadgeCheck size={25} /><div><strong>你目前初步符合 ISIC 國際學生證活動範圍</strong><p>完成直接報名後，哩來會再說明 ISIC 所需文件；最終仍須符合全日制學生資格並通過 ISIC 審核。</p></div></div>}<div className="success-actions"><a href={websiteUrl} className="button button-primary">返回哩來愛爾蘭官網</a><TrackedLink href={consultationUrl} event="consultation_redirect_click" className="button button-secondary">查看一對一語校諮詢</TrackedLink></div></div>;
}

export function MultiStepApplicationForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isConsultation = form.serviceType === "consultation";
  const isicEligible = form.serviceType === "direct_application";
  const chooseServiceType = (intent: DirectApplicationFormData["serviceType"]) => {
    setSubmitted(false);
    setStep(1);
    setErrors({});
    setForm((current) => intent === "consultation" ? {
      ...current,
      serviceType: "consultation",
      preferredCity: current.preferredCity || "尚未確定",
      preferredSchool: "尚未確定",
      courseType: current.courseType || "尚未確定／希望諮詢",
      expectedStartMonth: current.expectedStartMonth || "尚未確定",
      courseDuration: current.courseDuration || "尚未確定",
      decisionStage: "我需要一對一語校諮詢",
      agreements: {},
      isicInitiallyEligible: false,
    } : {
      ...current,
      serviceType: "direct_application",
      courseType: current.courseType === "尚未確定／希望諮詢" ? "" : current.courseType,
      expectedStartMonth: current.expectedStartMonth === "尚未確定" ? "" : current.expectedStartMonth,
      courseDuration: current.courseDuration === "尚未確定" ? "" : current.courseDuration,
      decisionStage: current.decisionStage === "我需要一對一語校諮詢" ? "" : current.decisionStage,
      consultationGoal: "",
      agreements: {},
    });
    trackEvent("form_service_type_selected", { serviceType: intent }, `service-type:${intent}`);
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialIntent = params.get("intent") === "consultation" ? "consultation" : "direct_application";
    setForm((current) => ({ ...current, serviceType: initialIntent, preferredCity: initialIntent === "consultation" ? "尚未確定" : current.preferredCity, preferredSchool: initialIntent === "consultation" ? "尚未確定" : current.preferredSchool, courseType: initialIntent === "consultation" ? "尚未確定／希望諮詢" : current.courseType, expectedStartMonth: initialIntent === "consultation" ? "尚未確定" : current.expectedStartMonth, courseDuration: initialIntent === "consultation" ? "尚未確定" : current.courseDuration, decisionStage: initialIntent === "consultation" ? "我需要一對一語校諮詢" : current.decisionStage, utmSource: params.get("utm_source") ?? "", utmMedium: params.get("utm_medium") ?? "", utmCampaign: params.get("utm_campaign") ?? "", utmContent: params.get("utm_content") ?? "", utmTerm: params.get("utm_term") ?? "", gclid: params.get("gclid") ?? "", landingPageUrl: window.location.href }));
    const handleIntent = (event: Event) => chooseServiceType((event as CustomEvent<{ intent: DirectApplicationFormData["serviceType"] }>).detail.intent);
    const handleAccommodationIntent = () => {
      setSubmitted(false);
      setStep(1);
      setErrors({});
      setForm((current) => ({
        ...current,
        serviceType: "direct_application",
        accommodationNeeded: "需要",
        partnerAccommodationInterest: "兩者都想了解",
        agreements: {},
      }));
    };
    window.addEventListener("lilai-form-intent", handleIntent);
    window.addEventListener("lilai-accommodation-intent", handleAccommodationIntent);
    return () => {
      window.removeEventListener("lilai-form-intent", handleIntent);
      window.removeEventListener("lilai-accommodation-intent", handleAccommodationIntent);
    };
  }, []);
  useEffect(() => { setForm((current) => ({ ...current, isicInitiallyEligible: isicEligible })); }, [isicEligible]);

  const update = (name: keyof DirectApplicationFormData, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };
  const updateAccommodation = (value: string) => {
    setForm((current) => ({ ...current, accommodationNeeded: value, partnerAccommodationInterest: value === "不需要" ? "" : current.partnerAccommodationInterest }));
    setErrors((current) => ({ ...current, accommodationNeeded: "", partnerAccommodationInterest: "" }));
  };
  const validate = (currentStep: number) => {
    const nextErrors: Errors = {};
    requiredByStep[form.serviceType][currentStep].forEach((name) => { if (!String(form[name as keyof DirectApplicationFormData] ?? "").trim()) nextErrors[name] = "請完成此欄位"; });
    if (currentStep === 1 && form.email && !/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "請輸入有效的 Email";
    if (currentStep === 2 && form.preferredSchool === "其他指定學校" && !form.customSchool.trim()) nextErrors.customSchool = "請填寫指定學校";
    if (currentStep === 2 && form.accommodationNeeded && form.accommodationNeeded !== "不需要" && !form.partnerAccommodationInterest.trim()) nextErrors.partnerAccommodationInterest = "請完成此欄位";
    if (currentStep === 3) {
      (isConsultation ? consultationAgreementTexts : agreementTexts).forEach((_, index) => { if (!form.agreements[`agreement-${index}`]) nextErrors[`agreement-${index}`] = "請勾選確認"; });
      if (isicEligible && !form.agreements.isic) nextErrors.isic = "請勾選確認";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };
  const nextStep = () => {
    if (!validate(step)) return;
    trackEvent(isConsultation ? `consultation_step_${step}_complete` : `direct_application_step_${step}_complete`, {}, `${form.serviceType}-form-step-${step}`);
    if (step === 2 && isicEligible) trackEvent("direct_application_isic_activity_selected", { course: form.courseType }, `isic-activity:${form.courseType}`);
    setStep((current) => current + 1); document.getElementById("direct-application-form")?.scrollIntoView({ block: "start" });
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!validate(3)) return; setSubmitting(true); setErrors((current) => ({ ...current, submit: "" }));
    try { await submitDirectApplication({ ...form, isicInitiallyEligible: isicEligible }); trackEvent(isConsultation ? "consultation_request_submit" : "direct_application_submit", { isicInitiallyEligible: isicEligible }); setSubmitted(true); }
    catch (error) { setErrors((current) => ({ ...current, submit: error instanceof Error ? error.message : "報名資料送出失敗，請稍後再試。" })); }
    finally { setSubmitting(false); }
  };

  if (submitted) return <section className="section form-section" id="direct-application-form"><div className="shell form-shell"><SuccessState isicEligible={isicEligible} serviceType={form.serviceType} /></div></section>;

  return <section className="section form-section" id="direct-application-form"><div className="shell form-shell"><div className="form-intro"><span className="eyebrow">約 3–5 分鐘完成</span><h2>{isConsultation ? "預約一對一語校諮詢" : "提交直接報名需求"}</h2><p>{isConsultation ? "還不知道該選哪個城市、語校或課程也沒關係。先告訴我們你的方向，哩來會透過 Email 聯絡後續預約方式。" : "現在不需要付款，也不需要上傳護照。通過資格確認後，我們才會與你簡短核對資料並寄送付款通知。"}</p></div><form className="application-form" onSubmit={submit} noValidate>
    <div className="service-type-picker" aria-label="選擇需求類型"><button type="button" className={cn(form.serviceType === "direct_application" && "is-active")} aria-pressed={form.serviceType === "direct_application"} onClick={() => chooseServiceType("direct_application")}><BadgeCheck size={22} /><span><strong>我已大致選好</strong><small>直接報名語校</small></span></button><button type="button" className={cn(form.serviceType === "consultation" && "is-active")} aria-pressed={form.serviceType === "consultation"} onClick={() => chooseServiceType("consultation")}><CircleHelp size={22} /><span><strong>我需要預約一對一諮詢</strong><small>還不確定也可以填</small></span></button></div>
    <div className="progress-wrap" aria-label={`表單進度：第 ${step} 步，共 3 步`}><div className="progress-meta"><span>步驟 {step}／3</span><strong>{["聯絡資料", isConsultation ? "出發方向" : "報名計畫", "確認送出"][step - 1]}</strong></div><div className="progress-bar"><span style={{ width: `${step / 3 * 100}%` }} /></div></div>
    {step === 1 && <fieldset><legend>你的聯絡資料</legend><div className="field-grid"><Field label="中文姓名" name="chineseName" required error={errors.chineseName}><input id="chineseName" value={form.chineseName} onChange={(e) => update("chineseName", e.target.value)} aria-describedby={errors.chineseName ? "chineseName-error" : undefined} /></Field><Field label="Email" name="email" required error={errors.email}><input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} inputMode="email" /></Field><Field label="手機號碼" name="phone" required error={errors.phone}><input id="phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} inputMode="tel" /></Field><Field label="Instagram ID／LINE ID（選填）" name="lineId" hint="方便後續用你習慣的方式聯絡；未填仍可透過 Email 或手機聯繫"><input id="lineId" value={form.lineId} onChange={(e) => update("lineId", e.target.value)} placeholder="例如：@lilaiireland 或 LINE ID" /></Field><Field label="目前所在地" name="currentLocation" required error={errors.currentLocation}><select id="currentLocation" value={form.currentLocation} onChange={(e) => update("currentLocation", e.target.value)}><option value="">請選擇</option>{["台灣", "愛爾蘭", "其他"].map(option => <option key={option}>{option}</option>)}</select></Field></div></fieldset>}
    {step === 2 && <fieldset><legend>{isConsultation ? "告訴我們你的出發方向" : "你的語校報名計畫"}</legend>{isConsultation && <div className="consultation-prefill"><CircleHelp size={22} /><div><strong>不用先決定語校</strong><p>已自動將學校標記為「尚未確定」，諮詢時再一起比較。</p></div></div>}<div className="field-grid"><Field label={isConsultation ? "目前偏好的城市" : "想報名的城市"} name="preferredCity" required error={errors.preferredCity}><select id="preferredCity" value={form.preferredCity} onChange={(e) => update("preferredCity", e.target.value)}><option value="">請選擇</option>{["Dublin", "Cork", "Galway", "Limerick", "其他", "尚未確定"].map(option => <option key={option}>{option}</option>)}</select></Field>{!isConsultation && <Field label="想報名的學校" name="preferredSchool" required error={errors.preferredSchool}><select id="preferredSchool" value={form.preferredSchool} onChange={(e) => update("preferredSchool", e.target.value)}><option value="">請選擇</option>{schoolOptions.map(option => <option key={option}>{option}</option>)}</select></Field>}{!isConsultation && form.preferredSchool === "其他指定學校" && <Field label="指定學校名稱" name="customSchool" required error={errors.customSchool}><input id="customSchool" value={form.customSchool} onChange={(e) => update("customSchool", e.target.value)} /></Field>}<Field label={isConsultation ? "目前感興趣的課程" : "課程類型"} name="courseType" required error={errors.courseType}><select id="courseType" value={form.courseType} onChange={(e) => update("courseType", e.target.value)}><option value="">請選擇</option>{courseOptions.filter(option => isConsultation || option.label !== "尚未確定／希望諮詢").map(option => <option key={option.label}>{option.label}</option>)}</select></Field>{isConsultation ? <Field label="預計何時出發" name="expectedStartMonth" required error={errors.expectedStartMonth}><select id="expectedStartMonth" value={form.expectedStartMonth} onChange={(e) => update("expectedStartMonth", e.target.value)}>{["3 個月內", "3–6 個月內", "半年後", "尚未確定"].map(option => <option key={option}>{option}</option>)}</select></Field> : <Field label="預計開課年月" name="expectedStartMonth" required error={errors.expectedStartMonth}><input id="expectedStartMonth" type="month" value={form.expectedStartMonth} onChange={(e) => update("expectedStartMonth", e.target.value)} /></Field>}<Field label={isConsultation ? "目前考慮的就讀週數" : "預計就讀週數"} name="courseDuration" required error={errors.courseDuration}><select id="courseDuration" value={form.courseDuration} onChange={(e) => update("courseDuration", e.target.value)}><option value="">請選擇</option>{["4 週以下", "4–12 週", "13–24 週", "25 週以上", "25+8 課程", "其他", "尚未確定"].map(option => <option key={option}>{option}</option>)}</select></Field><Field label="偏好上課時段" name="classSchedule"><select id="classSchedule" value={form.classSchedule} onChange={(e) => update("classSchedule", e.target.value)}><option value="">請選擇</option>{["上午", "下午", "皆可", "尚未確定"].map(option => <option key={option}>{option}</option>)}</select></Field><Field label="是否需要住宿協助" name="accommodationNeeded" required error={errors.accommodationNeeded}><select id="accommodationNeeded" value={form.accommodationNeeded} onChange={(e) => updateAccommodation(e.target.value)}><option value="">請選擇</option>{["需要", "不需要", "尚未確定"].map(option => <option key={option}>{option}</option>)}</select></Field>{form.accommodationNeeded && form.accommodationNeeded !== "不需要" && <div className="field-full"><Field label="是否想參考哩來合作的 Leevin Stay Hostel／Stay Student？" name="partnerAccommodationInterest" required error={errors.partnerAccommodationInterest} hint="由哩來學長姐依城市、入住期間、房型與當期房況提供合作報價；住宿安排服務費 NT$1,500（原價 NT$2,000）"><select id="partnerAccommodationInterest" value={form.partnerAccommodationInterest} onChange={(e) => update("partnerAccommodationInterest", e.target.value)}><option value="">請選擇</option>{["想參考 Leevin Stay Hostel", "想參考 Leevin Stay Student", "兩者都想了解", "暫時不需要"].map(option => <option key={option}>{option}</option>)}</select></Field></div>}<Field label="是否已取得其他報價" name="quoteStatus"><select id="quoteStatus" value={form.quoteStatus} onChange={(e) => update("quoteStatus", e.target.value)}><option value="">請選擇</option>{["尚未取得", "已由學校取得", "已由其他代辦取得", "曾與哩來聯繫過"].map(option => <option key={option}>{option}</option>)}</select></Field></div>{isicEligible && <div className="eligibility-hint"><BadgeCheck size={22} /><p><strong>你選擇的是直接報名語校</strong>不使用一對一選校諮詢者可加贈 ISIC 國際學生證；報名 25+8 長期課程的學生基本上均適用提出申請，最終仍須符合全日制學生資格並通過文件審核。</p></div>}</fieldset>}
    {step === 3 && <fieldset><legend>{isConsultation ? "這次最想解決什麼問題？" : "確認你目前的準備進度"}</legend>{isConsultation ? <Field label="選一個最接近你目前需求的選項" name="consultationGoal" required error={errors.consultationGoal}><div className="radio-stack">{["比較城市與生活成本", "比較語校與課程差異", "評估學費、住宿與整體預算", "規劃 25+8 打工遊學", "還不確定，想從頭一起討論"].map(option => <label key={option}><input type="radio" name="consultationGoal" value={option} checked={form.consultationGoal === option} onChange={(e) => update("consultationGoal", e.target.value)} /><span>{option}</span></label>)}</div></Field> : <><Field label="你目前的進度最接近哪一項？" name="decisionStage" required error={errors.decisionStage}><div className="radio-stack">{["我已確認主要學校及課程，可以直接報名", "我大致選好，只需要確認少量細節", "我仍需要完整比較不同學校或城市"].map(option => <label key={option}><input type="radio" name="decisionStage" value={option} checked={form.decisionStage === option} onChange={(e) => update("decisionStage", e.target.value)} /><span>{option}</span></label>)}</div></Field>{form.decisionStage === "我仍需要完整比較不同學校或城市" && <div className="recommendation-card"><CircleHelp size={24} /><div><strong>一對一語校諮詢可能更適合</strong><p>若你仍需要完整比較不同學校、城市或預算，一對一語校諮詢會比直接報名更適合。</p><TrackedLink href={consultationUrl} event="consultation_redirect_from_application_form" className="text-link">改填一對一諮詢需求 <ArrowRight size={16} /></TrackedLink></div></div>}</>}<div className="field-grid"><Field label="預計學費＋住宿預算" name="budgetRange" required error={errors.budgetRange} hint="歐元金額為約數，實際依付款當日匯率為準"><select id="budgetRange" value={form.budgetRange} onChange={(e) => update("budgetRange", e.target.value)}><option value="">請選擇</option>{["NT$150,000 以下（約 €4,100 以下）", "NT$150,000–200,000（約 €4,100–€5,500）", "NT$200,000–250,000（約 €5,500–€6,900）", "NT$250,000–300,000（約 €6,900–€8,300）", "NT$300,000 以上（約 €8,300 以上）", "尚未確認"].map(option => <option key={option}>{option}</option>)}</select></Field><Field label="如何得知哩來愛爾蘭" name="discoverySource"><select id="discoverySource" value={form.discoverySource} onChange={(e) => update("discoverySource", e.target.value)}><option value="">選填</option>{["Google 搜尋", "Instagram", "Threads", "YouTube", "朋友推薦（請朋友私訊我們登記才享推薦好禮）", "說明會", "其他"].map(option => <option key={option}>{option}</option>)}</select></Field><div className="field-full"><Field label={isConsultation ? "還有什麼希望我們先知道？" : "其他希望我們確認的事項"} name="additionalNotes" hint={isConsultation ? "例如：最擔心的問題、偏好的生活方式，或任何尚未確定的地方。" : "請填寫必要的報名細節，不需在此提供護照或其他敏感文件。"}><textarea id="additionalNotes" rows={4} value={form.additionalNotes} onChange={(e) => update("additionalNotes", e.target.value)} /></Field></div></div><div className="agreements"><h3>送出前，請確認以下事項</h3>{(isConsultation ? consultationAgreementTexts : agreementTexts).map((text, index) => { const key = `agreement-${index}`; return <div key={key}><label className="checkbox-row"><input type="checkbox" checked={!!form.agreements[key]} onChange={(e) => { setForm(current => ({ ...current, agreements: { ...current.agreements, [key]: e.target.checked } })); setErrors(current => ({ ...current, [key]: "" })); }} /><span>{text}</span></label>{errors[key] && <p className="error-text">{errors[key]}</p>}</div>; })}{isicEligible && <div className="isic-agreement"><label className="checkbox-row"><input type="checkbox" checked={!!form.agreements.isic} onChange={(e) => { setForm(current => ({ ...current, agreements: { ...current.agreements, isic: e.target.checked } })); if (e.target.checked) trackEvent("isic_eligibility_checkbox_checked"); setErrors(current => ({ ...current, isic: "" })); }} /><span>{isicAgreement}</span></label>{errors.isic && <p className="error-text">{errors.isic}</p>}</div>}</div></fieldset>}
    {(["utmSource", "utmMedium", "utmCampaign", "utmContent", "utmTerm", "gclid", "landingPageUrl"] as const).map(name => <input key={name} type="hidden" name={name} value={String(form[name])} />)}
    {errors.submit && <p className="error-text" role="alert">{errors.submit}</p>}
    <div className="form-actions">{step > 1 && <button type="button" className="button button-ghost" onClick={() => setStep(current => current - 1)}>返回上一步</button>}{step < 3 ? <button type="button" className="button button-primary" onClick={nextStep}>下一步 <ArrowRight size={18} /></button> : <div className="submit-wrap"><button type="submit" className="button button-primary button-large" disabled={submitting}>{submitting ? "正在送出…" : isConsultation ? "送出一對一諮詢需求" : "提交直接報名需求"} {!submitting && <ArrowRight size={18} />}</button><small>{isConsultation ? "送出後，哩來會透過 Email 聯絡後續預約方式。" : "送出表單不代表報名成立，也不會立即產生付款。"}</small></div>}</div>
  </form></div></section>;
}

export function BenefitCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) { return <article className="benefit-card"><Icon /><h3>{title}</h3><p>{children}</p></article>; }

export function WhyLilaiSection() {
  return <section className="section"><div className="shell"><SectionHeading title="不只幫你把資料送到學校" /><div className="benefit-grid"><BenefitCard icon={MapPin} title="愛爾蘭在地學長姐">團隊實際生活在愛爾蘭，理解出發前後真正會遇到的問題。</BenefitCard><BenefitCard icon={UsersRound} title="實際參訪與學生回饋">不只依賴官方文宣，而是結合語校參訪、合作經驗與學弟妹回饋整理資訊。</BenefitCard><BenefitCard icon={ShieldCheck} title="流程與費用透明">報名前清楚說明課程、學費、付款方式、訂金與後續流程。</BenefitCard><BenefitCard icon={FileCheck2} title="申請與文件追蹤">協助處理報名資料、校方付款、補件與入學文件。</BenefitCard><BenefitCard icon={HeartHandshake} title="抵達後仍有支援">從行前準備到愛爾蘭生活，不會在收到入學文件後就失去聯絡。</BenefitCard><BenefitCard icon={Coffee} title="哩來學弟妹社群">透過 Coffee Chat、活動與實用資訊，協助你更快開始愛爾蘭生活。</BenefitCard></div></div></section>;
}

export function AccommodationSupportSection() {
  const cancellationRows = [
    ["入住日前 21 天以上", "住宿費全額退還"],
    ["入住日前 14–21 天", "退還住宿費 50%"],
    ["入住日前 14 天以內", "住宿費不退"],
    ["No-show（未通知未到）", "住宿費不退"],
  ];

  return (
    <section className="section accommodation-section" id="accommodation-support">
      <div className="shell">
        <div className="accommodation-heading-grid">
          <SectionHeading
            eyebrow="LEEVIN 住宿銜接"
            title="語校之外，也先幫你把落地住宿接好"
            subtitle="需要住宿的學弟妹，可一併詢問 Leevin 青年旅館或學生住宿。哩來透過合作方案提供學弟妹專屬住宿報價，通常比語校代訂或住宿平台的公開方案更優惠。"
            align="left"
          />
          <aside className="accommodation-fee-card" aria-label="Leevin 住宿安排服務費">
            <span>哩來學弟妹住宿安排服務費</span>
            <div><strong>NT$1,500</strong><s>原價 NT$2,000</s></div>
            <p>不另收訂金；此服務費即作為訂房保留與安排費，完成支付後一律不退。</p>
          </aside>
        </div>

        <div className="accommodation-options">
          <article className="accommodation-option-card">
            <div className="accommodation-photo">
              <img src="https://leevinstay.com/wp-content/uploads/2025/09/faci06-1024x683.jpg" alt="Leevin Stay Hostel 公共空間" loading="lazy" />
              <span>青年旅館</span>
            </div>
            <div className="accommodation-option-copy">
              <h3>Leevin Stay Hostel</h3>
              <p>以青年旅館房型、公共空間與社交氛圍為主，適合喜歡認識新朋友、享受共用設施與熱鬧住宿體驗的學弟妹。</p>
              <ul><li><UsersRound size={17} />青年旅館房型與共用公共空間</li><li><MapPin size={17} />依城市、入住期間與房況提供方案</li><li><CheckCircle2 size={17} />最低預約週數：1 週</li><li><BadgeCheck size={17} />入住 4 週以上享長住優惠</li></ul>
              <a className="accommodation-profile-link" href="https://leevinstay.com/leevin-hostel-dublin/" target="_blank" rel="noreferrer">查看 Stay Hostel 簡介與房型照片 <ArrowRight size={15} /></a>
            </div>
          </article>
          <article className="accommodation-option-card">
            <div className="accommodation-photo">
              <img src="https://leevinstay.com/wp-content/uploads/2026/04/Layer-2.png" alt="Leevin Stay Student 住宅式學生住宿房間" loading="lazy" />
              <span>學生住宿</span>
            </div>
            <div className="accommodation-option-copy">
              <h3>Leevin Stay Student</h3>
              <p>更接近家庭式共居，可使用廚房準備餐食；依房源提供單人、雙人、三人或四人房，適合偏好住宅生活感的學弟妹。</p>
              <ul><li><Coffee size={17} />可使用廚房，生活方式更接近家庭式共居</li><li><HeartHandshake size={17} />報價已包含 Wi-Fi、帳單與每週清潔，不另收費</li><li><CheckCircle2 size={17} />最低預約週數：4 週</li><li><BadgeCheck size={17} />入住 8 週以上享長住優惠</li></ul>
              <a className="accommodation-profile-link" href="https://leevinstay.com/stay-student/" target="_blank" rel="noreferrer">查看 Stay Student 簡介與房型照片 <ArrowRight size={15} /></a>
            </div>
          </article>
        </div>

        <p className="accommodation-availability-note"><Info size={17} />實際金額與長住優惠依城市、房型、入住期間及當期房況為準，由哩來學長姐提供專屬合作報價及後續聯絡。</p>

        <details className="accordion accommodation-terms">
          <summary>取消、退款與延誤規則 <ChevronDown size={20} /></summary>
          <div className="accordion-content">
            <p className="accommodation-terms-lead">取消時間以 Leevin 實際收到取消通知為準；以下退款比例僅適用住宿費，NT$1,500 住宿安排服務費在任何情況下皆不退。</p>
            <div className="accommodation-refund-grid">
              {cancellationRows.map(([timing, refund]) => <div key={timing}><strong>{timing}</strong><span>{refund}</span></div>)}
            </div>
            <ul className="accommodation-notes">
              <li>Leevin 將退款匯回哩來後，哩來會在 14 個工作天內退還學生；銀行手續費與匯差將自退款金額中扣除。</li>
              <li>若遲到或遇到航班延誤，須於原定入住日 24 小時前通知 Leevin，否則原定入住當晚費用不退。</li>
              <li>房型、實際房況、入住與退房細節，仍以確認報價及正式住宿文件為準。</li>
            </ul>
          </div>
        </details>

        <div className="accommodation-actions">
          <TrackedLink href="#direct-application-form" event="accommodation_application_click" className="button button-primary button-large">報名語校並詢問住宿方案 <ArrowRight size={19} /></TrackedLink>
          <p>按下後會預先勾選需要住宿與 Leevin 方案，完成表單後再由學長姐提供報價及聯絡。</p>
        </div>
      </div>
    </section>
  );
}

export function BrandProofSection() {
  return <section className="section brand-proof"><div className="shell brand-proof-grid"><div className="brand-proof-copy"><span className="eyebrow">ALEX &amp; ARSHA COMMUNITY</span><h2>不只把你送到學校，<br />而是陪你在愛爾蘭開始生活</h2><p>哩來由正在愛爾蘭生活的學長姐 Alex &amp; Arsha 創立。我們把自己走過的路、踩過的坑與整理過的資源，轉化成出發前後都能用得上的陪伴。</p><p>從申請、文件到落地後的 Coffee Chat 與生活圈，讓你知道抵達後仍找得到人、問得到問題。</p><a className="text-link" href="https://lilaiireland.com/alex-arsha">認識學長姐 Alex &amp; Arsha <ArrowRight size={16} /></a></div><div className="community-collage" aria-label="哩來愛爾蘭生活圈真實活動照片"><figure className="community-photo community-photo-main"><img src="/lilai-assets/community-seaside.jpg" alt="哩來愛爾蘭學弟妹在海邊團體合照" loading="lazy" /><figcaption>城市探索與出遊</figcaption></figure><figure className="community-photo community-photo-side"><img src="/lilai-assets/community-extra-01.jpg" alt="哩來愛爾蘭生活圈聚會" loading="lazy" /><figcaption>哩來生活圈</figcaption></figure></div></div></section>;
}

export function GiftPackageSection() {
  const supportCards: Array<{ icon: LucideIcon; title: string; body: string; media: "handbooks" | "job" | "network" | "ai" | "isic"; badge?: string }> = [
    {
      icon: Route,
      title: "行前、開局雙手冊",
      body: "行前手冊整理出發前的文件、預算與行李準備；開局手冊則陪你安排抵達後第一個月的交通、手機、生活用品與常見行政事項，把最混亂的階段整理成清楚步驟。",
      media: "handbooks",
    },
    {
      icon: BriefcaseBusiness,
      title: "求職攻略手冊",
      body: "Lite 與 Pro 都包含求職攻略手冊，整理服務業求職方向、CV 撰寫與面試技巧，並附上履歷模板，讓你抵達後開始找工作時有清楚的起點。",
      media: "job",
    },
    {
      icon: RadioTower,
      title: "抵達網路方案",
      body: "依課程長度提供對應網路支援：報名 4 週以上短期課程享 5 日歐洲地區 eSIM；報名 25+8 長期課程則享 28 日 Three Super Surfer，價值 20 歐元，並包含愛爾蘭手機門號。抵達當地後，可直接使用該門號開始申請 IRP、銀行卡、PPSN 等相關文件。",
      media: "network",
    },
    {
      icon: MessageCircle,
      title: "AI 英語練功系統",
      body: "AI 英語練功系統正式上線後，Lite 提供 14 日體驗資格；Pro 則提供一年份使用權限，協助大家在語校之外持續練習英文。",
      media: "ai",
      badge: "Lite 正式上線 14 日體驗・Pro 一年份使用權限",
    },
    {
      icon: BadgeCheck,
      title: "ISIC 國際學生證",
      body: "選擇直接報名語校、不使用一對一選校諮詢者加贈。報名 25+8 長期課程的學生基本上均適用提出申請；通過 ISIC 全日制學生資格與文件審核後，可取得 12 個月國際學生身分與數位學生證。",
      media: "isic",
      badge: "直接報名・不使用選校諮詢者加贈",
    },
  ];

  return (
    <section className="section gift-support-section" id="opening-support">
      <div className="shell">
        <SectionHeading
          eyebrow="愛爾蘭開局支援系統"
          title="不只是代辦語校，我們也幫你準備愛爾蘭開局大禮包"
          subtitle="從行前準備、落地生活、網路連線到英文練習，哩來把學弟妹最常卡住的問題整理成實用資源，讓你抵達愛爾蘭後不是從零開始。"
        />

        <div className="support-card-grid">
          {supportCards.map(({ icon: Icon, title, body, media, badge }) => (
            <article className={cn("support-card", media === "isic" && "support-card-isic")} key={title}>
              <SupportCardMedia type={media} />
              <div className="support-card-content">
                <div className="support-card-meta"><span className="support-card-icon"><Icon size={24} aria-hidden="true" /></span>{badge && <span className="support-badge">{badge}</span>}</div>
                <h3>{title}</h3>
                <p>{body}</p>
                {media === "isic" && <details className="isic-benefit-examples"><summary>看看 ISIC 可以省在哪裡 <ChevronDown size={18} aria-hidden="true" /></summary><div className="isic-benefit-examples-body"><strong>一張卡，日常生活與週末旅行都能用</strong><ul><li><span>吃飯</span>Mad Egg 20% 折扣</li><li><span>購物</span>Adidas 指定商品 15% 折扣</li><li><span>交通</span>FlixBus 單張票 9 折、兩張票 85 折</li><li><span>娛樂</span>IMC 電影票＋爆米花＋飲料 €12.50</li><li><span>景點</span>Guinness Storehouse 標準票價減 €6.50</li></ul><small>優惠、合作店家與使用條件可能調整，實際內容以 ISIC Ireland 當期公告為準。</small></div></details>}
              </div>
            </article>
          ))}
        </div>

        <div className="gift-comparison-heading">
          <span>依課程長度提供對應支援</span>
          <h3>選擇適合你的開局大禮包</h3>
        </div>
        <div className="gift-comparison-grid">
          <article className="package-card">
            <div className="package-card-header"><span>Lite</span><h3>開局大禮包 Lite</h3></div>
            <p className="package-audience"><strong>適用對象</strong>報名 4 週以上短期課程的學弟妹</p>
            <GiftPackageList items={["行前、開局雙手冊", "2026 愛爾蘭出發前 30 件必做清單", "求職攻略手冊（CV、面試技巧與履歷模板）", "5 日歐洲地區 eSIM", "AI 英語練功系統正式上線 14 日體驗資格"]} />
            <p className="package-description">適合短期課程、剛開始探索愛爾蘭生活，或希望出發前有基本支援的學弟妹。</p>
          </article>
          <article className="package-card package-card-pro">
            <span className="package-featured-badge">最完整開局支援</span>
            <div className="package-card-header"><span>Pro</span><h3>開局大禮包 Pro</h3></div>
            <p className="package-audience"><strong>適用對象</strong>報名 25+8 長期課程的學弟妹</p>
            <GiftPackageList items={["行前、開局雙手冊", "2026 愛爾蘭出發前 30 件必做清單", "求職攻略手冊（CV、面試技巧與履歷模板）", "28 日 Three Super Surfer（含愛爾蘭手機門號），價值 20 歐元", "AI 英語練功系統，一年份使用權限"]} />
            <p className="package-description">適合準備 25+8 長期規劃，希望完整銜接語校、生活、求職與英文練習的學弟妹。</p>
          </article>
        </div>

        <p className="gift-support-note">實際贈送內容依報名課程長度、當期活動與合作方案為準。AI 英語練功系統的實際正式上線時間與功能內容將依開發進度調整；Lite 的 14 日體驗資格於正式上線後開放使用。</p>
        <div className="gift-support-actions">
          <TrackedLink href="#direct-application-form" event="gift_direct_application_click" className="button button-primary button-large">直接報名語校 <ArrowRight size={19} /></TrackedLink>
        </div>
      </div>
    </section>
  );
}

export function SeminarHighlightsSection() {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoPlayerRef = useRef<HTMLDivElement>(null);
  const playVideo = () => {
    trackEvent("seminar_highlight_video_open", { video: "4OHtEJxV62U" }, "seminar-highlight-video");
    setVideoPlaying(true);
    window.requestAnimationFrame(() => videoPlayerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  return (
    <section className="section seminar-highlights-section" id="seminar-highlights">
      <div className="shell seminar-highlights-shell">
        <SectionHeading
          eyebrow="說明會精華片段"
          title="花人生不到1%的時間，就能體驗到這些事！"
          subtitle="從什麼是「25+8」，到可以帶給你什麼除了學英文以外的事？我們把說明會中最常被問到的問題整理成精華片段。"
        />
        <div className="seminar-highlights-grid">
          <article className="video-highlight-card">
            <div className="video-inline-player" ref={videoPlayerRef}>
              {videoPlaying ? (
                <iframe
                  src="https://www.youtube-nocookie.com/embed/4OHtEJxV62U?autoplay=1&rel=0&playsinline=1"
                  title="1 分鐘看懂什麼是 25+8！"
                  allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <button type="button" className="video-thumbnail-button" onClick={playVideo} aria-label="播放：1 分鐘看懂什麼是 25+8！">
                  <img src="https://i.ytimg.com/vi/4OHtEJxV62U/hqdefault.jpg" alt="1 分鐘看懂什麼是 25+8 影片縮圖" loading="lazy" />
                  <span className="video-play-icon"><Play size={25} fill="currentColor" aria-hidden="true" /></span>
                  <span className="video-duration">1 MIN</span>
                </button>
              )}
            </div>
            <div className="video-highlight-copy">
              <h3>1 分鐘看懂什麼是 25+8！</h3>
              <p>適合正在考慮長期課程、打工遊學，或還不確定自己適不適合愛爾蘭的人。</p>
            </div>
          </article>
          <div className="seminar-key-points">
            <span className="seminar-key-points-label">這段影片會帶你快速了解</span>
            <ul>
              {["25+8 是什麼？適合誰？", "有哪些學英文以外的好處？", "為什麼學長姐、學弟妹都超推！"].map((item) => <li key={item}><CheckCircle2 size={21} aria-hidden="true" /><span>{item}</span></li>)}
            </ul>
            <button type="button" className="button button-secondary seminar-video-cta" onClick={playVideo}>看說明會精華片段 <Play size={17} aria-hidden="true" /></button>
            <TrackedLink href="/free-departure-assessment" event="seminar_free_assessment_click" className="text-link">免費出發評估 <ArrowRight size={16} /></TrackedLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TestimonialCard({ item }: { item: typeof testimonials[number] }) { return <article className="testimonial-card"><div className="review-card-top"><strong>{item.name}</strong><span><img src="/lilai-assets/google-logo.png" alt="Google" />評論</span></div><div className="stars" aria-label="5 顆星">★★★★★</div><p>「{item.quote}」</p><div className="review-tags">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div></article>; }
export function TestimonialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = scrollRef.current;
    if (!row || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let paused = false;
    let lastFrame = performance.now();
    let resumeTimer = 0;
    const pause = () => { paused = true; };
    const resume = () => { paused = false; lastFrame = performance.now(); };
    const resumeAfterTouch = () => { window.clearTimeout(resumeTimer); resumeTimer = window.setTimeout(resume, 1200); };
    const tick = (now: number) => {
      const delta = Math.min(now - lastFrame, 64);
      lastFrame = now;
      if (!paused) {
        row.scrollLeft += delta * 0.03;
        const resetPoint = row.scrollWidth / 2;
        if (resetPoint > 0 && row.scrollLeft >= resetPoint) row.scrollLeft -= resetPoint;
      }
      frame = window.requestAnimationFrame(tick);
    };

    row.addEventListener("mouseenter", pause);
    row.addEventListener("mouseleave", resume);
    row.addEventListener("focusin", pause);
    row.addEventListener("focusout", resume);
    row.addEventListener("touchstart", pause, { passive: true });
    row.addEventListener("touchend", resumeAfterTouch, { passive: true });
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(resumeTimer);
      row.removeEventListener("mouseenter", pause);
      row.removeEventListener("mouseleave", resume);
      row.removeEventListener("focusin", pause);
      row.removeEventListener("focusout", resume);
      row.removeEventListener("touchstart", pause);
      row.removeEventListener("touchend", resumeAfterTouch);
    };
  }, []);

  return <section className="section testimonials-section"><div className="shell"><SectionHeading eyebrow="STUDENT REVIEWS" title="哩來學弟妹的真實出發經驗" subtitle="這些文字來自學弟妹們真實的 Google 評論。" /><div className="testimonial-scroll" ref={scrollRef} aria-label="哩來學弟妹 Google 評論，自動橫向輪播"><div className="testimonial-group">{testimonials.map(item => <TestimonialCard key={item.id} item={item} />)}</div><div className="testimonial-group" aria-hidden="true">{testimonials.map(item => <TestimonialCard key={`duplicate-${item.id}`} item={item} />)}</div></div><div className="reviews-link"><a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" className="button button-secondary">查看更多 Google 評論 <ArrowRight size={17} /></a></div></div></section>;
}

const faqs = [
  ["我還有一些問題，也可以直接報名嗎？", "可以。直接報名不代表完全不能詢問，而是適合已大致確認學校與方案的人。完成訂金後，哩來仍會協助處理申請、文件、付款、開課與行前流程中的必要問題。"],
  ["直接報名和一對一諮詢有什麼不同？", "直接報名適合已完成主要選擇的人，且不使用一對一選校諮詢者才會加贈 ISIC 國際學生證；一對一諮詢則適合仍需要比較城市、學校、課程與預算的人。"],
  ["提交表單後就需要付款嗎？", "不需要。哩來會先確認你的條件、學校名額與方案可行性，通過確認後才會寄送付款通知。"],
  ["七日訂金半價如何計算？", "以付款通知中標示的截止日期為準。在期限內完成付款，訂金由 NT$6,000 優惠為 NT$3,000。"],
  ["訂金什麼時候退還？", "當學生正式抵達愛爾蘭並開始就讀已報名課程後，將依正式報名條款所載方式與時間退還。"],
  ["超過七日才付款會怎樣？", "訂金將恢復為 NT$6,000，學校名額、價格與方案亦需依當時最新狀況重新確認。"],
  ["ISIC 國際學生證適用哪些人？", "本活動適用選擇直接報名語校、不使用一對一選校諮詢，且符合 ISIC 全日制學生資格的學弟妹。報名 25+8 長期課程的學生基本上均適用提出申請；申辦時仍須依官方要求提供在學證明、身分證明與合適照片，最終是否核發依 ISIC 文件審核結果為準。"],
  ["ISIC 國際學生證可以怎麼使用？", "標準 ISIC 卡效期為 12 個月，可透過 ISIC App 使用數位學生證並查看全球優惠。例如 Mad Egg 20% 折扣、Adidas 指定商品 15% 折扣、FlixBus 車票優惠、IMC 電影套票，以及 Guinness Storehouse 等景點優惠；實際優惠與使用條件以 ISIC Ireland 當期公告為準。"],
  ["直接報名會比透過諮詢少服務嗎？", "不會影響正式報名後的申請、文件、付款與行前支援。差別只在於直接報名不包含訂金付款前的完整選校分析。"],
];
export function FAQAccordion() { return <section className="section section-tint" id="faq"><div className="shell narrow-shell"><SectionHeading title="常見問題" subtitle="把付款、服務範圍與贈禮條件一次說清楚。" /><div className="faq-list">{faqs.map(([question, answer], index) => <details className="accordion" key={question} onToggle={(e) => { if (e.currentTarget.open) trackEvent("faq_open", { question }, `faq-${index}`); }}><summary>{question}<ChevronDown size={20} /></summary><div className="accordion-content"><p>{answer}</p></div></details>)}</div></div></section>; }

export function FinalCTA() { return <section className="final-cta"><div className="shell final-inner"><div><span className="eyebrow eyebrow-light">下一站，愛爾蘭</span><h2>已經做好前期研究，<br />就直接往下一步走吧</h2><p>先提交報名需求，確認資格後再付款。7 日內完成訂金享半價；選擇直接報名、不使用一對一選校諮詢並通過官方資格審核，再加贈 ISIC 國際學生證。</p></div><div className="final-actions"><TrackedLink href="#direct-application-form" event="direct_application_start" className="button button-light button-large">提交直接報名需求 <ArrowRight size={19} /></TrackedLink><TrackedLink href={consultationUrl} event="consultation_redirect_click" className="button button-outline-light">我還需要一對一選校協助</TrackedLink><TrackedLink href={assessmentUrl} event="free_assessment_click" className="light-link">還在探索階段？免費完成階段評估</TrackedLink></div></div></section>; }

export function StickyMobileCTA() { return <div className="sticky-mobile-cta"><TrackedLink href="#direct-application-form" event="direct_application_start" className="button button-primary">直接開始報名</TrackedLink><TrackedLink href={consultationUrl} event="consultation_redirect_click" className="sticky-text">需要選校協助？</TrackedLink></div>; }

export function LandingFooter() { return <footer className="footer"><div className="shell footer-grid"><div><Logo inverse /><p>一起把夢，過成生活 ☘️</p><small>營運單位：築夢愛爾國際留遊學<br />統一編號：00853881</small></div><div><strong>開始規劃</strong><a href={websiteUrl}>返回官網</a><TrackedLink href={assessmentUrl} event="free_assessment_click">免費出發評估</TrackedLink><TrackedLink href={consultationUrl} event="consultation_redirect_click">一對一語校諮詢</TrackedLink></div><div><strong>相關政策</strong><a href="https://lilaiireland.com/agreement/" target="_blank" rel="noopener noreferrer">隱私權政策</a></div><div><strong>聯絡我們</strong><nav className="footer-social-links" aria-label="社群與聯絡方式"><a href="https://www.instagram.com/lilaiireland/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram"><Camera aria-hidden="true" /></a><a href="https://www.threads.com/@lilaiireland?xmt=AQG0O09cRB2uGgzJjsVy8TdFipQQ_ARZ4-X4b23ZfY7Hmk0" target="_blank" rel="noopener noreferrer" aria-label="Threads" title="Threads"><AtSign aria-hidden="true" /></a><a href="https://www.youtube.com/@%E5%93%A9%E4%BE%86%E6%84%9B%E7%88%BE%E8%98%AD" target="_blank" rel="noopener noreferrer" aria-label="YouTube" title="YouTube"><PlaySquare aria-hidden="true" /></a><a href="mailto:lilaiireland@gmail.com" aria-label="Email：lilaiireland@gmail.com" title="lilaiireland@gmail.com"><Mail aria-hidden="true" /></a></nav></div></div><div className="shell footer-bottom"><span>© {new Date().getFullYear()} 哩來愛爾蘭 Lilai Ireland</span><span>本頁資訊以正式報名條款為準</span></div></footer>; }

export default function Home() {
  return <><LandingHeader /><main><HeroSection /><DirectApplicationOffer /><PartnerSchoolSection /><ServicePathComparison /><ApplicationProcess /><WhyLilaiSection /><AccommodationSupportSection /><GiftPackageSection /><SeminarHighlightsSection /><MultiStepApplicationForm /><BrandProofSection /><TestimonialsSection /><FAQAccordion /><FinalCTA /></main><LandingFooter /><StickyMobileCTA /></>;
}
