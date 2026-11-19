import { defineRule, type ESTree } from "@oxlint/plugins";

// apps/web/DESIGN.md, Height: places take tint 1 or tint 2 and a raised part takes `raised`.
// A foreground mix this faint is a tint, and a theme surface under a state variant is a hover or
// a highlight, so either one is a step off the ladder.
const FAINT_FOREGROUND = /^bg-foreground\/(\d+)$/u;
const THEME_SURFACE = /^bg-(?:accent|muted|input)(?:\/\d+)?$/u;
const STATE_VARIANT =
  /^(?:not-)?(?:hover|focus-within|data-(?:highlighted|selected|pressed|checked|unchecked|popup-open))$|^\[:/u;
const MAX_TINT = 20;

function parseClass(token: string) {
  const variants: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < token.length; index++) {
    const character = token[index];
    if (character === "[" || character === "(") depth++;
    else if (character === "]" || character === ")") depth--;
    else if (character === ":" && depth === 0) {
      variants.push(token.slice(start, index));
      start = index + 1;
    }
  }
  return { variants, utility: token.slice(start).replace(/^!|!$/gu, "") };
}

function offenders(text: string) {
  return text
    .split(/\s+/u)
    .filter(Boolean)
    .filter((token) => {
      const { variants, utility } = parseClass(token);
      const faint = FAINT_FOREGROUND.exec(utility);
      if (faint) return Number(faint[1]) <= MAX_TINT;
      return THEME_SURFACE.test(utility) && variants.some((variant) => STATE_VARIANT.test(variant));
    });
}

export default defineRule({
  meta: {
    type: "problem",
    docs: { description: "Keep shared parts on the tone ladder: tint-1, tint-2 and raised." },
  },
  create(context) {
    const check = (node: ESTree.Node, text: string) => {
      for (const token of offenders(text)) {
        context.report({
          node,
          message: `${token} is a tint off the ladder. Use bg-tint-1 (a field, a track, a selected row), bg-tint-2 (hover, a highlighted row, an off switch) or raised.`,
        });
      }
    };
    return {
      Literal(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      TemplateLiteral(node) {
        check(node, node.quasis.map((part) => part.value.cooked ?? part.value.raw).join(" "));
      },
    };
  },
});
