import { ImageResponse } from "next/og";

// 아이폰 홈 화면 아이콘(apple-touch-icon). iOS는 manifest icons가 아니라 이 파일을 쓴다.
// iOS가 모서리를 둥글게 처리하므로 배경은 불투명한 단색으로 채운다.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 88,
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
