import type { Metadata } from "next";
import "./globals.css";
import Navigation from "./components/Navigation";
import MainSection from "./components/MainSection";

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
      </body>
    </html>
  );
}
