# AGENTS.md

AI コーディングエージェント向けの作業ガイドです。人間向けの説明は [README.md](README.md) を参照してください。

## プロジェクト概要

EquipHub は社内デモ用の備品貸し出し管理 Web アプリです。
「GitHub Projects を使ったアジャイル風プロジェクト管理」と「AI 駆動開発」のデモ題材として使います。
機能は意図的に最小限にしているため、デモの見せ場にならない大きな機能追加や構成変更は避けてください。

## 技術構成

- Node.js 18 以上 / Express 4（CommonJS）
- 環境変数はリポジトリ直下の `.env` から dotenv で読み込む（設定できる項目は `.env.example`）
- データは `data/db.json` を直接読み書き（DB なし）
- フロントエンドは `public/` の素の HTML / CSS / JavaScript（フレームワーク・ビルドなし）

```
src/server.js        API サーバー（静的ファイル配信も兼ねる）
public/index.html    画面
public/app.js        画面ロジック
public/styles.css    スタイル
data/db.json         備品データ（.gitignore 対象）
docs/project-seed.md GitHub Projects 用のバックログ種
.github/             Issue テンプレート（Epic / Story / Task / Bug）、PR テンプレート、GitHub Actions のワークフロー
.claude/skills/      Claude Code のスキル（create-issue / split-issue / create-test-viewpoints / create-pr）
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
   - Epic / Story や Size が L 以上の Issue は、`split-issue` スキルで 1 つの PR で完了できる子 Issue に分解してから着手する
   - 機能の追加・変更・不具合修正では、実装に着手する前に `create-test-viewpoints` スキルでテスト観点を作成し、Issue に記録する
2. ブランチ名: `<type>/<issue番号>-<短い英語の説明>`（例: `fix/12-reject-past-due-date`）
   - type: `feat` / `fix` / `docs` / `chore` / `refactor` / `test`
   - 手元で作業ブランチを作成したら、Project 上の Issue の Status を `In progress` に変更する（手順は下の「Status の変更」）
3. コミットメッセージ: `#<issue番号> <type>: <要約>`（日本語可。例: `#12 fix: 過去日の返却期限を拒否する`）
   - 1 行目の先頭に必ず Issue 番号を付ける（GitHub 上でコミットと Issue を相互に辿れるようにするため）
   - `#` で始まる行はエディタでの編集時にコメント扱いで消えるため、`git commit -m "..."` または `git commit -F <ファイル>` で渡す（エディタを使う場合は `git config commit.cleanup scissors` を設定する）
4. `main` へ直接コミット・push しない
5. 機能を追加・変更・削除したら、同じ PR で [README.md](README.md) を更新する
   - 「現在できること」（アプリ / 開発フロー）、「API」、主な制約が実装と一致しているか確認する
   - 制約を解消した場合（例: 過去日のチェックを追加した）は、主な制約から削除する
   - 機能に影響しない変更（リファクタリング、テストのみなど）は更新不要
6. PR は `create-pr` スキルを使って作成する。タイトルはコミットメッセージと同じ `#<issue番号> <type>: <要約>` とし、本文には次を必ず含める
   - `Closes #<issue番号>`（マージ時に Issue をクローズし、Project 上で Done に遷移させるため）
   - 「AI 生成部分」と「人間レビュー観点」
7. PR がマージされたら、Issue をクローズし、Project 上の Status を `Done` にする
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
  - `Sprint`: スプリント（Iteration）。詳細は下の「Sprint と Milestone」
  - `Milestone`: リポジトリの Milestone。詳細は下の「Sprint と Milestone」
- Issue の種類はラベルで表す: `epic` / `story` / `task` / `bug`
- 優先度ラベル: `p1` / `p2` / `p3`（Project の Priority と同じ段階。ラベルと Priority は同じ値にそろえる）
- すべての Issue に Priority と Size を設定する。抜けや食い違いは下の「Priority と Size の確認」で見つける
- 有効な組み込みワークフロー: Item closed（クローズで `Done`）、Pull request merged（マージで PR を `Done`）、Auto-close issue、Auto-add to project など。無効化するとマージ後の自動遷移が止まるため、変更する場合は本ファイルも更新する

### Sprint と Milestone

Sprint（スプリント）と Milestone（リリース目標）は今後追加されていくため、一覧は本ファイルに記載せず、下のコマンドや GitHub の画面で確認する。

