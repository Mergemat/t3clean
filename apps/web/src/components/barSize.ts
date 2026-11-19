import { createContext, useContext } from "react";

/** The bar a detail's actions sit in. Controls in a row share one height, so in the frame header
 *  they are 32 tall like the header's own, and 24 in a side panel's denser bar. */
export const BarContext = createContext<"panel" | "frame">("panel");

export function barControlSize(bar: "panel" | "frame") {
  return bar === "frame"
    ? ({ text: "sm", icon: "icon-sm", badge: "control-sm" } as const)
    : ({ text: "xs", icon: "icon-xs", badge: "control" } as const);
}

export function useBarControlSize() {
  return barControlSize(useContext(BarContext));
}
