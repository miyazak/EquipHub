---
name: create-issue
description: EquipHub の GitHub Issue を作成する。ユーザーが「Issue を作って」「バグを起票して」「タスクを登録して」「バックログを登録して」と依頼したとき、または docs/project-seed.md の項目を Issue 化するときに使う。
---

# Issue 作成

EquipHub リポジトリ（`miyazak/EquipHub`）に Issue を作成し、Project `for demo`（owner `miyazak`、番号 `3`）に追加する。

## 前提

- `gh` CLI がインストール済みで、`gh auth status` が成功すること（`project` スコープが必要）
- `gh` が使えない場合は Issue を作成せず、タイトルと本文を Markdown で出力し、ユーザーに手動での登録を依頼する

## 手順

1. 依頼内容から Issue の種類を決める: Epic / Story / Task / Bug / Spike
2. 重複を確認する: `gh issue list --state all --search "<キーワード>"`（seed の項目は #1〜#20 に登録済み）
3. Bug の場合は、コード（`src/server.js`, `public/app.js`）を読んで実際に再現するか確認する。再現しない場合は起票せず、ユーザーに報告する
4. Sprint と Milestone を決める（ルールは AGENTS.md の「Sprint と Milestone」）
   - Sprint: 着手するスプリントが決まっていれば指定する。未定なら空にする（スプリント計画で割り当てる）
   - Milestone: 対応する Epic のリリース目標があれば指定する。なければ空にする
   - どちらも、会話から分からない場合はユーザーに聞く。Sprint と Milestone の一覧は下のコマンドで確認し、存在しないものは勝手に作らない
5. 下のテンプレートでタイトル・本文・ラベル・Project フィールド・Sprint・Milestone の値を決め、**作成前にユーザーに内容を確認してもらう**（複数件を一括登録する場合は一覧で確認する）
6. Issue を作成する。本文は一時ファイルに書いて `--body-file` で渡す（改行や記号の崩れを防ぐ）。Milestone を指定する場合は `--milestone` を付ける

   ```bash
   gh issue create --title "<タイトル>" --body-file <本文ファイル> \
     --label "<種類ラベル>" --label "<優先度ラベル>" --project "for demo" \
     --milestone "<Milestone 名>"
   ```

7. Project のフィールド（Priority / Size / Sprint）を設定する

   ```bash
   # Project 上のアイテム ID を取得する
   # `--project` で追加済みの場合、item-add は「Content already exists」エラーになることがあるため、
   # エラーになったら Issue 番号でアイテムを探す（エラーで手順を止めない）
   gh project item-add 3 --owner miyazak --url <Issue の URL> --format json --jq .id \
     || gh project item-list 3 --owner miyazak --limit 1000 --format json \
          --jq '.items[] | select(.content.type=="Issue" and .content.number==<issue番号>) | .id'

   # フィールド ID と選択肢 ID を取得
   gh project field-list 3 --owner miyazak --format json

   gh project item-edit --project-id <Project ID> --id <アイテム ID> \
     --field-id <フィールド ID> --single-select-option-id <選択肢 ID>

   # Sprint を設定する（Sprint の ID は下の「Sprint と Milestone の確認」で取得する）
   gh project item-edit --project-id <Project ID> --id <アイテム ID> \
     --field-id <Sprint フィールド ID> --iteration-id <Sprint の ID>
   ```

   Project ID は `gh project list --owner miyazak --format json` で取得する。

8. 設定できたかを確認する。Priority が優先度ラベルと一致し、Size と（指定した場合は）Sprint・Milestone が入っていること。途中でエラーになった場合も、この確認で抜けを見つけて設定し直す

   ```bash
   gh project item-list 3 --owner miyazak --limit 1000 --format json \
     --jq '.items[] | select(.content.type=="Issue" and .content.number==<issue番号>) | {status, priority, size, sprint: .sprint.title, milestone: .milestone.title, labels}'
   ```

9. 作成された Issue の URL と、設定したラベル・フィールド・Sprint・Milestone を報告する

## ラベルと Project フィールド

| 種類 | 種類ラベル |
|---|---|
| Epic | `epic` |
| Story | `story` |
| Task | `task` |
| Bug | `bug` |
| Spike | なし（ラベルを付けず、タイトルで区別する） |

- 優先度ラベル: `p1` / `p2` / `p3`
- Project の Priority: P1 / P2 / P3（優先度ラベルと同じ値にする。例: `p2` なら P2）
- Project の Size: XS / S / M / L / XL
- 存在しないラベルは勝手に作らない（`gh label list` で確認する）

## Sprint と Milestone の確認

Sprint と Milestone は今後追加されていくため、起票のたびに一覧を確認する。

```bash
# Sprint の一覧（フィールド ID、各 Sprint の ID・名前・開始日）
gh api graphql -f query='query{user(login:"miyazak"){projectV2(number:3){field(name:"Sprint"){... on ProjectV2IterationField{id configuration{iterations{id title startDate duration}}}}}}}'

# Milestone の一覧（名前と期限）
gh api repos/miyazak/EquipHub/milestones --jq '.[] | "\(.title)\t\(.due_on)"'
```

- 終了済みのスプリントには割り当てない（`iterations` に含まれるのは現在と今後のスプリント）

## タイトル

`<TYPE>: <内容>` の形式にする（既存 Issue と `docs/project-seed.md` に合わせる）。

- `STORY: 利用者として、備品を貸し出し申請したい`
- `TASK: 貸出 API を実装する`
- `BUG: 返却期限が過去日でも登録できる`

Story はユーザー視点の「〇〇として、△△したい」で書く。

## 本文テンプレート

`.github/ISSUE_TEMPLATE/` の各テンプレート（Web 画面から起票する人向け）と同じ項目にする（変更する場合は両方をそろえる）。見出しは Web 画面のテンプレートで起票した場合と同じ `###` にする。

### Story / Task / Spike

```markdown
### 概要
<何を・なぜ行うか>

### 受け入れ条件
- [ ] <検証可能な条件>
- [ ] <検証可能な条件>

### 補足
- 関連: #<親 Epic / Story の番号（あれば）>
- 影響範囲: <src/server.js など>
```

### Bug

```markdown
### 現象
<何が起きるか>

### 再現手順
1. <手順>
2. <手順>

### 期待する動作
<本来どうなるべきか>

### 原因の見立て
<該当コードの場所（ファイル名:行番号）と理由>

### 受け入れ条件
- [ ] <修正後に満たすべき条件>
```

### Epic

```markdown
### 目的
<この Epic で実現したいこと>

### 子 Issue
- [ ] #<番号> <タイトル>

### 完了の定義
<Epic 全体が完了したと言える状態>
```

## 書き方のルール

- 受け入れ条件は、第三者が確認できる具体的な条件にする（例: 「過去日を指定すると 400 が返る」）
- Size の目安: XS = 数行の修正、S = 1 ファイル内の変更、M = API と画面の両方の変更、L 以上 = 分割を検討すべき規模
- L 以上の場合は、Story / Task への分割を提案する（分割は `split-issue` スキルで行う）
