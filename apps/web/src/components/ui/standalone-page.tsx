import type { ReactNode } from "react";

import { T3Wordmark } from "../T3Wordmark";

export function StandalonePage({ children }: { readonly children: ReactNode }) {
  return (
    // The page owns scrolling because root cannot scroll; safe centering keeps oversized cards top-aligned.
    <div className="flex h-full items-center-safe justify-center overflow-y-auto scrollbar-gutter-both bg-background px-4 py-10 text-ink-1 sm:px-6">
      <section className="level-float w-full max-w-xl p-6">{children}</section>
    </div>
  );
}

export function StandalonePageHeader({
  context,
  title,
  description,
}: {
  readonly context?: ReactNode;
  readonly title: ReactNode;
  readonly description: ReactNode;
}) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-3 text-ink-2">
        <span className="flex items-baseline gap-2" role="img" aria-label="T3 Code">
          <T3Wordmark className="h-3 w-auto shrink-0 text-ink-1" aria-hidden />
          <span className="text-title font-medium tracking-tight">Code</span>
        </span>
        {context ? <span className="text-body">{context}</span> : null}
      </div>
      <h1 className="mt-6 text-title leading-tight font-semibold">{title}</h1>
      <p className="mt-2 text-body text-ink-2">{description}</p>
    </>
  );
}
