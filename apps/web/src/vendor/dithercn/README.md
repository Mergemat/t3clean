# dithercn (vendored)

From [opencoredev/dithercn](https://github.com/opencoredev/dithercn) at `3b1e85384c9a`, MIT (see `LICENSE`):
the `dither-core` registry item as `dither/` and `ripples` as `ripples.tsx`.

Local changes, to reapply on update: imports point at `~/vendor/dithercn/dither`, and two
`noUncheckedIndexedAccess` fixes (`ripples.tsx` default source, `diffuse.ts` error channel).

Update with `curl -sL https://dithercn.dev/r/<item>.json` and copy each file's `content`.
