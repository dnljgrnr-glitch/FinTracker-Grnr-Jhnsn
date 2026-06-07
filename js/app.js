// ============================================================
//  APP.JS  — FinTracker Garner-Johnson  v8.0
//  Audit fixes applied:
//   1. Slider goal input: data-si-goal only (no data-goal dupe)
//   2. Dashboard totalDebt uses track: not startBal
//   3. Roadmap milestones read from track: not walletGet()
//   4. Debt Snapshot tables use track: with startBal fallback
//   5. Dead code moInterest removed
//   6. Settings: no debt/savings amounts — only spending/income/APR/split
//   7. Balance Log: one-button snapshot, no re-entry
//   8. Restored: Move Fund countdown
//   9. Restored: Monthly interest burn
//  10. Debt slider labels: "Started At" not "Goal"
// ============================================================

'use strict';

// ── State ────────────────────────────────────────────────────
let unlocked  = false;
let activeTab = 'dashboard';
let activePerson = 'daniel';

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkJasper();
  renderAll();
  wireGlobalEvents();
});

function checkJasper() {
  const stored = localStorage.getItem('jasper_unlocked');
  if (stored === 'true') {
    unlocked = true;
  }
}

function wireGlobalEvents() {
  // Tab bar
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      renderAll();
    });
  });

  // Person selector
  document.querySelectorAll('[data-person]').forEach(btn => {
    btn.addEventListener('click', () => {
      activePerson = btn.dataset.person;
      renderAll();
    });
  });

  // Slider delegation
  document.addEventListener('input', handleSliderInput);
  document.addEventListener('change', handleSliderChange);
}

// ── Render All ───────────────────────────────────────────────
function renderAll() {
  renderNav();
  renderBody();
}

function renderNav() {
  const tabs = ['dashboard', 'daniel', 'sonia', 'roadmap', 'settings'];
  const labels = { dashboard: 'Dashboard', daniel: 'Daniel', sonia: 'Sonia', roadmap: 'Roadmap', settings: 'Settings' };
  const nav = document.getElementById('nav');
  if (!nav) return;
  nav.innerHTML = tabs.map(t => `
    <button data-tab="${t}" class="nav-btn ${activeTab === t ? 'active' : ''}">${labels[t]}</button>
  `).join('');
  nav.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => { activeTab = btn.dataset.tab; renderAll(); });
  });
}

function renderBody() {
  const body = document.getElementById('body');
  if (!body) return;
  if (!unlocked) { body.innerHTML = renderLock(); return; }

  switch (activeTab) {
    case 'dashboard': body.innerHTML = renderDashboard(); break;
    case 'daniel':    body.innerHTML = renderPerson('daniel'); break;
    case 'sonia':     body.innerHTML = renderPerson('sonia'); break;
    case 'roadmap':   body.innerHTML = renderRoadmap(); break;
    case 'settings':  body.innerHTML = renderSettings(); break;
    default:          body.innerHTML = renderDashboard();
  }

  bindBodyEvents();
}

// ── Lock Screen ──────────────────────────────────────────────
function renderLock() {
  return `
    <div class="lock-screen">
      <div class="lock-card">
        <div class="lock-icon">🔒</div>
        <h2>Household Access</h2>
        <p>Enter the passphrase to continue.</p>
        <input id="jasperInput" type="password" placeholder="Passphrase" class="lock-input" autocomplete="off" />
        <button id="jasperBtn" class="btn-primary">Unlock</button>
        <div id="lockError" class="lock-error"></div>
      </div>
    </div>
  `;
}

// Simple synchronous hash — no async, no crypto.subtle, no failure modes
function simpleHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0;
  }
  return h.toString(16);
}

