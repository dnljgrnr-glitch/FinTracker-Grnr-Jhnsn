/**
 * Garner-Johnson Financial Tracker · app.js v5
 * Vanilla JS — no dependencies — GitHub Pages compatible
 * Requires financeData.js loaded first (window.FINANCE_DATA)
 */
'use strict';

/* ═══════════════════════════════════════════════════════════
   1. SETUP & GLOBALS
═══════════════════════════════════════════════════════════ */
const DATA = window.FINANCE_DATA;
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const money = n =>
  typeof n === 'number'
    ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    : (n ?? '—');

const priv = val => `<span class="private-value">${money(val)}</span>`;

/* ── LocalStorage ── */
const LS = {
  get:    (k, fb = null) => { try { const v = localStorage.getItem(k); return v === null ? fb : JSON.parse(v); } catch { return fb; } },
  set:    (k, v)         => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  remove: (k)            => { try { localStorage.removeItem(k); } catch {} },
  keys:   (pfx)          => { try { return Object.keys(localStorage).filter(k => k.startsWith(pfx)); } catch { return []; } },
};

/* ── Goal system: all key amounts are overridable ── */
const goal  = key => LS.get(`goal:${key}`, DATA.goalDefaults[key] ?? 0);
const setGoal = (key, val) => LS.set(`goal:${key}`, val);

/* ── Spending tracker (per person, per category, per month) ── */
const monthKey  = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
const monthLabel= () => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const spendKey  = (person, cat) => `spend:${person}-${cat}-${monthKey()}`;
const getSpent  = (person, cat) => Number(LS.get(spendKey(person, cat), 0));
const setSpent  = (person, cat, val) => LS.set(spendKey(person, cat), val);
const capLimit  = (person, cat) => goal(`cap-${person}-${cat}`);

/* ── Finance math ── */
function payoffMonths(balance, aprPct, payment) {
  const r = aprPct / 100 / 12;
  if (r <= 0 || payment <= 0) return 0;
  if (payment <= balance * r) return Infinity;
  return Math.ceil(-Math.log(1 - (r * balance / payment)) / Math.log(1 + r));
}
function totalInterestPaid(balance, aprPct, payment) {
  const n = payoffMonths(balance, aprPct, payment);
  if (!isFinite(n)) return Infinity;
  return Math.max(0, (n * payment) - balance);
}
function monthlyInterestCost(balance, aprPct) {
  return balance * (aprPct / 100 / 12);
}

/* ── Derived household values (respect editable goals) ── */
function danielShare() {
  const total = goal('household-rent') + goal('household-electric') + goal('household-internet') + goal('household-groceries');
  return Math.round(total * (goal('household-split-daniel') / 100) * 100) / 100;
}
function soniaShare() {
  const total = goal('household-rent') + goal('household-electric') + goal('household-internet') + goal('household-groceries');
  return Math.round(total * ((100 - goal('household-split-daniel')) / 100) * 100) / 100;
}

/* ═══════════════════════════════════════════════════════════
   2. AUTH
═══════════════════════════════════════════════════════════ */
function auth() {
  const loginEl = $('#login');
  if (sessionStorage.getItem('financeUnlocked') === 'true') { loginEl.style.display = 'none'; return; }
  setTimeout(() => $('#passwordInput') && $('#passwordInput').focus(), 80);
  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const val = $('#passwordInput').value.trim();
    if (val === DATA.password) {
      sessionStorage.setItem('financeUnlocked', 'true');
      loginEl.style.display = 'none';
    } else {
      const err = $('#loginError');
      err.textContent = 'Incorrect passcode — try again.';
      $('#passwordInput').value = '';
      $('#passwordInput').focus();
      setTimeout(() => { err.textContent = ''; }, 4000);
    }
  });
  $('#lockBtn').addEventListener('click', () => { sessionStorage.removeItem('financeUnlocked'); location.reload(); });
}

/* ═══════════════════════════════════════════════════════════
   3. BUILDER HELPERS
═══════════════════════════════════════════════════════════ */
function table(headers, rows, opts = {}) {
  const ths = headers.map(h => `<th scope="col">${h}</th>`).join('');
  const trs = rows.map(r => `<tr>${r.map((c,i) => i===0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`).join('')}</tr>`).join('');
  const cap = opts.caption ? `<caption class="sr-only">${opts.caption}</caption>` : '';
  return `<div class="table-wrap" role="region" aria-label="${opts.label||'Table'}" tabindex="0"><table>${cap}<thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
}
function card(title, body, span = 'span-6') {
  return `<div class="card ${span}"><h2>${title}</h2>${body}</div>`;
}
function proTip(text) { return `<div class="pro-tip"><strong>💡 Key Rule</strong>${text}</div>`; }
function notice(text) { return `<div class="notice"><strong>⚠️ Note</strong>${text}</div>`; }

function tracker(id, label, fallback, target) {
  const current = Number(LS.get(`tracker:${id}`, fallback));
  const tgt = Number(target);
  const pct = Math.max(0, Math.min(100, (current / tgt) * 100)).toFixed(1);
  const fillClass = pct >= 100 ? 'full' : pct >= 60 ? '' : pct >= 30 ? 'warn' : 'bad';
  return `
  <div class="progress-wrap" data-tracker="${id}" data-target="${tgt}" data-fallback="${fallback}">
    <div class="progress-header">
      <span class="progress-label-text">${label}</span>
      <span class="progress-amounts private-value">${money(current)} / ${money(tgt)}</span>
      <span class="progress-pct">${pct}%</span>
    </div>
    <div class="progress-bar" role="progressbar" aria-valuenow="${current}" aria-valuemin="0" aria-valuemax="${tgt}" aria-label="${label}">
      <div class="progress-fill ${fillClass}" style="width:${pct}%"></div>
    </div>
    <div class="tracker-row">
      <label>Update balance<input type="number" step="0.01" min="0" value="${current}" data-tracker-input="${id}" aria-label="Current value for ${label}" /></label>
      <label>Target<input type="number" value="${tgt}" disabled /></label>
    </div>
  </div>`;
}

function checklist(id, items) {
  const saved = LS.get(`checks:${id}`, {});
  const doneCount = items.filter((_, i) => saved[i]).length;
  const rows = items.map((item, i) => `
    <div class="check-row ${saved[i] ? 'done' : ''}">
      <input type="checkbox" id="${id}-${i}" data-list="${id}" data-index="${i}" ${saved[i] ? 'checked' : ''} />
      <label for="${id}-${i}">${item}</label>
    </div>`).join('');
  return `<p class="checklist-summary" id="${id}-summary">${doneCount} of ${items.length} complete</p>
  <div class="checklist" role="group">${rows}</div>`;
}

