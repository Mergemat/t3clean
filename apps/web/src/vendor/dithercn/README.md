# dithercn (vendored)

From [opencoredev/dithercn](https://github.com/opencoredev/dithercn) at `3b1e85384c9a`, MIT (see `LICENSE`):
the `dither-core` registry item as `dither/`; `aurora.tsx` from the live registry on 2026-11-14.

Local changes, to reapply on update: imports point at `~/vendor/dithercn/dither`, a
`noUncheckedIndexedAccess` fix in `diffuse.ts` (error channel), and `auroraPalette`'s `tipColor`
accepts `undefined` for `exactOptionalPropertyTypes`.

Update with `curl -sL https://dithercn.dev/r/<item>.json` and copy each file's `content`.