function attemptUnlock() {
  const input = document.getElementById('jasperInput');
  if (!input) return;
  const val = input.value.trim().toUpperCase();
  if (simpleHash(val) === DATA.jasper.hash) {
    unlocked = true;
    localStorage.setItem('jasper_unlocked', 'true');
    renderAll();
  } else {
    const err = document.getElementById('lockError');
    if (err) err.textContent = 'Incorrect passphrase.';
    input.value = '';
    input.focus();
  }
}
window.attemptUnlock = attemptUnlock;

function lock() {
  unlocked = false;
  localStorage.removeItem('jasper_unlocked');
  renderAll();
}
window.lock = lock;

// ── Dashboard ────────────────────────────────────────────────
function renderDashboard() {
  const debt     = totalDebt();         // uses track: live values
  const savings  = totalSavings();
  const interest = totalInterestBurn();
  const move     = moveFundCountdown();

  const dWallet  = walletGet('daniel', 'checking') + walletGet('daniel', 'savings');
  const sWallet  = walletGet('sonia',  'checking') + walletGet('sonia',  'savings');
  const combined = dWallet + sWallet;

  const totalIncome = DATA.income.daniel.monthly + DATA.income.sonia.monthly;

  return `
    <div class="dashboard">
      <header class="dash-header">
        <h1>Garner-Johnson</h1>
        <span class="lock-btn" onclick="lock()">Lock</span>
      </header>

      <div class="hero-grid">
        <div class="hero-card red">
          <div class="hero-label">Total Debt</div>
          <div class="hero-value">${fmt(debt)}</div>
        </div>
        <div class="hero-card green">
          <div class="hero-label">Total Savings</div>
          <div class="hero-value">${fmt(savings)}</div>
        </div>
        <div class="hero-card blue">
          <div class="hero-label">Combined Wallets</div>
          <div class="hero-value">${fmt(combined)}</div>
        </div>
        <div class="hero-card amber">
          <div class="hero-label">Monthly Interest Burn</div>
          <div class="hero-value">${fmt(interest)}<span class="hero-sub">/mo</span></div>
        </div>
      </div>

      <div class="section-title">Move Fund Countdown</div>
      <div class="move-card">
        <div class="move-row">
          <span class="move-label">Days to July 10</span>
          <span class="move-val">${move.daysLeft}</span>
        </div>
        <div class="move-row">
          <span class="move-label">Paychecks Left</span>
          <span class="move-val">${move.paychecksLeft}</span>
        </div>
        <div class="move-row">
          <span class="move-label">Remaining to Goal</span>
          <span class="move-val">${fmt(move.remaining)}</span>
        </div>
        <div class="move-row highlight">
          <span class="move-label">Needed Per Paycheck</span>
          <span class="move-val">${fmt(move.perPaycheck)}</span>
        </div>
        <div class="move-progress">
          <div class="move-bar" style="width:${Math.min(100,(move.currentBal/move.targetAmount)*100).toFixed(1)}%"></div>
        </div>
        <div class="move-prog-label">${fmt(move.currentBal)} of ${fmt(move.targetAmount)}</div>
      </div>

      <div class="dash-two-col">
        <div>
          <div class="section-title">Daniel</div>
          ${renderWalletCard('daniel')}
        </div>
        <div>
          <div class="section-title">Sonia</div>
          ${renderWalletCard('sonia')}
        </div>
      </div>

      <div class="section-title">Household Income</div>
      <div class="income-row">
        <span>Combined Monthly Take-Home</span>
        <strong>${fmt(totalIncome)}</strong>
      </div>
    </div>
  `;
}

function renderWalletCard(person) {
  const checking = walletGet(person, 'checking');
  const savings  = walletGet(person, 'savings');
  return `
    <div class="wallet-card">
      <div class="wallet-row">
        <label>Checking</label>
        <input type="number" class="wallet-input" data-wallet-person="${person}" data-wallet-type="checking"
               value="${checking}" placeholder="0.00" />
      </div>
      <div class="wallet-row">
        <label>Savings</label>
        <input type="number" class="wallet-input" data-wallet-person="${person}" data-wallet-type="savings"
               value="${savings}" placeholder="0.00" />
      </div>
      <div class="wallet-total">Total: <strong>${fmt(checking + savings)}</strong></div>
    </div>
  `;
}

