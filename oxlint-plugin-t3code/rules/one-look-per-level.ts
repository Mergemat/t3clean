import { defineRule, type ESTree } from "@oxlint/plugins";

// apps/web/DESIGN.md, Levels: a surface's background, blur, edge, shadow and corner all come from
// its level (level-frame, level-chat, level-float), so every item on a level looks the same.
const OWN_MATERIAL =
  /^(?:backdrop-.+|bg-(?:popover|card)(?:\/\d+)?|(?:inset-)?shadow-(?:2xs|xs|sm|md|lg|xl|2xl)(?:\/\d+)?)$/u;
const LEVEL = /^level-(?:frame|chat|float)$/u;
const PSEUDO = /^(?:before|after|\*|\*\*|\[.*\])$/u;

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
  const tokens = text.split(/\s+/u).filter(Boolean).map(parseClass);
  const hasLevel = tokens.some((token) => LEVEL.test(token.utility));
  const found: { label: string; why: string }[] = [];
  for (const { variants, utility } of tokens) {
    const label = [...variants, utility].join(":");
    if (OWN_MATERIAL.test(utility)) {
      found.push({ label, why: "sets a surface's own background, blur or shadow" });
      continue;
    }
    // Next to a level, the element's own box takes nothing but the level's look; children and
    // pseudo-elements reached through a variant are their own boxes.
    if (!hasLevel || variants.some((variant) => PSEUDO.test(variant))) continue;
    if (/^rounded(?:-|$)/u.test(utility) && utility !== "rounded-inherit")
      found.push({ label, why: "sets a corner next to a level, which owns the corner" });
    else if (/^bg-/u.test(utility) && variants.length === 0)
      found.push({ label, why: "sets a background next to a level, which owns the background" });
    else if (/^border-(?!0$|[xytblrse]-0$)/u.test(utility) && variants.length === 0)
      found.push({ label, why: "sets an edge next to a level, which owns the edge" });
  }
  return found;
}

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Every surface takes its whole look (background, blur, edge, shadow, corner) from its level.",
    },
  },
  create(context) {
    const check = (node: ESTree.Node, text: string) => {
      for (const { label, why } of offenders(text)) {
        context.report({
          node,
          message: `${label} ${why}. Give the surface its level instead: level-frame (sidebar, header, bars), level-chat (messages, code, the composer) or level-float (details, menus, popovers, dialogs, toasts, tooltips).`,
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
