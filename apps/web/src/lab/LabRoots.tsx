import type { CSSProperties } from "react";

import { Button } from "../components/ui/button";

export type Roots = {
  readonly step: number;
  readonly typeBase: number;
  readonly typeRatio: number;
};

// Mirrors the roots in index.css; Reset returns here.
export const DEFAULT_ROOTS: Roots = {
  step: 8,
  typeBase: 14,
  typeRatio: 1.2,
};

const CONTROLS = [
  {
    key: "step",
    label: "Step",
    hint: "Every space, size and corner is counted in steps.",
    min: 6,
    max: 12,
    step: 1,
    format: (v: number) => `${v}px`,
  },
  {
    key: "typeBase",
    label: "Base text",
    hint: "The size you read most. The other text sizes are computed from it.",
    min: 12,
    max: 16,
    step: 1,
    format: (v: number) => `${v}px`,
  },
  {
    key: "typeRatio",
    label: "Type ratio",
    hint: "How far apart text sizes are. Meta is base ÷ ratio, titles base × ratio².",
    min: 1.1,
    max: 1.4,
    step: 0.05,
    format: (v: number) => `${v}`,
  },
] as const;

export function rootsStyle(roots: Roots): CSSProperties {
  return {
    "--step": `${roots.step / 16}rem`,
    "--type-base": `${roots.typeBase / 16}rem`,
    "--type-ratio": `${roots.typeRatio}`,
  } as CSSProperties;
}

function rootsCss(roots: Roots) {
  return Object.entries(rootsStyle(roots))
    .map(([name, value]) => `  ${name}: ${String(value)};`)
    .join("\n");
}

export function RootsPanel({
  roots,
  onChange,
}: {
  roots: Roots;
  onChange: (roots: Roots) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <h2 className="text-heading">Roots</h2>
        <p className="text-meta text-ink-2">
          Everything in the lab derives from these three. They apply to the lab only.
        </p>
      </div>
      {CONTROLS.map((control) => {
        const value = roots[control.key];
        const progress = (value - control.min) / (control.max - control.min);
        return (
          <label key={control.key} className="flex flex-col gap-2">
            <span className="flex items-baseline justify-between">
              <span className="text-body">{control.label}</span>
              <span className="text-meta tabular-nums text-ink-2">{control.format(value)}</span>
            </span>
            <span className="text-meta text-ink-3">{control.hint}</span>
            <input
              className="settings-slider"
              type="range"
              min={control.min}
              max={control.max}
              step={control.step}
              value={value}
              style={
                {
                  "--settings-slider-progress": `${progress * 100}%`,
                  "--settings-slider-fill-offset": `${0.5 - progress}rem`,
                } as CSSProperties
              }
              onChange={(event) =>
                onChange({ ...roots, [control.key]: Number(event.currentTarget.value) })
              }
            />
          </label>
        );
      })}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void navigator.clipboard.writeText(`:root {\n${rootsCss(roots)}\n}`)}
        >
          Copy roots
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_ROOTS)}>
          Reset
        </Button>
      </div>
    </div>
  );
}
