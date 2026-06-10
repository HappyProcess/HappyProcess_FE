import type { MetadataRoute } from "next";

// 홈 화면 추가(PWA) 메타. 아이폰은 홈 화면 아이콘으로 manifest의 icons가 아니라
// app/apple-icon.tsx(apple-touch-icon)를 사용하고, standalone 실행에는 layout의
// appleWebApp 메타가 필요하다. icons는 안드로이드/데스크톱 설치용.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Happy Process",
    short_name: "HappyProcess",
    description: "날씨와 건강 상태를 함께 챙기는 건강 날씨 도우미",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#3182f6",
    lang: "ko",
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
