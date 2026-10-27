const tableBody = document.getElementById('itemTableBody');
const statusFilter = document.getElementById('statusFilter');
const keywordInput = document.getElementById('keyword');
const statsBox = document.getElementById('stats');
const reloadBtn = document.getElementById('reloadBtn');
const borrowFormTemplate = document.getElementById('borrowFormTemplate');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  return res.json();
}

function renderStats(stats) {
  statsBox.innerHTML = `
    <article class="stat">
      <span class="label">総備品数</span>
      <span class="value">${stats.total}</span>
    </article>
    <article class="stat">
      <span class="label">貸出可</span>
      <span class="value">${stats.available}</span>
    </article>
    <article class="stat">
      <span class="label">貸出中</span>
      <span class="value">${stats.borrowed}</span>
    </article>
  `;
}

function statusBadge(status) {
  if (status === 'borrowed') {
    return '<span class="badge borrowed">貸出中</span>';
  }
  return '<span class="badge available">貸出可</span>';
}

function createBorrowForm(itemId) {
  const node = borrowFormTemplate.content.firstElementChild.cloneNode(true);
  node.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(node);
    const borrower = formData.get('borrower');
    const dueDate = formData.get('dueDate');

    try {
      await fetchJson(`/api/items/${itemId}/borrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borrower, dueDate })
      });
      await loadScreen();
    } catch (error) {
      alert(error.message);
    }
  });
  return node;
}

function createReturnButton(itemId) {
  const button = document.createElement('button');
  button.className = 'btn btn-small';
  button.type = 'button';
  button.textContent = '返却';
  button.addEventListener('click', async () => {
    try {
      await fetchJson(`/api/items/${itemId}/return`, { method: 'POST' });
      await loadScreen();
    } catch (error) {
      alert(error.message);
    }
  });
  return button;
}

function renderItems(items) {
  tableBody.innerHTML = '';

  if (items.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="7">条件に一致する備品がありません。</td>';
    tableBody.appendChild(tr);
    return;
  }

  items.forEach((item, i) => {
    const tr = document.createElement('tr');
    tr.style.animationDelay = `${i * 35}ms`;

    tr.innerHTML = `
      <td>${item.id}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.category)}</td>
      <td>${statusBadge(item.status)}</td>
      <td>${escapeHtml(item.borrower || '-')}</td>
      <td>${escapeHtml(item.dueDate || '-')}</td>
      <td><div class="inline-action" id="action-${item.id}"></div></td>
    `;

    tableBody.appendChild(tr);

    const actionCell = document.getElementById(`action-${item.id}`);
    if (item.status === 'available') {
      actionCell.appendChild(createBorrowForm(item.id));
    } else {
      actionCell.appendChild(createReturnButton(item.id));
    }
  });
}

async function loadScreen() {
  const status = statusFilter.value;
  const keyword = keywordInput.value.trim();
  const query = new URLSearchParams({ status, keyword }).toString();

  const [items, stats] = await Promise.all([
    fetchJson(`/api/items?${query}`),
    fetchJson('/api/stats')
  ]);

  renderItems(items);
  renderStats(stats);
}

statusFilter.addEventListener('change', loadScreen);
keywordInput.addEventListener('input', loadScreen);
reloadBtn.addEventListener('click', loadScreen);

loadScreen().catch((error) => {
  alert(`初期読み込みに失敗しました: ${error.message}`);
});
