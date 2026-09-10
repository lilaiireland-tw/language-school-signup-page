import type { Metadata } from "next";
import { headers } from "next/headers";
import { PRODUCTION_LANDING_URL, appPath } from "./lib/site-paths";
import "./globals.css";

const title = "愛爾蘭語言學校報名｜25+8打工遊學與選校協助｜哩來愛爾蘭";
const description = "比較愛爾蘭語言學校、25+8 打工遊學、短期語校課程與住宿方案。已選好學校可直接報名；仍在比較城市與語校，可預約一對一選校諮詢，由哩來愛爾蘭協助完成申請與行前準備。";
const googleAdsTagId = "AW-17610996814";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "example.com";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);
  const hostname = host.split(":")[0].toLowerCase();
  const isProductionHostname = hostname === "lilaiireland.com" || hostname === "www.lilaiireland.com";
  const noindex = process.env.NEXT_PUBLIC_NOINDEX === "true" || !isProductionHostname;

  return {
    title,
    description,
    metadataBase: baseUrl,
    alternates: { canonical: PRODUCTION_LANDING_URL },
    openGraph: { title, description, type: "website", locale: "zh_TW", url: PRODUCTION_LANDING_URL, images: [{ url: appPath("/og.png"), width: 1734, height: 907, alt: "哩來愛爾蘭語校直接報名" }] },
    twitter: { card: "summary_large_image", title, description, images: [appPath("/og.png")] },
    robots: { index: !noindex, follow: !noindex },
    icons: { icon: appPath("/favicon.svg"), shortcut: appPath("/favicon.svg") },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><head>
    <script async src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsTagId}`} />
    <script dangerouslySetInnerHTML={{ __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${googleAdsTagId}');
    ` }} />
  </head><body>{children}</body></html>;
}
