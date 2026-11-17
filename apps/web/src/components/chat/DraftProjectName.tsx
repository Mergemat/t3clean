export function DraftProjectName({
  value,
  singleLine = false,
}: {
  value: string;
  singleLine?: boolean;
}) {
  return (
    <span
      aria-label={value}
      className={`min-w-0 ${singleLine ? "block truncate text-left" : "line-clamp-2 whitespace-normal wrap-anywhere"}`}
    >
      {value}
    </span>
  );
}
