import { ImageResponse } from "next/og";

// PWA/브라우저용 앱 아이콘 (안드로이드·데스크톱 설치, 탭 파비콘 보조).
// 단색 배경이라 maskable 크롭에도 안전하다.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#3182f6",
          color: "#ffffff",
          fontSize: 248,
          fontWeight: 800,
          letterSpacing: "-0.04em",
        }}
      >
        HP
      </div>
    ),
    { ...size }
  );
}
