import { useSyncExternalStore } from "react";

// The grid overlay: html[data-show-grid] draws the step lines and shades every ring's inset
// (index.css), so whatever isn't shaded is off the system.
const ATTRIBUTE = "data-show-grid";

function isGridShown(): boolean {
  return document.documentElement.hasAttribute(ATTRIBUTE);
}

export function setGridShown(shown: boolean) {
  document.documentElement.toggleAttribute(ATTRIBUTE, shown);
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [ATTRIBUTE] });
  return () => observer.disconnect();
}

export function useGridShown(): boolean {
  return useSyncExternalStore(subscribe, isGridShown, () => false);
}

/** Option+Shift+G shows or hides the grid anywhere in the app. */
export function installGridShortcut() {
  window.addEventListener("keydown", (event) => {
    if (event.code !== "KeyG" || !event.altKey || !event.shiftKey) return;
    if (event.metaKey || event.ctrlKey) return;
    event.preventDefault();
    setGridShown(!isGridShown());
  });
}
