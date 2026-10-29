# EquipHub

備品貸し出し管理のデモ用 Web アプリです。  
社内デモで「GitHub Projects を使ったアジャイル風プロジェクト管理」と「AI 駆動開発」の題材に使えるよう、最小機能を実装しています。

## 現在できること

> 機能を追加・変更した場合は、同じ PR でこのセクションを更新してください（[AGENTS.md](AGENTS.md) の開発フローを参照）。

### アプリ

| 機能 | 内容 |
|---|---|
| 備品一覧 | ID・備品名・カテゴリ・状態・借用者・返却期限を一覧表示する |
| ステータス絞り込み | すべて / 貸出可 / 貸出中 で一覧を絞り込む |
| キーワード検索 | 備品名・カテゴリ・借用者を、大文字・小文字を区別せずに検索する（入力と同時に反映） |
| 貸出 | 貸出可の備品に、借用者と返却期限を入力して貸し出す（どちらも必須） |
| 返却 | 貸出中の備品を、ボタン 1 つで貸出可に戻す（借用者と返却期限はクリアされる） |
| サマリー | 総備品数・貸出可・貸出中の件数をカードで表示する |

主な制約:

- 貸出中の備品は貸し出せず、貸出可の備品は返却できない（API は 409 を返す）
- 返却期限の日付の妥当性（過去日など）はチェックしていない（[#19](https://github.com/miyazak/EquipHub/issues/19)）
- 備品の追加・編集・削除の機能はない（`data/db.json` を直接編集する）

### 開発フロー（AI 駆動開発）

| できること | 方法 |
|---|---|
| Issue の起票 | Claude Code の `/create-issue`。ラベル付与、Project「for demo」への追加、Priority / Size の設定まで行う |
| Issue の起票（Web 画面） | 「New issue」から Epic / Story / Task / Bug のテンプレートを選ぶ。種類ラベルの付与と Project への追加は自動 |
| PR の作成 | Claude Code の `/create-pr`。規約どおりのコミット・push・PR 作成（`Closes #<番号>`、AI 生成部分、人間レビュー観点）を行う |
| PR の作成（Web 画面） | PR テンプレートが自動で入る |
| Status の自動遷移 | PR のマージで Issue がクローズされ、Project の Status が `Done` になる |

作業ブランチの命名、コミットメッセージの形式、Status の運用などのルールは [AGENTS.md](AGENTS.md) にまとめています。

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

> `data/db.json`（備品データ）は `.gitignore` の対象です。新しく clone した環境では存在しないため、用意してから起動してください。

## 開発用コマンド

```bash
npm run dev   # ファイル変更を監視して自動で再起動
```

## API

| メソッド | パス | 内容 |
|---|---|---|
| GET | `/api/items?status=all\|available\|borrowed&keyword=...` | 備品一覧（絞り込み・検索） |
| GET | `/api/stats` | 総数・貸出可・貸出中の件数 |
| POST | `/api/items/:id/borrow` | 貸出。body: `{ "borrower": "Sato", "dueDate": "2026-11-03" }` |
| POST | `/api/items/:id/return` | 返却 |

エラー時は `{ "message": "..." }` を返します（400: 必須項目なし、404: 備品が存在しない、409: 状態が不正）。

## GitHub Projects デモ向けの使い方

Project「for demo」に、[docs/project-seed.md](docs/project-seed.md) をもとにしたバックログ（Epic / Story / Task / Bug）を登録済みです。

おすすめデモの流れ:

1. Project の Backlog から、Priority の高い Issue を選ぶ
2. 作業ブランチを作成し、Issue の Status を `In progress` にする
3. AI で実装し、`/create-pr` で PR を作成する
4. PR をマージすると、Issue がクローズされ Status が `Done` に自動遷移する
