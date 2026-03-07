import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "No.S - 넘버에스 | 삼성전자 뮤지컬 동호회",
  description: "같은 무대를 꿈꾸는 사람들의 공간. 연습실 예약 현황을 한눈에 확인하고 공유하세요.",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "No.S",
  },
  metadataBase: new URL("https://samsung-musical.com"),
  openGraph: {
    title: "No.S - 삼성전자 뮤지컬 동호회",
    description: "같은 무대를 꿈꾸는 사람들의 공간. 연습실 예약 현황을 한눈에 확인하고 공유하세요.",
    siteName: "No.S",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "No.S - 삼성전자 뮤지컬 동호회",
    description: "같은 무대를 꿈꾸는 사람들의 공간. 연습실 예약 현황을 한눈에 확인하고 공유하세요.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="theme-color" content="#0066B3" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
