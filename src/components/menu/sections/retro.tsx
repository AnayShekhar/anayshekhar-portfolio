// Old-system separator: a 1px dashed rule (3px dash / 3px gap). `dash` overrides
// the default colour (e.g. deep teal at 40% between project entries).
export function PixelDivider({
  dash,
  className,
}: {
  dash?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pixel-divider ${className ?? ""}`}
      style={dash ? ({ ["--dash" as string]: dash } as React.CSSProperties) : undefined}
    />
  );
}
