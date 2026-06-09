/**
 * Garner-Johnson Financial Tracker · app.js
 * Vanilla JS — no dependencies — GitHub Pages compatible
 * Requires: financeData.js loaded first (window.FINANCE_DATA)
 */

'use strict';

/* ─── Globals ─────────────────────────────────────────── */
const DATA = window.FINANCE_DATA;
const $    = (sel, root = document) => root.querySelector(sel);
const $$   = (sel, root = document) => [...root.querySelectorAll(sel)];
const money = n => typeof n === 'number'
  ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  : (n ?? '—');
const priv = val => `<span class="private-value">${money(val)}</span>`;

/* ─── LocalStorage helpers ────────────────────────────── */
const LS = {
  get:    (k, fallback = null) => { try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set:    (k, v)               => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  remove: (k)                  => { try { localStorage.removeItem(k); } catch {} },
  keys:   (prefix)             => { try { return Object.keys(localStorage).filter(k => k.startsWith(prefix)); } catch { return []; } },
  num:    (k, def)             => { const v = localStorage.getItem(k); return v !== null ? parseFloat(v) : def; },
};

/* ─── Auth ────────────────────────────────────────────── */
function auth() {
  const loginEl = $('#login');
  if (sessionStorage.getItem('financeUnlocked') === 'true') {
    loginEl.style.display = 'none';
    return;
  }
  setTimeout(() => $('#passwordInput') && $('#passwordInput').focus(), 80);
  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const val = $('#passwordInput').value.trim();
    if (val === DATA.password) {
      sessionStorage.setItem('financeUnlocked', 'true');
      loginEl.style.display = 'none';
      $('#main-content').focus();
    } else {
      const err = $('#loginError');
      err.textContent = 'Incorrect passcode — try again.';
      $('#passwordInput').value = '';
      $('#passwordInput').focus();
      setTimeout(() => { err.textContent = ''; }, 4000);
    }
  });
  $('#lockBtn').addEventListener('click', () => {
    sessionStorage.removeItem('financeUnlocked');
    location.reload();
  });
}

