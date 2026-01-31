interface CategoryBadgeProps {
  name: string;
  colorHex?: string | null;
}

export function CategoryBadge({ name, colorHex }: CategoryBadgeProps) {
  if (!name) return null;

  return (
    <span
      className="inline-block max-w-[120px] truncate rounded-md px-1.5 py-0.5 text-[10px] sm:text-xs leading-tight"
      style={{
        backgroundColor: colorHex ? `${colorHex}20` : "rgba(255,255,255,0.08)",
        color: colorHex ?? "rgb(156, 163, 175)",
      }}
    >
      {name}
    </span>
  );
}
