type Props = {
  index: number;
  scale?: number;
  isOnlyIcon?: boolean;
};

const spriteSheets = [
  "/resources/weather_icon_1.png",
  "/resources/weather_icon_2.png",
  "/resources/weather_icon_3.png",
  "/resources/weather_icon_4.png",
];

export default function WeatherIcon({
  index,
  scale = 1,
  isOnlyIcon = false
}: Props) {
  const sheetIndex = Math.floor(index / 12);
  const localIndex = index % 12;
  const COLS = 6;
  const ROWS = 2;

  const xSize = Math.floor(640/COLS);
  const ySize = Math.floor(298 /ROWS);

  const row = Math.floor(localIndex / COLS);
  const col = localIndex % COLS;

  const x = -(col * xSize + 15)*scale;
  const y = -(row * ySize + 15)*scale;

  return (
    <div
      style={{
        width: xSize * scale,
        height: (isOnlyIcon ? xSize : ySize) * scale,
        backgroundImage: `url(${spriteSheets[sheetIndex]})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: `${x-1}px ${y-1}px`,
        backgroundSize: `${(COLS * (xSize + 10) - 30) * scale + COLS}px ${(ROWS * (ySize + 20)) * scale + ROWS}px`,
      }}
    />
  );
}