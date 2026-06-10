import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});
import MainSection from "./components/MainSection";
import Navigation from "./components/Navigation";
import AlertPoller from "./components/AlertPoller";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "HappyProcess",
  description: "날씨와 건강 상태를 함께 챙기는 건강 날씨 도우미",
  // 아이폰 '홈 화면에 추가' 시 전체화면(standalone)으로 실행 + 홈 화면 앱 이름
  appleWebApp: {
    capable: true,
    title: "HappyProcess",
    statusBarStyle: "default",
  },
  // 구형 iOS Safari 호환용 레거시 메타(전체화면 실행)
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

// 모바일에서 입력창 포커스 시 화면 확대(zoom) 방지 — 전역 적용
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // 노치 영역까지 채우고(이미 safe-area-inset 사용 중) 상단 바 색을 브랜드 블루로
  viewportFit: "cover",
  themeColor: "#3182f6",
};

export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="ko" className={`${roboto.variable} h-full overflow-hidden`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="h-full flex flex-col bg-[#f2f4f6] overflow-hidden">
        <MainSection>
          <Navigation />
          {children}
        </MainSection>
        <AlertPoller />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#191f28",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "0",
              borderRadius: "14px",
              padding: "13px 18px",
            },
            error: {
              iconTheme: { primary: "#f04452", secondary: "#fff" },
            },
            success: {
              iconTheme: { primary: "#3182f6", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
