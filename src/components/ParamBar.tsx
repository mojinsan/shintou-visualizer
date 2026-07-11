import { useEffect, useState, useRef } from 'react';
import { useParamsStore } from '../state/useParams';
import { Play, Square, Share2 } from 'lucide-react';

function SliderField({
  label, value, display, min, max, step, onChange,
}: {
  label: string; value: number; display: string;
  min: number; max: number; step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col justify-end gap-1 min-w-0">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-muted-foreground truncate">{label}</span>
        <span className="font-bold text-primary ml-2 shrink-0">{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step ?? 1} value={value}
        onChange={(e) => onChange(step ? parseFloat(e.target.value) : parseInt(e.target.value, 10))}
        className="w-full accent-primary h-1.5"
      />
    </div>
  );
}

const MAX_N = 50;
const STEP_MS = 250; // 1ステップの目標間隔（重い描画が無ければこの間隔で進む）

export function ParamBar() {
  const { N, meanChildren, sdChildren, partnerRate, seed, setParams } = useParamsStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPlayback = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    rafRef.current = null;
    timerRef.current = null;
  };

  useEffect(() => cancelPlayback, []);

  // 重いシミュレーション（KinshipGraph等）はReactのレンダー中に同期的に走るため、
  // 描画が重いフレームほど rAF の発火が遅れる。二重 rAF でその「実際に描画が終わった
  // タイミング」を待ってから次のNへ進めることで、再生が描画を追い越さないようにする。
  const scheduleNext = (currentN: number) => {
    const start = performance.now();
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        const elapsed = performance.now() - start;
        timerRef.current = setTimeout(() => {
          const next = currentN + 1;
          if (next > MAX_N) {
            setIsPlaying(false);
            return;
          }
          setParams({ N: next });
          scheduleNext(next);
        }, Math.max(0, STEP_MS - elapsed));
      });
    });
  };

  const toggleAnimate = () => {
    if (isPlaying) {
      cancelPlayback();
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    setParams({ N: 1 });
    scheduleNext(1);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('URLをクリップボードにコピーしました');
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-4 mb-4">
      {/* 上段: スライダーを横並びで高さを揃える。N列を2倍幅（md以上）。
          狭い画面では2列グリッドに折り返し、Nは全幅で目立たせる */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 md:gap-x-6 md:grid-cols-[2fr_1fr_1fr_1fr]">
        {/* 親等数 N — 最重要パラメータ。ボールド＋大きめに */}
        <div className="flex flex-col justify-end gap-1 min-w-0 col-span-2 md:col-span-1">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-bold">親等数 (N)</span>
            <span className="text-2xl font-extrabold text-primary ml-2 leading-none">{N}</span>
          </div>
          <input
            type="range" min={1} max={MAX_N} value={N}
            onChange={(e) => setParams({ N: parseInt(e.target.value, 10) })}
            className="w-full accent-primary h-2"
          />
        </div>
        <SliderField
          label="平均子ども数 (μ)" value={meanChildren} display={meanChildren.toFixed(1)}
          min={0} max={8} step={0.1}
          onChange={(v) => setParams({ meanChildren: v })}
        />
        <SliderField
          label="標準偏差 (σ)" value={sdChildren} display={sdChildren.toFixed(1)}
          min={0} max={5} step={0.1}
          onChange={(v) => setParams({ sdChildren: v })}
        />
        <SliderField
          label="パートナー割合 (p)" value={partnerRate} display={partnerRate.toFixed(2)}
          min={0} max={1} step={0.05}
          onChange={(v) => setParams({ partnerRate: v })}
        />
      </div>

      {/* 下段: ボタン群 + シード入力 */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
        <button
          onClick={toggleAnimate}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
            isPlaying
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              : 'bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground'
          }`}
        >
          {isPlaying
            ? <><Square size={11} fill="currentColor" /> 停止</>
            : <><Play size={11} fill="currentColor" /> 1から再生</>}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Share2 size={11} /> 条件を共有
        </button>

        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-muted-foreground whitespace-nowrap">乱数シード</span>
          <input
            type="number" value={seed}
            onChange={(e) => setParams({ seed: parseInt(e.target.value, 10) || 0 })}
            className="w-20 border border-input bg-transparent px-2 py-1 text-xs rounded-md"
          />
        </div>
      </div>
    </div>
  );
}
