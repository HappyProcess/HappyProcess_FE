type Props = {
  path: string;
  size: number;
  cols: number;
  rows: number;
  gap: number;
  index: number;
  scale?: number;
  className?: string;
};
export default function Icon({
  path,
  size,
  cols,
  rows,
  gap,
  index,
  scale = 1,
  className = ""
}: Props) {
  const SHEET_WIDTH = (size + gap) * cols - gap
  const SHEET_HEIGHT = (size + gap) * rows - gap

  const row = Math.floor(index / cols);
  const col = index % cols;

  const scaledIcon = size * scale;
  const scaledStep = (size + gap) * scale;

  const x = -(col * scaledStep);
  const y = -(row * scaledStep);
  return (
    <div
      className={className}
      style={{
        width: scaledIcon,
        height: scaledIcon,
        backgroundImage: `url(${path})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: `${x}px ${y}px`,
        backgroundSize: `${SHEET_WIDTH * scale}px ${SHEET_HEIGHT * scale}px`,
      }}
    />
  );
}