import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";
import { AppHeader } from "@/components/app-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 뉴스 수집기",
  description: "해외 AI 뉴스를 한국어로 요약해 카테고리별 카드로 보여주는 앱",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider localization={koKR}>
      <html
        lang="ko"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-background font-sans text-fg">
          {/* 로그인 상태는 요청마다 달라지므로 Suspense 안에서 렌더링 (cacheComponents) */}
          <Suspense fallback={<div className="h-14 border-b border-border bg-surface" />}>
            <AppHeader />
          </Suspense>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
