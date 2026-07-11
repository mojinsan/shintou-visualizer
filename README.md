# N親等 親族人数シミュレータ

数学的モデルと乱数分岐を用いて、特定の親等（N）内に含まれる親族の人数を可視化するWebアプリです。

**公開URL:** https://mojinsan.github.io/shintou-visualizer/

## これは何？

親等数・平均子ども数・標準偏差・パートナー割合などのパラメータを調整しながら、以下を確認できます。

- 指定した親等までの親族の総人数（累計）
- 力学グラフ／日の出図／放射バー図による親族構成の可視化
- 世界人口や都道府県人口との規模比較
- 親等ごとの累計人数の推移（対数スケール）

シミュレーションは「近親交配のない完全な木構造」を仮定しているため、Nが大きくなると実際の総人口を上回ります。これは数学的な指数関数の性質を示すもので、現実には家系の収束により重複が発生します。

パラメータはURLのクエリパラメータに同期されるため、「条件を共有」ボタンでそのままURLを共有できます。

## 開発

```bash
npm install
npm run dev       # 開発サーバー起動
npm run build     # 型チェック + 本番ビルド
npm run lint      # Oxlintによる静的解析
npx vitest run    # テスト実行
```

## 技術スタック

React 19 / TypeScript / Vite / Tailwind CSS v4 / Zustand / D3 / react-force-graph-2d

## デプロイ

サーバーサイド処理のない静的サイトです。`main`ブランチへのpushをトリガーに、GitHub Actions (`.github/workflows/deploy.yml`) がビルドしてGitHub Pagesへ自動デプロイします。

## ライセンス

[MIT](./LICENSE)