// ── Person Tab ───────────────────────────────────────────────
function renderPerson(person) {
  const name = DATA.names[person];
  const subTabs = ['wallet', 'debt', 'spending', 'paychecks', 'budget', 'checklist'];
  const stored = localStorage.getItem('subtab:' + person) || 'wallet';

  return `
    <div class="person-tab">
      <header class="person-header">
        <h2>${name}</h2>
      </header>
      <div class="sub-tab-bar">
        ${subTabs.map(s => `
          <button class="sub-btn ${stored === s ? 'active' : ''}"
                  onclick="setSubTab('${person}','${s}')">${capitalize(s)}</button>
        `).join('')}
      </div>
      <div class="sub-body">
        ${renderSubTab(person, stored)}
      </div>
    </div>
  `;
}

function setSubTab(person, sub) {
  localStorage.setItem('subtab:' + person, sub);
  renderAll();
}
window.setSubTab = setSubTab;

function renderSubTab(person, sub) {
  switch (sub) {
    case 'wallet':    return renderSubWallet(person);
    case 'debt':      return renderSubDebt(person);
    case 'spending':  return renderSubSpending(person);
    case 'paychecks': return renderSubPaychecks(person);
    case 'budget':    return renderSubBudget(person);
    case 'checklist': return renderSubChecklist(person);
    default: return '';
  }
}

// Sub: Wallet
function renderSubWallet(person) {
  return `
    <div class="sub-section">
      <div class="section-title">Wallet</div>
      ${renderWalletCard(person)}
    </div>
  `;
}

