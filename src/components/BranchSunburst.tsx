import * as d3 from "d3";
import { useMemo, useState } from "react";
import type { IndividualResult } from "../types";
import { formatJa } from "../lib/format";

interface TooltipInfo {
  x: number;
  y: number;
  degree: number;
  kind: string;
  value: number;
}

const KIND_LABEL: Record<string, string> = {
  ego: "自分",
  ancestor: "祖先",
  descendant: "子孫",
  collateral: "傍系",
};

export function BranchSunburst({ ind, size = 520 }: { ind: IndividualResult; size?: number }) {
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  const root = useMemo(() => {
    const h = d3.stratify<any>().id((d) => d.id).parentId((d) => d.parentId)(ind.nodes as any);
    h.sum(() => 1).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    return d3.partition<any>().size([2 * Math.PI, size * 0.46])(h as any);
  }, [ind, size]);

  const maxDepth = root.height || 1;
  const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, maxDepth]);

  // Ring thickness shrinks as maxDepth grows (fixed outer radius split across more levels),
  // and outer-generation wedges are often narrow slivers. A fixed padAngle/cornerRadius/
  // strokeWidth eats a fixed number of pixels regardless of how thin the wedge is, so at
  // high N the white gap/corner/stroke can swallow the entire wedge and it reads as blank.
  // Scale all three down with ring thickness so thin wedges keep visible fill.
  const ringThickness = (size * 0.46) / maxDepth;
  const cornerRadius = Math.min(1.5, ringThickness * 0.2);
  const strokeWidth = Math.min(0.5, ringThickness * 0.08);
  const padAngle = Math.min(0.004, 0.05 / maxDepth);

  const arc = d3.arc<any>()
    .startAngle((d) => d.x0).endAngle((d) => d.x1)
    .innerRadius((d) => d.y0).outerRadius((d) => d.y1)
    .padAngle(padAngle).cornerRadius(cornerRadius);

  const nodes = root.descendants().filter((d) => d.depth > 0);

  // タップ操作にはhoverイベントが来ないため、クリック/タップでも同じ内容を表示する。
  const showTooltip = (e: React.MouseEvent<SVGPathElement>, d: (typeof nodes)[number], kind: string) => {
    const rect = (e.currentTarget.closest("svg") as SVGElement).getBoundingClientRect();
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      degree: d.depth,
      kind,
      value: d.value ?? 1,
    });
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
        width={size}
        height={size}
        onMouseLeave={() => setTooltip(null)}
        onClick={(e) => {
          // 扇形の外(背景)をタップしたら閉じる。扇形自体はpath側のonClickで表示する。
          if (e.target === e.currentTarget) setTooltip(null);
        }}
      >
        {nodes.map((d, i) => {
          const kind = d.data.kind ?? "collateral";
          return (
            <path
              key={i}
              d={arc(d)!}
              fill={colorScale(d.depth)}
              stroke="var(--bg)"
              strokeWidth={strokeWidth}
              style={{ cursor: "pointer", transition: "opacity 0.15s" }}
              onMouseEnter={(e) => showTooltip(e, d, kind)}
              onMouseMove={(e) => {
                const rect = (e.currentTarget.closest("svg") as SVGElement).getBoundingClientRect();
                setTooltip((prev) => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev);
              }}
              onClick={(e) => {
                e.stopPropagation();
                showTooltip(e, d, kind);
              }}
            />
          );
        })}
        {/* 中心ラベル */}
        <text textAnchor="middle" dy="0.35em" fontSize={size * 0.03} fill="currentColor" opacity={0.5}>
          0親等
        </text>
      </svg>

      {/* React ツールチップ */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 bg-background/95 border border-border rounded-md shadow-lg px-3 py-2 text-sm"
          style={{
            left: tooltip.x + 14,
            top: tooltip.y - 10,
            transform: tooltip.x > size * 0.6 ? "translateX(-110%)" : undefined,
          }}
        >
          <div className="font-semibold">{tooltip.degree}親等 / {KIND_LABEL[tooltip.kind] ?? tooltip.kind}</div>
          <div className="text-muted-foreground">この枝の人数: <span className="font-medium text-foreground">{formatJa(tooltip.value)}人</span></div>
        </div>
      )}
    </div>
  );
}
