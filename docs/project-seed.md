# GitHub Projects Seed (EquipHub)

このファイルは、GitHub Projects に貼り付けて初期バックログを作るための種です。

## Project の推奨フィールド

- `Status`: Backlog / Ready / In Progress / In Review / Done
- `Type`: Epic / Story / Task / Bug / Spike
- `Priority`: P0 / P1 / P2
- `Sprint`: Sprint 1 / Sprint 2
- `Size`: XS / S / M / L
- `AI Support`: None / Prompted / Agent-driven

## Epic

1. `EPIC: 備品貸し出し業務を Web 化する`
2. `EPIC: 運用を可視化する`
3. `EPIC: AI 駆動開発フローを定着させる`

## User Story

1. `STORY: 管理者として、備品の貸出可否を一覧で把握したい`
2. `STORY: 利用者として、備品を貸し出し申請したい`
3. `STORY: 管理者として、返却処理を簡単に行いたい`
4. `STORY: 管理者として、利用状況のサマリーを確認したい`
5. `STORY: チームとして、Issue から実装まで AI で加速したい`

## Task

1. `TASK: 備品一覧 API を実装する`
2. `TASK: 貸出 API を実装する`
3. `TASK: 返却 API を実装する`
4. `TASK: 一覧画面にフィルタと検索を追加する`
5. `TASK: 統計カード UI を追加する`
6. `TASK: デモデータを JSON で管理する`
7. `TASK: README に起動手順とデモ手順を記載する`
8. `TASK: GitHub Actions で npm test を自動実行する`
9. `TASK: ラベルと Issue テンプレートを整備する`

## Bug 候補（デモ用）

1. `BUG: 同時貸出時に二重予約が発生する`
2. `BUG: 返却期限が過去日でも登録できる`
3. `BUG: キーワード検索が大文字小文字を正規化していない`

## AI 駆動開発デモの観点

- `Spike`: Copilot Chat で API 仕様を先に定義し、Issue に転記
- `Task`: Issue 本文に受け入れ条件を記述して、AI にテスト観点を作らせる
- `Workflow`: PR 説明文に「AI 生成部分」と「人間レビュー観点」を明記
- `Metric`: Lead Time と Review Time を Project Insights で比較
