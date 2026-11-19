import { describe } from "@effect/vitest";

import { createOxlintRuleHarness } from "../test/utils.ts";

const rule = createOxlintRuleHarness("t3code/one-look-per-level", {
  filename: "apps/web/src/components/chat/Example.tsx",
});

describe("t3code/one-look-per-level", () => {
  rule.valid(
    "allows a level with layout, and pseudo-elements and children styled through variants",
    `
      const card = "level-float relative flex p-2 before:rounded-inherit *:bg-tint-1";
      const knob = "size-4 rounded-full bg-white shadow-knob";
    `,
  );

  rule.invalid("reports a surface's own blur", `const bar = "bg-tint-1 backdrop-blur-sm";`);

  rule.invalid("reports a raw popover or card fill", `const ghost = "bg-popover/95 px-2";`);

  rule.invalid("reports a scale shadow", `const row = "shadow-lg";`);

  rule.invalid("reports a corner set next to a level", `const card = "level-chat rounded-row";`);

  rule.invalid(
    "reports an edge set next to a level",
    `const card = "level-float border-border/60";`,
  );
});
