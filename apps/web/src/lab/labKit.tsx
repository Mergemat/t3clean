import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "../lib/utils";

export function LabSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} data-lab-section="" className="flex scroll-mt-6 flex-col gap-2">
      <div className="flex flex-col gap-1">
        <h2 className="text-heading">{title}</h2>
        {description ? <p className="max-w-prose text-meta text-ink-2">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function LabRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}

/**
 * Reads a computed style property off the rendered element, so the lab shows what the roots
 * resolve to instead of numbers typed into the page. Key the specimen on the roots to re-read.
 */
export function useComputed<T extends HTMLElement>(property: string) {
  const ref = useRef<T>(null);
  const [value, setValue] = useState("");
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- reads the computed style of the rendered element, which only exists after render
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setValue(getComputedStyle(el).getPropertyValue(property).trim());
  }, [property]);
  return [ref, value] as const;
}

export function px(value: string) {
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number)) return value;
  // rounded-full is an effectively infinite radius.
  return number >= 9999 ? "full" : `${Math.round(number * 10) / 10}px`;
}
