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
      path="/resources/recommandations.png"
      size={373}
      cols={4}
      rows={4}
      gap={4}
      index={index}
      scale={scale}
      className={className}
    />
  );
}