/* ═══════════════════════════════════════════════════════════
   4. NEW COMPONENTS
═══════════════════════════════════════════════════════════ */

/* ── Move Fund Countdown ── */
function renderMoveFundCountdown() {
  const target = new Date('2026-07-10');
  const today  = new Date();
  today.setHours(0,0,0,0);
  const daysLeft = Math.max(0, Math.ceil((target - today) / 86400000));
  const saved    = Number(LS.get('tracker:daniel-move-fund', 0));
  const needed   = Math.max(0, goal('daniel-move-target') - saved);
  const perDay   = daysLeft > 0 ? needed / daysLeft : 0;
  const perCheck = needed / Math.max(1, Math.ceil(daysLeft / 7)); // weekly paychecks
  const urgency  = daysLeft < 14 ? 'urgent' : 'ok';
  return `
  <div class="countdown-grid">
    <div class="countdown-stat">
      <span class="countdown-val ${urgency}">${daysLeft}</span>
      <span class="countdown-lbl">Days Left</span>
    </div>
    <div class="countdown-stat">
      <span class="countdown-val private-value">${money(needed)}</span>
      <span class="countdown-lbl">Still Needed</span>
    </div>
    <div class="countdown-stat">
      <span class="countdown-val private-value">${money(Math.round(perCheck))}</span>
      <span class="countdown-lbl">Per Paycheck</span>
    </div>
  </div>
  <p class="section-note" style="margin-top:8px">Target: <strong>July 10, 2026</strong> · Goal: <strong class="private-value">${money(goal('daniel-move-target'))}</strong> · Saved so far: <strong class="private-value">${money(saved)}</strong></p>`;
}

/* ── Monthly Interest Cost ── */
function renderInterestSummary() {
  const visaBal  = goal('daniel-visa-balance');
  const visaApr  = goal('daniel-visa-apr');
  const nwBal    = goal('sonia-nw-balance');
  const nwApr    = goal('sonia-nw-apr');
  const vInt     = monthlyInterestCost(visaBal, visaApr);
  const nwInt    = monthlyInterestCost(nwBal, nwApr);
  const total    = vInt + nwInt;
  return `
  <div class="interest-row">
    <span>NFCU Visa <span class="private-value">(${money(visaBal)} @ ${visaApr}%)</span></span>
    <strong class="private-value">${money(Math.round(vInt))}/mo</strong>
  </div>
  <div class="interest-row">
    <span>NW Loan <span class="private-value">(${money(nwBal)} @ ${nwApr}%)</span></span>
    <strong class="private-value">${money(Math.round(nwInt))}/mo</strong>
  </div>
  <div class="interest-total">
    <span>Total interest burning monthly</span>
    <strong class="private-value">${money(Math.round(total))}/mo</strong>
  </div>
  <p class="section-note" style="margin-top:8px">That's <strong class="private-value">${money(Math.round(total*12))}/year</strong> going purely to interest. Every extra dollar toward principal cuts this.</p>`;
}

/* ── Spending Cap Tracker ── */
function renderSpendingCaps(person) {
  const caps = DATA.spendingCaps[person];
  const rows = caps.map(c => {
    const spent = getSpent(person, c.id);
    const limit = capLimit(person, c.id);
    const pct   = limit > 0 ? Math.min(200, (spent / limit) * 100) : 0;
    const fillClass = pct >= 100 ? 'over' : pct >= 75 ? 'warn' : '';
    const statusClass = pct >= 100 ? 'over' : pct >= 75 ? 'warn' : 'ok';
    const statusText  = pct >= 100 ? `🔴 Over by ${money(spent - limit)}` : pct >= 75 ? `⚠️ ${money(limit - spent)} remaining` : `✓ ${money(limit - spent)} remaining`;
    return `
    <div class="cap-row">
      <div class="cap-row-header">
        <span class="cap-label">${c.label}</span>
        <span class="cap-amounts private-value">${money(spent)} / ${money(limit)}</span>
      </div>
      <div class="cap-bar"><div class="cap-fill ${fillClass}" style="width:${Math.min(100,pct)}%"></div></div>
      <div class="cap-input-row">
        <label>Spent this month
          <input type="number" step="0.01" min="0" value="${spent}"
            data-spend="${person}:${c.id}" aria-label="Spent on ${c.label}" />
        </label>
        <label>Monthly cap
          <input type="number" step="1" min="0" value="${limit}"
            data-goal="cap-${person}-${c.id}" aria-label="Cap for ${c.label}" />
        </label>
      </div>
      <p class="cap-status ${statusClass}">${statusText}</p>
    </div>`;
  }).join('');

  return `
  <div class="cap-month-header">
    <span class="month-badge">${monthLabel()}</span>
    <button class="btn-ghost" style="font-size:.78rem;padding:5px 10px" data-reset-spend="${person}">Reset Month</button>
  </div>
  ${rows}`;
}

