// XNX SPEED License Management Admin Frontend Controller
const API_BASE = '/api/licenses';
let currentToken = localStorage.getItem('xnx_admin_token') || '';
let allLicenses = [];

document.addEventListener('DOMContentLoaded', () => {
  if (currentToken) {
    showDashboard();
    fetchLicenses();
  } else {
    showLogin();
  }

  // Event Listeners
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('btn-logout').addEventListener('click', handleLogout);
  document.getElementById('btn-refresh').addEventListener('click', fetchLicenses);
  document.getElementById('btn-open-generate').addEventListener('click', () => {
    document.getElementById('generate-modal').style.display = 'flex';
  });
  document.getElementById('btn-close-modal').addEventListener('click', () => {
    document.getElementById('generate-modal').style.display = 'none';
  });
  document.getElementById('generate-form').addEventListener('submit', handleGenerate);
  document.getElementById('search-input').addEventListener('input', renderTable);
  document.getElementById('filter-status').addEventListener('change', renderTable);
});

function showLogin() {
  document.getElementById('login-overlay').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('admin-pass').value = '';
  document.getElementById('login-msg').textContent = '';
}

function showDashboard() {
  document.getElementById('login-overlay').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
}

function handleLogin(e) {
  e.preventDefault();
  const pass = document.getElementById('admin-pass').value.trim();
  if (!pass) return;

  currentToken = pass;
  fetch(API_BASE, {
    headers: { 'Authorization': `Bearer ${currentToken}` }
  })
  .then(res => {
    if (!res.ok) throw new Error('Invalid Password');
    return res.json();
  })
  .then(data => {
    localStorage.setItem('xnx_admin_token', currentToken);
    showDashboard();
    allLicenses = data.licenses || [];
    renderStats();
    renderTable();
    showToast('✓ Admin Login Successful!');
  })
  .catch(err => {
    document.getElementById('login-msg').textContent = '❌ Access Denied: Incorrect Password';
    currentToken = '';
    localStorage.removeItem('xnx_admin_token');
  });
}

function handleLogout() {
  localStorage.removeItem('xnx_admin_token');
  currentToken = '';
  showLogin();
}

function fetchLicenses() {
  fetch(API_BASE, {
    headers: { 'Authorization': `Bearer ${currentToken}` }
  })
  .then(res => {
    if (res.status === 401) {
      handleLogout();
      throw new Error('Unauthorized');
    }
    return res.json();
  })
  .then(data => {
    allLicenses = data.licenses || [];
    renderStats();
    renderTable();
  })
  .catch(err => console.error(err));
}

function renderStats() {
  const total = allLicenses.length;
  const active = allLicenses.filter(l => l.status === 'active').length;
  const revoked = allLicenses.filter(l => l.status === 'revoked').length;
  const expired = allLicenses.filter(l => l.status === 'expired').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-active').textContent = active;
  document.getElementById('stat-revoked').textContent = revoked;
  document.getElementById('stat-expired').textContent = expired;
}

function renderTable() {
  const search = document.getElementById('search-input').value.toLowerCase().trim();
  const filter = document.getElementById('filter-status').value;
  const tbody = document.getElementById('license-tbody');

  let filtered = allLicenses.filter(lic => {
    const matchStatus = (filter === 'all' || lic.status === filter);
    const matchSearch = (
      lic.client_name.toLowerCase().includes(search) ||
      lic.key.toLowerCase().includes(search) ||
      (lic.hwid && lic.hwid.toLowerCase().includes(search)) ||
      (lic.notes && lic.notes.toLowerCase().includes(search))
    );
    return matchStatus && matchSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 25px; color: var(--text-muted);">No matching licenses found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(lic => {
    const isRevoked = lic.status === 'revoked';
    const isExpired = lic.status === 'expired';
    const badgeClass = isRevoked ? 'badge-revoked' : (isExpired ? 'badge-expired' : 'badge-active');
    const statusText = isRevoked ? 'REVOKED' : (isExpired ? 'EXPIRED' : 'ACTIVE');

    const formattedDate = lic.expires_at ? new Date(lic.expires_at).toLocaleDateString() : 'Lifetime';
    const hwidDisplay = lic.hwid 
      ? `<span class="hwid-tag">${lic.hwid.substring(0, 10)}...</span> <button class="btn-reset-hwid" onclick="resetHwid('${lic.id}')">Reset</button>` 
      : `<span style="color: #64748B;">Unbound</span>`;

    return `
      <tr>
        <td><strong>${escapeHtml(lic.client_name)}</strong><br><small style="color:#64748B;">${escapeHtml(lic.notes || '')}</small></td>
        <td>
          <div class="key-pill">
            <span>${escapeHtml(lic.key)}</span>
            <button class="btn-copy" onclick="copyText('${escapeHtml(lic.key)}')">📋</button>
          </div>
        </td>
        <td>${escapeHtml(lic.plan || 'VIP')}</td>
        <td>${hwidDisplay}</td>
        <td>${formattedDate}</td>
        <td><span class="badge-status ${badgeClass}">${statusText}</span></td>
        <td>
          <div style="display: flex; gap: 6px;">
            ${isRevoked 
              ? `<button class="btn-action-activate" onclick="toggleStatus('${lic.id}', 'activate')">🟢 Activate</button>`
              : `<button class="btn-action-revoke" onclick="toggleStatus('${lic.id}', 'revoke')">⛔ Revoke</button>`
            }
            <button class="btn-action-del" onclick="deleteLicense('${lic.id}')">🗑</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function handleGenerate(e) {
  e.preventDefault();
  const client_name = document.getElementById('gen-client-name').value.trim();
  const plan = document.getElementById('gen-plan').value;
  const days = document.getElementById('gen-days').value;
  const custom_key = document.getElementById('gen-custom-key').value.trim();
  const notes = document.getElementById('gen-notes').value.trim();

  fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`
    },
    body: JSON.stringify({ client_name, plan, days, custom_key, notes })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      document.getElementById('generate-modal').style.display = 'none';
      document.getElementById('generate-form').reset();
      showToast(`✓ Generated Key: ${data.license.key}`);
      fetchLicenses();
    } else {
      alert(data.message || 'Error generating license');
    }
  })
  .catch(err => console.error(err));
}

function toggleStatus(id, action) {
  fetch(API_BASE, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`
    },
    body: JSON.stringify({ id, action })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showToast(`✓ License ${action === 'revoke' ? 'Revoked' : 'Activated'}!`);
      fetchLicenses();
    }
  });
}

function resetHwid(id) {
  if (!confirm("Reset hardware ID binding for this key?")) return;
  fetch(API_BASE, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`
    },
    body: JSON.stringify({ id, action: 'reset_hwid' })
  })
  .then(res => res.json())
  .then(() => {
    showToast('✓ HWID Reset!');
    fetchLicenses();
  });
}

function deleteLicense(id) {
  if (!confirm("Are you sure you want to permanently delete this license?")) return;
  fetch(`${API_BASE}?id=${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${currentToken}`
    }
  })
  .then(res => res.json())
  .then(() => {
    showToast('✓ License Deleted!');
    fetchLicenses();
  });
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`✓ Copied: ${text}`);
  });
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}
