import Icon from "./Icon"
type Props = {
  index: number;
  scale?: number;
  className?: string;
};

export default function ConditionIcon({
  index,
  scale = 1,
  className = ""
}: Props) {
  return (
    <Icon
      path="/resources/condition_icon.png"
      size={200}
      cols={2}
      rows={1}
      gap={4}
      index={index}
      scale={scale}
      className={className}
    />
  );
}