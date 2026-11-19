import { describe } from "@effect/vitest";

import { createOxlintRuleHarness } from "../test/utils.ts";

const rule = createOxlintRuleHarness("t3code/no-off-ladder-tints", {
  filename: "apps/web/src/components/ui/example.tsx",
});

describe("t3code/no-off-ladder-tints", () => {
  rule.valid(
    "allows the ladder, solid foreground fills and separator lines",
    `
      const field = "bg-tint-1 focus-within:bg-tint-2 data-pressed:raised";
      const knob = "dark:data-unchecked:bg-foreground/80";
      const line = "dark:*:[[data-slot=separator]:has(+[data-slot=toggle]:hover)]:before:bg-input/64";
    `,
  );

  rule.invalid("reports a faint foreground mix", `const row = "data-highlighted:bg-foreground/9";`);

  rule.invalid("reports a theme surface used as a hover", `const ghost = "hover:bg-accent";`);

  rule.invalid(
    "reports a theme surface under an arbitrary state variant",
    "const ghost = `[:hover,[data-pressed]]:bg-muted/40`;",
  );
});