// Sub: Debt — sliders with track: as live value, startBal as max/default
function renderSubDebt(person) {
  const myDebts = DATA.debts.filter(d => d.owner === person || d.owner === 'joint');
  if (!myDebts.length) return '<p class="empty">No debts assigned.</p>';

  return `
    <div class="sub-section">
      <div class="section-title">Debt Tracker</div>
      ${myDebts.map(d => renderDebtSlider(d)).join('')}
      <div class="snapshot-title">Debt Snapshot</div>
      <table class="snapshot-table">
        <thead><tr><th>Account</th><th>APR</th><th>Balance</th><th>Mo. Interest</th></tr></thead>
        <tbody>
          ${myDebts.map(d => {
            const bal = currentBal(d);  // uses track: with startBal fallback
            const mi  = bal * (d.apr / 100 / 12);
            return `<tr>
              <td>${d.label}</td>
              <td>${d.apr}%</td>
              <td class="bal-cell" data-debt-id="${d.id}">${fmt(bal)}</td>
              <td>${fmt(mi)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderDebtSlider(debt) {
  const live = trackGet(debt.id);
  const current = live !== null ? live : debt.startBal;
  const max = debt.startBal;
  const pct = max > 0 ? (((max - current) / max) * 100).toFixed(1) : 0;

  return `
    <div class="slider-block" data-si="${debt.id}" data-si-max="${max}" data-si-type="debt">
      <div class="slider-top">
        <span class="slider-label">${debt.label}</span>
        <span class="slider-pct" data-si-pct="${debt.id}">${pct}% paid</span>
      </div>
      <div class="slider-track">
        <div class="slider-fill debt-fill" data-si-fill="${debt.id}"
             style="width:${pct}%"></div>
        <input type="range" class="slider-range"
               data-si-range="${debt.id}"
               min="0" max="${max}" step="1"
               value="${max - current}" />
      </div>
      <div class="slider-inputs">
        <div class="si-input-group">
          <label class="si-label">Started At</label>
          <input type="number" class="si-input" data-si-goal="${debt.id}"
                 value="${max}" placeholder="${max}" />
        </div>
        <div class="si-input-group">
          <label class="si-label">Now</label>
          <input type="number" class="si-input" data-si-now="${debt.id}"
                 value="${current}" placeholder="${current}" />
        </div>
      </div>
      <div class="slider-meta">${fmt(current)} remaining — ${fmt(max - current)} paid</div>
    </div>
  `;
}

// Sub: Spending
function renderSubSpending(person) {
  const caps = DATA.spendCaps[person];
  const cats = Object.keys(caps);
  return `
    <div class="sub-section">
      <div class="section-title">Monthly Spending Caps</div>
      <table class="snapshot-table">
        <thead><tr><th>Category</th><th>Cap</th><th>Spent</th><th>Left</th></tr></thead>
        <tbody>
          ${cats.map(cat => {
            const cap = caps[cat];
            const spent = parseFloat(localStorage.getItem('spend:' + person + ':' + cat) || '0');
            const left = Math.max(0, cap - spent);
            return `<tr>
              <td>${capitalize(cat)}</td>
              <td>${fmt(cap)}</td>
              <td><input type="number" class="inline-input" data-spend="${person}:${cat}"
                         value="${spent}" placeholder="0" /></td>
              <td class="${left < cap * 0.2 ? 'red-text' : ''}">${fmt(left)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Sub: Paychecks
function renderSubPaychecks(person) {
  const inc  = DATA.income[person];
  const freq = inc.payFreq === 'biweekly' ? 'Biweekly' : 'Weekly';
  const perCheck = inc.payFreq === 'biweekly' ? inc.monthly / 2 : inc.monthly / 4;
  return `
    <div class="sub-section">
      <div class="section-title">Paychecks</div>
      <div class="paycheck-row">
        <span>Monthly Take-Home</span><strong>${fmt(inc.monthly)}</strong>
      </div>
      <div class="paycheck-row">
        <span>Frequency</span><strong>${freq}</strong>
      </div>
      <div class="paycheck-row">
        <span>Per Paycheck (est.)</span><strong>${fmt(perCheck)}</strong>
      </div>
    </div>
  `;
}

// Sub: Budget
function renderSubBudget(person) {
  const inc   = DATA.income[person];
  const split = DATA.split[person];
  const caps  = DATA.spendCaps[person];
  const totalCaps = Object.values(caps).reduce((a, b) => a + b, 0);
  const debtAmt   = DATA.debts.filter(d => d.owner === person || d.owner === 'joint')
                              .reduce((sum, d) => sum + currentBal(d) * (d.apr / 100 / 12), 0);
  return `
    <div class="sub-section">
      <div class="section-title">Budget Overview</div>
      <div class="budget-row">
        <span>Monthly Income</span><strong class="green-text">${fmt(inc.monthly)}</strong>
      </div>
      <div class="budget-row">
        <span>Spending Caps Total</span><strong>${fmt(totalCaps)}</strong>
      </div>
      <div class="budget-row">
        <span>Est. Monthly Debt Interest</span><strong class="red-text">${fmt(debtAmt)}</strong>
      </div>
      <div class="budget-row">
        <span>Household Split</span><strong>${split}%</strong>
      </div>
      <div class="budget-row highlight">
        <span>Remaining (est.)</span>
        <strong>${fmt(inc.monthly - totalCaps - debtAmt)}</strong>
      </div>
    </div>
  `;
}

// Sub: Checklist
function renderSubChecklist(person) {
  const items = JSON.parse(localStorage.getItem('checklist:' + person) || '[]');
  return `
    <div class="sub-section">
      <div class="section-title">Monthly Checklist</div>
      <div class="checklist-add">
        <input id="cl-input-${person}" type="text" placeholder="Add item..." class="cl-text-input" />
        <button class="btn-sm" onclick="addChecklistItem('${person}')">Add</button>
      </div>
      <ul class="checklist">
        ${items.map((item, i) => `
          <li class="cl-item ${item.done ? 'done' : ''}">
            <input type="checkbox" ${item.done ? 'checked' : ''}
                   onchange="toggleChecklist('${person}', ${i})" />
            <span>${item.text}</span>
            <button class="cl-del" onclick="deleteChecklist('${person}', ${i})">×</button>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

function addChecklistItem(person) {
  const input = document.getElementById('cl-input-' + person);
  if (!input || !input.value.trim()) return;
  const items = JSON.parse(localStorage.getItem('checklist:' + person) || '[]');
  items.push({ text: input.value.trim(), done: false });
  localStorage.setItem('checklist:' + person, JSON.stringify(items));
  renderAll();
}
window.addChecklistItem = addChecklistItem;

function toggleChecklist(person, i) {
  const items = JSON.parse(localStorage.getItem('checklist:' + person) || '[]');
  if (items[i]) items[i].done = !items[i].done;
  localStorage.setItem('checklist:' + person, JSON.stringify(items));
  renderAll();
}
window.toggleChecklist = toggleChecklist;

function deleteChecklist(person, i) {
  const items = JSON.parse(localStorage.getItem('checklist:' + person) || '[]');
  items.splice(i, 1);
  localStorage.setItem('checklist:' + person, JSON.stringify(items));
  renderAll();
}
window.deleteChecklist = deleteChecklist;

// ── Savings Sliders (within person sub-tabs) ─────────────────
function renderSavingsSlider(sav) {
  const live    = trackGet(sav.id);
  const current = live !== null ? live : 0;
  const max     = sav.goalBal;
  const pct     = max > 0 ? ((current / max) * 100).toFixed(1) : 0;

  return `
    <div class="slider-block" data-si="${sav.id}" data-si-max="${max}" data-si-type="savings">
      <div class="slider-top">
        <span class="slider-label">${sav.label}</span>
        <span class="slider-pct" data-si-pct="${sav.id}">${pct}%</span>
      </div>
      <div class="slider-track">
        <div class="slider-fill savings-fill" data-si-fill="${sav.id}"
             style="width:${pct}%"></div>
        <input type="range" class="slider-range"
               data-si-range="${sav.id}"
               min="0" max="${max}" step="1"
               value="${current}" />
      </div>
      <div class="slider-inputs">
        <div class="si-input-group">
          <label class="si-label">Goal</label>
          <input type="number" class="si-input" data-si-goal="${sav.id}"
                 value="${max}" placeholder="${max}" />
        </div>
        <div class="si-input-group">
          <label class="si-label">Now</label>
          <input type="number" class="si-input" data-si-now="${sav.id}"
                 value="${current}" placeholder="0" />
        </div>
      </div>
      <div class="slider-meta">${fmt(current)} of ${fmt(max)}</div>
    </div>
  `;
}

// ── Roadmap ──────────────────────────────────────────────────
// FIX #3: Milestones read from track: not walletGet()
function renderRoadmap() {
  const milestones = [
    {
      label:    'Daniel — Emergency Fund $1K',
      check:    () => (trackGet('d-emer') || 0) >= 1000,
      target:   fmt(1000),
      current:  fmt(trackGet('d-emer') || 0),
    },
    {
      label:    'Move Fund Funded',
      check:    () => (trackGet('d-move') || 0) >= DATA.moveFund.targetAmount,
      target:   fmt(DATA.moveFund.targetAmount),
      current:  fmt(trackGet('d-move') || 0),
    },
    {
      label:    'Sonia — Savings $2,500',
      check:    () => (trackGet('s-svng') || 0) >= 2500,
      target:   fmt(2500),
      current:  fmt(trackGet('s-svng') || 0),
    },
    {
      label:    'NW Loan Paid Off',
      check:    () => (trackGet('d-nwln') !== null ? trackGet('d-nwln') : DATA.debts.find(d => d.id === 'd-nwln').startBal) <= 0,
      target:   '$0',
      current:  fmt(currentBal(DATA.debts.find(d => d.id === 'd-nwln'))),
    },
    {
      label:    'Sonia — Emergency Fund $3K',
      check:    () => (trackGet('s-emer') || 0) >= 3000,
      target:   fmt(3000),
      current:  fmt(trackGet('s-emer') || 0),
    },
    {
      label:    'Daniel — Visa Paid Off',
      check:    () => (trackGet('d-visa') !== null ? trackGet('d-visa') : DATA.debts.find(d => d.id === 'd-visa').startBal) <= 0,
      target:   '$0',
      current:  fmt(currentBal(DATA.debts.find(d => d.id === 'd-visa'))),
    },
  ];

  return `
    <div class="roadmap">
      <div class="section-title">Financial Roadmap</div>
      <div class="roadmap-list">
        ${milestones.map((m, i) => `
          <div class="milestone ${m.check() ? 'done' : ''}">
            <div class="ms-check">${m.check() ? '✓' : (i + 1)}</div>
            <div class="ms-body">
              <div class="ms-label">${m.label}</div>
              <div class="ms-progress">${m.current} / ${m.target}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ── Settings ─────────────────────────────────────────────────
// FIX #6: No debt/savings amount fields — only spending caps, income, APRs, split
// FIX #7: Balance Log = one-button snapshot, no re-entry
function renderSettings() {
  return `
    <div class="settings">
      <div class="section-title">Settings</div>

      <div class="settings-section">
        <div class="settings-subhead">Debt APRs</div>
        ${DATA.debts.map(d => `
          <div class="settings-row">
            <label>${d.label}</label>
            <input type="number" step="0.01" class="settings-input"
                   data-setting-apr="${d.id}" value="${d.apr}" />
            <span class="settings-unit">%</span>
          </div>
        `).join('')}
      </div>

      <div class="settings-section">
        <div class="settings-subhead">Monthly Income</div>
        ${DATA.people.map(p => `
          <div class="settings-row">
            <label>${DATA.names[p]}</label>
            <input type="number" class="settings-input"
                   data-setting-income="${p}" value="${DATA.income[p].monthly}" />
          </div>
        `).join('')}
      </div>

      <div class="settings-section">
        <div class="settings-subhead">Household Split</div>
        ${DATA.people.map(p => `
          <div class="settings-row">
            <label>${DATA.names[p]}</label>
            <input type="number" class="settings-input"
                   data-setting-split="${p}" value="${DATA.split[p]}" />
            <span class="settings-unit">%</span>
          </div>
        `).join('')}
      </div>

      <div class="settings-section">
        <div class="settings-subhead">Spending Caps — Daniel</div>
        ${Object.keys(DATA.spendCaps.daniel).map(cat => `
          <div class="settings-row">
            <label>${capitalize(cat)}</label>
            <input type="number" class="settings-input"
                   data-setting-cap="daniel:${cat}" value="${DATA.spendCaps.daniel[cat]}" />
          </div>
        `).join('')}
      </div>

      <div class="settings-section">
        <div class="settings-subhead">Spending Caps — Sonia</div>
        ${Object.keys(DATA.spendCaps.sonia).map(cat => `
          <div class="settings-row">
            <label>${capitalize(cat)}</label>
            <input type="number" class="settings-input"
                   data-setting-cap="sonia:${cat}" value="${DATA.spendCaps.sonia[cat]}" />
          </div>
        `).join('')}
      </div>

      <div class="settings-section">
        <div class="settings-subhead">Balance Log</div>
        <p class="settings-note">Snapshots current slider positions into a dated log entry. No re-entry needed.</p>
        <button class="btn-primary" onclick="snapshotBalanceLog()">Snapshot Now</button>
        <div class="balance-log">
          ${renderBalanceLog()}
        </div>
      </div>

      <div class="settings-section danger-zone">
        <div class="settings-subhead">Session</div>
        <button class="btn-danger" onclick="lock()">Lock App</button>
        <button class="btn-danger" onclick="clearAllData()">Clear All Data</button>
      </div>
    </div>
  `;
}

function snapshotBalanceLog() {
  const log = JSON.parse(localStorage.getItem('balanceLog') || '[]');
  const entry = {
    date: new Date().toLocaleDateString(),
    debts: DATA.debts.reduce((acc, d) => { acc[d.id] = currentBal(d); return acc; }, {}),
    savings: DATA.savings.reduce((acc, s) => { acc[s.id] = trackGet(s.id) || 0; return acc; }, {}),
    wallets: {
      daniel: { checking: walletGet('daniel', 'checking'), savings: walletGet('daniel', 'savings') },
      sonia:  { checking: walletGet('sonia',  'checking'), savings: walletGet('sonia',  'savings') },
    },
  };
  log.unshift(entry);
  if (log.length > 24) log.splice(24); // keep last 24
  localStorage.setItem('balanceLog', JSON.stringify(log));
  renderAll();
}
window.snapshotBalanceLog = snapshotBalanceLog;

function renderBalanceLog() {
  const log = JSON.parse(localStorage.getItem('balanceLog') || '[]');
  if (!log.length) return '<p class="empty">No snapshots yet.</p>';
  return log.slice(0, 5).map(entry => `
    <div class="log-entry">
      <strong>${entry.date}</strong>
      <div class="log-debts">
        ${DATA.debts.map(d => `<span>${d.label}: ${fmt(entry.debts[d.id] || 0)}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

function clearAllData() {
  if (!confirm('Clear all tracking data? This cannot be undone.')) return;
  const keys = Object.keys(localStorage).filter(k =>
    k.startsWith('track:') || k.startsWith('wallet:') || k.startsWith('spend:') ||
    k.startsWith('checklist:') || k === 'balanceLog'
  );
  keys.forEach(k => localStorage.removeItem(k));
  renderAll();
}
window.clearAllData = clearAllData;

// ── Slider Event Handlers ────────────────────────────────────
// FIX #1: data-si-goal only — no data-goal duplicate handler

function handleSliderInput(e) {
  const el = e.target;

  // Range drag
  if (el.matches('[data-si-range]')) {
    const id   = el.dataset.siRange;
    const block = el.closest('[data-si]');
    if (!block) return;
    const type = block.dataset.siType;
    const max  = parseFloat(block.dataset.siMax);

    let current;
    if (type === 'debt') {
      // range value = amount paid; current = max - paid
      const paid = parseFloat(el.value);
      current = max - paid;
    } else {
      current = parseFloat(el.value);
    }

    localStorage.setItem('track:' + id, current);
    updateSliderUI(id, current, max, type);
    updateSnapshotCell(id, current);
  }

  // Now input
  if (el.matches('[data-si-now]')) {
    const id    = el.dataset.siNow;
    const block = el.closest('[data-si]');
    if (!block) return;
    const type = block.dataset.siType;
    const max  = parseFloat(block.dataset.siMax);
    const current = parseFloat(el.value) || 0;

    localStorage.setItem('track:' + id, current);
    updateSliderUI(id, current, max, type);

    // Also update the range input position
    const range = block.querySelector('[data-si-range]');
    if (range) {
      range.value = type === 'debt' ? max - current : current;
    }
    updateSnapshotCell(id, current);
  }

  // Wallet input
  if (el.matches('[data-wallet-person]')) {
    const person = el.dataset.walletPerson;
    const type   = el.dataset.walletType;
    walletSet(person, type, parseFloat(el.value) || 0);
    // Update totals in the same wallet card without full re-render
    const card = el.closest('.wallet-card');
    if (card) {
      const total = walletGet(person, 'checking') + walletGet(person, 'savings');
      const t = card.querySelector('.wallet-total strong');
      if (t) t.textContent = fmt(total);
    }
  }

  // Spend input
  if (el.matches('[data-spend]')) {
    const [person, cat] = el.dataset.spend.split(':');
    localStorage.setItem('spend:' + person + ':' + cat, parseFloat(el.value) || 0);
    // Update the "Left" cell in the same row
    const row = el.closest('tr');
    if (row) {
      const cap   = DATA.spendCaps[person][cat];
      const spent = parseFloat(el.value) || 0;
      const left  = Math.max(0, cap - spent);
      const leftCell = row.querySelector('td:last-child');
      if (leftCell) {
        leftCell.textContent = fmt(left);
        leftCell.className   = left < cap * 0.2 ? 'red-text' : '';
      }
    }
  }
}

function handleSliderChange(e) {
  const el = e.target;

  // FIX #1: data-si-goal only — single handler, no data-goal
  if (el.matches('[data-si-goal]')) {
    const id    = el.dataset.siGoal;
    const block = el.closest('[data-si]');
    if (!block) return;

    const newMax = parseFloat(el.value) || 0;
    block.dataset.siMax = newMax;

    // Update the range input max
    const range = block.querySelector('[data-si-range]');
    if (range) range.max = newMax;

    const type    = block.dataset.siType;
    const current = trackGet(id) !== null ? trackGet(id) : (type === 'debt' ? newMax : 0);
    updateSliderUI(id, current, newMax, type);
  }

  // Settings inputs (APR, income, split, caps)
  if (el.matches('[data-setting-apr]')) {
    const id = el.dataset.settingApr;
    const d  = DATA.debts.find(x => x.id === id);
    if (d) d.apr = parseFloat(el.value) || d.apr;
  }
  if (el.matches('[data-setting-income]')) {
    const p = el.dataset.settingIncome;
    DATA.income[p].monthly = parseFloat(el.value) || DATA.income[p].monthly;
  }
  if (el.matches('[data-setting-split]')) {
    const p = el.dataset.settingSplit;
    DATA.split[p] = parseFloat(el.value) || DATA.split[p];
  }
  if (el.matches('[data-setting-cap]')) {
    const [person, cat] = el.dataset.settingCap.split(':');
    DATA.spendCaps[person][cat] = parseFloat(el.value) || DATA.spendCaps[person][cat];
  }
}

// Update slider UI without re-render
function updateSliderUI(id, current, max, type) {
  const pct = max > 0
    ? type === 'debt'
      ? (((max - current) / max) * 100).toFixed(1)
      : ((current / max) * 100).toFixed(1)
    : 0;

  const fill = document.querySelector(`[data-si-fill="${id}"]`);
  const pctEl = document.querySelector(`[data-si-pct="${id}"]`);
  const meta  = document.querySelector(`[data-si="${id}"] .slider-meta`);
  const nowEl = document.querySelector(`[data-si-now="${id}"]`);

  if (fill)  fill.style.width = pct + '%';
  if (pctEl) pctEl.textContent = type === 'debt' ? pct + '% paid' : pct + '%';
  if (nowEl && parseFloat(nowEl.value) !== current) nowEl.value = current;

  if (meta) {
    if (type === 'debt') {
      meta.textContent = `${fmt(current)} remaining — ${fmt(max - current)} paid`;
    } else {
      meta.textContent = `${fmt(current)} of ${fmt(max)}`;
    }
  }
}

// Update snapshot table cell without re-render
function updateSnapshotCell(id, current) {
  const cell = document.querySelector(`.bal-cell[data-debt-id="${id}"]`);
  if (cell) cell.textContent = fmt(current);
}

// ── Bind post-render events ───────────────────────────────────
function bindBodyEvents() {
  // Jasper unlock — button click
  const btn = document.getElementById('jasperBtn');
  if (btn) btn.addEventListener('click', attemptUnlock);

  // Jasper unlock — Enter key
  const ji = document.getElementById('jasperInput');
  if (ji) {
    ji.addEventListener('keydown', e => {
      if (e.key === 'Enter') attemptUnlock();
    });
    ji.focus();
  }
}

// ── Utilities ────────────────────────────────────────────────
function fmt(n) {
  return '$' + (parseFloat(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
