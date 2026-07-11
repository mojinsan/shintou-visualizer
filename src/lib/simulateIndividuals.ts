import { mulberry32, randn } from "./rng";
import type { SimParams, IndividualResult, PersonNode, NodeKind } from "../types";

interface Cand { parentId: string; dir: "up" | "down"; kind: NodeKind; }

export function simulateIndividuals(p: SimParams, budget = 3000): IndividualResult {
  const rng = mulberry32((p.seed ^ 0x1234567) >>> 0);
  const capPerDegree = Math.max(12, Math.floor(budget / Math.max(1, p.N)));
  const sampleClipped = (min: number) =>
    Math.max(min, Math.round(p.meanChildren + p.sdChildren * randn(rng)));
  const hasPartner = () => rng() < p.partnerRate;

  const nodes: PersonNode[] = [];
  const links: { source: string; target: string }[] = [];
  let counter = 0;
  const newId = () => `n${counter++}`;

  const ego: PersonNode = { id: newId(), degree: 0, kind: "ego" };
  nodes.push(ego);

  type Live = { node: PersonNode; dir: "up" | "down" };
  let live: Live[] = [{ node: ego, dir: "down" }];
  let truncated = false;
  const hiddenByDegree: Record<number, number> = {};

  for (let d = 1; d <= p.N && live.length > 0; d++) {
    // 1) admitted 親から候補生成（有界）
    const cands: Cand[] = [];
    for (const { node, dir } of live) {
      if (node.kind === "ego") {
        cands.push({ parentId: node.id, dir: "up", kind: "ancestor" });
        cands.push({ parentId: node.id, dir: "up", kind: "ancestor" });
        const kids = hasPartner() ? sampleClipped(0) : 0;
        for (let k = 0; k < kids; k++) cands.push({ parentId: node.id, dir: "down", kind: "descendant" });
      } else if (dir === "up") {
        cands.push({ parentId: node.id, dir: "up", kind: "ancestor" });
        cands.push({ parentId: node.id, dir: "up", kind: "ancestor" });
        const others = sampleClipped(1) - 1; // 夫婦は>=1、系列外の子＝傍系
        for (let k = 0; k < others; k++) cands.push({ parentId: node.id, dir: "down", kind: "collateral" });
      } else {
        const kind: NodeKind = node.kind === "descendant" ? "descendant" : "collateral";
        const kids = hasPartner() ? sampleClipped(0) : 0;
        for (let k = 0; k < kids; k++) cands.push({ parentId: node.id, dir: "down", kind });
      }
    }
    // 2) 親等ごとに代表を層化抽出
    const chosen = reservoirSample(cands, capPerDegree, rng);
    if (chosen.length < cands.length) {
      truncated = true;
      hiddenByDegree[d] = cands.length - chosen.length;
    }
    // 3) 実体化
    const next: Live[] = [];
    for (const c of chosen) {
      const node: PersonNode = { id: newId(), degree: d, kind: c.kind, parentId: c.parentId };
      nodes.push(node);
      links.push({ source: c.parentId, target: node.id });
      next.push({ node, dir: c.dir });
    }
    live = next;
  }

  return { nodes, links, truncated, shownCount: nodes.length, hiddenByDegree };
}

// Algorithm-R
function reservoirSample<T>(items: T[], k: number, rng: () => number): T[] {
  if (items.length <= k) return items.slice();
  const res = items.slice(0, k);
  for (let i = k; i < items.length; i++) {
    const j = Math.floor(rng() * (i + 1));
    if (j < k) res[j] = items[i];
  }
  return res;
}
