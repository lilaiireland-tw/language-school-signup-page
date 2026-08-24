import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "愛爾蘭語校直接報名與選校協助｜哩來愛爾蘭";
const description = "已經大致選好愛爾蘭語言學校？可直接提交報名需求，或預約一對一選校諮詢。7 日內完成訂金享半價，直接報名 25+8 長期課程再享限定權益。";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "example.com";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);
  const noindex = process.env.NEXT_PUBLIC_NOINDEX === "true";

  return {
    title,
    description,
    metadataBase: baseUrl,
    alternates: { canonical: "https://lilaiireland.com/" },
    openGraph: { title, description, type: "website", locale: "zh_TW", images: [{ url: "/og.png", width: 1734, height: 907, alt: "哩來愛爾蘭語校直接報名" }] },
    twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
    robots: { index: !noindex, follow: !noindex },
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