/* ── Payoff Slider ── */
function renderPayoffSlider(sliderId, balanceKey, aprKey, minKey, label) {
  const balance = goal(balanceKey);
  const apr     = goal(aprKey);
  const minPmt  = goal(minKey);
  const maxPmt  = Math.ceil(minPmt * 2.5 / 50) * 50;
  const defPmt  = Math.round((minPmt + maxPmt * 0.4) / 10) * 10;
  const stored  = LS.get(`slider:${sliderId}`, defPmt);
  const initPmt = Math.max(minPmt, Math.min(maxPmt, stored));

  const n   = payoffMonths(balance, apr, initPmt);
  const ti  = totalInterestPaid(balance, apr, initPmt);
  const nMin = payoffMonths(balance, apr, minPmt);
  const tiMin= totalInterestPaid(balance, apr, minPmt);
  const saved = Math.max(0, tiMin - ti);

  return `
  <p class="section-note">Balance: <strong class="private-value">${money(balance)}</strong> · APR: <strong>${apr}%</strong></p>
  <div class="slider-section">
    <label>Monthly Payment <span id="slider-val-${sliderId}" class="private-value">${money(initPmt)}</span></label>
    <input type="range" id="slider-${sliderId}"
      min="${minPmt}" max="${maxPmt}" step="10" value="${initPmt}"
      data-slider="${sliderId}" data-balance="${balanceKey}" data-apr="${aprKey}" data-min="${minKey}"
      aria-label="Monthly payment for ${label}" />
    <div class="slider-range-labels">
      <span class="private-value">${money(minPmt)} min</span>
      <span class="private-value">${money(maxPmt)}</span>
    </div>
  </div>
  <div class="payoff-output" id="payoff-out-${sliderId}">
    <div class="payoff-stat">
      <span class="payoff-stat-val good" id="po-months-${sliderId}">${isFinite(n) ? n : '∞'}</span>
      <span class="payoff-stat-lbl">Months to Payoff</span>
    </div>
    <div class="payoff-stat">
      <span class="payoff-stat-val bad private-value" id="po-interest-${sliderId}">${isFinite(ti) ? money(Math.round(ti)) : '∞'}</span>
      <span class="payoff-stat-lbl">Total Interest</span>
    </div>
    <div class="payoff-vs-min" id="po-vs-${sliderId}">
      vs. minimum only: ${isFinite(nMin)?nMin:'∞'} months · ${isFinite(tiMin)?money(Math.round(tiMin)):'∞'} interest ·
      <strong class="private-value">You save ${money(Math.round(saved))}</strong>
    </div>
  </div>`;
}

/* ── Balance Log ── */
function renderBalanceLog() {
  const log = LS.get('balancelog', []);
  const today = new Date().toISOString().slice(0,10);

  const formHtml = `
  <p class="section-note">Snapshot current balances monthly to track your real progress over time.</p>
  <div class="log-form-grid">
    <label>Daniel Visa Balance<input type="number" step="0.01" id="log-daniel-visa" value="${goal('daniel-visa-balance')}" /></label>
    <label>Daniel Vehicle Balance<input type="number" step="0.01" id="log-daniel-vehicle" value="${goal('daniel-vehicle-balance')}" /></label>
    <label>Daniel Apple Card<input type="number" step="0.01" id="log-daniel-apple" value="${goal('daniel-apple-balance')}" /></label>
    <label>Sonia NW Loan Balance<input type="number" step="0.01" id="log-sonia-nw" value="${goal('sonia-nw-balance')}" /></label>
    <label>Sonia Family Debt<input type="number" step="0.01" id="log-sonia-family" value="${goal('sonia-family-balance')}" /></label>
    <label>Sonia Savings Balance<input type="number" step="0.01" id="log-sonia-savings" value="${goal('sonia-savings-balance')}" /></label>
    <label>Daniel Savings Balance<input type="number" step="0.01" id="log-daniel-savings" value="${goal('daniel-savings-balance')}" /></label>
    <label>Date<input type="date" id="log-date" value="${today}" /></label>
  </div>
  <button id="logEntryBtn" class="btn-primary">📋 Log This Snapshot</button>
  <p id="logStatus" style="font-size:.875rem;margin-top:6px" role="alert"></p>`;

  let historyHtml = '';
  if (log.length > 0) {
    const rows = [...log].reverse().slice(0,24).map((entry, i) => {
      const prev = log[log.length - 2 - i]; // previous entry for trend
      const totalDebt = (entry.danielVisa||0) + (entry.danielVehicle||0) + (entry.danielApple||0) + (entry.soniaNW||0) + (entry.soniaFamily||0);
      const totalSavings = (entry.danielSavings||0) + (entry.soniaSavings||0);
      const nw = totalSavings - totalDebt;
      const prevNW = prev ? ((prev.danielSavings||0)+(prev.soniaSavings||0)) - ((prev.danielVisa||0)+(prev.danielVehicle||0)+(prev.danielApple||0)+(prev.soniaNW||0)+(prev.soniaFamily||0)) : null;
      const trendHtml = prevNW !== null
        ? nw > prevNW ? `<span class="trend-up">↑ ${money(Math.round(nw-prevNW))}</span>`
        : nw < prevNW ? `<span class="trend-down">↓ ${money(Math.round(prevNW-nw))}</span>`
        : `<span class="trend-flat">—</span>` : '<span class="trend-flat">—</span>';
      return [
        entry.date || '—',
        `<span class="private-value">${money(entry.danielVisa)}</span>`,
        `<span class="private-value">${money(entry.soniaNW)}</span>`,
        `<span class="private-value">${money(totalSavings)}</span>`,
        `<span class="private-value" style="font-weight:700;color:${nw>=0?'var(--good)':'var(--bad)'}">${money(Math.round(nw))}</span>`,
        trendHtml,
      ];
    });
    historyHtml = `
    <div class="log-history-wrap">
      <p class="log-history-title">Snapshot History (last 24)</p>
      ${table(['Date','Visa','NW Loan','Savings','Net Worth','Change'], rows, { label:'Balance history', caption:'Monthly balance snapshots' })}
      <button id="clearLogBtn" class="btn-ghost" style="margin-top:10px;font-size:.8rem">Clear History</button>
    </div>`;
  }

  return formHtml + historyHtml;
}

