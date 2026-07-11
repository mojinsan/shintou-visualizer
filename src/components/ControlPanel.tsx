import { useState, useRef } from 'react';
import { useParamsStore } from '../state/useParams';
import { Play, Square } from 'lucide-react';

export function ControlPanel() {
  const { N, meanChildren, sdChildren, partnerRate, seed, setParams } = useParamsStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleAnimate = () => {
    if (isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPlaying(false);
      return;
    }
    
    setIsPlaying(true);
    let currentN = 1;
    setParams({ N: currentN });
    
    timerRef.current = setInterval(() => {
      currentN += 1;
      if (currentN > 50) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsPlaying(false);
      } else {
        setParams({ N: currentN });
      }
    }, 250);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('URLをクリップボードにコピーしました');
  };

  return (
    <div className="w-full md:w-80 p-4 border-r border-border bg-card overflow-y-auto shrink-0 flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold mb-4">N親等 シミュレータ</h2>
        <p className="text-sm text-muted-foreground mb-4">
          ある人物（ego）を起点とした親族人数を確率モデルで計算し可視化します。
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex justify-between text-sm font-medium mb-2">
            <span>親等数 (N)</span>
            <span className="text-primary font-bold">{N}</span>
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={N}
            onChange={(e) => setParams({ N: parseInt(e.target.value, 10) })}
            className="w-full accent-primary"
          />
          <button
            onClick={toggleAnimate}
            className={`mt-2 flex items-center justify-center w-full gap-2 text-sm px-3 py-1.5 rounded-md transition-colors ${
              isPlaying
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground'
            }`}
          >
            {isPlaying ? (
              <>
                <Square size={14} fill="currentColor" /> 停止
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" /> 1から再生
              </>
            )}
          </button>
        </div>

        <div>
          <label className="flex justify-between text-sm font-medium mb-2">
            <span>平均子ども数 (μ)</span>
            <span>{meanChildren.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="8"
            step="0.1"
            value={meanChildren}
            onChange={(e) => setParams({ meanChildren: parseFloat(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <label className="flex justify-between text-sm font-medium mb-2">
            <span>標準偏差 (σ)</span>
            <span>{sdChildren.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={sdChildren}
            onChange={(e) => setParams({ sdChildren: parseFloat(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <label className="flex justify-between text-sm font-medium mb-2">
            <span>パートナー取得割合 (p)</span>
            <span>{partnerRate.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={partnerRate}
            onChange={(e) => setParams({ partnerRate: parseFloat(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <label className="flex justify-between text-sm font-medium mb-2">
            <span>乱数シード</span>
            <span>{seed}</span>
          </label>
          <input
            type="number"
            value={seed}
            onChange={(e) => setParams({ seed: parseInt(e.target.value, 10) || 0 })}
            className="w-full border border-input bg-transparent px-3 py-1 text-sm shadow-sm rounded-md"
          />
        </div>
      </div>

      <div className="mt-auto pt-4">
        <button
          onClick={handleShare}
          className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          現在の条件を共有
        </button>
        <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
          <strong>※注意:</strong> このシミュレーションは近親交配を無視した木構造を仮定しています。
          Nが大きくなると実際の人口を超えますが、現実には「家系の収束」が起こるためです。
        </p>
      </div>
    </div>
  );
}
