const DIALOG_BACKDROP_BASE_CLASS =
  "fixed inset-0 z-50 transition-opacity duration-200 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0";

const DIALOG_BACKDROP_CLASS = `dialog-backdrop ${DIALOG_BACKDROP_BASE_CLASS}`;
const DIALOG_MEDIA_BACKDROP_CLASS = `${DIALOG_BACKDROP_BASE_CLASS} bg-black/75 backdrop-blur-none`;

const DIALOG_POPUP_BASE_CLASS =
  "relative flex min-h-0 w-full min-w-0 flex-col outline-none data-nested-dialog-open:-translate-y-5 data-nested-dialog-open:scale-90 data-nested-dialog-open:opacity-90 transition duration-200 ease-out will-change-transform data-nested:data-ending-style:translate-y-8 data-nested:data-starting-style:translate-y-8 data-nested-dialog-open:origin-top data-ending-style:scale-98 data-starting-style:scale-98 data-ending-style:opacity-0 data-starting-style:opacity-0 app-region-no-drag";

const DIALOG_POPUP_CLASS = `dialog-glass ${DIALOG_POPUP_BASE_CLASS} rounded-box border`;
const DIALOG_MEDIA_POPUP_CLASS = `${DIALOG_POPUP_BASE_CLASS} max-h-9/10 w-auto max-w-9/10 overflow-visible rounded-none border border-transparent bg-transparent p-0 shadow-none`;

const DIALOG_MOBILE_SHEET_CLASS =
  "max-sm:max-w-none max-sm:rounded-none max-sm:border-x-0 max-sm:border-t max-sm:border-b-0 max-sm:data-nested-dialog-open:opacity-0 max-sm:data-ending-style:translate-y-4 max-sm:data-starting-style:translate-y-4";

export {
  DIALOG_BACKDROP_CLASS,
  DIALOG_MEDIA_BACKDROP_CLASS,
  DIALOG_MOBILE_SHEET_CLASS,
  DIALOG_POPUP_CLASS,
  DIALOG_MEDIA_POPUP_CLASS,
};
