import { useRouterState } from "@tanstack/react-router";

/** The settings section on screen. The address switches before the new section's code loads, and
 *  the resolved location trails its render, so layout read from either dresses one section as the
 *  other. The rendered route match changes together with the content. */
export function useSettingsPathname() {
  return useRouterState({
    select: (state) => state.matches.at(-1)?.pathname ?? state.location.pathname,
  });
}
