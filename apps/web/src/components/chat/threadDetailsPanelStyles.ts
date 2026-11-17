const THREAD_DETAILS_PANEL_RESTING_BUTTON_SURFACE_CLASS = "bg-transparent shadow-none";

const THREAD_DETAILS_PANEL_HOVER_SURFACE_CLASS =
  "hover:!bg-black/4 data-pressed:!bg-black/4 dark:hover:!bg-white/8 dark:data-pressed:!bg-white/8";

const THREAD_DETAILS_PANEL_HALF_HOVER_SURFACE_CLASS = "hover:bg-black/4 dark:hover:bg-white/8";

const THREAD_DETAILS_PANEL_ROW_SURFACE_CLASS = `${THREAD_DETAILS_PANEL_RESTING_BUTTON_SURFACE_CLASS} ${THREAD_DETAILS_PANEL_HOVER_SURFACE_CLASS}`;
const THREAD_DETAILS_PANEL_SPLIT_BUTTON_SURFACE_CLASS = `${THREAD_DETAILS_PANEL_ROW_SURFACE_CLASS} data-popup-open:!bg-black/4 dark:data-popup-open:!bg-white/8`;

export const THREAD_DETAILS_PANEL_ROW_CONTENT_CLASS = "gap-2 px-2 text-left";

export const THREAD_DETAILS_PANEL_LABEL_CLASS = "text-box-trim overflow-x-clip overflow-y-visible";

const THREAD_DETAILS_PANEL_CONTROL_CLASS = `h-8 min-w-0 rounded-row border-0 ${THREAD_DETAILS_PANEL_ROW_CONTENT_CLASS} text-body text-ink-2`;

export const THREAD_DETAILS_PANEL_ROW_CLASS = `${THREAD_DETAILS_PANEL_CONTROL_CLASS} w-full justify-start ${THREAD_DETAILS_PANEL_ROW_SURFACE_CLASS}`;

// A split control is a row and an icon button side by side (DESIGN.md): two shapes with their own
// corners, half a step apart, and only the one under the pointer fills.
export const THREAD_DETAILS_PANEL_SELECT_ROW_CLASS = `${THREAD_DETAILS_PANEL_CONTROL_CLASS} w-full justify-start gap-1 px-0 ${THREAD_DETAILS_PANEL_RESTING_BUTTON_SURFACE_CLASS} [&_[data-slot=select-icon]]:flex [&_[data-slot=select-icon]]:size-8 [&_[data-slot=select-icon]]:shrink-0 [&_[data-slot=select-icon]]:items-center [&_[data-slot=select-icon]]:justify-center [&_[data-slot=select-icon]>svg]:size-4 [&_[data-slot=select-icon]>svg]:text-ink-2`;

export const THREAD_DETAILS_PANEL_SELECT_LABEL_CLASS = `flex h-full min-w-0 flex-1 items-center rounded-row ${THREAD_DETAILS_PANEL_ROW_CONTENT_CLASS} ${THREAD_DETAILS_PANEL_HALF_HOVER_SURFACE_CLASS}`;

export const THREAD_DETAILS_PANEL_SELECT_ICON_CLASS = `rounded-row ${THREAD_DETAILS_PANEL_HALF_HOVER_SURFACE_CLASS}`;

export const THREAD_DETAILS_PANEL_LOCKED_ROW_CLASS = `h-8 w-full min-w-0 justify-start rounded-row border border-transparent ${THREAD_DETAILS_PANEL_ROW_CONTENT_CLASS} text-body text-ink-2 sm:h-8 sm:text-body`;

export const THREAD_DETAILS_PANEL_ICON_CLASS = "size-4 shrink-0 text-ink-2";

export const THREAD_DETAILS_PANEL_CHEVRON_CLASS = "size-4 shrink-0 text-ink-2";

export const THREAD_DETAILS_PANEL_ICON_ACTION_CLASS = `size-6 justify-center rounded-row border-transparent bg-transparent p-0 sm:size-6 ${THREAD_DETAILS_PANEL_ROW_SURFACE_CLASS}`;

export const THREAD_DETAILS_PANEL_META_ACTION_CLASS = `h-6 gap-1 rounded-row border-transparent px-2 text-meta font-medium text-ink-2 ${THREAD_DETAILS_PANEL_ROW_SURFACE_CLASS}`;

export const THREAD_DETAILS_PANEL_SPLIT_GROUP_CLASS =
  "group/details-split flex w-full items-center gap-1";

export const THREAD_DETAILS_PANEL_SPLIT_PRIMARY_CLASS = `${THREAD_DETAILS_PANEL_CONTROL_CLASS} flex-1 justify-start ${THREAD_DETAILS_PANEL_SPLIT_BUTTON_SURFACE_CLASS}`;

export const THREAD_DETAILS_PANEL_SPLIT_SECONDARY_CLASS = `${THREAD_DETAILS_PANEL_CONTROL_CLASS} size-8 justify-center px-0 ${THREAD_DETAILS_PANEL_SPLIT_BUTTON_SURFACE_CLASS}`;

// The halves are separate shapes now, so nothing draws between them.
export const THREAD_DETAILS_PANEL_SPLIT_SEPARATOR_CLASS = "hidden";
