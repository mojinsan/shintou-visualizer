# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Japanese-language single-page app ("N親等 親族人数シミュレータ") that visualizes how many relatives fall within N degrees of kinship (親等), using a mathematical growth model plus stochastic sampling. Built with React 19 + TypeScript + Vite, Tailwind CSS v4, Zustand, D3, and react-force-graph-2d.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — type-check (`tsc -b`) then production build via Vite
- `npm run lint` — run Oxlint (`.oxlintrc.json`; react/typescript/oxc plugins)
- `npm run preview` — preview the production build locally
- `npx vitest run` — run the test suite once (`npx vitest` for watch mode)
- `npx vitest run src/lib/simulateAggregate.test.ts` — run a single test file
- There is no separate typecheck script; `tsc -b` runs as part of `npm run build`.

## Architecture

The app has two parallel, independently-computed representations of the same kinship model, and it's important not to conflate them:

1. **Aggregate simulation** (`src/lib/simulateAggregate.ts`) — computes exact expected counts per degree using a recurrence relation (`down_d = m * down_{d-1} + inflow_d`), optionally adding Gaussian noise scaled by propagated variance when `stochastic=true`. This is the source of truth for all displayed totals (StatCards, PopulationCompare, RadialGrowth/coxcomb view). It's O(N) and always fast.
2. **Individual simulation** (`src/lib/simulateIndividuals.ts`) — actually generates a bounded, sampled family tree (`PersonNode[]` + links) for rendering as a graph. It uses reservoir sampling (`capPerDegree = budget / N`) to cap nodes per degree since real counts explode exponentially; when a degree's real candidate count exceeds the cap, `truncated` is set and the true hidden count is tracked in `hiddenByDegree`. This is a *representative sample*, not the real population — only `simulateAggregate` numbers should be treated as authoritative.

Both simulations depend on `src/lib/distribution.ts` (`computeOffspringStats`), which numerically estimates offspring-count moments (mean/variance for "generic person" and "ancestor couple's other children") via 200k Monte Carlo draws, because the closed-form distribution of `round(Normal) `clipped at 0` is intractable analytically. `src/lib/rng.ts` provides a seeded PRNG (mulberry32) + Box-Muller normal sampling — everything is seeded for reproducibility and URL-shareability.

**Kinship model conventions**: `up_d = 2^d` (ancestors at degree d double each generation). `down_d` mixes descendants of ego and collateral relatives (cousins, etc.) — see the recurrence in `simulateAggregate.ts` and the worked example in `simulateAggregate.test.ts`. Node kinds are `ego | ancestor | descendant | collateral`.

**State flow**: `useParamsStore` (Zustand, `src/state/useParams.ts`) holds `SimParams` (`N`, `meanChildren`, `sdChildren`, `partnerRate`, `seed`) and is the single source of truth. It initializes from URL query params (`N`, `mu`, `sd`, `p`, `seed`) on load and debounces writes back to the URL (300ms) on every change, which is how the "条件を共有" (share) button in `ParamBar` works — it just copies `window.location.href`.

**View selection** (`src/lib/viewMode.ts`): `KinshipGraph` auto-picks between three D3-based renderings based on scale — `force` (react-force-graph-2d, individual nodes, only viable when population is small and untruncated), `sunburst` (`BranchSunburst.tsx`, d3.partition/arc, always viable), and `coxcomb` (`RadialGrowth.tsx`, radial bars over aggregate levels, manual-select only). `KinshipGraph` debounces param changes by 150ms before re-simulating (both aggregate and individual), and re-mounts the force graph via a `graphKey` bump whenever individual data changes, to reset its physics layout.

**Formatting**: `src/lib/format.ts` (`formatJa`) renders large numbers using traditional Japanese numeral units (万, 億, 兆, ... 無量大数) rather than SI/scientific notation, since the whole point of the app is showing population counts that dwarf real-world figures.

**Theming**: Tailwind v4 with CSS custom properties in `src/index.css` (shadcn-style HSL variables for `--background`, `--primary`, etc., plus `--c-ancestor`/`--c-descendant` for the radial chart). Dark mode via `.dark` class.

## Deployment

Pure client-side static site — `npm run build` produces `dist/`, which needs no server-side logic (state lives entirely in URL query params, no server routes or APIs). Deployable to any static host (e.g. GitHub Pages); no containerization required.
