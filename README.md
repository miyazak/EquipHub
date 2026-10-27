# EquipHub

備品貸し出し管理のデモ用 Web アプリです。  
社内デモで「GitHub Projects を使ったアジャイル風プロジェクト管理」と「AI 駆動開発」の題材に使えるよう、最小機能を実装しています。

## 機能

- 備品一覧表示
- ステータス絞り込み（貸出可 / 貸出中）
- キーワード検索
- 貸出処理（借用者・返却期限の登録）
- 返却処理
- サマリー統計（総数 / 貸出可 / 貸出中）

## ローカル実行手順

1. Node.js 18 以上を用意
2. 依存関係をインストール

```bash
npm install
```

3. アプリ起動

```bash
npm start
```

4. ブラウザで以下を開く

- http://localhost:3000

## 開発用コマンド

```bash
npm run dev
```

## API

- `GET /api/items?status=all|available|borrowed&keyword=...`
- `GET /api/stats`
- `POST /api/items/:id/borrow`
  - body: `{ "borrower": "Sato", "dueDate": "2026-11-03" }`
- `POST /api/items/:id/return`

## GitHub Projects デモ向けの使い方

`docs/project-seed.md` に、Project へ登録しやすい Epic / User Story / Task のサンプルを用意しています。

おすすめデモの流れ:

1. まず Backlog を一括登録
2. Sprint 列へ優先順に移動
3. AI で Issue を分解し、実装 PR を作成
4. PR マージと同時に Done へ自動遷移