/* ── Goals & Limits Editor ── */
function renderGoalsEditor() {
  function gField(key, label, step = '0.01', suffix = '') {
    return `<div class="goal-field"><label>${label}${suffix}</label><input type="number" step="${step}" value="${goal(key)}" data-goal="${key}" /></div>`;
  }
  return `
  <p class="section-note">All amounts here are saved instantly to this device. Changes flow through the whole app — no reload needed.</p>

  <div class="goals-section-title">Daniel — Debts</div>
  <div class="goal-grid">
    ${gField('daniel-visa-balance',    'Visa Current Balance')}
    ${gField('daniel-visa-minimum',    'Visa Minimum Payment')}
    ${gField('daniel-visa-target-pmt', 'Visa Target Payment')}
    ${gField('daniel-visa-apr',        'Visa APR %', '0.01', '%')}
    ${gField('daniel-vehicle-balance', 'Vehicle Balance')}
    ${gField('daniel-vehicle-min',     'Vehicle Min Payment')}
    ${gField('daniel-apple-balance',   'Apple Card Balance')}
    ${gField('daniel-apple-min',       'Apple Card Min')}
  </div>

  <div class="goals-section-title">Daniel — Goals & Income</div>
  <div class="goal-grid">
    ${gField('daniel-move-target',     'Move Fund Target')}
    ${gField('daniel-savings-balance', 'Daniel Savings Balance')}
    ${gField('daniel-income',          'Monthly Income')}
  </div>

  <div class="goals-section-title">Sonia — Debts</div>
  <div class="goal-grid">
    ${gField('sonia-nw-balance',       'NW Loan Balance')}
    ${gField('sonia-nw-minimum',       'NW Loan Min Payment')}
    ${gField('sonia-nw-apr',           'NW Loan APR %', '0.01', '%')}
    ${gField('sonia-family-balance',   'Family Debt Balance')}
    ${gField('sonia-family-payment',   'Family Debt Payment')}
    ${gField('sonia-apple-min',        'Apple Card Min')}
  </div>

  <div class="goals-section-title">Sonia — Goals & Income</div>
  <div class="goal-grid">
    ${gField('sonia-savings-target',   'Savings Goal')}
    ${gField('sonia-savings-balance',  'Savings Current Balance')}
    ${gField('sonia-income',           'Monthly Income')}
  </div>

  <div class="goals-section-title">Household</div>
  <div class="goal-grid">
    ${gField('household-rent',         'Rent')}
    ${gField('household-electric',     'Electric')}
    ${gField('household-internet',     'Internet')}
    ${gField('household-groceries',    'Groceries')}
    ${gField('household-split-daniel', "Daniel's Split %", '1', '%')}
  </div>

  <div class="goals-section-title">Spending Caps — Daniel</div>
  <div class="goal-grid">
    ${gField('cap-daniel-gas',      'Gas / Transportation')}
    ${gField('cap-daniel-personal', 'Personal / Food / Misc')}
    ${gField('cap-daniel-fastfood', 'Fast Food')}
    ${gField('cap-daniel-online',   'Online Shopping')}
  </div>

  <div class="goals-section-title">Spending Caps — Sonia</div>
  <div class="goal-grid">
    ${gField('cap-sonia-beauty',    'Beauty / Personal Care')}
    ${gField('cap-sonia-fastfood',  'Fast Food')}
    ${gField('cap-sonia-amazon',    'Amazon / Online')}
    ${gField('cap-sonia-applecash', 'Apple Cash Transfers')}
  </div>`;
}

/* ── Live Bill Split Calculator ── */
function renderBillSplitCalc() {
  const dPct = goal('household-split-daniel');
  const sPct = 100 - dPct;
  const bills = [
    { label: 'Rent',      key: 'household-rent' },
    { label: 'Electric',  key: 'household-electric' },
    { label: 'Internet',  key: 'household-internet' },
    { label: 'Groceries', key: 'household-groceries' },
  ];
  const rows = bills.map(b => {
    const amt = goal(b.key);
    const d   = Math.round(amt * dPct / 100 * 100) / 100;
    const s   = Math.round(amt * sPct / 100 * 100) / 100;
    return `
    <div class="split-row" data-split-row="${b.key}">
      <span>${b.label}</span>
      <div class="split-cell"><input type="number" step="1" value="${amt}" data-goal="${b.key}" style="text-align:right;width:80px;padding:5px 6px;font-size:.875rem" aria-label="${b.label} amount" /></div>
      <span class="split-cell private-value split-d">${money(d)}</span>
      <span class="split-cell private-value split-s">${money(s)}</span>
    </div>`;
  }).join('');

  const totalAmt = bills.reduce((s,b) => s + goal(b.key), 0);
  const totalD   = danielShare();
  const totalS   = soniaShare();

  return `
  <div>
    <div class="split-row header">
      <span>Bill</span><span class="split-cell">Amount</span>
      <span class="split-cell">Daniel (${dPct}%)</span>
      <span class="split-cell">Sonia (${sPct}%)</span>
    </div>
    ${rows}
    <div class="split-row" style="font-weight:700;border-top:2px solid var(--line);padding-top:10px;margin-top:6px">
      <span>Total</span>
      <span class="split-cell private-value">${money(totalAmt)}</span>
      <span class="split-cell private-value">${money(totalD)}</span>
      <span class="split-cell private-value">${money(totalS)}</span>
    </div>
    <p class="section-note" style="margin-top:10px">Edit any amount above — split recalculates instantly. Change the split % in Goals & Limits.</p>
  </div>`;
}

