import type { Metadata } from "next";
import "./globals.css";
import Navigation from "./components/Navigation";
import MainSection from "./components/MainSection";
import Footer from "./components/Footer"
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "HappyProcess",
  description: "HappyProcess",
};

export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col">
        <Navigation/>
        <MainSection>
          {children}
        </MainSection>
        <Footer />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#1d1d1f",
              fontSize: "14px",
              letterSpacing: "-0.224px",
              borderRadius: "11px",
              border: "1px solid #e0e0e0",
              boxShadow: "rgba(0,0,0,0.22) 3px 5px 30px 0",
              padding: "12px 16px",
            },
            error: {
              iconTheme: { primary: "#cc0000", secondary: "#fff" },
            },
            success: {
              iconTheme: { primary: "#0066cc", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
