#!/usr/bin/env node

// Moves every class in apps/web/src onto the grid (apps/web/DESIGN.md). After merging upstream,
// take upstream's side of a conflicting class string, run `pnpm tokens`, then lint what's left.

import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";
import { Command, Flag } from "effect/cli";

const ROOT = "apps/web/src";

// Spacing scale: 2px steps up to 16px, 4px steps above. Sizes use the same scale.
const SCALE_UTILS = new Set(
  (
    "p px py pt pr pb pl ps pe m mx my mt mr mb ml ms me gap gap-x gap-y space-x space-y " +
    "inset inset-x inset-y top right bottom left start end translate-x translate-y " +
    "scroll-m scroll-mt scroll-mb scroll-p scroll-pt scroll-pb scroll-px scroll-py indent " +
    "w h size min-w min-h max-w max-h basis"
  ).split(" "),
);
const FRACTION_UTILS = new Set(
  "w h size min-w min-h max-w max-h basis inset inset-x inset-y top right bottom left start end translate-x translate-y".split(
    " ",
  ),
);
// Text sizes in px, from the theme's --text-* tokens and Tailwind's defaults.
const TEXT_SIZES: ReadonlyArray<readonly [number, string]> = [
  [7, "5xs"],
  [8, "4xs"],
  [10, "3xs"],
  [11, "2xs"],
  [12, "xs"],
  [14, "sm"],
  [16, "base"],
  [18, "lg"],
  [20, "xl"],
  [24, "2xl"],
];
const TRANSITIONS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^opacity$/, "transition-opacity"],
  [/^(?:(?:transform|translate|scale|rotate),?)+$/, "transition-transform"],
  [
    /^(?:(?:color|background-color|border-color|fill|stroke|text-decoration-color),?)+$/,
    "transition-colors",
  ],
  [/^(?:box-shadow|shadow)$/, "transition-shadow"],
  // `transition` alone skips layout properties, so anything that animates size or position needs all.
  [
    /(?:height|width|padding|margin|grid-template|inset|top|left|right|bottom|flex)/,
    "transition-all",
  ],
];

// Radius scale in px, from the theme's --radius-* tokens (shadcn's multiples of a 10px --radius).
const RADII: ReadonlyArray<readonly [number, string]> = [
  [2, "xs"],
  [6, "sm"],
  [8, "md"],
  [10, "lg"],
  [14, "xl"],
  [18, "2xl"],
  [22, "3xl"],
  [26, "4xl"],
];
// Selectors, not values: arbitrary variants are how Tailwind targets state, and stay.
const VARIANT_UTIL = /^(?:group|peer|has|not|in|data|aria|supports|nth)(?:-|$)/;

/** Named tokens for values the rules above can't express. Exact source token → replacement. */
const TABLE: Record<string, string> = {
  "shadow-[0_1px_--theme(--color-black/4%)]": "shadow-edge-light",
  "shadow-[0_-1px_--theme(--color-white/6%)]": "shadow-edge-dark",
  "shadow-[0_-1px_--theme(--color-white/2%)]": "shadow-edge-dark-faint",
  "inset-shadow-[0_1px_--theme(--color-white/16%)]": "inset-shadow-control-highlight",
  "inset-shadow-[0_1px_--theme(--color-black/8%)]": "inset-shadow-control-pressed",
  "size-[1em]": "size-em",
  "min-h-[1lh]": "min-h-lh",
  "h-[1cap]": "h-cap",
  "max-h-[inherit]": "max-h-inherit",
  "grid-rows-[1fr]": "grid-rows-(--grid-open)",
  "grid-rows-[0fr]": "grid-rows-(--grid-closed)",
  "grid-cols-[minmax(0,1fr)_auto]": "grid-cols-(--grid-trail)",
  "grid-cols-[1fr_auto]": "grid-cols-(--grid-trail)",
  "grid-cols-[auto_1fr]": "grid-cols-(--grid-lead)",
  "grid-cols-[auto_minmax(0,1fr)]": "grid-cols-(--grid-lead)",
  "grid-cols-[auto_minmax(0,1fr)_auto]": "grid-cols-(--grid-lead-trail)",
  "grid-cols-[1rem_minmax(0,1fr)]": "grid-cols-(--grid-lead)",
  "grid-cols-[1rem_minmax(0,1fr)_auto]": "grid-cols-(--grid-lead-trail)",
  "grid-rows-[1fr_auto]": "grid-rows-(--grid-trail)",
  "grid-rows-[minmax(0,1fr)]": "grid-rows-1",
  "max-w-[calc(100vw-2rem)]": "max-w-(--viewport-inset)",
  "max-w-[calc(100vw-1rem)]": "max-w-(--viewport-inset)",
};

