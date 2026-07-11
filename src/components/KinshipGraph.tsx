import { useEffect, useRef, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import { useParamsStore } from '../state/useParams';
import { simulateIndividuals } from '../lib/simulateIndividuals';
import { simulateAggregate } from '../lib/simulateAggregate';
import { pickViewMode } from '../lib/viewMode';
import type { ViewMode } from '../lib/viewMode';
import { RadialGrowth } from './RadialGrowth';
import { BranchSunburst } from './BranchSunburst';
import * as d3 from 'd3';
import { Users } from 'lucide-react';
import { formatJa } from '../lib/format';

// Force Graph is client side only
export function KinshipGraph() {
  const params = useParamsStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods>(null);
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [debouncedParams, setDebouncedParams] = useState(params);
  const [manualView, setManualView] = useState<ViewMode | "auto">("auto");
  const [scaleType, setScaleType] = useState<"sqrt" | "log">("sqrt");
  const [graphKey, setGraphKey] = useState(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedParams(params);
    }, 150);
    return () => clearTimeout(handler);
  }, [params]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { agg, ind } = useMemo(() => {
    return {
      agg: simulateAggregate(debouncedParams),
      ind: simulateIndividuals(debouncedParams, 3000)
    };
  }, [debouncedParams]);

  // ind が変わるたびに graphKey を更新 → ForceGraph2D を再マウントしてレイアウトをリセット
  useEffect(() => {
    setGraphKey((k) => k + 1);
  }, [ind]);

  const viewMode = manualView === "auto" ? pickViewMode(agg, ind) : manualView;

  // Color scale based on degree
  const colorScale = d3.scaleSequential(d3.interpolateCool).domain([0, debouncedParams.N]);

  useEffect(() => {
    // zoom to fit after graph loads
    if (viewMode === "force") {
      const timer = setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(400, 20);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ind, viewMode]);

  return (
    <div className="relative w-full h-[500px] bg-black/5 rounded-xl border border-border overflow-hidden flex flex-col" ref={containerRef}>
      
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-background/90 backdrop-blur-sm border border-border rounded-md shadow-sm p-1 flex gap-1 items-center w-fit">
          <select 
            value={manualView} 
            onChange={e => setManualView(e.target.value as any)}
            className="bg-transparent text-sm border-none outline-none px-2 py-1 cursor-pointer"
          >
            <option value="auto">自動</option>
            <option value="force">ネットワーク図</option>
            <option value="sunburst">日の出図</option>
            <option value="coxcomb">放射バー図</option>
          </select>
          {viewMode === "coxcomb" && (
            <select
              value={scaleType}
              onChange={e => setScaleType(e.target.value as any)}
              className="bg-transparent text-sm border-l border-border outline-none pl-2 py-1 ml-1 cursor-pointer"
            >
              <option value="sqrt">平方根スケール</option>
              <option value="log">対数スケール</option>
            </select>
          )}
        </div>
        
        <div className="bg-background/90 backdrop-blur-sm border border-border px-3 py-2 rounded-md text-sm font-medium shadow-sm flex items-center gap-2 w-fit">
           <Users size={16} className="text-muted-foreground" />
           {viewMode === "coxcomb" ? (
             <span>合計: {formatJa(agg.grandTotal)} 人</span>
           ) : (
             <span>
               表示: {formatJa(ind.shownCount)} 人 
               {ind.truncated ? " (代表サンプル)" : ""} ／ 推定実在: {formatJa(agg.grandTotal)} 人
             </span>
           )}
        </div>
      </div>
      
      <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {viewMode === "force" && (
          <>
            <ForceGraph2D
              key={graphKey}
              ref={fgRef as any}
              width={dimensions.width}
              height={dimensions.height}
              graphData={ind}
              nodeColor={(n: any) => n.kind === 'ego' ? '#ff4444' : colorScale(n.degree)}
              nodeRelSize={4}
              linkColor={() => 'rgba(150, 150, 150, 0.2)'}
              linkWidth={1}
              enableNodeDrag={false}
              d3VelocityDecay={0.3}
              warmupTicks={100}
              cooldownTicks={0}
            />
            <div className="absolute bottom-4 left-4 z-10 bg-background/80 backdrop-blur-sm border border-border px-3 py-2 rounded-md text-xs pointer-events-none">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff4444' }}></div>
                <span>起点 (自分)</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(to right, #44ffff, #4444ff)' }}></div>
                <span>親族 (色が濃いほど遠い)</span>
              </div>
              <div className="mt-2 text-muted-foreground">スクロールでズーム / ドラッグで移動</div>
            </div>
          </>
        )}
        
        {viewMode === "sunburst" && (
          <div className="flex items-center justify-center h-full w-full relative">
            <BranchSunburst ind={ind} size={Math.min(dimensions.width, dimensions.height) - 40} />
            <div className="absolute bottom-4 left-4 z-10 bg-background/80 backdrop-blur-sm border border-border px-3 py-2 rounded-md text-xs pointer-events-none">
              <div className="font-semibold mb-1">日の出図の読み方</div>
              <div className="flex items-center gap-2 mb-1">
                <span>・中心が 0親等 (自分) です。</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span>・外側の層に行くほど遠い親等の親族になります。</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span>・扇形の角度(広さ)は、その枝に連なる人数の多さを表します。</span>
              </div>
              <div className="mt-2 text-muted-foreground">※ マウスホバーで詳細人数を表示します</div>
            </div>
          </div>
        )}
        
        {viewMode === "coxcomb" && (
          <div className="flex items-center justify-center h-full w-full relative">
            <RadialGrowth agg={agg} size={Math.min(dimensions.width, dimensions.height) - 40} scaleType={scaleType} />
            <div className="absolute bottom-4 left-4 z-10 bg-background/80 backdrop-blur-sm border border-border px-3 py-2 rounded-md text-xs pointer-events-none">
              <div className="font-semibold mb-1">放射バー図の読み方</div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-sm bg-[var(--c-ancestor)] opacity-90"></div>
                <span>内側: 祖先 (親・祖父母など)</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-sm bg-[var(--c-descendant)] opacity-90"></div>
                <span>外側: 子孫・傍系 (子・兄弟・いとこなど)</span>
              </div>
              <div className="mt-2 text-muted-foreground">
                ・円をケーキのようにN等分し、それぞれが「各親等」を表します。<br/>
                ・花びらの長さ（半径）が「その親等にいる人数」を表します。<br/>
                ・爆発的に増えるため {scaleType === "log" ? "対数スケール" : "平方根スケール"} で表示しています。<br/>
                ※ マウスホバーで詳細人数を表示します
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
