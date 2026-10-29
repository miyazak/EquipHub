---
name: split-issue
description: EquipHub の Epic や Story を、実装できる粒度の子 Issue（Story / Task）に分解して起票し、サブ Issue として登録する。ユーザーが「Issue を分解して」「Story を Task に分けて」「この Epic を分割して」と依頼したとき、または create-issue で Size が L 以上になったときに使う。
---

# Issue 分解

親 Issue（Epic / Story）の内容とコードを読み、子 Issue に分解して起票する。起票した子 Issue は親 Issue のサブ Issue として登録する。

## 前提

- `gh` CLI がインストール済みで、`gh auth status` が成功すること（`project` スコープが必要）
- 子 Issue の起票は `create-issue` スキルの規約（タイトル・本文テンプレート・ラベル・Project フィールド・Sprint・Milestone）に従う

## 分解の単位

| 親 Issue | 子 Issue |
|---|---|
| Epic | Story（ユーザー視点の要求）。実装作業が明確なものは Task でもよい |
| Story | Task（1 つの PR で完了できる具体的な作業） |
| Task（Size が L 以上） | Task（より小さい作業） |

## 手順

1. 親 Issue を読む: `gh issue view <番号> --json title,body,labels,milestone`
2. 既存のサブ Issue を確認する: `gh api repos/miyazak/EquipHub/issues/<番号>/sub_issues --jq '.[] | "#\(.number) \(.state) \(.title)"'`
3. 関連するコード（`src/server.js`, `public/` など）を読み、現在の実装でどこまで実現できているかを確認する。実装済みの部分は子 Issue にしない
4. 子 Issue の案を作る。各子 Issue について次を決める
   - タイトル（`STORY: ` / `TASK: ` で始める）と本文（create-issue スキルのテンプレート）
   - 受け入れ条件: 親 Issue の受け入れ条件のどれを満たすためのものかが分かるようにする
   - Size: XS〜M に収める（L 以上になるならさらに分ける）
   - Priority: 原則として親 Issue と同じ
   - Sprint / Milestone: 原則として親 Issue と同じ。Sprint は着手時期が決まっていなければ空にする
   - 依存関係: 先に終わらせる必要がある子 Issue があれば「補足」に書く
5. **起票前に、子 Issue の一覧（タイトル・Size・Priority・依存関係）と、親 Issue の受け入れ条件との対応をユーザーに確認してもらう**
   - 親 Issue の受け入れ条件のうち、どの子 Issue でも満たされないものがあれば指摘する
6. 子 Issue を起票し、Project のフィールドを設定する（コマンドは create-issue スキルの手順 6〜7）
7. 子 Issue を親 Issue のサブ Issue として登録する

   ```bash
   # サブ Issue の登録には Issue 番号ではなく Issue の ID が必要
   id=$(gh api repos/miyazak/EquipHub/issues/<子 Issue 番号> --jq .id)
   gh api -X POST repos/miyazak/EquipHub/issues/<親 Issue 番号>/sub_issues -F sub_issue_id=$id
   ```

   - サブ Issue の親は 1 つだけ。既に別の親がある Issue は登録できないため、ユーザーに報告する

8. 親が Epic の場合は、親 Issue 本文の「子 Issue」のチェックリストにも追記する（`gh issue edit <番号> --body-file <本文ファイル>`）
9. 起票した子 Issue の URL と、親 Issue のサブ Issue の件数（`gh api repos/miyazak/EquipHub/issues/<番号> --jq .sub_issues_summary`）を報告する

## 書き方のルール

- 子 Issue は 1 つの PR で完了できる大きさにする
- 「画面」と「API」のように、レビューの観点が異なる作業は分ける
- テストが必要な子 Issue には、受け入れ条件に「テスト観点を作成する」ことを含めてよい（テスト観点の作成は `create-test-viewpoints` スキルを使う）
