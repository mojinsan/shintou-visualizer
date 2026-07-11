import * as d3 from "d3";
import { useMemo, useState } from "react";
import type { AggregateResult } from "../types";
import { formatJa } from "../lib/format";

interface TooltipInfo {
  x: number;
  y: number;
  degree: number;
  cat: "ancestor" | "down";
  count: number;
}

export function RadialGrowth({
  agg, size = 520, scaleType = "sqrt",
}: { agg: AggregateResult; size?: number; scaleType?: "sqrt" | "log" }) {
  const inner = size * 0.08, outer = size * 0.46;
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  const arcs = useMemo(() => {
    const N = agg.levels.length || 1;
    const maxTotal = d3.max(agg.levels, (l) => l.total) ?? 1;
    const rScale = scaleType === "log"
      ? d3.scaleLog().domain([1, Math.max(2, maxTotal)]).range([inner, outer]).clamp(true)
      : d3.scaleSqrt().domain([0, maxTotal]).range([inner, outer]);
    const ang = (2 * Math.PI) / N;
    return agg.levels.flatMap((l, i) => {
      const a0 = i * ang, a1 = a0 + ang * 0.9;
      const rUp = rScale(Math.max(1, l.ancestors));
      const rTot = rScale(Math.max(1, l.total));
      return [
        { a0, a1, r0: inner, r1: rUp, cat: "ancestor" as const, l },
        { a0, a1, r0: rUp, r1: rTot, cat: "down" as const, l },
      ];
    });
  }, [agg, size, scaleType]);

  const arc = d3.arc<any>()
    .innerRadius((d) => d.r0).outerRadius((d) => d.r1)
    .startAngle((d) => d.a0).endAngle((d) => d.a1)
    .padAngle(0.004).cornerRadius(2);

  // タップ操作にはhoverイベントが来ないため、クリック/タップでも同じ内容を表示する。
  const showTooltip = (e: React.MouseEvent<SVGPathElement>, d: (typeof arcs)[number]) => {
    const rect = (e.currentTarget.closest("svg") as SVGElement).getBoundingClientRect();
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      degree: d.l.degree,
      cat: d.cat,
      count: d.cat === "ancestor" ? d.l.ancestors : d.l.descendantsCollateral,
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
        {arcs.map((d, i) => (
          <path
            key={i}
            d={arc(d)!}
            fill={d.cat === "ancestor" ? "var(--c-ancestor)" : "var(--c-descendant)"}
            opacity={0.9}
            style={{ cursor: "pointer" }}
            onMouseEnter={(e) => showTooltip(e, d)}
            onMouseMove={(e) => {
              const rect = (e.currentTarget.closest("svg") as SVGElement).getBoundingClientRect();
              setTooltip((prev) => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev);
            }}
            onClick={(e) => {
              e.stopPropagation();
              showTooltip(e, d);
            }}
          />
        ))}
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 bg-background/95 border border-border rounded-md shadow-lg px-3 py-2 text-sm"
          style={{
            left: tooltip.x + 14,
            top: tooltip.y - 10,
            transform: tooltip.x > size * 0.6 ? "translateX(-110%)" : undefined,
          }}
        >
          <div className="font-semibold">
            {tooltip.degree}親等 / {tooltip.cat === "ancestor" ? "祖先" : "子孫・傍系"}
          </div>
          <div className="text-muted-foreground">
            人数: <span className="font-medium text-foreground">{formatJa(tooltip.count)}人</span>
          </div>
        </div>
      )}
    </div>
  );
}
