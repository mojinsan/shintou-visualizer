import { useMemo } from 'react';
import { useParamsStore } from '../state/useParams';
import { simulateAggregate } from '../lib/simulateAggregate';
import { POPULATIONS } from '../data/populations';
import { formatJa } from '../lib/format';

export function PopulationCompare() {
  const params = useParamsStore();
  
  const currentTotal = useMemo(() => {
    return simulateAggregate(params, true).grandTotal;
  }, [params]);

  // Determine which populations we have surpassed
  const surpassed = useMemo(() => {
    return POPULATIONS.filter(p => currentTotal >= p.pop).sort((a, b) => b.pop - a.pop);
  }, [currentTotal]);

  const topSurpassed = surpassed[0];

  // Find exact N where we surpass World
  const breakthroughN = useMemo(() => {
    let testN = 1;
    while(testN <= 60) {
      const res = simulateAggregate({ ...params, N: testN }, false);
      if (res.grandTotal >= 8100000000) return testN;
      testN++;
    }
    return -1;
  }, [params.meanChildren, params.sdChildren, params.partnerRate]);

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm mt-6">
      <h3 className="text-lg font-bold mb-4">規模感の比較</h3>
      
      {currentTotal < POPULATIONS[POPULATIONS.length - 1].pop ? (
        <p className="text-muted-foreground text-center py-4">まだ最小の都道府県人口（鳥取県）に達していません。Nを増やしてみましょう。</p>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-primary/10 p-4 rounded-lg text-primary border border-primary/20">
            <div className="text-4xl">🚀</div>
            <div>
              <div className="text-sm font-bold opacity-80">突破！</div>
              <div className="text-xl">
                {topSurpassed.category === "cosmic" || topSurpassed.category === "biology" ? (
                  <>現在の人数は <strong>{topSurpassed.name}</strong> ({formatJa(topSurpassed.pop)}) を超えました！</>
                ) : topSurpassed.category === "world" ? (
                  <>現在の人数は <strong>{topSurpassed.name}人口</strong> ({formatJa(topSurpassed.pop)}) を超えました！</>
                ) : (
                  <>現在の人数は <strong>{topSurpassed.name}</strong> の人口 ({formatJa(topSurpassed.pop)}) を超えました！</>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">超えた地域・国 (上位5件)</h4>
            <div className="flex flex-wrap gap-2">
              {surpassed.slice(0, 5).map(p => (
                <div key={p.name} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm font-medium border border-border">
                  {p.name}
                </div>
              ))}
              {surpassed.length > 5 && (
                <div className="px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-sm">
                  他 {surpassed.length - 5} 件
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {breakthroughN > 0 && breakthroughN !== params.N && currentTotal < 8100000000 && (
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            💡 今のパラメータ設定では、<strong>N={breakthroughN}</strong> で世界人口(約81億)を突破します。
          </p>
        </div>
      )}
    </div>
  );
}
