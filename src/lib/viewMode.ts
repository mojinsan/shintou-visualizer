import type { AggregateResult, IndividualResult } from "../types";

export type ViewMode = "force" | "sunburst" | "coxcomb";

export function pickViewMode(agg: AggregateResult, ind: IndividualResult): ViewMode {
  const total = agg.grandTotal;
  if (total <= 400 && !ind.truncated) return "force";   // 個々の顔が見える
  return "sunburst";                                    // 枝構造を俯瞰（coxcombは手動のみ）
}
