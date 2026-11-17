/**
 * The half-step gap between rows of a virtualized list (`ItemSeparatorComponent`). Such a list
 * places each row itself, so the sibling margin that spaces other lists' rows can't reach them.
 */
export function ListRowGap() {
  return <div aria-hidden className="h-1" />;
}
