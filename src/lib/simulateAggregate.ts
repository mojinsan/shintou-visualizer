import { mulberry32, randn } from "./rng";
import { computeOffspringStats } from "./distribution";
import type { SimParams, AggregateResult, LevelCount } from "../types";

export function simulateAggregate(p: SimParams, stochastic = true): AggregateResult {
  const st = computeOffspringStats(p.meanChildren, p.sdChildren, p.partnerRate, p.seed);
  const { mGeneric: m, sAncestor: s, varGeneric, varAncestorOther } = st;
  const rng = mulberry32(p.seed >>> 0);

  const levels: LevelCount[] = [];
  let downPrev = 0, cumulative = 0;

  for (let d = 1; d <= p.N; d++) {
    const up = Math.pow(2, d);                         // up_d = 2^d
    const couples = d >= 2 ? Math.pow(2, d - 2) : 0;   // gen(d-1) の夫婦数
    const inflowMean = d === 1 ? m : s * couples;
    const downMean = m * downPrev + inflowMean;

    let down = downMean;
    if (stochastic) {
      const variance = downPrev * varGeneric + couples * varAncestorOther;
      down = Math.max(0, downMean + Math.sqrt(Math.max(0, variance)) * randn(rng));
    }
    const total = up + down;
    cumulative += total;
    levels.push({ degree: d, ancestors: up, descendantsCollateral: down, total, cumulative });
    downPrev = down;
  }
  return { levels, grandTotal: cumulative, effectiveM: m, sideBranch: s };
}