/** Standalone arbitrary properties → the utility named after that property. */
const PROPERTIES: Record<string, string> = {
  "[-webkit-app-region:no-drag]": "app-region-no-drag",
  "[content-visibility:auto]": "content-visibility-auto",
  "[overflow-anchor:none]": "overflow-anchor-none",
  "[text-box:trim-both_cap_alphabetic]": "text-box-trim",
  "[scrollbar-width:none]": "scrollbar-none",
  "[container-type:size]": "@container-size",
};

function toPx(value: string): number | null {
  const m = /^(-?\d*\.?\d+)(px|rem)$/.exec(value);
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] === "rem" ? n * 16 : n;
}

function scaleKey(px: number): string {
  if (px === 1) return "px";
  const steps = px / 4;
  const snapped = steps <= 4 ? Math.round(steps * 2) / 2 : Math.round(steps);
  return String(snapped);
}

function fractionKey(percent: number): string {
  if (percent === 100) return "full";
  const twentieths = Math.max(1, Math.round(percent / 5));
  if (twentieths === 20) return "full";
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(twentieths, 20);
  return `${twentieths / d}/${20 / d}`;
}

function nearestText(px: number): string {
  let best = TEXT_SIZES[0]!;
  for (const entry of TEXT_SIZES)
    if (Math.abs(entry[0] - px) < Math.abs(best[0] - px)) best = entry;
  return best[1];
}

function nearestRadius(px: number): string {
  let best = RADII[0]!;
  for (const entry of RADII) if (Math.abs(entry[0] - px) < Math.abs(best[0] - px)) best = entry;
  return best[1];
}

/** `neg` is a leading "-" on the utility; returns the full replacement utility or null. */
function convert(neg: boolean, util: string, value: string): string | null {
  const sign = neg ? "-" : "";
  const number = /^(\d*\.?\d+)$/.exec(value);
  if (number && /^scale(?:-[xy])?$/.test(util))
    return `${sign}${util}-${Math.round(Number(value) * 100)}`;
  if (/^ring(?:-offset)?$/.test(util) || util === "border" || util === "outline") {
    const px = toPx(value);
    if (px !== null) return `${util}-${Math.round(px)}`;
  }
  if (util === "aspect" && /^\d+\/\d+$/.test(value)) return `aspect-${value}`;
  const varRef = /^var\((--[\w-]+)\)$/.exec(value);
  if (varRef) return `${sign}${util}-(${varRef[1]})`;

  if (SCALE_UTILS.has(util)) {
    const spacing =
      /^calc\(--spacing\((\d*\.?\d+)\)(?:-1px)?\)$/.exec(value) ??
      /^--spacing\((\d*\.?\d+)\)$/.exec(value);
    if (spacing) return `${sign}${util}-${spacing[1]}`;
    const px = toPx(value);
    if (px !== null) {
      const negative = px < 0 !== neg;
      const key = scaleKey(Math.abs(px));
      return key === "0" ? `${util}-0` : `${negative ? "-" : ""}${util}-${key}`;
    }
    const percent = /^(\d*\.?\d+)%$/.exec(value);
    if (percent && FRACTION_UTILS.has(util))
      return `${sign}${util}-${fractionKey(Number(percent[1]))}`;
  }

  if (util === "z" && /^\d+$/.test(value)) return `z-${value}`;
  if (util === "text") {
    const px = toPx(value);
    if (px !== null) return `text-${nearestText(px)}`;
  }
  if (util === "transition") {
    for (const [pattern, replacement] of TRANSITIONS) if (pattern.test(value)) return replacement;
    return "transition";
  }
  if (
    util.startsWith("rounded") &&
    (value === "inherit" || /^calc\(var\(--(?:radius(?:-\w+)?|control-radius)\)-1px\)$/.test(value))
  )
    return `${util}-inherit`;
  if (util.startsWith("rounded")) {
    const px = toPx(value);
    if (px !== null) return `${util}-${nearestRadius(px)}`;
  }
  return null;
}