- Sprint: Project の Iteration フィールド `Sprint`
  - 1 スプリントは 1 週間（月曜〜日曜）
  - 名前は `Sprint <連番>`
  - スプリントごとにテーマ（取り組む Epic など）を決める
- Milestone: リポジトリの Milestone。リリース目標を表し、原則として Epic と対応させて期限を設定する
- 割り当てのルール
  - 起票時に、着手するスプリントが決まっていれば Sprint を、対応する Epic があれば Milestone を指定する
  - 着手時期が未定の Issue は Sprint を空にしておき、スプリント計画（Project のビュー「Sprint planning」）で割り当てる
  - スプリント終了時に `Done` になっていない Issue は、次のスプリントに繰り越す（Sprint を次のスプリントに変更する）。繰り越す前に、分割や優先度の見直しが必要かを検討する
- スプリント運用用の Project のビュー: Current sprint（今のスプリント）、Next sprint（次のスプリント）、Sprint planning（未割り当ての Open な Issue）、Sprint roadmap（時間軸）

```bash
# Sprint の一覧と ID を確認する
gh api graphql -f query='query{user(login:"miyazak"){projectV2(number:3){field(name:"Sprint"){... on ProjectV2IterationField{id configuration{iterations{id title startDate duration} completedIterations{id title startDate}}}}}}}'

# Issue に Sprint を設定する（アイテム ID の取得方法は下の「Status の変更」と同じ）
gh project item-edit --project-id <Project ID> --id <アイテム ID> \
  --field-id <Sprint フィールド ID> --iteration-id <Sprint の ID>

# Milestone の一覧を確認する
gh api repos/miyazak/EquipHub/milestones --jq '.[] | "\(.title)\t\(.due_on)"'

# Issue に Milestone を設定する
gh issue edit <issue番号> --milestone "<Milestone 名>"
```

### Priority と Size の確認

Web 画面の Issue テンプレートから起票した場合や、手順の途中でエラーになった場合は、Project の Priority / Size が設定されないことがある。次のタイミングで下のコマンドを実行し、出力された Issue を設定し直す（何も出力されなければ問題なし）。

- スプリント計画のとき（次のスプリントに割り当てる前）
- スプリントの終了時
- Issue をまとめて起票・分解した後

```bash
# 優先度ラベルと Priority が食い違っている、または Size が空の Issue を一覧にする
gh project item-list 3 --owner miyazak --limit 1000 --format json \
  --jq '.items[] | select(.content.type=="Issue") | (([.labels[]? | select(test("^p[123]$"))][0] // "") | ascii_upcase) as $l | select($l != (.priority // "") or .size == null) | "#\(.content.number)\tlabel=\($l)\tPriority=\(.priority // "-")\tSize=\(.size // "-")"'
```

Priority は GitHub Actions（`.github/workflows/sync-project-priority.yml`）でも自動で同期する。

- Issue の起票・再オープン・ラベルの変更時に、優先度ラベル（`p1`〜`p3`）の値を Project の Priority に設定する（Issue が Project にない場合は追加する）
- 起票時に優先度ラベルまたは Size がない場合は、Issue に設定を促すコメントを付ける
- Size はラベルがないため自動では設定しない。起票した人が設定する
- 実行には、Project を操作できる Personal Access Token（classic、`project` スコープ）をリポジトリの Secret `PROJECT_TOKEN` に登録しておく必要がある。未登録の場合、ワークフローは何もせずに終了する

### Status の変更

```bash
# Project 上のアイテム ID を取得する
# 追加済みの場合、item-add は「Content already exists」エラーになることがあるため、Issue 番号で探し直す
gh project item-add 3 --owner miyazak --url https://github.com/miyazak/EquipHub/issues/<issue番号> --format json --jq .id \
  || gh project item-list 3 --owner miyazak --limit 1000 --format json \
       --jq '.items[] | select(.content.type=="Issue" and .content.number==<issue番号>) | .id'

# Status フィールドと選択肢の ID は gh project field-list 3 --owner miyazak --format json で確認する
gh project item-edit --project-id <Project ID> --id <アイテム ID> \
  --field-id <Status フィールド ID> --single-select-option-id <In progress の選択肢 ID>
```

Project ID は `gh project list --owner miyazak --format json` で確認する。
