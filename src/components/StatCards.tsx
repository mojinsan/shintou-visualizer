import { useMemo } from 'react';
import { useParamsStore } from '../state/useParams';
import { simulateAggregate } from '../lib/simulateAggregate';
import { formatJa, formatSci } from '../lib/format';
import { POPULATIONS } from '../data/populations';

// 文字列の長さに応じてフォントサイズクラスを返す
function adaptiveFontSize(str: string): string {
  const len = str.replace(/[^\S]/g, '').length; // 空白除く文字数
  if (len <= 7)  return 'text-3xl';
  if (len <= 10) return 'text-2xl';
  if (len <= 14) return 'text-xl';
  if (len <= 18) return 'text-lg';
  return 'text-base';
}

export function StatCards() {
  const params = useParamsStore();
  
  const aggregate = useMemo(() => {
    return simulateAggregate(params, true);
  }, [params]);

  const worldPop = POPULATIONS.find(p => p.category === 'world')?.pop || 8100000000;
  const ratio = aggregate.grandTotal / worldPop;

  const totalStr = formatJa(aggregate.grandTotal);
  const ratioStr = ratio < 1e-4
    ? '< 0.01'
    : (ratio * 100).toLocaleString('ja-JP', { maximumFractionDigits: 2 });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col justify-between">
        <div className="text-sm font-medium text-muted-foreground">総親族数 ({params.N}親等まで)</div>
        <div className={`${adaptiveFontSize(totalStr)} font-bold mt-2 text-primary`}>
          {totalStr} <span className="text-lg font-normal text-foreground">人</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          (厳密値/指数表記: {formatSci(aggregate.grandTotal)})
        </div>
      </div>

      <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col justify-between">
        <div className="text-sm font-medium text-muted-foreground">世界人口対比</div>
        <div className={`${adaptiveFontSize(ratioStr)} font-bold mt-2`}>
          {ratioStr}
          <span className="text-lg font-normal text-muted-foreground ml-1">%</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {ratio > 1 ? '※世界人口を突破（家系収束を無視した結果）' : '世界人口(約81億)を基準'}
        </div>
      </div>

      <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col justify-between">
        <div className="text-sm font-medium text-muted-foreground">シミュレーション統計</div>
        <div className="text-sm mt-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">実効・一般人子数(m):</span>
            <span className="font-semibold">{aggregate.effectiveM.toFixed(2)} 人</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">実効・祖先傍系(s):</span>
            <span className="font-semibold">{aggregate.sideBranch.toFixed(2)} 人</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">最遠層の人数(d={params.N}):</span>
            <span className="font-semibold">{formatJa(aggregate.levels[aggregate.levels.length - 1]?.total || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