// util-[value], not followed by ":" (that would be an arbitrary variant like data-[state=open]:).
const TOKEN = /(^|[\s"'`{(:!])(-?)([a-z][a-z0-9-]*?)-\[([^\]\s"'`]+)\](?!:)/g;

const unmapped = new Map<string, number>();
let changed = 0;

// [property:value] as a whole class (variants before it are kept by the lead group).
const PROPERTY = /(^|[\s"'`{(:!])(\[-?[a-z-]+:[^\]\s"'`]+\])(?=[\s"'`})]|$)/g;
// bg-foreground/[0.04] → bg-foreground/4: opacity modifiers are whole percentages.
const OPACITY = /\/\[(0?\.\d+)\]/g;

function propertyClass(token: string): string | null {
  const intrinsic =
    /^\[contain-intrinsic-(?:block-)?size:(?:auto_)?(?:(\d*\.?\d+)px|--spacing\((\d*\.?\d+)\))\]$/.exec(
      token,
    );
  if (intrinsic) return `contain-intrinsic-block-${intrinsic[2] ?? scaleKey(Number(intrinsic[1]))}`;
  return PROPERTIES[token] ?? null;
}

// The grid (apps/web/DESIGN.md): layout lands on whole steps (even numbers on Tailwind's scale);
// half steps only inside a control (components/ui) or something smaller than a row. Each string
// literal is one element's classes, so it is the context for choices that depend on the element.
const CLASS_TOKEN =
  /(^|[\s"'`{(])((?:[^\s"'`{}()]*?:)?)(-?)([a-z][a-z0-9.-]*(?:\/\d+)?)(!?)(?=[\s"'`})]|$)/g;
// A class after an arbitrary variant such as [&_svg:not([class*='size-'])]:size-4.
const ARBITRARY_VARIANT = /(\]:)(-?)([a-z][a-z0-9.-]*)(?=[\s"'`]|$)/g;
const LITERAL = /"[^"\n]*"|'[^'\n]*'|`[^`]*`/g;
const SPACING =
  /^(p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y)-(\d*\.?\d+|part|item|group|section|label)$/;
const POSITION =
  /^(inset|inset-x|inset-y|top|right|bottom|left|start|end|translate-x|translate-y)-(\d*\.\d+)$/;
const SIZE =
  /^(w|h|size|min-w|min-h|max-w|max-h|basis|leading)-(\d*\.?\d+|control-sm|control-md|control-lg|icon)$/;
const TEXT_SIZE = /^text-(xs|2xs|3xs|4xs|5xs|sm|lg|xl|2xl)(?:\/\d+)?$/;
const INK =
  /^text-(foreground|muted-foreground|secondary-label|sidebar-muted-foreground|placeholder|icon-muted)(?:\/(\d+))?$/;
const RADIUS =
  /^rounded(-(?:t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee))?(?:-(xs|sm|md|lg|xl|2xl|3xl|4xl|control-sm|control-md|control-lg|float|card))?$/;
const NAMED_SPACE: Record<string, number> = { part: 1, item: 2, section: 6, label: 8 };
const NAMED_SIZE: Record<string, number> = {
  "control-sm": 6,
  "control-md": 8,
  "control-lg": 10,
  icon: 4,
};
const LOOKS_LIKE_CLASSES =
  /(?:^|\s)(?:flex|grid|inline-flex|items-\w+|p[xy]?-\S+|h-\S+|bg-\S+)(?=\s|$)/;
const SMALL_SIZE = /(?:^|\s)(?:h|size)-(\d*\.?\d+)(?=\s|$)/;

interface Context {
  readonly float: boolean;
  readonly small: boolean;
  readonly classes: boolean;
  readonly control: boolean;
}

// The nearest whole half step; a tie goes up below 3 (a small icon) and to even above that.
function nearestHalfStep(n: number): number {
  const lo = Math.floor(n);
  if (n - lo !== 0.5) return Math.round(n);
  return lo < 3 || lo % 2 === 1 ? lo + 1 : lo;
}

/** The nearest even number; a tie goes to the multiple of 4, or down when `down` is set. */
function nearestEven(n: number, down = false): number {
  const lo = Math.floor(n / 2) * 2;
  const hi = lo + 2;
  if (n - lo < hi - n) return lo;
  if (hi - n < n - lo) return hi;
  return down ? lo : lo % 4 === 0 ? lo : hi;
}

function spacingValue(util: string, n: number, context: Context): number | null {
  const padding = util.startsWith("p");
  if (padding && context.float && n === 1) return 2;
  if (n === 0 || n === 1) return n;
  if (n < 1) return padding ? 1 : null;
  if (context.control) return nearestHalfStep(n);
  return nearestEven(n, !padding);
}

// Below a row, or inside a control, any half step works.
function sizeValue(n: number, control = false): number {
  return n >= 6 && !control ? nearestEven(n) : nearestHalfStep(n);
}

// "" drops the class.
function gridClass(util: string, context: Context): string | null {
  const spacing = SPACING.exec(util);
  if (spacing) {
    const name = spacing[2]!;
    if (name in NAMED_SPACE) {
      const steps =
        name === "part" && context.float && spacing[1]!.startsWith("p") ? 2 : NAMED_SPACE[name]!;
      return `${spacing[1]}-${steps}`;
    }
    if (name === "group") return `${spacing[1]}-${spacing[1]!.startsWith("p") ? 4 : 2}`;
    if (!/^\d*\.?\d+$/.test(name)) return null;
    const n = Number(name);
    const value = spacingValue(spacing[1]!, n, context);
    if (value === null) return "";
    return value === n ? null : `${spacing[1]}-${String(value)}`;
  }
  const position = POSITION.exec(util);
  if (position) return `${position[1]}-${Math.round(Number(position[2]))}`;
  const size = SIZE.exec(util);
  if (size) {
    const name = size[2]!;
    if (name in NAMED_SIZE) return `${size[1]}-${NAMED_SIZE[name]}`;
    if (!/^\d*\.?\d+$/.test(name)) return null;
    const n = Number(name);
    const value = sizeValue(n, context.control);
    return value === n ? null : `${size[1]}-${String(value)}`;
  }
  const text = TEXT_SIZE.exec(util);
  if (text) {
    const step = text[1]!;
    return step === "sm" ? "text-body" : /^(lg|xl|2xl)$/.test(step) ? "text-title" : "text-meta";
  }
  const ink = INK.exec(util);
  if (ink) {
    const opacity = ink[2] === undefined ? 100 : Number(ink[2]);
    if (ink[1] === "placeholder" || ink[1] === "icon-muted") return "text-ink-3";
    if (ink[1] === "foreground")
      return opacity >= 85 ? "text-ink-1" : opacity >= 55 ? "text-ink-2" : "text-ink-3";
    return opacity >= 70 ? "text-ink-2" : "text-ink-3";
  }
  const controlRadius =
    /^rounded(-(?:t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee))?-\(--control-radius\)$/.exec(util);
  if (controlRadius) return `rounded${controlRadius[1] ?? ""}-row`;
  const radius = RADIUS.exec(util);
  if (radius) {
    const side = radius[1] ?? "";
    const step = radius[2];
    if (step === undefined && !context.classes) return null;
    const ring =
      step === undefined || step === "xs" || step === "sm"
        ? "chip"
        : /^(md|lg|control-)/.test(step)
          ? context.small
            ? "chip"
            : "row"
          : "box";
    return `rounded${side}-${ring}`;
  }
  return null;
}

function contextOf(literal: string, control: boolean): Context {
  const small = SMALL_SIZE.exec(literal);
  return {
    control,
    float: /\b(?:rounded-float|dropdown-glass)\b/.test(literal),
    small: small !== null && Number(small[1]) < 6 && !/\bh-control-/.test(literal),
    classes: LOOKS_LIKE_CLASSES.test(literal),
  };
}

// An icon nudged down to meet the first line of its text instead takes the line's height, which
// centres it on that line.
function lineIcon(literal: string): string {
  if (!/(^|[\s"'`])mt-0\.5(?=[\s"'`]|$)/.test(literal)) return literal;
  const sizes = literal.match(/(?:^|[\s"'`])size-(\d*\.?\d+)(?=[\s"'`]|$)/g);
  if (sizes?.length !== 1) return literal;
  changed += 1;
  return literal
    .replace(/(^|[\s"'`])mt-0\.5(?=[\s"'`]|$)/, "$1h-lh")
    .replace(
      /(^|[\s"'`])size-(\d*\.?\d+)(?=[\s"'`]|$)/,
      (_m, lead: string, n: string) => `${lead}w-${sizeValue(Number(n))}`,
    );
}

function gridLiteral(literal: string, control: boolean): string {
  const source = lineIcon(literal);
  const context = contextOf(source, control);
  const mapped = source
    .replace(ARBITRARY_VARIANT, (whole, lead: string, neg: string, util: string) => {
      const next = gridClass(util, context);
      if (next === null || next === "") return whole;
      changed += 1;
      return `${lead}${neg}${next}`;
    })
    .replace(
      CLASS_TOKEN,
      (whole, lead: string, variants: string, neg: string, util: string, bang: string) => {
        const next = gridClass(util, context);
        if (next === null) return whole;
        changed += 1;
        if (next === "") return /\s/.test(lead) ? "" : lead;
        return `${lead}${variants}${neg}${next}${bang}`;
      },
    );
  if (mapped === source) return source;
  const quote = mapped[0]!;
  if (quote === "`") return mapped;
  // Keep the edges the literal had: a leading space may be joining it to another string.
  const before = /^\s/.test(source.slice(1, -1)) ? " " : "";
  const after = /\s$/.test(source.slice(1, -1)) ? " " : "";
  return `${quote}${before}${mapped.slice(1, -1).trim()}${after}${quote}`;
}

function grid(source: string, control = false): string {
  return source.replace(LITERAL, (literal) => gridLiteral(literal, control));
}

function rewrite(source: string): string {
  source = source.replace(OPACITY, (whole, fraction: string) => {
    changed += 1;
    return `/${Math.round(Number(fraction) * 100)}`;
  });
  source = source.replace(PROPERTY, (whole, lead: string, token: string) => {
    const mapped = propertyClass(token);
    if (mapped === null) return whole;
    changed += 1;
    return `${lead}${mapped}`;
  });
  return source.replace(TOKEN, (whole, lead: string, neg: string, util: string, value: string) => {
    const original = `${neg}${util}-[${value}]`;
    if (VARIANT_UTIL.test(util) || value.includes("[")) return whole;
    const mapped = TABLE[original] ?? convert(neg === "-", util, value);
    if (mapped === null) {
      unmapped.set(original, (unmapped.get(original) ?? 0) + 1);
      return whole;
    }
    changed += 1;
    return `${lead}${mapped}`;
  });
}

// CSS: lengths on spacing and sizing properties read from the same scales. Token definitions
// that are themselves scales (--text-*, --radius-*), measurements (--app-corner) and hairlines stay.
const CSS_FILE = `${ROOT}/index.css`;
const LENGTH_PROPS =
  /^(?:padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left|width|height|min-width|min-height|max-width|max-height)(?:-[a-z-]+)?$|^--[\w-]*(?:inset|gap|gutter|offset|width|height|size|max-width)(?:-[\w-]+)?$/;
const KEEP_PROPS = /^--(?:text|radius|shadow|font|glass|surface-grain|app-corner|app-scrollbar)/;
const CSS_DECLARATION = /(^|[;{\s])(--[\w-]+|[a-z-]+)(\s*:\s*)([^;{}]+);/g;

function rewriteCssValue(prop: string, value: string): string {
  if (KEEP_PROPS.test(prop) || value.includes("--spacing(")) return value;
  if (prop === "font-size") {
    const px = toPx(value.trim());
    return px === null ? value : value.replace(value.trim(), `var(--text-${nearestText(px)})`);
  }
  if (prop === "border-radius") {
    const px = toPx(value.trim());
    if (px === null || px >= 999) return value;
    return value.replace(value.trim(), `var(--radius-${nearestRadius(px)})`);
  }
  if (!LENGTH_PROPS.test(prop)) return value;
  // Literals outside env() fallbacks; 0-2px are hairlines and stay.
  let depthInEnv = 0;
  return value.replace(
    /env\(|\)|(-?\d*\.?\d+)(px|rem)\b/g,
    (match, num?: string, unit?: string) => {
      if (match === "env(") {
        depthInEnv += 1;
        return match;
      }
      if (match === ")") {
        if (depthInEnv > 0) depthInEnv -= 1;
        return match;
      }
      if (depthInEnv > 0 || num === undefined || unit === undefined) return match;
      const px = unit === "rem" ? Number(num) * 16 : Number(num);
      if (Math.abs(px) <= 2) return match;
      const key = scaleKey(Math.abs(px));
      return px < 0 ? `calc(--spacing(${key}) * -1)` : `--spacing(${key})`;
    },
  );
}

function rewriteCss(source: string): string {
  // Comments can hold "prop: value;" prose; leave them untouched.
  return source
    .split(/(\/\*[\s\S]*?\*\/)/)
    .map((chunk) =>
      chunk.startsWith("/*")
        ? chunk
        : chunk.replace(
            CSS_DECLARATION,
            (whole, lead: string, prop: string, colon: string, value: string) => {
              if (prop.startsWith("@")) return whole;
              const next = rewriteCssValue(prop, value);
              if (next !== value) changed += 1;
              return `${lead}${prop}${colon}${next};`;
            },
          ),
    )
    .join("");
}

class OffGridClassesError extends Schema.TaggedError<OffGridClassesError>()("OffGridClassesError", {
  changed: Schema.Number,
}) {
  override get message() {
    return `${this.changed} classes are off the grid; run pnpm tokens`;
  }
}

const tokenizeClasses = Command.make("tokenize-classes", {
  check: Flag.Boolean("check").pipe(
    Flag.withDescription("Report what would change without writing."),
    Flag.withDefault(false),
  ),
}).pipe(
  Command.withDescription("Move every class onto the grid (apps/web/DESIGN.md)."),
  Command.withHandler(({ check }) =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const update = Effect.fn("TokenizeClasses.update")(function* (
        file: string,
        transform: (source: string) => string,
      ) {
        const source = yield* fs.readFileString(file);
        const next = transform(source);
        if (next !== source && !check) yield* fs.writeFileString(file, next);
      });

      yield* update(CSS_FILE, rewriteCss);
      const entries = yield* fs.readDirectory(ROOT, { recursive: true });
      const sources = entries.filter(
        (entry) =>
          /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) && !entry.startsWith("vendor/"),
      );
      for (const entry of sources)
        yield* update(path.join(ROOT, entry), (source) =>
          grid(rewrite(source), entry.startsWith("components/ui/")),
        );

      const lines = [`${check ? "would change" : "changed"} ${changed} classes`];
      if (unmapped.size > 0) {
        lines.push(`unmapped (${unmapped.size}), lint decides whether each is allowed:`);
        for (const [token, count] of [...unmapped].sort((a, b) => b[1] - a[1]))
          lines.push(`  ${count}\t${token}`);
      }
      yield* Effect.log(lines.join("\n"));
      if (check && changed > 0) return yield* new OffGridClassesError({ changed });
    }),
  ),
);

Command.run(tokenizeClasses, { version: "0.0.0" }).pipe(
  Effect.scoped,
  Effect.provide(Layer.mergeAll(Logger.layer([Logger.consolePretty()]), NodeServices.layer)),
  NodeRuntime.runMain,
);
