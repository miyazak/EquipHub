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
4. 下のテンプレートでタイトル・本文・ラベル・Project フィールドの値を決め、**作成前にユーザーに内容を確認してもらう**（複数件を一括登録する場合は一覧で確認する）
5. Issue を作成する。本文は一時ファイルに書いて `--body-file` で渡す（改行や記号の崩れを防ぐ）

   ```bash
   gh issue create --title "<タイトル>" --body-file <本文ファイル> \
     --label "<種類ラベル>" --label "<優先度ラベル>" --project "for demo"
   ```

6. Project のフィールド（Priority / Size）を設定する

   ```bash
   # Project 上のアイテム ID を取得（追加済みでも同じ ID が返る）
   gh project item-add 3 --owner miyazak --url <Issue の URL> --format json --jq .id

   # フィールド ID と選択肢 ID を取得
   gh project field-list 3 --owner miyazak --format json

   gh project item-edit --project-id <Project ID> --id <アイテム ID> \
     --field-id <フィールド ID> --single-select-option-id <選択肢 ID>
   ```

   Project ID は `gh project list --owner miyazak --format json` で取得する。

7. 作成された Issue の URL と、設定したラベル・フィールドを報告する

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

## タイトル

`<TYPE>: <内容>` の形式にする（既存 Issue と `docs/project-seed.md` に合わせる）。

- `STORY: 利用者として、備品を貸し出し申請したい`
- `TASK: 貸出 API を実装する`
- `BUG: 返却期限が過去日でも登録できる`

Story はユーザー視点の「〇〇として、△△したい」で書く。

## 本文テンプレート

### Story / Task / Spike

```markdown
## 概要
<何を・なぜ行うか>

## 受け入れ条件
- [ ] <検証可能な条件>
- [ ] <検証可能な条件>

## 補足
- 関連: #<親 Epic / Story の番号（あれば）>
- 影響範囲: <src/server.js など>
```

### Bug

```markdown
## 現象
<何が起きるか>

## 再現手順
1. <手順>
2. <手順>

## 期待する動作
<本来どうなるべきか>

## 原因の見立て
<該当コードの場所（ファイル名:行番号）と理由>

## 受け入れ条件
- [ ] <修正後に満たすべき条件>
```

### Epic

```markdown
## 目的
<この Epic で実現したいこと>

## 子 Issue
- [ ] #<番号> <タイトル>

## 完了の定義
<Epic 全体が完了したと言える状態>
```

## 書き方のルール

- 受け入れ条件は、第三者が確認できる具体的な条件にする（例: 「過去日を指定すると 400 が返る」）
- Size の目安: XS = 数行の修正、S = 1 ファイル内の変更、M = API と画面の両方の変更、L 以上 = 分割を検討すべき規模
- L 以上の場合は、Story / Task への分割を提案する