/* ─── Helpers ─────────────────────────────────────────── */
function table(headers, rows, opts = {}) {
  const ths = headers.map(h => `<th scope="col">${h}</th>`).join('');
  const trs = rows.map(r => {
    const cls = opts.rowClass ? ` class="${opts.rowClass(r)}"` : '';
    return `<tr${cls}>${r.map((c, i) => {
      const tag = i === 0 ? 'th scope="row"' : 'td';
      return `<${tag}>${c}</${tag.split(' ')[0]}>`;
    }).join('')}</tr>`;
  }).join('');
  const caption = opts.caption ? `<caption class="sr-only">${opts.caption}</caption>` : '';
  return `<div class="table-wrap" role="region" aria-label="${opts.label || 'Table'}" tabindex="0">
    <table>${caption}<thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
}

function card(title, body, span = 'span-6') {
  return `<div class="card ${span}"><h2>${title}</h2>${body}</div>`;
}

function proTip(text) {
  return `<div class="pro-tip"><strong>💡 Key Rule</strong>${text}</div>`;
}

function notice(text) {
  return `<div class="notice"><strong>⚠️ Note</strong>${text}</div>`;
}

/* ─── Slider builder ──────────────────────────────────── */
/**
 * type: 'debt' — slider represents remaining balance (lower = better)
 * type: 'savings' — slider represents amount saved (higher = better)
 */
function buildSlider(id, label, type, storedBal, goal, apr) {
  const current = LS.num(`slider:${id}`, storedBal);
  const goalVal = LS.num(`goal:${id}`, goal);
  const pct = goalVal > 0
    ? type === 'debt'
      ? Math.max(0, Math.min(100, ((goalVal - current) / goalVal) * 100))
      : Math.max(0, Math.min(100, (current / goalVal) * 100))
    : 0;
  const fillClass = pct >= 100 ? 'full' : pct >= 60 ? '' : pct >= 30 ? 'warn' : 'bad';
  const rangeVal  = type === 'debt' ? Math.max(0, goalVal - current) : current;
  const stat1Lbl  = type === 'debt' ? 'Paid down' : 'Saved';
  const stat1Val  = type === 'debt' ? money(goalVal - current) : money(current);
  const stat2Lbl  = type === 'debt' ? 'Remaining' : 'To goal';
  const stat2Val  = type === 'debt' ? money(current) : money(Math.max(0, goalVal - current));
  const moInt     = type === 'debt' && apr ? ` · ${money(current * (apr / 100 / 12))}/mo interest` : '';

  return `
  <div class="slider-wrap" data-slider-id="${id}" data-slider-type="${type}">
    <div class="slider-header">
      <span class="slider-name">${label}</span>
      <span class="slider-pct" id="spct-${id}">${pct.toFixed(1)}%</span>
    </div>
    <div class="progress-bar" role="progressbar" aria-valuenow="${pct.toFixed(0)}" aria-valuemin="0" aria-valuemax="100">
      <div class="progress-fill ${fillClass}" id="sfill-${id}" style="width:${pct.toFixed(1)}%"></div>
    </div>
    <input type="range" class="slider-range" id="srange-${id}"
      min="0" max="${goalVal}" step="1" value="${rangeVal}"
      aria-label="${label} progress slider" />
    <div class="slider-stats">
      <div class="slider-stat">
        <span class="slider-stat-val private-value" id="sstat1-${id}">${stat1Val}</span>
        <span class="slider-stat-lbl">${stat1Lbl}</span>
      </div>
      <div class="slider-stat">
        <span class="slider-stat-val private-value" id="sstat2-${id}">${stat2Val}</span>
        <span class="slider-stat-lbl">${stat2Lbl}</span>
      </div>
    </div>
    <div class="slider-edit-row">
      <label class="slider-edit-label">
        ${type === 'debt' ? 'Original / current balance' : 'Current saved'}
        <input type="number" step="0.01" min="0"
          class="slider-edit-input" id="sbal-${id}"
          value="${current}"
          data-slider-bal="${id}" data-slider-type="${type}" />
      </label>
      <label class="slider-edit-label">
        Goal
        <input type="number" step="0.01" min="1"
          class="slider-edit-input" id="sgoal-${id}"
          value="${goalVal}"
          data-slider-goal="${id}" data-slider-type="${type}" />
      </label>
    </div>
    <div class="slider-meta private-value" id="smeta-${id}">${stat2Val} ${type === 'debt' ? 'remaining' : 'to go'}${moInt}</div>
  </div>`;
}

/* ─── Spending cap tracker ────────────────────────────── */
function buildSpendCap(person, capObj, idx) {
  const id      = `${person}-cap-${idx}`;
  const cap     = LS.num(`cap-limit:${id}`, capObj.cap);
  const spent   = LS.num(`cap-spent:${id}`, 0);
  const pct     = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0;
  const left    = Math.max(0, cap - spent);
  const cls     = pct >= 100 ? 'bad' : pct >= 80 ? 'warn' : '';
  return `
  <div class="cap-row" data-cap-id="${id}">
    <div class="cap-header">
      <span class="cap-name">${capObj.name}</span>
      <span class="cap-status ${cls}" id="capstat-${id}">${pct >= 100 ? 'OVER' : `${left.toLocaleString('en-US',{style:'currency',currency:'USD'})} left`}</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill ${cls}" id="capfill-${id}" style="width:${pct.toFixed(1)}%"></div>
    </div>
    <div class="cap-inputs">
      <label class="cap-input-label">
        Spent this month
        <input type="number" step="0.01" min="0" class="cap-input" id="capspent-${id}"
          value="${spent}" data-cap-spent="${id}" />
      </label>
      <label class="cap-input-label">
        Monthly cap
        <input type="number" step="0.01" min="1" class="cap-input" id="caplimit-${id}"
          value="${cap}" data-cap-limit="${id}" />
      </label>
    </div>
  </div>`;
}

/* ─── Wallet tracker ──────────────────────────────────── */
function buildWallet(person) {
  const checking = LS.num(`wallet:${person}:checking`, 0);
  const savings  = LS.num(`wallet:${person}:savings`,  0);
  const total    = checking + savings;
  return `
  <div class="wallet-block">
    <div class="wallet-total-row">
      <span class="wallet-total-label">Total on hand</span>
      <span class="wallet-total-val private-value" id="wallet-total-${person}">${money(total)}</span>
    </div>
    <div class="wallet-inputs">
      <label class="wallet-label">
        Checking
        <input type="number" step="0.01" min="0" class="wallet-input"
          value="${checking}" data-wallet="${person}" data-wallet-type="checking" />
      </label>
      <label class="wallet-label">
        Savings
        <input type="number" step="0.01" min="0" class="wallet-input"
          value="${savings}" data-wallet="${person}" data-wallet-type="savings" />
      </label>
    </div>
  </div>`;
}

/* ─── Sub-tab builder ─────────────────────────────────── */
function buildSubTabs(person, tabs, activeTab) {
  const btns = tabs.map(t =>
    `<button class="sub-tab${t.id === activeTab ? ' active' : ''}"
      data-person="${person}" data-subtab="${t.id}">${t.label}</button>`
  ).join('');
  return `<div class="sub-tabs" role="tablist" aria-label="${person} sections">${btns}</div>`;
}

/* ─── Update slider UI live (no re-render) ────────────── */
function updateSliderUI(id, type, current, goalVal) {
  const pct = goalVal > 0
    ? type === 'debt'
      ? Math.max(0, Math.min(100, ((goalVal - current) / goalVal) * 100))
      : Math.max(0, Math.min(100, (current / goalVal) * 100))
    : 0;

  const fillEl  = document.getElementById('sfill-'  + id);
  const pctEl   = document.getElementById('spct-'   + id);
  const stat1El = document.getElementById('sstat1-' + id);
  const stat2El = document.getElementById('sstat2-' + id);
  const metaEl  = document.getElementById('smeta-'  + id);
  const rangeEl = document.getElementById('srange-' + id);
  const balEl   = document.getElementById('sbal-'   + id);

  const stat1Val = type === 'debt' ? money(goalVal - current) : money(current);
  const stat2Val = type === 'debt' ? money(current) : money(Math.max(0, goalVal - current));
  const fillClass = pct >= 100 ? 'full' : pct >= 60 ? '' : pct >= 30 ? 'warn' : 'bad';

  if (fillEl)  { fillEl.style.width = pct.toFixed(1) + '%'; fillEl.className = `progress-fill ${fillClass}`; }
  if (pctEl)   pctEl.textContent  = pct.toFixed(1) + '%';
  if (stat1El) stat1El.textContent = stat1Val;
  if (stat2El) stat2El.textContent = stat2Val;
  if (metaEl)  metaEl.textContent  = stat2Val + (type === 'debt' ? ' remaining' : ' to go');
  if (rangeEl && document.activeElement !== rangeEl) {
    rangeEl.max   = goalVal;
    rangeEl.value = type === 'debt' ? Math.max(0, goalVal - current) : current;
  }
  if (balEl && document.activeElement !== balEl) balEl.value = current;
}

/* ─── Dashboard ───────────────────────────────────────── */
function renderDashboard() {
  const D = DATA.daniel, S = DATA.sonia, H = DATA.household;

  // Live totals from sliders
  let totalDebt = 0, totalSavings = 0;
  [...D.debts, ...S.debts].forEach((d, i) => {
    const person = i < D.debts.length ? 'daniel' : 'sonia';
    const idx    = i < D.debts.length ? i : i - D.debts.length;
    const id     = `${person}-debt-${idx}`;
    totalDebt   += LS.num(`slider:${id}`, d.balance);
  });
  [...D.savings, ...S.savings].forEach((s, i) => {
    const person = i < D.savings.length ? 'daniel' : 'sonia';
    const idx    = i < D.savings.length ? i : i - D.savings.length;
    const id     = `${person}-sav-${idx}`;
    totalSavings += LS.num(`slider:${id}`, s.balance);
  });

  const dWallet = LS.num('wallet:daniel:checking', 0) + LS.num('wallet:daniel:savings', 0);
  const sWallet = LS.num('wallet:sonia:checking',  0) + LS.num('wallet:sonia:savings',  0);

  // Move fund countdown
  const moveId      = 'daniel-sav-0';
  const moveSaved   = LS.num(`slider:${moveId}`, D.savings[0].balance);
  const moveGoal    = LS.num(`goal:${moveId}`, D.savings[0].goal);
  const moveTarget  = new Date('2026-07-10');
  const today       = new Date();
  const daysLeft    = Math.max(0, Math.ceil((moveTarget - today) / 86400000));
  const payLeft     = Math.max(1, Math.floor(daysLeft / 7));
  const moveRemain  = Math.max(0, moveGoal - moveSaved);
  const perPaycheck = moveRemain / payLeft;
  const movePct     = moveGoal > 0 ? Math.min(100, (moveSaved / moveGoal) * 100).toFixed(1) : 0;

  // Interest burn
  let interestBurn = 0;
  [...D.debts, ...S.debts].forEach((d, i) => {
    if (!d.apr) return;
    const person = i < D.debts.length ? 'daniel' : 'sonia';
    const idx    = i < D.debts.length ? i : i - D.debts.length;
    const id     = `${person}-debt-${idx}`;
    const bal    = LS.num(`slider:${id}`, d.balance);
    interestBurn += bal * (d.apr / 100 / 12);
  });

  $('#dashboard').innerHTML = `<div class="grid">

    ${card('Household Snapshot', `
      <div class="metric"><span>Combined income</span><strong class="private-value">${money(H.incomeMonthly)}/mo</strong></div>
      <div class="metric"><span>Total debt tracked</span><strong class="private-value">${money(totalDebt)}</strong></div>
      <div class="metric"><span>Total savings tracked</span><strong class="private-value">${money(totalSavings)}</strong></div>
      <div class="metric"><span>Monthly interest burn</span><strong class="private-value" style="color:var(--bad)">${money(interestBurn)}/mo</strong></div>
      <div class="metric"><span>Split</span><strong>Daniel 59% · Sonia 41%</strong></div>
    `, 'span-6')}

    ${card('Wallets — On Hand Cash', `
      <p class="section-note" style="margin-bottom:10px">Enter current balances to track available cash.</p>
      <div style="margin-bottom:14px">
        <p style="font-weight:700;font-size:.85rem;margin-bottom:6px">Daniel</p>
        ${buildWallet('daniel')}
      </div>
      <div>
        <p style="font-weight:700;font-size:.85rem;margin-bottom:6px">Sonia</p>
        ${buildWallet('sonia')}
      </div>
      <div class="metric" style="margin-top:10px;border-top:1px solid var(--line);padding-top:10px">
        <span>Combined wallets</span>
        <strong class="private-value" id="combined-wallets">${money(dWallet + sWallet)}</strong>
      </div>
    `, 'span-6')}

    ${card('Move Fund Countdown', `
      <div class="metric"><span>Days to July 10</span><strong>${daysLeft}</strong></div>
      <div class="metric"><span>Paychecks left</span><strong>${payLeft}</strong></div>
      <div class="metric"><span>Saved so far</span><strong class="private-value">${money(moveSaved)}</strong></div>
      <div class="metric"><span>Still needed</span><strong class="private-value">${money(moveRemain)}</strong></div>
      <div class="metric" style="font-weight:700"><span>Needed per paycheck</span><strong class="private-value" style="color:var(--accent)">${money(perPaycheck)}</strong></div>
      <div class="progress-bar" style="margin-top:10px" role="progressbar" aria-valuenow="${movePct}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-fill ${movePct >= 100 ? 'full' : ''}" style="width:${movePct}%"></div>
      </div>
      <p class="section-note" style="text-align:right;margin-top:4px">${money(moveSaved)} of ${money(moveGoal)} · ${movePct}%</p>
    `, 'span-6')}

    ${card('Operating Rule', proTip(
      'No discretionary spending happens until bills, debt payments, and savings are assigned for the pay cycle. Every paycheck gets a job <em>before</em> it hits the account.'
    ), 'span-6')}

  </div>`;
}

/* ─── Daniel ──────────────────────────────────────────── */
const DANIEL_TABS = [
  { id:'overview',  label:'Overview'   },
  { id:'wallet',    label:'💵 Wallet'  },
  { id:'debt',      label:'💳 Debt'    },
  { id:'savings',   label:'💰 Savings' },
  { id:'spending',  label:'📊 Spending'},
  { id:'paychecks', label:'📅 Paychecks'},
  { id:'checklist', label:'✅ Checklist'},
];

function renderDaniel() {
  const active = LS.get('subtab:daniel', 'overview');
  $('#daniel').innerHTML = `
    <div class="person-header">
      <h2>Daniel</h2>
      <span class="pill warn">NFCU Visa priority</span>
      <span class="pill good">Move target: $1,950</span>
    </div>
    ${buildSubTabs('daniel', DANIEL_TABS, active)}
    <div id="daniel-subtab-body">${renderDanielTab(active)}</div>`;
}

function renderDanielTab(tab) {
  const D = DATA.daniel;
  switch (tab) {
    case 'overview': return `<div class="grid">
      ${card('Summary', `
        <p>Primary rule: keep NFCU Visa at zero new charges and build the move fund to $1,950 by July 10.
        Protect the EasyStart Certificate — do not touch before December 2026.</p>
        ${notice('EasyStart Certificate: <strong class="private-value">$2,137.75</strong> — matures 12/06/2026. Do not withdraw early.')}
      `, 'span-12')}
      ${card('Visa Payoff Scenarios',
        table(['Scenario','Monthly Pmt','Timeline'], D.visaTimeline, { label:'Visa payoff options' }),
      'span-6')}
      ${card('Post-Move Budget',
        table(['Category','Amount'], D.budget || [], { label:'Daniel budget' }),
      'span-6')}
    </div>`;

    case 'wallet': return `<div class="grid">
      ${card('Daniel\'s Wallet', `
        <p class="section-note" style="margin-bottom:12px">Track your current checking and savings balances. Updates the dashboard totals live.</p>
        ${buildWallet('daniel')}
      `, 'span-12')}
    </div>`;

    case 'debt': return `<div class="grid">
      ${card('Debt Sliders', `
        <p class="section-note" style="margin-bottom:12px">Drag the slider or type a value to update your current balance. Edit the Goal field to adjust the original balance.</p>
        ${D.debts.map((d, i) => buildSlider(`daniel-debt-${i}`, d.name, 'debt', d.balance, d.balance, d.apr)).join('')}
      `, 'span-12')}
    </div>`;

    case 'savings': return `<div class="grid">
      ${card('Savings Progress', `
        <p class="section-note" style="margin-bottom:12px">Drag or type to update how much you've saved toward each goal.</p>
        ${D.savings.map((s, i) => buildSlider(`daniel-sav-${i}`, s.name, 'savings', s.balance, s.goal, null)).join('')}
      `, 'span-12')}
    </div>`;

    case 'spending': return `<div class="grid">
      ${card('Monthly Spending Caps', `
        <p class="section-note" style="margin-bottom:12px">Enter what you've spent so far this month. Bar turns yellow at 80%, red at 100%.</p>
        ${D.spendCaps.map((c, i) => buildSpendCap('daniel', c, i)).join('')}
        <button class="btn-secondary" style="margin-top:14px;font-size:.8rem" id="reset-caps-daniel">Reset Month</button>
      `, 'span-12')}
    </div>`;

    case 'paychecks': return `<div class="grid">
      ${card('Paycheck Allocation: June 5 – July 10',
        table(['Date','Income','Allocation'],
          D.paychecks.map(r => [r[0], `<strong class="private-value">${r[1]}</strong>`, r[2]]),
          { label:'Daniel paycheck allocation' }),
      'span-12')}
    </div>`;

    case 'checklist': return `<div class="grid">
      ${card('Action Checklist', buildChecklist('daniel', D.checklist), 'span-12')}
    </div>`;

    default: return '';
  }
}

/* ─── Sonia ───────────────────────────────────────────── */
const SONIA_TABS = [
  { id:'overview',  label:'Overview'   },
  { id:'wallet',    label:'💵 Wallet'  },
  { id:'debt',      label:'💳 Debt'    },
  { id:'savings',   label:'💰 Savings' },
  { id:'spending',  label:'📊 Spending'},
  { id:'paychecks', label:'📅 Paychecks'},
  { id:'checklist', label:'✅ Checklist'},
];

function renderSonia() {
  const active = LS.get('subtab:sonia', 'overview');
  $('#sonia').innerHTML = `
    <div class="person-header">
      <h2>Sonia</h2>
      <span class="pill good">Savings first</span>
      <span class="pill warn">NW Loan 12.50% APR</span>
    </div>
    ${buildSubTabs('sonia', SONIA_TABS, active)}
    <div id="sonia-subtab-body">${renderSoniaTab(active)}</div>`;
}

function renderSoniaTab(tab) {
  const S = DATA.sonia;
  switch (tab) {
    case 'overview': return `<div class="grid">
      ${card('Summary', `
        <p>Primary rule: zero overdrafts, reach $1,000 emergency savings immediately,
        then grow to $2,500 by month 6. Northwest loan is $2,266.02 at 12.50% APR —
        consider extra payments after savings target is met.</p>
      `, 'span-12')}
      ${card('Northwest Loan Payoff Scenarios',
        table(['Monthly Payment','Payoff','Est. Interest'], S.loanPayoff, { label:'NW loan options' }),
      'span-6')}
      ${card('Family Debt Timeline',
        table(['Milestone','Balance'], S.familyDebtTimeline.map(([a,b])=>[a,`<span class="private-value">${b}</span>`]), { label:'Family debt' }),
      'span-6')}
      ${card('Family Repayment Message', `
        <p>Hey, I want to start paying you back consistently and make sure this is handled respectfully.
        After the move, I'm going to start paying <strong>$200/month</strong> beginning with my first
        post-move paycheck cycle. Starting month three, I'll increase it to <strong>$300/month</strong>.
        I'll keep you updated and stay consistent so there's no confusion.</p>
      `, 'span-12')}
    </div>`;

    case 'wallet': return `<div class="grid">
      ${card('Sonia\'s Wallet', `
        <p class="section-note" style="margin-bottom:12px">Track your current checking and savings balances.</p>
        ${buildWallet('sonia')}
      `, 'span-12')}
    </div>`;

    case 'debt': return `<div class="grid">
      ${card('Debt Sliders', `
        <p class="section-note" style="margin-bottom:12px">Drag or type to update your current balance. Edit Goal to adjust original balance.</p>
        ${S.debts.map((d, i) => buildSlider(`sonia-debt-${i}`, d.name, 'debt', d.balance, d.balance || 1, d.apr)).join('')}
      `, 'span-12')}
    </div>`;

    case 'savings': return `<div class="grid">
      ${card('Savings Progress', `
        <p class="section-note" style="margin-bottom:12px">Track progress toward each savings goal.</p>
        ${S.savings.map((s, i) => buildSlider(`sonia-sav-${i}`, s.name, 'savings', s.balance, s.goal, null)).join('')}
      `, 'span-12')}
    </div>`;

    case 'spending': return `<div class="grid">
      ${card('Monthly Spending Caps', `
        <p class="section-note" style="margin-bottom:12px">Enter what you've spent this month. Yellow at 80%, red at 100%.</p>
        ${S.spendCaps.map((c, i) => buildSpendCap('sonia', c, i)).join('')}
        <button class="btn-secondary" style="margin-top:14px;font-size:.8rem" id="reset-caps-sonia">Reset Month</button>
      `, 'span-12')}
    </div>`;

    case 'paychecks': return `<div class="grid">
      ${card('Next Paycheck Allocation',
        table(['Use','Amount'], S.nextPaycheck.map(([a,b])=>[a,`<strong class="private-value">${b}</strong>`]), { label:'Sonia paycheck' }),
      'span-12')}
    </div>`;

    case 'checklist': return `<div class="grid">
      ${card('Action Checklist', buildChecklist('sonia', S.checklist), 'span-12')}
    </div>`;

    default: return '';
  }
}

/* ─── Checklist builder ───────────────────────────────── */
function buildChecklist(id, items) {
  const saved = LS.get(`checks:${id}`, {});
  const doneCount = items.filter((_, i) => saved[i]).length;
  const rows = items.map((item, i) => {
    const checked = saved[i] ? 'checked' : '';
    return `<div class="check-row ${saved[i] ? 'done' : ''}">
      <input type="checkbox" id="${id}-${i}" data-list="${id}" data-index="${i}" ${checked} />
      <label for="${id}-${i}">${item}</label>
    </div>`;
  }).join('');
  return `<p class="checklist-summary" id="${id}-summary">${doneCount} of ${items.length} complete</p>
    <div class="checklist">${rows}</div>`;
}

/* ─── Household ───────────────────────────────────────── */
function renderHousehold() {
  const H = DATA.household;
  const bills = H.sharedBills.map(r => [r[0], priv(r[1]), priv(r[2]), priv(r[3])]);
  const nwRows = H.netWorth.map(r => [
    `Mo ${r[0]}`, priv(+r[1].replace(/[$,]/g,'')), priv(+r[2].replace(/[$,]/g,'')),
    priv(+r[3].replace(/[$,]/g,'')), r[4], priv(+r[5].replace(/[$,]/g,'')),
    priv(+r[6].replace(/[$,]/g,'')),
    `<span class="private-value" style="font-weight:700;color:${r[7].startsWith('-')?'var(--bad)':'var(--good)'}">${r[7]}</span>`,
  ]);
  $('#household').innerHTML = `<div class="grid">
    ${card('Shared Bill Split',
      table(['Bill','Total','Daniel (59%)','Sonia (41%)'], bills, { label:'Shared bills' }),
    'span-6')}
    ${card('Debt Payoff Sequence',
      table(['Priority','Action','Reason'], H.debtSequence, { label:'Payoff sequence' }),
    'span-6')}
    ${card('Net Worth Trajectory (Months 1–36)', `
      <p class="section-note">Projected combined net worth assuming plan is followed.</p>
      ${table(['Month','Visa','Vehicle','Family','NW Loan','Cash','Invest','Net Worth'], nwRows, { label:'Net worth' })}
    `, 'span-12')}
  </div>`;
}

/* ─── Review ──────────────────────────────────────────── */
function renderReview() {
  const reviewItems = [
    'Overdrafts are $0.',
    'Daniel NFCU Visa has $0 new charges.',
    'Daniel Visa balance fell each month.',
    'Sonia family debt payment made every month.',
    'Sonia Northwest loan current or accelerated.',
    'Emergency savings increased.',
    'Shared bills split correctly at 59/41.',
    'Subscriptions did not creep back.',
    'Fast food, beauty, and Amazon stayed under cap.',
    'Net worth improved quarter over quarter.',
    'Move-related final bills are closed out.',
    'Investing only started after trigger list is satisfied.',
  ];
  const investTriggers = [
    ['Daniel',    'Visa paid off, $1,000+ emergency fund, no new card charges 90 days', '$50–$150/mo'],
    ['Sonia',     '$2,500 emergency fund, no overdrafts 90 days, family debt below $5K', '$50–$150/mo'],
    ['Household', 'Both current, shared bills stable, no surprise old-address bills',   'Review quarterly'],
  ];
  const scenarios = [
    ['Conservative', 'Daniel $600/mo to Visa; Sonia follows family plan; extra cash builds reserves', 'Safer but slower'],
    ['Balanced ✓',   'Daniel $700/mo to Visa; Sonia saves to $2,500 and pays family debt on schedule', 'Recommended'],
    ['Aggressive',   'Daniel $800–$900/mo to Visa; Sonia adds extra to NW loan after month 6', 'Fastest — higher risk'],
  ];
  $('#review').innerHTML = `<div class="grid">
    ${card('Quarterly Review Checklist', buildChecklist('quarterly', reviewItems), 'span-6')}
    ${card('Investment Triggers',
      table(['Person','Trigger Condition','Start Amount'], investTriggers, { label:'Invest triggers' }),
    'span-6')}
    ${card('Scenario Options',
      table(['Scenario','Action','Outcome'], scenarios, { label:'Scenarios' }),
    'span-12')}
  </div>`;
}

/* ─── Settings ────────────────────────────────────────── */
function renderSettings() {
  $('#settings').innerHTML = `<div class="grid">
    ${card('Security & Privacy', `
      ${notice('Passcode is client-side only — it prevents casual viewing, not a determined attacker. Do not store bank logins, full account numbers, or SSNs.')}
      <p>All data is saved to this device's localStorage only. Nothing is sent to any server.</p>
    `, 'span-12')}
    ${card('Export Progress', `
      <p class="section-note">Download your saved data as JSON or CSV.</p>
      <div class="btn-group">
        <button id="exportJsonBtn" class="btn-primary">Export JSON</button>
        <button id="exportCsvBtn" class="btn-secondary">Export CSV</button>
      </div>
      <pre id="exportOut" class="callout" style="margin-top:12px;display:none"></pre>
    `, 'span-6')}
    ${card('Import Progress', `
      <p class="section-note">Restore a previously exported JSON file.</p>
      <div class="field-group" style="margin-top:8px">
        <label for="importFile">Select JSON export file</label>
        <input type="file" id="importFile" accept=".json,application/json" />
      </div>
      <button id="importBtn" class="btn-primary" style="margin-top:8px">Import & Restore</button>
      <p id="importStatus" role="alert" style="margin-top:8px;font-size:.875rem"></p>
    `, 'span-6')}
    ${card('Data Reset', `
      <p class="section-note">Permanently clear all saved progress from this device.</p>
      <button id="resetBtn2" class="btn-danger" style="margin-top:8px">Reset All Progress</button>
    `, 'span-12')}
  </div>`;

  $('#exportJsonBtn').addEventListener('click', () => {
    const out = {};
    LS.keys('checks:').forEach(k => { out[k] = LS.get(k); });
    LS.keys('slider:').forEach(k => { out[k] = LS.get(k); });
    LS.keys('goal:').forEach(k => { out[k] = LS.get(k); });
    LS.keys('wallet:').forEach(k => { out[k] = LS.get(k); });
    LS.keys('cap-').forEach(k => { out[k] = LS.get(k); });
    out['lastUpdated'] = LS.get('lastUpdated');
    const json = JSON.stringify(out, null, 2);
    downloadFile(`gj-progress-${datestamp()}.json`, json, 'application/json');
    const pre = $('#exportOut'); pre.textContent = json; pre.style.display = 'block';
  });

  $('#exportCsvBtn').addEventListener('click', () => {
    const rows = [['Key','Value','ExportedAt']];
    const now  = new Date().toISOString();
    ['checks:','slider:','goal:','wallet:','cap-'].forEach(prefix =>
      LS.keys(prefix).forEach(k => rows.push([k, JSON.stringify(LS.get(k)), now]))
    );
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    downloadFile(`gj-progress-${datestamp()}.csv`, csv, 'text/csv');
  });

  $('#importBtn').addEventListener('click', () => {
    const file = $('#importFile').files[0];
    const status = $('#importStatus');
    if (!file) { status.textContent = '⚠️ Select a JSON file first.'; return; }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const imported = JSON.parse(e.target.result);
        let count = 0;
        Object.entries(imported).forEach(([k, v]) => {
          if (k.startsWith('checks:') || k.startsWith('slider:') || k.startsWith('goal:') ||
              k.startsWith('wallet:') || k.startsWith('cap-') || k === 'lastUpdated') {
            LS.set(k, v); count++;
          }
        });
        status.textContent = `✅ Imported ${count} items. Reloading…`;
        setTimeout(() => location.reload(), 1200);
      } catch { status.textContent = '❌ Invalid file.'; }
    };
    reader.readAsText(file);
  });

  $('#resetBtn2').addEventListener('click', () => {
    if (!confirm('Clear all saved progress on this device?')) return;
    ['checks:','slider:','goal:','wallet:','cap-','tracker:'].forEach(prefix =>
      LS.keys(prefix).forEach(k => LS.remove(k))
    );
    LS.remove('lastUpdated');
    location.reload();
  });
}

/* ─── lastUpdated ─────────────────────────────────────── */
function refreshLastUpdated() {
  const ts = LS.get('lastUpdated', null);
  const el = $('#lastUpdatedDisplay');
  if (!el) return;
  if (ts) {
    const d = new Date(ts);
    el.textContent = `Saved ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}`;
  } else { el.textContent = ''; }
}

function touchLastUpdated() {
  LS.set('lastUpdated', new Date().toISOString());
  refreshLastUpdated();
}

/* ─── Privacy toggle ──────────────────────────────────── */
function initPrivacyToggle() {
  const btn = $('#privacyBtn');
  if (!btn) return;
  const on = LS.get('privacyMode', false);
  applyPrivacy(on, btn);
  btn.addEventListener('click', () => {
    const next = !document.body.classList.contains('privacy-mode');
    LS.set('privacyMode', next);
    applyPrivacy(next, btn);
  });
}

function applyPrivacy(on, btn) {
  document.body.classList.toggle('privacy-mode', on);
  btn.setAttribute('aria-pressed', String(on));
  const label = btn.querySelector('.btn-label');
  if (label) label.textContent = on ? 'Show $' : 'Hide $';
}

/* ─── Tab navigation ──────────────────────────────────── */
function initTabs() {
  const tabs   = $$('.tab');
  const panels = $$('.panel');

  function activate(tab) {
    tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    tab.setAttribute('aria-selected','true');
    const target = $(`#${tab.dataset.target}`);
    if (target) target.classList.add('active');
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', e => {
      const idx = tabs.indexOf(tab);
      if (e.key === 'ArrowRight') { e.preventDefault(); tabs[(idx+1)%tabs.length].focus(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); tabs[(idx-1+tabs.length)%tabs.length].focus(); }
    });
  });
}

