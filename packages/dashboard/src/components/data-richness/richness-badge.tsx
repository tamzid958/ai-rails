import { Badge, type BadgeProps } from "../ui/badge";
import clsx from "clsx";

type DataRichness = "FULL" | "TAGGED" | "HEURISTIC" | "NONE";

const RICHNESS_CONFIG: Record<
  DataRichness,
  { variant: BadgeProps["variant"]; text: string }
> = {
  FULL: { variant: "accent", text: "FULL" },
  TAGGED: { variant: "success", text: "TAG" },
  HEURISTIC: { variant: "warning", text: "EST" },
  NONE: { variant: "default", text: "NONE" },
};

type RichnessBadgeProps = {
  richness: DataRichness;
  className?: string;
};

function RichnessBadge({ richness, className }: RichnessBadgeProps) {
  const config = RICHNESS_CONFIG[richness];

  return (
    <Badge variant={config.variant} className={clsx(className)}>
      {config.text}
    </Badge>
  );
}

export { RichnessBadge };
export type { RichnessBadgeProps, DataRichness };
