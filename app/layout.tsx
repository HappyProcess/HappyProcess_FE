import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});
import MainSection from "./components/MainSection";
import Navigation from "./components/Navigation";
import BottomNav from "./components/BottomNav";
import AlertPoller from "./components/AlertPoller";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "HappyProcess",
  description: "HappyProcess",
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
        <BottomNav />
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
