import { StatCards } from './components/StatCards';
import { KinshipGraph } from './components/KinshipGraph';
import { GrowthChart } from './components/GrowthChart';
import { PopulationCompare } from './components/PopulationCompare';
import { ParamBar } from './components/ParamBar';

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="p-4 md:p-8 max-w-[1200px] mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">
            N親等 親族人数シミュレータ
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            数学的モデルと乱数分岐を用いて、特定の親等内に含まれる親族の人数を可視化します。
          </p>
        </header>

        <ParamBar />

        <StatCards />

        <KinshipGraph />

        <GrowthChart />

        <PopulationCompare />

        <footer className="mt-12 pt-6 border-t border-border text-sm text-muted-foreground text-center pb-8">
          <p>
            ※このシミュレーションは「近親交配のない完全な木構造」を仮定しているため、Nが大きくなると実際の総人口を上回ります。
          </p>
          <p className="mt-1">
            これは数学的な指数関数の性質を示すものであり、現実には「家系の収束」により重複が発生します。
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
