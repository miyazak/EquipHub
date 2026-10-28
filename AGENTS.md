# AGENTS.md

AI コーディングエージェント向けの作業ガイドです。人間向けの説明は [README.md](README.md) を参照してください。

## プロジェクト概要

EquipHub は社内デモ用の備品貸し出し管理 Web アプリです。
「GitHub Projects を使ったアジャイル風プロジェクト管理」と「AI 駆動開発」のデモ題材として使います。
機能は意図的に最小限にしているため、デモの見せ場にならない大きな機能追加や構成変更は避けてください。

## 技術構成

- Node.js 18 以上 / Express 4（CommonJS）
- データは `data/db.json` を直接読み書き（DB なし）
- フロントエンドは `public/` の素の HTML / CSS / JavaScript（フレームワーク・ビルドなし）

```
src/server.js        API サーバー（静的ファイル配信も兼ねる）
public/index.html    画面
public/app.js        画面ロジック
public/styles.css    スタイル
data/db.json         備品データ（.gitignore 対象）
docs/project-seed.md GitHub Projects 用のバックログ種
.github/             Issue テンプレート（Epic / Story / Task / Bug）と PR テンプレート
.claude/skills/      Claude Code のスキル（create-issue / create-pr）
```

## コマンド

```bash
npm install     # 依存関係のインストール
npm start       # 起動（http://localhost:3000）
npm run dev     # ファイル変更を監視して起動
```

テストは未整備です（`npm test` は存在しません）。変更後は `npm start` で起動し、該当 API や画面を実際に操作して確認してください。

## 注意事項

- `data/db.json` は `.gitignore` 対象です。存在しないとサーバーが API 呼び出し時にエラーになります。
- API を叩いて動作確認すると `data/db.json` が書き換わります。確認後は元のデモデータに戻してください。
- 新しい依存パッケージの追加は、必要性を Issue / PR で説明できる場合に限ります。

## コーディング規約

既存コードに合わせます。

- インデント 2 スペース、シングルクォート、セミコロンあり
- サーバーは CommonJS（`require`）、フロントは素の DOM API
- HTML に値を埋め込むときは `public/app.js` の `escapeHtml()` を通す
- API のエラーは `{ message: '...' }` 形式で、適切なステータスコード（400 / 404 / 409 など）を返す
- UI 文言は日本語、コード上の識別子・API メッセージは英語

## 開発フロー

Issue → ブランチ → PR → マージ（GitHub Projects 上で Done に自動遷移）の流れで進めます。

1. 作業は必ず Issue に紐づける（Issue 作成は `create-issue` スキルを使う）
2. ブランチ名: `<type>/<issue番号>-<短い英語の説明>`（例: `fix/12-reject-past-due-date`）
   - type: `feat` / `fix` / `docs` / `chore` / `refactor` / `test`
   - 手元で作業ブランチを作成したら、Project 上の Issue の Status を `In progress` に変更する（手順は下の「Status の変更」）
3. コミットメッセージ: `#<issue番号> <type>: <要約>`（日本語可。例: `#12 fix: 過去日の返却期限を拒否する`）
   - 1 行目の先頭に必ず Issue 番号を付ける（GitHub 上でコミットと Issue を相互に辿れるようにするため）
   - `#` で始まる行はエディタでの編集時にコメント扱いで消えるため、`git commit -m "..."` または `git commit -F <ファイル>` で渡す（エディタを使う場合は `git config commit.cleanup scissors` を設定する）
4. `main` へ直接コミット・push しない
5. PR は `create-pr` スキルを使って作成する。タイトルはコミットメッセージと同じ `#<issue番号> <type>: <要約>` とし、本文には次を必ず含める
   - `Closes #<issue番号>`（マージ時に Issue をクローズし、Project 上で Done に遷移させるため）
   - 「AI 生成部分」と「人間レビュー観点」
6. PR がマージされたら、Issue をクローズし、Project 上の Status を `Done` にする
   - 通常は自動で行われる: `Closes #<issue番号>` によりマージ時に Issue がクローズされ、Project の組み込みワークフロー「Item closed」で Status が `Done` になる
   - マージ後に `gh issue view <issue番号> --json state` と Project 上の Status を確認する
   - 反映されていない場合（`Closes` の書き漏れ、`main` 以外へのマージなど）は手動で対応する
     - Issue のクローズ: `gh issue close <issue番号> --comment "#<PR番号> のマージにより対応完了"`
     - Status の変更: 下の「Status の変更」の手順で `Done` の選択肢 ID を指定する

## GitHub Projects とラベル

- Project: `for demo`（owner `miyazak`、番号 `3`）。[docs/project-seed.md](docs/project-seed.md) の項目は Issue #1〜#20 として登録済み
- Project のフィールド
  - `Status`: Backlog / Ready / In progress / In review / Done
  - `Priority`: P1 / P2 / P3
  - `Size`: XS / S / M / L / XL
- Issue の種類はラベルで表す: `epic` / `story` / `task` / `bug`
- 優先度ラベル: `p1` / `p2` / `p3`（Project の Priority と同じ段階。ラベルと Priority は同じ値にそろえる）
- 有効な組み込みワークフロー: Item closed（クローズで `Done`）、Pull request merged（マージで PR を `Done`）、Auto-close issue、Auto-add to project など。無効化するとマージ後の自動遷移が止まるため、変更する場合は本ファイルも更新する

### Status の変更

```bash
# Project 上のアイテム ID を取得（追加済みでも同じ ID が返る）
gh project item-add 3 --owner miyazak --url https://github.com/miyazak/EquipHub/issues/<issue番号> --format json --jq .id

# Status フィールドと選択肢の ID は gh project field-list 3 --owner miyazak --format json で確認する
gh project item-edit --project-id <Project ID> --id <アイテム ID> \
  --field-id <Status フィールド ID> --single-select-option-id <In progress の選択肢 ID>
```

Project ID は `gh project list --owner miyazak --format json` で確認する。
