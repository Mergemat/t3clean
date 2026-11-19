const DIALOG_BACKDROP_BASE_CLASS =
  "fixed inset-0 z-50 transition-opacity duration-200 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0";

const DIALOG_BACKDROP_CLASS = `dialog-backdrop ${DIALOG_BACKDROP_BASE_CLASS}`;
const DIALOG_MEDIA_BACKDROP_CLASS = `${DIALOG_BACKDROP_BASE_CLASS} bg-black/75`;

const DIALOG_POPUP_BASE_CLASS =
  "relative flex min-h-0 w-full min-w-0 flex-col outline-none data-nested-dialog-open:-translate-y-5 data-nested-dialog-open:scale-90 data-nested-dialog-open:opacity-90 transition duration-200 ease-out will-change-transform data-nested:data-ending-style:translate-y-8 data-nested:data-starting-style:translate-y-8 data-nested-dialog-open:origin-top data-ending-style:scale-98 data-starting-style:scale-98 data-ending-style:opacity-0 data-starting-style:opacity-0 app-region-no-drag";

const DIALOG_POPUP_CLASS = `level-float ${DIALOG_POPUP_BASE_CLASS}`;
const DIALOG_MEDIA_POPUP_CLASS = `${DIALOG_POPUP_BASE_CLASS} max-h-9/10 w-auto max-w-9/10 overflow-visible rounded-none border border-transparent bg-transparent p-0 shadow-none`;

/** Every dialog is one of three widths: a question, a form, or content to read. */
const DIALOG_SIZE_CLASS = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
} as const;
type DialogSize = keyof typeof DIALOG_SIZE_CLASS;

/* A dialog is a float (16): what it holds (rows, fields, buttons: 8) sits one step in, so the
   corners are concentric, and text sits on its rows' text edge, one step further. */
const DIALOG_HEADER_CLASS = "flex flex-col gap-1 px-4 pt-4 pb-2";
const DIALOG_FOOTER_CLASS = "flex flex-col-reverse gap-2 p-2 sm:flex-row sm:justify-end";
const DIALOG_TITLE_CLASS = "wrap-anywhere text-heading font-medium text-ink-1";

const DIALOG_MOBILE_SHEET_CLASS =
  "max-sm:max-w-none max-sm:rounded-none max-sm:border-x-0 max-sm:border-t max-sm:border-b-0 max-sm:data-nested-dialog-open:opacity-0 max-sm:data-ending-style:translate-y-4 max-sm:data-starting-style:translate-y-4";

export type { DialogSize };
export {
  DIALOG_SIZE_CLASS,
  DIALOG_HEADER_CLASS,
  DIALOG_FOOTER_CLASS,
  DIALOG_TITLE_CLASS,
  DIALOG_BACKDROP_CLASS,
  DIALOG_MEDIA_BACKDROP_CLASS,
  DIALOG_MOBILE_SHEET_CLASS,
  DIALOG_POPUP_CLASS,
  DIALOG_MEDIA_POPUP_CLASS,
};
