import { useState } from "react";

type Props = {
  index?: number;
  scale?: number;
  className?: string;
};

const path = "/resources/switch.png";
const size = 412;
const cols = 1;
const rows = 2;
const gap = 0;

export default function switchIcon({
  scale = 1,
  className = "",
}: Props) {
  const [isOn, setOn] = useState(false);

  const SHEET_WIDTH = (size + gap) * cols - gap
  const SHEET_HEIGHT = (size + gap) * rows - gap

  const row = Math.floor(Number(isOn) / cols);
  const col = Number(isOn) % cols;

  const scaledIcon = size * scale;
  const scaledStep = (size + gap) * scale;

  const x = -(col * scaledStep);
  const y = -(row * scaledStep);
  return (
    <div
      className={className}
      style={{
        width: scaledIcon,
        height: scaledIcon/2,
        backgroundImage: `url(${path})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: `${x}px ${y - scaledIcon / 4}px`,
        backgroundSize: `${SHEET_WIDTH * scale}px ${SHEET_HEIGHT * scale}px`,
      }}
      onClick={() => setOn(!isOn)}
    />
  );
}