import { mulberry32, randn } from "./rng";

export interface OffspringStats {
  mGeneric: number;        // 一般人の期待子ども数 = p * E[clipped]
  varGeneric: number;
  sAncestor: number;       // 祖先夫婦の他の子期待数
  varAncestorOther: number;
}

// round + 0カットオフ の分布は解析式が煩雑なため、固定シードの数値推定で十分。
export function computeOffspringStats(
  meanChildren: number, sdChildren: number, partnerRate: number,
  seed: number, samples = 200_000
): OffspringStats {
  const rng = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  let sG = 0, sG2 = 0, sA = 0, sA2 = 0;
  for (let i = 0; i < samples; i++) {
    const clipped = Math.max(0, Math.round(meanChildren + sdChildren * randn(rng)));
    const generic = rng() < partnerRate ? clipped : 0;   // 一般人
    const other = Math.max(1, clipped) - 1;              // 祖先夫婦の他の子(>=1保証)
    sG += generic; sG2 += generic * generic;
    sA += other;   sA2 += other * other;
  }
  const mGeneric = sG / samples;
  const sAncestor = sA / samples;
  return {
    mGeneric,
    varGeneric: sG2 / samples - mGeneric * mGeneric,
    sAncestor,
    varAncestorOther: sA2 / samples - sAncestor * sAncestor,
  };
}
