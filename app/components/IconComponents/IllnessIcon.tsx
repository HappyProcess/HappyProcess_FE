import Icon from "./Icon";

type Props = {
  index: number;
  scale?: number;
  className?: string;
};

export default function IllnessIcon({
  index,
  scale = 1,
  className = ""
}: Props) {
  return (
    <Icon
      path="/resources/illness_icons.png"
      size={373}
      cols={7}
      rows={2}
      gap={4}
      index={index}
      scale={scale}
      className={className}
    />
  );
}