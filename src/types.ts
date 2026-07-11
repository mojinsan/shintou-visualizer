export interface SimParams {
  N: number;            // 親等上限 1..50
  meanChildren: number; // μ
  sdChildren: number;   // σ
  partnerRate: number;  // p 0..1
  seed: number;
}

export interface LevelCount {
  degree: number;               // 親等 d
  ancestors: number;            // up_d
  descendantsCollateral: number;// down_d (子孫+傍系)
  total: number;                // up_d + down_d
  cumulative: number;           // Σ_{k<=d}
}

export interface AggregateResult {
  levels: LevelCount[];
  grandTotal: number;
  effectiveM: number; // 一般人の期待子ども数 m
  sideBranch: number; // 祖先夫婦の他の子 s
}

export type NodeKind = "ego" | "ancestor" | "descendant" | "collateral";
export interface PersonNode { id: string; degree: number; kind: NodeKind; parentId?: string; }
export interface IndividualResult {
  nodes: PersonNode[];
  links: { source: string; target: string }[];
  truncated: boolean;
  shownCount: number;
  hiddenByDegree?: Record<number, number>; // 追加（局所的な参考値。正確な総数は集約を使う）
}
