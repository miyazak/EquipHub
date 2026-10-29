const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

// server.js を読み込む前に、テスト用の一時データファイルを DB_PATH で指定する
// （data/db.json は読み書きしない）
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'equiphub-test-'));
const dbPath = path.join(tmpDir, 'db.json');
process.env.DB_PATH = dbPath;

const app = require('../src/server');

const initialItems = [
  { id: 1, name: 'MacBook Pro 14', category: 'PC', status: 'available', borrower: '', dueDate: '' },
  { id: 2, name: 'iPad Air', category: 'Tablet', status: 'available', borrower: '', dueDate: '' },
  { id: 3, name: 'HD Web Camera', category: 'Camera', status: 'borrowed', borrower: 'Sato', dueDate: '2026-11-03' }
];

let server;
let baseUrl;

function readItems() {
  return JSON.parse(fs.readFileSync(dbPath, 'utf-8')).items;
}

async function request(method, url, body) {
  const res = await fetch(`${baseUrl}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: res.status, body: await res.json() };
}

function ids(items) {
  return items.map((item) => item.id);
}

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://localhost:${server.address().port}`;
});

// テストごとに初期データに戻し、テスト間でデータが共有されないようにする
beforeEach(() => {
  fs.writeFileSync(dbPath, JSON.stringify({ items: initialItems }, null, 2), 'utf-8');
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('テスト用データ', () => {
  it('前のテストで貸し出した備品は、次のテストでは貸出可に戻っている', async () => {
    await request('POST', '/api/items/1/borrow', { borrower: 'Tanaka', dueDate: '2026-12-01' });
    assert.equal(readItems()[0].status, 'borrowed');
  });

  it('前のテストの変更が残っていない', () => {
    assert.equal(readItems()[0].status, 'available');
  });
});

describe('GET /api/items', () => {
  it('status 未指定と status=all は全件を返す', async () => {
    const noStatus = await request('GET', '/api/items');
    const all = await request('GET', '/api/items?status=all');
    assert.equal(noStatus.status, 200);
    assert.deepEqual(ids(noStatus.body), [1, 2, 3]);
    assert.equal(all.status, 200);
    assert.deepEqual(ids(all.body), [1, 2, 3]);
  });

  it('status=available は貸出可の備品だけを返す', async () => {
    const res = await request('GET', '/api/items?status=available');
    assert.equal(res.status, 200);
    assert.deepEqual(ids(res.body), [1, 2]);
  });

  it('status=borrowed は貸出中の備品だけを返す', async () => {
    const res = await request('GET', '/api/items?status=borrowed');
    assert.equal(res.status, 200);
    assert.deepEqual(ids(res.body), [3]);
  });

  it('keyword は備品名を大文字・小文字を区別せずに検索する', async () => {
    const res = await request('GET', '/api/items?keyword=macbook');
    assert.equal(res.status, 200);
    assert.deepEqual(ids(res.body), [1]);
  });

  it('keyword はカテゴリと借用者も検索する', async () => {
    const byCategory = await request('GET', '/api/items?keyword=tablet');
    const byBorrower = await request('GET', '/api/items?keyword=sato');
    assert.deepEqual(ids(byCategory.body), [2]);
    assert.deepEqual(ids(byBorrower.body), [3]);
  });

  it('keyword に一致する備品がなければ空配列を返す', async () => {
    const res = await request('GET', '/api/items?keyword=notfound');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, []);
  });

  it('status と keyword を組み合わせて絞り込める', async () => {
    const res = await request('GET', '/api/items?status=available&keyword=camera');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, []);
  });
});

describe('GET /api/stats', () => {
  it('総数・貸出中・貸出可の件数を返す', async () => {
    const res = await request('GET', '/api/stats');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { total: 99, borrowed: 1, available: 2 }); // CI の失敗表示の確認用（マージしない）
  });

  it('貸出後は件数が更新される', async () => {
    await request('POST', '/api/items/1/borrow', { borrower: 'Tanaka', dueDate: '2026-12-01' });
    const res = await request('GET', '/api/stats');
    assert.deepEqual(res.body, { total: 3, borrowed: 2, available: 1 });
  });
});

describe('POST /api/items/:id/borrow', () => {
  it('借用者と返却期限を指定すると貸出中になり、データに保存される', async () => {
    const res = await request('POST', '/api/items/1/borrow', { borrower: 'Tanaka', dueDate: '2026-12-01' });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'borrowed');
    assert.equal(res.body.borrower, 'Tanaka');
    assert.equal(res.body.dueDate, '2026-12-01');
    assert.deepEqual(readItems()[0], { ...initialItems[0], status: 'borrowed', borrower: 'Tanaka', dueDate: '2026-12-01' });
  });

  it('借用者がなければ 400 を返し、状態は変わらない', async () => {
    const res = await request('POST', '/api/items/1/borrow', { dueDate: '2026-12-01' });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, 'borrower and dueDate are required');
    assert.equal(readItems()[0].status, 'available');
  });

  it('返却期限がなければ 400 を返し、状態は変わらない', async () => {
    const res = await request('POST', '/api/items/1/borrow', { borrower: 'Tanaka' });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, 'borrower and dueDate are required');
    assert.equal(readItems()[0].status, 'available');
  });

  it('存在しない備品は 404 を返す', async () => {
    const res = await request('POST', '/api/items/999/borrow', { borrower: 'Tanaka', dueDate: '2026-12-01' });
    assert.equal(res.status, 404);
    assert.equal(res.body.message, 'Item not found');
  });

  it('貸出中の備品は 409 を返し、借用者は変わらない', async () => {
    const res = await request('POST', '/api/items/3/borrow', { borrower: 'Tanaka', dueDate: '2026-12-01' });
    assert.equal(res.status, 409);
    assert.equal(res.body.message, 'Item is already borrowed');
    assert.equal(readItems()[2].borrower, 'Sato');
  });
});

describe('POST /api/items/:id/return', () => {
  it('貸出中の備品が貸出可に戻り、借用者と返却期限が空になる', async () => {
    const res = await request('POST', '/api/items/3/return');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'available');
    assert.equal(res.body.borrower, '');
    assert.equal(res.body.dueDate, '');
    assert.deepEqual(readItems()[2], { ...initialItems[2], status: 'available', borrower: '', dueDate: '' });
  });

  it('存在しない備品は 404 を返す', async () => {
    const res = await request('POST', '/api/items/999/return');
    assert.equal(res.status, 404);
    assert.equal(res.body.message, 'Item not found');
  });

  it('貸出可の備品は 409 を返す', async () => {
    const res = await request('POST', '/api/items/1/return');
    assert.equal(res.status, 409);
    assert.equal(res.body.message, 'Item is already available');
  });
});