/* ─── Global event delegation ─────────────────────────── */
function initEvents() {

  /* ── Checklists ── */
  document.addEventListener('change', e => {
    if (e.target.matches('input[type="checkbox"][data-list]')) {
      const { list, index } = e.target.dataset;
      const saved = LS.get(`checks:${list}`, {});
      saved[index] = e.target.checked;
      LS.set(`checks:${list}`, saved);
      e.target.closest('.check-row').classList.toggle('done', e.target.checked);
      touchLastUpdated();
      const allBoxes  = $$(`input[data-list="${list}"]`);
      const doneCount = allBoxes.filter(b => b.checked).length;
      const summary   = $(`#${list}-summary`);
      if (summary) summary.textContent = `${doneCount} of ${allBoxes.length} complete`;
    }
  });

  /* ── Sliders — range drag ── */
  document.addEventListener('input', e => {
    if (e.target.matches('.slider-range')) {
      const wrap   = e.target.closest('[data-slider-id]');
      if (!wrap) return;
      const id     = wrap.dataset.sliderId;
      const type   = wrap.dataset.sliderType;
      const goalEl = document.getElementById('sgoal-' + id);
      const goalVal = goalEl ? parseFloat(goalEl.value) || 0 : 0;
      const rangeVal = parseFloat(e.target.value);
      const current  = type === 'debt' ? Math.max(0, goalVal - rangeVal) : rangeVal;
      LS.set(`slider:${id}`, current);
      touchLastUpdated();
      updateSliderUI(id, type, current, goalVal);
    }

    /* ── Wallet inputs ── */
    if (e.target.matches('[data-wallet]')) {
      const person = e.target.dataset.wallet;
      const wtype  = e.target.dataset.walletType;
      const val    = parseFloat(e.target.value) || 0;
      localStorage.setItem(`wallet:${person}:${wtype}`, val);
      touchLastUpdated();
      const checking = LS.num(`wallet:${person}:checking`, 0);
      const savings  = LS.num(`wallet:${person}:savings`,  0);
      const total    = checking + savings;
      const totalEl  = document.getElementById(`wallet-total-${person}`);
      if (totalEl) totalEl.textContent = money(total);
      // Update combined wallets on dashboard if visible
      const dW = LS.num('wallet:daniel:checking',0)+LS.num('wallet:daniel:savings',0);
      const sW = LS.num('wallet:sonia:checking', 0)+LS.num('wallet:sonia:savings', 0);
      const cw = document.getElementById('combined-wallets');
      if (cw) cw.textContent = money(dW + sW);
    }

    /* ── Spending cap — spent input ── */
    if (e.target.matches('[data-cap-spent]')) {
      const id    = e.target.dataset.capSpent;
      const spent = parseFloat(e.target.value) || 0;
      localStorage.setItem(`cap-spent:${id}`, spent);
      touchLastUpdated();
      const limitEl = document.getElementById('caplimit-' + id);
      const cap     = limitEl ? parseFloat(limitEl.value) || 0 : 0;
      updateCapUI(id, spent, cap);
    }
  });

  /* ── Slider balance direct-type and goal edit ── */
  document.addEventListener('change', e => {

    if (e.target.matches('[data-slider-bal]')) {
      const id      = e.target.dataset.sliderBal;
      const type    = e.target.dataset.sliderType;
      const current = parseFloat(e.target.value) || 0;
      const goalEl  = document.getElementById('sgoal-' + id);
      const goalVal = goalEl ? parseFloat(goalEl.value) || 0 : 0;
      LS.set(`slider:${id}`, current);
      touchLastUpdated();
      updateSliderUI(id, type, current, goalVal);
    }

    if (e.target.matches('[data-slider-goal]')) {
      const id      = e.target.dataset.sliderGoal;
      const type    = e.target.dataset.sliderType;
      const goalVal = parseFloat(e.target.value) || 1;
      const balEl   = document.getElementById('sbal-' + id);
      const current = balEl ? parseFloat(balEl.value) || 0 : LS.num(`slider:${id}`, 0);
      LS.set(`goal:${id}`, goalVal);
      touchLastUpdated();
      const rangeEl = document.getElementById('srange-' + id);
      if (rangeEl) { rangeEl.max = goalVal; rangeEl.value = type === 'debt' ? Math.max(0, goalVal - current) : current; }
      updateSliderUI(id, type, current, goalVal);
    }

    /* ── Spending cap — limit edit ── */
    if (e.target.matches('[data-cap-limit]')) {
      const id    = e.target.dataset.capLimit;
      const cap   = parseFloat(e.target.value) || 0;
      localStorage.setItem(`cap-limit:${id}`, cap);
      touchLastUpdated();
      const spentEl = document.getElementById('capspent-' + id);
      const spent   = spentEl ? parseFloat(spentEl.value) || 0 : 0;
      updateCapUI(id, spent, cap);
    }
  });

  /* ── Sub-tab switching ── */
  document.addEventListener('click', e => {
    if (e.target.matches('.sub-tab')) {
      const person = e.target.dataset.person;
      const subtab = e.target.dataset.subtab;
      LS.set(`subtab:${person}`, subtab);

      $$('.sub-tab', e.target.closest('.sub-tabs').parentElement).forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      const body = $(`#${person}-subtab-body`);
      if (body) body.innerHTML = person === 'daniel' ? renderDanielTab(subtab) : renderSoniaTab(subtab);
    }

    /* ── Reset spending caps ── */
    if (e.target.matches('#reset-caps-daniel') || e.target.matches('#reset-caps-sonia')) {
      const person = e.target.id.includes('daniel') ? 'daniel' : 'sonia';
      LS.keys('cap-spent:' + person).forEach(k => LS.remove(k));
      // Re-render spending tab
      LS.set(`subtab:${person}`, 'spending');
      person === 'daniel' ? renderDaniel() : renderSonia();
    }
  });

  /* ── Header buttons ── */
  $('#printBtn').addEventListener('click', () => window.print());
  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all saved progress on this device?')) return;
    ['checks:','slider:','goal:','wallet:','cap-','tracker:','subtab:'].forEach(prefix =>
      LS.keys(prefix).forEach(k => LS.remove(k))
    );
    LS.remove('lastUpdated');
    location.reload();
  });
}

function updateCapUI(id, spent, cap) {
  const pct    = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0;
  const left   = Math.max(0, cap - spent);
  const cls    = pct >= 100 ? 'bad' : pct >= 80 ? 'warn' : '';
  const fillEl = document.getElementById('capfill-' + id);
  const statEl = document.getElementById('capstat-' + id);
  if (fillEl) { fillEl.style.width = pct.toFixed(1)+'%'; fillEl.className = `progress-fill ${cls}`; }
  if (statEl) {
    statEl.textContent = pct >= 100 ? 'OVER' : `${left.toLocaleString('en-US',{style:'currency',currency:'USD'})} left`;
    statEl.className   = `cap-status ${cls}`;
  }
}

/* ─── Utilities ───────────────────────────────────────── */
function datestamp() { return new Date().toISOString().slice(0, 10); }

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

/* ─── Init ────────────────────────────────────────────── */
function init() {
  auth();
  renderDashboard();
  renderDaniel();
  renderSonia();
  renderHousehold();
  renderReview();
  renderSettings();
  initTabs();
  initEvents();
  initPrivacyToggle();
  refreshLastUpdated();
}

init();
