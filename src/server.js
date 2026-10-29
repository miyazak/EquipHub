const path = require('path');

// リポジトリ直下の .env を読み込む（既に設定済みの環境変数は上書きしない）
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'db.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

function readDb() {
  const raw = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

function getItemById(items, id) {
  return items.find((item) => item.id === Number(id));
}

app.get('/api/items', (req, res) => {
  const data = readDb();
  const { status, keyword } = req.query;

  let items = data.items;

  if (status && status !== 'all') {
    items = items.filter((item) => item.status === status);
  }

  if (keyword) {
    const q = String(keyword).toLowerCase();
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.borrower.toLowerCase().includes(q)
    );
  }

  res.json(items);
});

app.get('/api/stats', (req, res) => {
  const data = readDb();
  const total = data.items.length;
  const borrowed = data.items.filter((item) => item.status === 'borrowed').length;
  const available = total - borrowed;
  res.json({ total, borrowed, available });
});

app.post('/api/items/:id/borrow', (req, res) => {
  const { borrower, dueDate } = req.body;

  if (!borrower || !dueDate) {
    return res.status(400).json({ message: 'borrower and dueDate are required' });
  }

  const data = readDb();
  const item = getItemById(data.items, req.params.id);

  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }

  if (item.status === 'borrowed') {
    return res.status(409).json({ message: 'Item is already borrowed' });
  }

  item.status = 'borrowed';
  item.borrower = borrower;
  item.dueDate = dueDate;

  writeDb(data);
  return res.json(item);
});

app.post('/api/items/:id/return', (req, res) => {
  const data = readDb();
  const item = getItemById(data.items, req.params.id);

  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }

  if (item.status === 'available') {
    return res.status(409).json({ message: 'Item is already available' });
  }

  item.status = 'available';
  item.borrower = '';
  item.dueDate = '';

  writeDb(data);
  return res.json(item);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`EquipHub is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