/* ── Paycheck Notes ── */
function paychecksWithNotes(paychecks) {
  return paychecks.map((r, i) => {
    const note = LS.get(`notes:daniel-${i}`, '');
    return `<tr>
      <th scope="row">${r[0]}</th>
      <td><strong class="private-value">${r[1]}</strong></td>
      <td>${r[2]}</td>
      <td>
        <div class="paycheck-note-wrap">
          <label>Notes</label>
          <textarea rows="2" data-note="daniel-${i}" aria-label="Notes for ${r[0]}">${note}</textarea>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════
   5. RENDER SECTIONS
═══════════════════════════════════════════════════════════ */

function renderDashboard() {
  const H = DATA.household;
  const total  = goal('household-rent')+goal('household-electric')+goal('household-internet')+goal('household-groceries');

  $('#dashboard').innerHTML = `<div class="grid">

    ${card('Household Snapshot', `
      <div class="metric"><span>Combined monthly income</span><strong class="private-value">${money(goal('daniel-income') + goal('sonia-income'))}</strong></div>
      <div class="metric"><span>Shared bill split</span><strong>Daniel ${goal('household-split-daniel')}% · Sonia ${100-goal('household-split-daniel')}%</strong></div>
      <div class="metric"><span>Total shared bills</span><strong class="private-value">${money(total)}/mo</strong></div>
      <div class="metric"><span>Daniel's share</span><strong class="private-value">${money(danielShare())}/mo</strong></div>
      <div class="metric"><span>Sonia's share</span><strong class="private-value">${money(soniaShare())}/mo</strong></div>
    `, 'span-6')}

    ${card('Move Fund Countdown', renderMoveFundCountdown(), 'span-6')}

    ${card('Live Progress Trackers', `
      ${tracker('daniel-move-fund',  'Daniel — Move Fund',          0,                         goal('daniel-move-target'))}
      ${tracker('daniel-visa-paid',  'Daniel — Visa Paid Down',     0,                         goal('daniel-visa-balance'))}
      ${tracker('sonia-savings',     'Sonia — Apple Savings',       goal('sonia-savings-balance'), goal('sonia-savings-target'))}
      ${tracker('sonia-family-paid', 'Sonia — Family Debt Paid',    0,                         goal('sonia-family-balance'))}
      ${tracker('sonia-nw-paid',     'Sonia — NW Loan Paid',        0,                         goal('sonia-nw-balance'))}
    `, 'span-6')}

    ${card('Monthly Interest Cost 💸', renderInterestSummary(), 'span-6')}

    ${card('Operating Rule', proTip('No discretionary spending happens until bills, debt payments, and savings are assigned for the pay cycle. Every paycheck gets a job <em>before</em> it hits the account.'), 'span-12')}

  </div>`;
}

function renderDaniel() {
  const D = DATA.daniel;

  $('#daniel').innerHTML = `<div class="grid">

    ${card('Daniel', `
      <p><span class="pill">${D.payFrequency}</span><span class="pill warn">NFCU Visa priority</span><span class="pill good">Move target: ${money(goal('daniel-move-target'))}</span></p>
      <p>Keep NFCU Visa at zero new charges. Build move fund by July 10. Protect EasyStart Certificate — do not touch before December 2026.</p>
      ${notice('EasyStart Certificate: <strong class="private-value">$2,137.75</strong> — matures 12/06/2026. Do not withdraw early.')}
    `, 'span-12')}

    ${card('Paycheck Allocation: June 5 – July 10', `
      <div class="table-wrap" role="region" aria-label="Daniel paycheck allocation" tabindex="0">
        <table><thead><tr><th>Date</th><th>Income</th><th>Allocation</th><th>Notes</th></tr></thead>
        <tbody>${paychecksWithNotes(D.paychecks)}</tbody></table>
      </div>
    `, 'span-12')}

    ${card('June–July Checklist', checklist('daniel', D.checklist), 'span-6')}

    ${card('Spending Cap Tracker', renderSpendingCaps('daniel'), 'span-6')}

    ${card('Debt Snapshot', table(
      ['Debt','Balance','APR','Min / Target'],
      [
        ['NFCU Visa',      priv(goal('daniel-visa-balance')),    `${goal('daniel-visa-apr')}%`,  `${priv(goal('daniel-visa-minimum'))} min / ${priv(goal('daniel-visa-target-pmt'))} target`],
        ['NFCU Vehicle',   priv(goal('daniel-vehicle-balance')), `${goal('daniel-vehicle-apr')}%`, priv(goal('daniel-vehicle-min'))],
        ['Apple Card',     priv(goal('daniel-apple-balance')),   'TBD',                          priv(goal('daniel-apple-min'))],
      ],
      { label:'Daniel debts', caption:'Daniel debt snapshot' }
    ), 'span-6')}

    ${card('Visa Payoff Calculator', renderPayoffSlider('daniel-visa', 'daniel-visa-balance', 'daniel-visa-apr', 'daniel-visa-minimum', 'NFCU Visa'), 'span-6')}

    ${card('Visa Payoff Scenarios', table(
      ['Scenario','Monthly Pmt','Timeline'],
      D.visaTimeline,
      { label:'Visa payoff options', caption:'Visa payoff scenarios' }
    ), 'span-6')}

    ${card('Post-Move Monthly Budget', table(
      ['Category','Amount'],
      [
        ['Shared household expenses',   priv(danielShare())],
        ['Vehicle loan',                priv(goal('daniel-vehicle-min'))],
        ['Visa minimum',                priv(goal('daniel-visa-minimum'))],
        ['Extra Visa target payment',   priv(goal('daniel-visa-target-pmt'))],
        ['Progressive',                 priv(134)],
        ['Verizon target',              priv(120)],
        ['TruStage',                    priv(12.50)],
        ['Apple Card estimate',         priv(goal('daniel-apple-min'))],
        ['Claude + Netflix',            priv(30.73)],
        ['Gas/transportation',          priv(goal('cap-daniel-gas'))],
        ['Personal/food/misc.',         priv(goal('cap-daniel-personal'))],
        ['Emergency savings',           priv(100)],
      ],
      { label:'Daniel post-move budget', caption:'Daniel monthly budget' }
    ), 'span-6')}

  </div>`;
}

function renderSonia() {
  const S = DATA.sonia;

  const nextPay = S.nextPaycheck.map(([a,b]) => [a, `<strong class="private-value">${b}</strong>`]);
  const savings = S.savingsTargets.map(([a,b]) => [a, priv(b)]);

  $('#sonia').innerHTML = `<div class="grid">

    ${card('Sonia', `
      <p><span class="pill">${S.payFrequency}</span><span class="pill good">Savings first</span><span class="pill warn">NW Loan ${goal('sonia-nw-apr')}% APR</span></p>
      <p>Zero overdrafts. $1,000 emergency savings immediately → $${goal('sonia-savings-target').toLocaleString()} by month 6. NW loan is <strong class="private-value">${money(goal('sonia-nw-balance'))}</strong> at <strong>${goal('sonia-nw-apr')}% APR</strong> — consider extra payments after savings target is met.</p>
    `, 'span-12')}

    ${card('Next Paycheck Allocation', table(['Use','Amount'], nextPay, { label:'Sonia paycheck', caption:'Sonia next paycheck' }), 'span-6')}

    ${card('Action Checklist', checklist('sonia', S.checklist), 'span-6')}

    ${card('Spending Cap Tracker', renderSpendingCaps('sonia'), 'span-6')}

    ${card('Debt Snapshot', table(
      ['Debt','Balance','APR','Payment'],
      [
        ['NW Bank Loan', priv(goal('sonia-nw-balance')),     `${goal('sonia-nw-apr')}%`, priv(goal('sonia-nw-minimum'))],
        ['Family Debt',  priv(goal('sonia-family-balance')), '0%',                       `${priv(goal('sonia-family-payment'))} → $300 mo 3+`],
        ['Apple Card',   '<em>TBD</em>',                     'TBD',                      priv(goal('sonia-apple-min'))],
      ],
      { label:'Sonia debts', caption:'Sonia debt snapshot' }
    ), 'span-6')}

    ${card('NW Loan Payoff Calculator', renderPayoffSlider('sonia-nw', 'sonia-nw-balance', 'sonia-nw-apr', 'sonia-nw-minimum', 'NW Loan'), 'span-6')}

    ${card('NW Loan Extra-Payment Scenarios', `
      <p class="section-note">Balance: <strong class="private-value">${money(goal('sonia-nw-balance'))}</strong> at <strong>${goal('sonia-nw-apr')}% APR</strong>. Minimum: <strong class="private-value">${money(goal('sonia-nw-minimum'))}/mo</strong>.</p>
      ${table(['Payment','Payoff','Est. Interest'], S.loanPayoff, { label:'NW loan options', caption:'NW loan payoff scenarios' })}
    `, 'span-6')}

    ${card('Post-Move Monthly Budget', table(
      ['Category','Amount'],
      [
        ['Personal fixed bills',       priv(263.50)],
        ['Shared household expenses',  priv(soniaShare())],
        ['Family debt months 1–2',     priv(goal('sonia-family-payment'))],
        ['Family debt month 3+',       priv(300)],
        ['Savings/sinking fund',       priv(270)],
        ['Gas',                        priv(120)],
        ['Beauty',                     priv(goal('cap-sonia-beauty'))],
        ['Fast food',                  priv(goal('cap-sonia-fastfood'))],
        ['Amazon',                     priv(goal('cap-sonia-amazon'))],
        ['Apple Cash named-purpose',   priv(goal('cap-sonia-applecash'))],
      ],
      { label:'Sonia post-move budget', caption:'Sonia monthly budget' }
    ), 'span-6')}

    ${card('Family Debt Timeline', table(['Milestone','Balance'], S.familyDebtTimeline.map(([a,b]) => [a,`<span class="private-value">${b}</span>`]), { label:'Family debt repayment' }), 'span-6')}

    ${card('Apple Savings Targets', table(['Milestone','Target'], savings, { label:'Savings milestones' }), 'span-6')}

    ${card('Family Repayment Message', `
      <p>Hey, I want to start paying you back consistently and make sure this is handled respectfully. After the move, I'm going to start paying <strong>$200/month</strong> beginning with my first post-move paycheck cycle. Starting in month three, I'll increase it to <strong>$300/month</strong>. I'll keep you updated and stay consistent so there's no confusion.</p>
      <p class="fine-print">Send as-is or in your own words.</p>
    `, 'span-12')}

  </div>`;
}

function renderHousehold() {
  const H = DATA.household;

  const nwRows = H.netWorth.map(r => [
    `Mo ${r[0]}`,
    `<span class="private-value">${r[1]}</span>`,
    `<span class="private-value">${r[2]}</span>`,
    `<span class="private-value">${r[3]}</span>`,
    r[4],
    `<span class="private-value">${r[5]}</span>`,
    `<span class="private-value">${r[6]}</span>`,
    `<span class="private-value" style="font-weight:700;color:${r[7].startsWith('-')?'var(--bad)':'var(--good)'}">${r[7]}</span>`,
  ]);

  $('#household').innerHTML = `<div class="grid">

    ${card('Live Bill Split Calculator', renderBillSplitCalc(), 'span-6')}

    ${card('Debt Payoff Sequence', table(['Priority','Action','Reason'], H.debtSequence, { label:'Payoff sequence' }), 'span-6')}

    ${card('Net Worth Trajectory (Months 1–36)', `
      <p class="section-note">Projected assuming plan is followed. Negative values are normal early on — this is a debt payoff map.</p>
      ${table(['Month','Visa','Vehicle','Family','NW Loan','Cash','Investments','Net Worth'], nwRows, { label:'Net worth projection' })}
    `, 'span-12')}

  </div>`;
}

function renderReview() {
  const reviewItems = [
    'Overdrafts are $0.',
    'Daniel NFCU Visa has $0 new charges.',
    'Daniel Visa balance fell each month.',
    'Sonia family debt payment made every month.',
    'Sonia Northwest loan current or accelerated.',
    'Emergency savings increased.',
    'Shared bills split correctly per current %.',
    'Subscriptions did not creep back.',
    'Spending caps respected across both trackers.',
    'Net worth improved quarter over quarter.',
    'Move-related final bills are closed out.',
    'Investing only started after trigger list is satisfied.',
  ];
  const triggers = [
    ['Daniel',    'Visa paid off, $1,000+ emergency fund, no new card charges 90 days',              '$50–$150/mo'],
    ['Sonia',     '$2,500 emergency fund, no overdrafts 90 days, family debt below $5,000, NW loan current or paid', '$50–$150/mo'],
    ['Household', 'Both current, shared bills stable, no surprise old-address bills',                'Review quarterly'],
  ];
  const scenarios = [
    ['Conservative', 'Daniel $600/mo to Visa; Sonia follows family plan; extra builds reserves', 'Safer but slower'],
    ['Balanced ✓',   'Daniel $700/mo to Visa; Sonia saves to $2,500 and pays family debt',       'Recommended'],
    ['Aggressive',   'Daniel $800–$900/mo to Visa; Sonia adds extra to NW loan after month 6',   'Fastest — higher risk'],
  ];
  $('#review').innerHTML = `<div class="grid">
    ${card('Quarterly Review Checklist', checklist('quarterly', reviewItems), 'span-6')}
    ${card('Investment Triggers', table(['Person','Trigger Condition','Start Amount'], triggers, { label:'Investment triggers' }), 'span-6')}
    ${card('Scenario Options', table(['Scenario','Action','Outcome'], scenarios, { label:'Scenarios' }), 'span-12')}
  </div>`;
}

function renderSettings() {
  $('#settings').innerHTML = `<div class="grid">

    ${card('Security & Privacy', `
      ${notice('The passcode is client-side only — not bank-grade security. Do not store account numbers, SSNs, or login credentials here. Use a private GitHub repository.')}
      <p>All progress is saved only to this device's localStorage. Nothing is ever sent to a server.</p>
    `, 'span-12')}

    ${card('Goals & Limits — Live Editor', renderGoalsEditor(), 'span-12')}

    ${card('Monthly Balance Snapshot Log', renderBalanceLog(), 'span-12')}

    ${card('Export Progress', `
      <p class="section-note">Download a backup of all your tracker values, checklist states, spending, and balance log.</p>
      <div class="btn-group">
        <button id="exportJsonBtn" class="btn-primary">Export JSON</button>
        <button id="exportCsvBtn"  class="btn-secondary">Export CSV</button>
      </div>
      <pre id="exportOut" class="callout" style="margin-top:12px;display:none"></pre>
    `, 'span-6')}

    ${card('Import Progress', `
      <p class="section-note">Restore a JSON backup on a new device.</p>
      <div class="field-group" style="margin-top:8px">
        <label for="importFile">Select JSON export file</label>
        <input type="file" id="importFile" accept=".json,application/json" />
      </div>
      <button id="importBtn" class="btn-primary" style="margin-top:8px">Import & Restore</button>
      <p id="importStatus" role="alert" style="margin-top:8px;font-size:.875rem"></p>
    `, 'span-6')}

    ${card('Reset All Data', `
      <p class="section-note">Permanently clears all saved progress, tracker values, spending data, and balance log from this device.</p>
      <button id="resetBtn2" class="btn-danger" style="margin-top:8px">Reset Everything</button>
    `, 'span-12')}

  </div>`;

  bindSettingsEvents();
}

function bindSettingsEvents() {
  /* Export JSON */
  $('#exportJsonBtn') && $('#exportJsonBtn').addEventListener('click', () => {
    const out = {};
    [...LS.keys('checks:'), ...LS.keys('tracker:'), ...LS.keys('goal:'), ...LS.keys('spend:'), ...LS.keys('notes:')].forEach(k => { out[k] = LS.get(k); });
    out['balancelog']   = LS.get('balancelog');
    out['lastUpdated']  = LS.get('lastUpdated');
    const json = JSON.stringify(out, null, 2);
    downloadFile(`gj-progress-${datestamp()}.json`, json, 'application/json');
    const pre = $('#exportOut'); pre.textContent = json; pre.style.display = 'block';
  });

  /* Export CSV */
  $('#exportCsvBtn') && $('#exportCsvBtn').addEventListener('click', () => {
    const now = new Date().toISOString();
    const rows = [['Key','Value','ExportedAt']];
    [...LS.keys('goal:'), ...LS.keys('tracker:'), ...LS.keys('spend:'), ...LS.keys('checks:')].forEach(k => rows.push([k, LS.get(k), now]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    downloadFile(`gj-progress-${datestamp()}.csv`, csv, 'text/csv');
  });

  /* Import JSON */
  $('#importBtn') && $('#importBtn').addEventListener('click', () => {
    const file = $('#importFile') && $('#importFile').files[0];
    const status = $('#importStatus');
    if (!file) { status.textContent = '⚠️ Select a file first.'; return; }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const imported = JSON.parse(e.target.result);
        let count = 0;
        Object.entries(imported).forEach(([k,v]) => {
          if (['balancelog','lastUpdated'].includes(k) || k.startsWith('checks:') || k.startsWith('tracker:') || k.startsWith('goal:') || k.startsWith('spend:') || k.startsWith('notes:')) {
            LS.set(k, v); count++;
          }
        });
        status.textContent = `✅ Imported ${count} items. Reloading…`;
        status.style.color = 'var(--good)';
        setTimeout(() => location.reload(), 1200);
      } catch { status.textContent = '❌ Invalid file.'; status.style.color = 'var(--bad)'; }
    };
    reader.readAsText(file);
  });

  /* Reset all */
  $('#resetBtn2') && $('#resetBtn2').addEventListener('click', () => {
    if (!confirm('Clear ALL saved data on this device? This cannot be undone.')) return;
    [...LS.keys('checks:'), ...LS.keys('tracker:'), ...LS.keys('goal:'), ...LS.keys('spend:'), ...LS.keys('notes:')].forEach(k => LS.remove(k));
    ['balancelog','lastUpdated'].forEach(k => LS.remove(k));
    location.reload();
  });

  /* Balance log entry */
  const logBtn = $('#logEntryBtn');
  logBtn && logBtn.addEventListener('click', () => {
    const entry = {
      date:           $('#log-date').value,
      danielVisa:     parseFloat($('#log-daniel-visa').value) || 0,
      danielVehicle:  parseFloat($('#log-daniel-vehicle').value) || 0,
      danielApple:    parseFloat($('#log-daniel-apple').value) || 0,
      soniaNW:        parseFloat($('#log-sonia-nw').value) || 0,
      soniaFamily:    parseFloat($('#log-sonia-family').value) || 0,
      soniaSavings:   parseFloat($('#log-sonia-savings').value) || 0,
      danielSavings:  parseFloat($('#log-daniel-savings').value) || 0,
    };
    // Also update the goal values so they're in sync
    setGoal('daniel-visa-balance',    entry.danielVisa);
    setGoal('daniel-vehicle-balance', entry.danielVehicle);
    setGoal('daniel-apple-balance',   entry.danielApple);
    setGoal('sonia-nw-balance',       entry.soniaNW);
    setGoal('sonia-family-balance',   entry.soniaFamily);
    setGoal('sonia-savings-balance',  entry.soniaSavings);
    setGoal('daniel-savings-balance', entry.danielSavings);
    const log = LS.get('balancelog', []);
    log.push(entry);
    LS.set('balancelog', log);
    touchLastUpdated();
    showToast('Snapshot saved ✓');
    const s = $('#logStatus');
    if (s) { s.textContent = `✅ Snapshot logged for ${entry.date}.`; s.style.color = 'var(--good)'; }
    // Re-render other panels with updated balances
    renderDashboard(); renderDaniel(); renderSonia(); renderHousehold();
    // Refresh the log history inside settings without full re-render
    setTimeout(() => renderSettings(), 300);
  });

  const clearLogBtn = $('#clearLogBtn');
  clearLogBtn && clearLogBtn.addEventListener('click', () => {
    if (!confirm('Clear all balance snapshot history?')) return;
    LS.remove('balancelog');
    renderSettings();
    showToast('Log cleared');
  });
}

/* ── Full re-render (called after goal changes) ── */
function renderAll() {
  renderDashboard();
  renderDaniel();
  renderSonia();
  renderHousehold();
  renderReview();
  refreshLastUpdated();
}

/* ═══════════════════════════════════════════════════════════
   6. UTILITIES
═══════════════════════════════════════════════════════════ */
function datestamp() { return new Date().toISOString().slice(0,10); }

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showToast(msg) {
  let t = document.getElementById('save-toast');
  if (!t) { t = Object.assign(document.createElement('div'), { id:'save-toast', className:'save-toast' }); document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

function refreshLastUpdated() {
  const el = $('#lastUpdatedDisplay');
  if (!el) return;
  const ts = LS.get('lastUpdated');
  if (ts) {
    const d = new Date(ts);
    el.textContent = `Saved ${d.toLocaleDateString()} ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;
  } else { el.textContent = ''; }
}

function touchLastUpdated() { LS.set('lastUpdated', new Date().toISOString()); refreshLastUpdated(); }

/* ═══════════════════════════════════════════════════════════
   7. PRIVACY TOGGLE
═══════════════════════════════════════════════════════════ */
function initPrivacyToggle() {
  const btn = $('#privacyBtn');
  if (!btn) return;
  applyPrivacy(LS.get('privacyMode', false), btn);
  btn.addEventListener('click', () => {
    const next = !document.body.classList.contains('privacy-mode');
    LS.set('privacyMode', next);
    applyPrivacy(next, btn);
  });
}
function applyPrivacy(on, btn) {
  document.body.classList.toggle('privacy-mode', on);
  btn.setAttribute('aria-pressed', String(on));
  const lbl = btn.querySelector('.btn-label');
  if (lbl) lbl.textContent = on ? 'Show $' : 'Hide $';
}

/* ═══════════════════════════════════════════════════════════
   8. TAB NAVIGATION
═══════════════════════════════════════════════════════════ */
function initTabs() {
  const tabs = $$('.tab');
  function activate(tab) {
    tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
    $$('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active'); tab.setAttribute('aria-selected','true');
    const target = $(`#${tab.dataset.target}`);
    if (target) target.classList.add('active');
  }
  tabs.forEach(tab => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', e => {
      const idx = tabs.indexOf(tab);
      if (e.key==='ArrowRight') { e.preventDefault(); tabs[(idx+1)%tabs.length].focus(); }
      if (e.key==='ArrowLeft')  { e.preventDefault(); tabs[(idx-1+tabs.length)%tabs.length].focus(); }
      if (e.key==='Home') { e.preventDefault(); tabs[0].focus(); }
      if (e.key==='End')  { e.preventDefault(); tabs[tabs.length-1].focus(); }
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   9. EVENT DELEGATION
═══════════════════════════════════════════════════════════ */
function initEvents() {

  /* ── Checklist checkboxes ── */
  document.addEventListener('change', e => {
    if (e.target.matches('input[type="checkbox"][data-list]')) {
      const { list, index } = e.target.dataset;
      const saved = LS.get(`checks:${list}`, {});
      saved[index] = e.target.checked;
      LS.set(`checks:${list}`, saved);
      e.target.closest('.check-row').classList.toggle('done', e.target.checked);
      touchLastUpdated();
      const boxes = $$(`input[data-list="${list}"]`);
      const done  = boxes.filter(b => b.checked).length;
      const sum   = $(`#${list}-summary`);
      if (sum) sum.textContent = `${done} of ${boxes.length} complete`;
    }

    /* ── Progress tracker inputs ── */
    if (e.target.matches('input[data-tracker-input]')) {
      const id  = e.target.dataset.trackerInput;
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val >= 0) {
        LS.set(`tracker:${id}`, val);
        touchLastUpdated();
        if ($('#dashboard').classList.contains('active')) renderDashboard();
      }
    }

    /* ── Goal inputs (Goals Editor + cap limit fields) ── */
    if (e.target.matches('input[data-goal]')) {
      const key = e.target.dataset.goal;
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) {
        setGoal(key, val);
        touchLastUpdated();
        showToast('Saved ✓');
        // Re-render all non-settings panels so values update live
        renderDashboard(); renderDaniel(); renderSonia(); renderHousehold();
      }
    }

    /* ── Spending cap "spent" inputs ── */
    if (e.target.matches('input[data-spend]')) {
      const [person, cat] = e.target.dataset.spend.split(':');
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val >= 0) {
        setSpent(person, cat, val);
        touchLastUpdated();
        showToast('Spending updated ✓');
        renderDashboard();
        if (person === 'daniel') renderDaniel();
        if (person === 'sonia')  renderSonia();
      }
    }
  });

  /* ── Payoff sliders (fire on drag) ── */
  document.addEventListener('input', e => {
    if (e.target.matches('input[type="range"][data-slider]')) {
      const id      = e.target.dataset.slider;
      const pmt     = parseFloat(e.target.value);
      const balance = goal(e.target.dataset.balance);
      const apr     = goal(e.target.dataset.apr);
      const minPmt  = goal(e.target.dataset.min);
      LS.set(`slider:${id}`, pmt);

      const n      = payoffMonths(balance, apr, pmt);
      const ti     = totalInterestPaid(balance, apr, pmt);
      const nMin   = payoffMonths(balance, apr, minPmt);
      const tiMin  = totalInterestPaid(balance, apr, minPmt);
      const saved  = Math.max(0, tiMin - ti);

      const valEl  = $(`#slider-val-${id}`);
      const mEl    = $(`#po-months-${id}`);
      const iEl    = $(`#po-interest-${id}`);
      const vEl    = $(`#po-vs-${id}`);

      if (valEl) valEl.textContent = money(pmt);
      if (mEl)   mEl.textContent   = isFinite(n) ? n : '∞';
      if (iEl)   iEl.textContent   = isFinite(ti) ? money(Math.round(ti)) : '∞';
      if (vEl)   vEl.innerHTML     = `vs. minimum only: ${isFinite(nMin)?nMin:'∞'} months · ${isFinite(tiMin)?money(Math.round(tiMin)):'∞'} interest · <strong class="private-value">You save ${money(Math.round(saved))}</strong>`;
    }
  });

  /* ── Paycheck notes ── */
  document.addEventListener('change', e => {
    if (e.target.matches('textarea[data-note]')) {
      LS.set(`notes:${e.target.dataset.note}`, e.target.value);
      touchLastUpdated();
    }
  });

  /* ── Reset spending month ── */
  document.addEventListener('click', e => {
    if (e.target.matches('[data-reset-spend]')) {
      const person = e.target.dataset.resetSpend;
      if (!confirm(`Reset all ${person}'s spending for ${monthLabel()}?`)) return;
      DATA.spendingCaps[person].forEach(c => LS.remove(spendKey(person, c.id)));
      showToast('Month reset ✓');
      renderDashboard();
      if (person === 'daniel') renderDaniel();
      if (person === 'sonia')  renderSonia();
    }
  });

  /* ── Header buttons ── */
  $('#printBtn').addEventListener('click', () => window.print());
  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all saved progress data on this device?')) return;
    [...LS.keys('checks:'), ...LS.keys('tracker:'), ...LS.keys('goal:'), ...LS.keys('spend:'), ...LS.keys('notes:')].forEach(k => LS.remove(k));
    ['balancelog','lastUpdated'].forEach(k => LS.remove(k));
    location.reload();
  });
}

/* ═══════════════════════════════════════════════════════════
   10. INIT
═══════════════════════════════════════════════════════════ */
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
