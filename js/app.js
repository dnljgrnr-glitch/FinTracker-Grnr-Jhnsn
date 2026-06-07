/**
 * GJ Financial · app.js v6
 * Full financial planning app — vanilla JS, no dependencies
 * Requires financeData.js (window.FINANCE_DATA)
 */
'use strict';

/* ═══════════════════════════════════════════════════════════
   1. SETUP
═══════════════════════════════════════════════════════════ */
const DATA = window.FINANCE_DATA;
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => typeof n === 'number'
  ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  : (n ?? '—');
const priv = v => `<span class="private-value">${money(v)}</span>`;

/* ═══════════════════════════════════════════════════════════
   2. STORAGE & GOAL SYSTEM
═══════════════════════════════════════════════════════════ */
const LS = {
  get:    (k, fb = null) => { try { const v = localStorage.getItem(k); return v === null ? fb : JSON.parse(v); } catch { return fb; } },
  set:    (k, v)         => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  remove: (k)            => { try { localStorage.removeItem(k); } catch {} },
  keys:   (p)            => { try { return Object.keys(localStorage).filter(k => k.startsWith(p)); } catch { return []; } },
};

// All editable amounts go through goal() — falls back to financeData defaults
const goal    = k => LS.get(`goal:${k}`, DATA.goalDefaults[k] ?? 0);
const setGoal = (k, v) => LS.set(`goal:${k}`, v);

// Spending caps (monthly, keyed by month)
const monthKey   = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
const monthLabel = () => new Date().toLocaleDateString('en-US', { month:'long', year:'numeric' });
const getSpent   = (person, cat) => Number(LS.get(`spend:${person}-${cat}-${monthKey()}`, 0));
const setSpent   = (person, cat, v) => LS.set(`spend:${person}-${cat}-${monthKey()}`, v);
const capLimit   = (person, cat) => goal(`cap-${person}-${cat}`);

/* ═══════════════════════════════════════════════════════════
   3. AUTH
═══════════════════════════════════════════════════════════ */
function auth() {
  const loginEl = $('#login');
  if (sessionStorage.getItem('gj-unlocked') === 'true') { loginEl.style.display = 'none'; return; }
  setTimeout(() => $('#passwordInput')?.focus(), 80);
  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    if ($('#passwordInput').value.trim() === DATA.password) {
      sessionStorage.setItem('gj-unlocked', 'true');
      loginEl.style.display = 'none';
    } else {
      const err = $('#loginError');
      err.textContent = 'Incorrect passcode.';
      $('#passwordInput').value = ''; $('#passwordInput').focus();
      setTimeout(() => { err.textContent = ''; }, 3500);
    }
  });
  $('#lockBtn').addEventListener('click', () => { sessionStorage.removeItem('gj-unlocked'); location.reload(); });
}

/* ═══════════════════════════════════════════════════════════
   4. MATH
═══════════════════════════════════════════════════════════ */
function payoffMonths(balance, aprPct, pmt) {
  const r = aprPct / 100 / 12;
  if (r <= 0 || pmt <= 0 || balance <= 0) return 0;
  if (pmt <= balance * r) return Infinity;
  return Math.ceil(-Math.log(1 - r * balance / pmt) / Math.log(1 + r));
}
function totalInterestPaid(balance, aprPct, pmt) {
  const n = payoffMonths(balance, aprPct, pmt);
  return isFinite(n) ? Math.max(0, n * pmt - balance) : Infinity;
}
function monthlyInterest(balance, aprPct) { return balance * aprPct / 100 / 12; }
function compoundGrowth(monthly, annualRate, years) {
  const r = annualRate / 100 / 12, n = years * 12;
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}
function danielShare() {
  const t = goal('household-rent') + goal('household-electric') + goal('household-internet') + goal('household-groceries');
  return Math.round(t * goal('household-split-daniel') / 100 * 100) / 100;
}
function soniaShare() {
  const t = goal('household-rent') + goal('household-electric') + goal('household-internet') + goal('household-groceries');
  return Math.round(t * (100 - goal('household-split-daniel')) / 100 * 100) / 100;
}
function totalDebt() {
  return goal('daniel-visa-balance') + goal('daniel-vehicle-balance') + goal('daniel-apple-balance') +
         goal('sonia-nw-balance') + goal('sonia-family-balance');
}
function totalSavings() { return goal('daniel-savings-balance') + goal('sonia-savings-balance'); }
function netWorth() { return totalSavings() - totalDebt(); }
function datestamp() { return new Date().toISOString().slice(0,10); }

/* ═══════════════════════════════════════════════════════════
   5. BUILDER HELPERS
═══════════════════════════════════════════════════════════ */
function table(headers, rows, opts = {}) {
  const ths = headers.map(h => `<th scope="col">${h}</th>`).join('');
  const trs = rows.map(r => `<tr>${r.map((c,i) => i===0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`).join('')}</tr>`).join('');
  return `<div class="table-wrap" tabindex="0" aria-label="${opts.label||'Table'}"><table>
    ${opts.caption ? `<caption class="sr-only">${opts.caption}</caption>` : ''}
    <thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
}
function card(title, body, span = 'span-6') {
  return `<div class="card ${span}"><h2>${title}</h2>${body}</div>`;
}
function proTip(text) { return `<div class="pro-tip"><strong>💡 Rule</strong>${text}</div>`; }
function notice(text) { return `<div class="notice"><strong>⚠️</strong> ${text}</div>`; }

function checklist(id, items) {
  const saved = LS.get(`checks:${id}`, {});
  const done  = items.filter((_, i) => saved[i]).length;
  return `<p class="checklist-summary" id="${id}-sum">${done} of ${items.length} complete</p>
  <div class="checklist" role="group">${items.map((item,i) => `
    <div class="check-row ${saved[i]?'done':''}">
      <input type="checkbox" id="${id}-${i}" data-list="${id}" data-index="${i}" ${saved[i]?'checked':''} />
      <label for="${id}-${i}">${item}</label>
    </div>`).join('')}</div>`;
}

/* ═══════════════════════════════════════════════════════════
   6. GOAL SLIDERS (the core progress UX)
   Debt sliders: drag right = more paid, remaining shrinks
   Savings sliders: drag right = more saved, approaches goal
═══════════════════════════════════════════════════════════ */
function goalSlider(id, label, icon, type = 'debt') {
  // type='debt': target = original balance, value = amount paid down
  // type='savings': target = savings goal, value = current saved
  const target  = Number(goal(type === 'debt'
    ? id.replace('-paid','-balance').replace('-paydown','')
    : id.replace('-saved','-target').replace('-savings','') ) || 0);
  const current = Number(LS.get(`gs:${id}`, 0));
  const pct     = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const remaining = Math.max(0, target - current);

  const statA = type === 'debt'
    ? `<div class="goal-stat"><span class="goal-stat-val paid private-value">${money(current)}</span><span class="goal-stat-lbl">Paid Down</span></div>`
    : `<div class="goal-stat"><span class="goal-stat-val saved private-value">${money(current)}</span><span class="goal-stat-lbl">Saved</span></div>`;
  const statB = type === 'debt'
    ? `<div class="goal-stat"><span class="goal-stat-val remaining private-value">${money(remaining)}</span><span class="goal-stat-lbl">Remaining</span></div>`
    : `<div class="goal-stat"><span class="goal-stat-val goal private-value">${money(remaining)}</span><span class="goal-stat-lbl">To Goal</span></div>`;

  return `
  <div class="goal-slider-wrap" data-gs="${id}" data-gs-type="${type}" data-gs-target="${target}">
    <div class="goal-slider-header">
      <span class="goal-slider-icon">${icon}</span>
      <span class="goal-slider-label">${label}</span>
      <span class="goal-slider-pct" id="gsp-${id}">${pct.toFixed(0)}%</span>
    </div>
    <div class="goal-slider-stats">${statA}${statB}</div>
    <div class="goal-slider-bar"><div class="goal-slider-fill${type==='debt'?' debt':''}" id="gsf-${id}" style="width:${pct}%"></div></div>
    <div class="goal-slider-input-row">
      <input type="range" min="0" max="${target}" step="${target > 5000 ? 50 : target > 500 ? 10 : 1}"
        value="${current}" data-gs-input="${id}"
        aria-label="${label} progress slider" aria-valuetext="${money(current)} of ${money(target)}" />
      <span class="goal-slider-num private-value" id="gsn-${id}">${money(current)}</span>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════
   7. SHARED COMPONENTS
═══════════════════════════════════════════════════════════ */
function renderMoveFundCountdown() {
  const target   = new Date('2026-07-10');
  const today    = new Date(); today.setHours(0,0,0,0);
  const daysLeft = Math.max(0, Math.ceil((target - today) / 86400000));
  const gsVal    = Number(LS.get('gs:move-fund', 0));
  const needed   = Math.max(0, goal('daniel-move-target') - gsVal);
  const perCheck = needed / Math.max(1, Math.ceil(daysLeft / 7));
  return `
  <div class="countdown-grid">
    <div class="countdown-stat">
      <span class="countdown-val ${daysLeft<14?'urgent':'ok'}">${daysLeft}</span>
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
  <p class="section-note" style="margin-top:8px">Target <strong>July 10, 2026</strong> · Goal <strong class="private-value">${money(goal('daniel-move-target'))}</strong></p>`;
}

function renderInterestSummary() {
  const vInt = monthlyInterest(goal('daniel-visa-balance'), goal('daniel-visa-apr'));
  const nInt = monthlyInterest(goal('sonia-nw-balance'),   goal('sonia-nw-apr'));
  const tot  = vInt + nInt;
  return `
  <div class="interest-row"><span>NFCU Visa</span><strong class="private-value">${money(Math.round(vInt))}/mo</strong></div>
  <div class="interest-row"><span>NW Loan</span><strong class="private-value">${money(Math.round(nInt))}/mo</strong></div>
  <div class="interest-total"><span>Total interest burning</span><strong class="private-value">${money(Math.round(tot))}/mo</strong></div>
  <p class="section-note" style="margin-top:8px">= <strong class="private-value">${money(Math.round(tot*12))}/year</strong> in pure interest. Every extra dollar toward principal cuts this.</p>`;
}

function renderSpendingCaps(person) {
  const caps = DATA.spendingCaps[person];
  return `
  <div class="cap-month-header">
    <span class="month-badge">${monthLabel()}</span>
    <button class="btn-ghost" style="font-size:.76rem;padding:4px 10px" data-reset-spend="${person}">Reset Month</button>
  </div>
  ${caps.map(c => {
    const spent = getSpent(person, c.id);
    const limit = capLimit(person, c.id);
    const pct   = limit > 0 ? Math.min(200, spent / limit * 100) : 0;
    const cls   = pct >= 100 ? 'over' : pct >= 75 ? 'warn' : '';
    const stCls = pct >= 100 ? 'over' : pct >= 75 ? 'warn' : 'ok';
    const stMsg = pct >= 100 ? `🔴 Over by ${money(spent-limit)}` : pct >= 75 ? `⚠️ ${money(limit-spent)} left` : `✓ ${money(limit-spent)} remaining`;
    return `
    <div class="cap-row">
      <div class="cap-row-header"><span class="cap-label">${c.label}</span><span class="cap-amounts private-value">${money(spent)} / ${money(limit)}</span></div>
      <div class="cap-bar"><div class="cap-fill ${cls}" style="width:${Math.min(100,pct)}%"></div></div>
      <div class="cap-input-row">
        <label>Spent this month<input type="number" step="0.01" min="0" value="${spent}" data-spend="${person}:${c.id}" /></label>
        <label>Monthly cap<input type="number" step="1" min="0" value="${limit}" data-goal="cap-${person}-${c.id}" /></label>
      </div>
      <p class="cap-status ${stCls}">${stMsg}</p>
    </div>`;
  }).join('')}`;
}

function renderSpendingMini(person) {
  return DATA.spendingCaps[person].map(c => {
    const spent = getSpent(person, c.id);
    const limit = capLimit(person, c.id);
    const pct   = limit > 0 ? Math.min(100, spent / limit * 100) : 0;
    const cls   = pct >= 100 ? 'over' : pct >= 75 ? 'warn' : '';
    return `<div class="spend-mini-row">
      <span class="spend-mini-label">${c.label}</span>
      <div class="spend-mini-bar"><div class="spend-mini-fill ${cls}" style="width:${pct}%"></div></div>
      <span class="spend-mini-pct">${pct.toFixed(0)}%</span>
    </div>`;
  }).join('');
}

function renderPayoffSlider(sliderId, balKey, aprKey, minKey, label) {
  const bal    = goal(balKey); const apr = goal(aprKey); const minP = goal(minKey);
  const maxP   = Math.ceil(minP * 3 / 50) * 50;
  const initP  = Math.max(minP, Math.min(maxP, LS.get(`slider:${sliderId}`, Math.round((minP + maxP * .4)/10)*10)));
  const n      = payoffMonths(bal, apr, initP);
  const ti     = totalInterestPaid(bal, apr, initP);
  const nMin   = payoffMonths(bal, apr, minP);
  const tiMin  = totalInterestPaid(bal, apr, minP);
  const saved  = Math.max(0, (isFinite(tiMin)?tiMin:0) - (isFinite(ti)?ti:0));
  return `
  <p class="section-note">Balance <strong class="private-value">${money(bal)}</strong> · APR <strong>${apr}%</strong></p>
  <div class="slider-section">
    <label>Monthly payment <span id="sv-${sliderId}" class="private-value">${money(initP)}</span></label>
    <input type="range" min="${minP}" max="${maxP}" step="10" value="${initP}"
      data-slider="${sliderId}" data-balance="${balKey}" data-apr="${aprKey}" data-min="${minKey}"
      aria-label="Monthly payment for ${label}" />
    <div class="slider-range-labels"><span class="private-value">${money(minP)} min</span><span class="private-value">${money(maxP)}</span></div>
  </div>
  <div class="payoff-output" id="po-${sliderId}">
    <div class="payoff-stat"><span class="payoff-stat-val good" id="pom-${sliderId}">${isFinite(n)?n:'∞'}</span><span class="payoff-stat-lbl">Months</span></div>
    <div class="payoff-stat"><span class="payoff-stat-val bad private-value" id="poi-${sliderId}">${isFinite(ti)?money(Math.round(ti)):'∞'}</span><span class="payoff-stat-lbl">Total Interest</span></div>
    <div class="payoff-vs-min" id="pov-${sliderId}">vs. minimum: ${isFinite(nMin)?nMin:'∞'} months · <strong class="private-value">save ${money(Math.round(saved))}</strong></div>
  </div>`;
}

function renderBalanceLog() {
  const log   = LS.get('balancelog', []);
  const today = datestamp();
  const formHtml = `
  <p class="section-note">Snapshot current balances to track real progress over time.</p>
  <div class="log-form-grid">
    <label>Daniel Visa<input type="number" step="0.01" id="log-dv" value="${goal('daniel-visa-balance')}" /></label>
    <label>Daniel Vehicle<input type="number" step="0.01" id="log-dveh" value="${goal('daniel-vehicle-balance')}" /></label>
    <label>Daniel Apple<input type="number" step="0.01" id="log-da" value="${goal('daniel-apple-balance')}" /></label>
    <label>Sonia NW Loan<input type="number" step="0.01" id="log-sn" value="${goal('sonia-nw-balance')}" /></label>
    <label>Sonia Family Debt<input type="number" step="0.01" id="log-sf" value="${goal('sonia-family-balance')}" /></label>
    <label>Sonia Savings<input type="number" step="0.01" id="log-ss" value="${goal('sonia-savings-balance')}" /></label>
    <label>Daniel Savings<input type="number" step="0.01" id="log-ds" value="${goal('daniel-savings-balance')}" /></label>
    <label>Date<input type="date" id="log-dt" value="${today}" /></label>
  </div>
  <button id="logEntryBtn" class="btn-primary">📋 Log Snapshot</button>
  <p id="logStatus" role="alert" style="font-size:.84rem;margin-top:6px"></p>`;

  let histHtml = '';
  if (log.length > 0) {
    const rows = [...log].reverse().slice(0,18).map((e, i) => {
      const prev  = log[log.length - 2 - i];
      const debt  = (e.dv||0)+(e.dveh||0)+(e.da||0)+(e.sn||0)+(e.sf||0);
      const sav   = (e.ds||0)+(e.ss||0);
      const nw    = sav - debt;
      const prevNW= prev ? ((prev.ds||0)+(prev.ss||0)) - ((prev.dv||0)+(prev.dveh||0)+(prev.da||0)+(prev.sn||0)+(prev.sf||0)) : null;
      const trend = prevNW !== null
        ? nw > prevNW ? `<span class="trend-up">↑${money(Math.round(nw-prevNW))}</span>`
        : nw < prevNW ? `<span class="trend-down">↓${money(Math.round(prevNW-nw))}</span>`
        : '<span class="trend-flat">—</span>' : '<span class="trend-flat">—</span>';
      return [e.dt||'—', `<span class="private-value">${money(e.dv)}</span>`, `<span class="private-value">${money(e.sn)}</span>`,
        `<span class="private-value">${money(sav)}</span>`,
        `<span class="private-value" style="color:${nw>=0?'var(--good-light)':'var(--bad-light)'};font-weight:700">${money(Math.round(nw))}</span>`, trend];
    });
    histHtml = `<div class="log-history-wrap">
      <p class="log-history-title">History</p>
      ${table(['Date','Visa','NW Loan','Savings','Net Worth','Δ'], rows, {label:'Balance history'})}
      <button id="clearLogBtn" class="btn-ghost" style="margin-top:8px;font-size:.78rem">Clear History</button>
    </div>`;
  }
  return formHtml + histHtml;
}

function renderGoalsEditor() {
  const f = (key, label, step = '0.01') =>
    `<div class="goal-field"><label>${label}<input type="number" step="${step}" value="${goal(key)}" data-goal="${key}" /></label></div>`;
  return `
  <p class="section-note">Every value here flows live through the entire app. No reload needed.</p>
  <div class="goals-section-title">Daniel — Debts</div>
  <div class="goal-grid">
    ${f('daniel-visa-balance','Visa Balance')}${f('daniel-visa-minimum','Visa Min Pmt')}
    ${f('daniel-visa-target-pmt','Visa Target Pmt')}${f('daniel-visa-apr','Visa APR %')}
    ${f('daniel-vehicle-balance','Vehicle Balance')}${f('daniel-vehicle-min','Vehicle Min')}
    ${f('daniel-apple-balance','Apple Card Balance')}${f('daniel-apple-min','Apple Min')}
  </div>
  <div class="goals-section-title">Daniel — Goals</div>
  <div class="goal-grid">
    ${f('daniel-move-target','Move Fund Target')}${f('daniel-savings-balance','Daniel Savings')}
    ${f('daniel-income','Monthly Income')}
  </div>
  <div class="goals-section-title">Sonia — Debts</div>
  <div class="goal-grid">
    ${f('sonia-nw-balance','NW Loan Balance')}${f('sonia-nw-minimum','NW Loan Min')}
    ${f('sonia-nw-apr','NW Loan APR %')}${f('sonia-family-balance','Family Debt')}
    ${f('sonia-family-payment','Family Pmt')}${f('sonia-apple-min','Apple Min')}
  </div>
  <div class="goals-section-title">Sonia — Goals</div>
  <div class="goal-grid">
    ${f('sonia-savings-target','Savings Goal')}${f('sonia-savings-balance','Current Savings')}
    ${f('sonia-income','Monthly Income')}
  </div>
  <div class="goals-section-title">Household</div>
  <div class="goal-grid">
    ${f('household-rent','Rent')}${f('household-electric','Electric')}
    ${f('household-internet','Internet')}${f('household-groceries','Groceries')}
    ${f('household-split-daniel',"Daniel Split %",'1')}
  </div>
  <div class="goals-section-title">Spending Caps — Daniel</div>
  <div class="goal-grid">
    ${f('cap-daniel-gas','Gas/Transport')}${f('cap-daniel-personal','Personal/Food')}
    ${f('cap-daniel-fastfood','Fast Food')}${f('cap-daniel-online','Online Shopping')}
  </div>
  <div class="goals-section-title">Spending Caps — Sonia</div>
  <div class="goal-grid">
    ${f('cap-sonia-beauty','Beauty/Personal')}${f('cap-sonia-fastfood','Fast Food')}
    ${f('cap-sonia-amazon','Amazon/Online')}${f('cap-sonia-applecash','Apple Cash')}
  </div>`;
}

/* ═══════════════════════════════════════════════════════════
   8. DASHBOARD
═══════════════════════════════════════════════════════════ */
function renderDashboard() {
  const nw    = netWorth();
  const debt  = totalDebt();
  const sav   = totalSavings();
  const dPct  = goal('household-split-daniel');

  $('#dashboard').innerHTML = `
  <!-- Hero metrics -->
  <div class="hero-grid" style="margin-bottom:var(--sp-md)">
    <div class="hero-stat">
      <span class="hero-val brand private-value">${money(goal('daniel-income')+goal('sonia-income'))}</span>
      <span class="hero-lbl">Combined Monthly Income</span>
    </div>
    <div class="hero-stat">
      <span class="hero-val bad private-value">${money(Math.round(debt))}</span>
      <span class="hero-lbl">Total Debt</span>
      <span class="hero-sub">↓ decreasing</span>
    </div>
    <div class="hero-stat">
      <span class="hero-val ${nw>=0?'good':'bad'} private-value">${money(Math.round(nw))}</span>
      <span class="hero-lbl">Est. Net Worth</span>
      <span class="hero-sub">${nw<0?'improving monthly':'positive'}</span>
    </div>
  </div>

  <div class="grid">

    ${card('Goal Progress', `
      ${goalSlider('move-fund',      'Move Fund Target',        '🏠', 'savings')}
      ${goalSlider('visa-paydown',   'NFCU Visa Payoff',        '💳', 'debt')}
      ${goalSlider('sonia-nw-paid',  'Sonia NW Loan Payoff',   '📋', 'debt')}
      ${goalSlider('sonia-savings',  'Sonia Emergency Savings', '🛟', 'savings')}
      ${goalSlider('family-paid',    'Family Debt Paid',        '🤝', 'debt')}
    `, 'span-6')}

    <div class="span-6">
      ${card('Move Fund Countdown', renderMoveFundCountdown(), 'span-12')}
      <div style="height:var(--sp-md)"></div>
      ${card('Monthly Interest Burn 🔥', renderInterestSummary(), 'span-12')}
    </div>

    ${card(`Daniel — Spending (${monthLabel()})`, renderSpendingMini('daniel'), 'span-6')}
    ${card(`Sonia — Spending (${monthLabel()})`,  renderSpendingMini('sonia'),  'span-6')}

    ${card('Operating Rule', proTip('Every paycheck is assigned before spending starts. No discretionary spending until bills, debt, and savings are covered.'), 'span-12')}

  </div>`;
}

/* ═══════════════════════════════════════════════════════════
   9. DANIEL (with sub-tabs)
═══════════════════════════════════════════════════════════ */
function renderDaniel() {
  const D    = DATA.daniel;
  const last = sessionStorage.getItem('subtab:daniel') || 'overview';
  const tabs = [
    { id:'overview',  label:'Overview'     },
    { id:'paychecks', label:'Paychecks'    },
    { id:'debt',      label:'Debt & Payoff'},
    { id:'spending',  label:'Spending'     },
    { id:'budget',    label:'Budget'       },
  ];

  const panels = {
    overview: `<div class="grid">
      <div class="span-12">
        <div class="person-header-card">
          <h2>Daniel J. Garner</h2>
          <p><span class="pill">${D.payFrequency}</span>
          <span class="pill warn">Visa: zero new charges</span>
          <span class="pill good">Move target: ${money(goal('daniel-move-target'))}</span>
          <span class="pill brand">EasyStart: matures Dec 2026</span></p>
          <p>Primary focus: build the move fund to ${money(goal('daniel-move-target'))} by July 10, keep Visa at zero new charges, and protect the EasyStart Certificate until December 2026.</p>
          ${notice('EasyStart Certificate <strong class="private-value">$2,137.75</strong> — do not touch before 12/06/2026.')}
        </div>
      </div>
      ${card('Key Metrics', `
        <div class="metric"><span>Monthly income</span><strong class="private-value">${money(goal('daniel-income'))}</strong></div>
        <div class="metric"><span>Visa balance</span><strong class="private-value bad">${money(goal('daniel-visa-balance'))}</strong></div>
        <div class="metric"><span>Vehicle balance</span><strong class="private-value">${money(goal('daniel-vehicle-balance'))}</strong></div>
        <div class="metric"><span>Monthly interest (Visa)</span><strong class="private-value bad">${money(Math.round(monthlyInterest(goal('daniel-visa-balance'),goal('daniel-visa-apr'))))}/mo</strong></div>
        <div class="metric"><span>Household share</span><strong class="private-value">${money(danielShare())}/mo</strong></div>
      `,'span-6')}
      ${card('Action Checklist', checklist('daniel', D.checklist), 'span-6')}
    </div>`,

    paychecks: `<div class="grid">
      ${card('Paycheck Allocation: June 5 – July 10', `
        <div class="table-wrap" tabindex="0">
          <table>
            <thead><tr><th>Date</th><th>Amount</th><th>Allocation</th><th>Notes</th></tr></thead>
            <tbody>${D.paychecks.map((r,i) => {
              const note = LS.get(`notes:daniel-${i}`, '');
              return `<tr><th scope="row">${r[0]}</th><td><strong class="private-value">${r[1]}</strong></td><td>${r[2]}</td>
              <td><div class="paycheck-note-wrap">
                <textarea rows="2" data-note="daniel-${i}" aria-label="Notes for ${r[0]}">${note}</textarea>
              </div></td></tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      `,'span-12')}
    </div>`,

    debt: `<div class="grid">
      ${card('Debt Snapshot', table(
        ['Debt','Balance','APR','Min / Target'],
        [
          ['NFCU Visa',    priv(goal('daniel-visa-balance')),    `${goal('daniel-visa-apr')}%`,     `${priv(goal('daniel-visa-minimum'))} / ${priv(goal('daniel-visa-target-pmt'))} target`],
          ['NFCU Vehicle', priv(goal('daniel-vehicle-balance')), `${goal('daniel-vehicle-apr')}%`,  priv(goal('daniel-vehicle-min'))],
          ['Apple Card',   priv(goal('daniel-apple-balance')),   'TBD',                             priv(goal('daniel-apple-min'))],
        ], { label:'Daniel debts' }
      ), 'span-6')}
      ${card('Visa Payoff Scenarios', table(
        ['Scenario','Payment','Timeline'],
        D.visaTimeline, { label:'Visa scenarios' }
      ), 'span-6')}
      ${card('Visa Payoff Calculator — Drag to Model Payments', renderPayoffSlider('daniel-visa','daniel-visa-balance','daniel-visa-apr','daniel-visa-minimum','Visa'), 'span-12')}
    </div>`,

    spending: `<div class="grid">
      ${card(`Spending Caps — ${monthLabel()}`, renderSpendingCaps('daniel'), 'span-12')}
    </div>`,

    budget: `<div class="grid">
      ${card('Post-Move Monthly Budget', table(
        ['Category','Amount'],
        [
          ['Shared household (59%)',     priv(danielShare())],
          ['Vehicle loan',               priv(goal('daniel-vehicle-min'))],
          ['Visa minimum',               priv(goal('daniel-visa-minimum'))],
          ['Extra Visa target',          priv(goal('daniel-visa-target-pmt'))],
          ['Progressive insurance',      priv(134)],
          ['Verizon',                    priv(120)],
          ['TruStage',                   priv(12.50)],
          ['Apple Card',                 priv(goal('daniel-apple-min'))],
          ['Claude + Netflix',           priv(30.73)],
          ['Gas / transport',            priv(goal('cap-daniel-gas'))],
          ['Personal / food / misc',     priv(goal('cap-daniel-personal'))],
          ['Emergency savings',          priv(100)],
        ], { label:'Daniel budget' }
      ), 'span-6')}
      ${card('Goal Slider — Visa Progress', goalSlider('visa-paydown','NFCU Visa Payoff','💳','debt'), 'span-6')}
    </div>`,
  };

  $('#daniel').innerHTML = buildSubTabs('daniel', tabs, last, panels);
}

/* ═══════════════════════════════════════════════════════════
   10. SONIA (with sub-tabs)
═══════════════════════════════════════════════════════════ */
function renderSonia() {
  const S    = DATA.sonia;
  const last = sessionStorage.getItem('subtab:sonia') || 'overview';
  const tabs = [
    { id:'overview',  label:'Overview'      },
    { id:'paychecks', label:'Paychecks'     },
    { id:'debt',      label:'Debt & Payoff' },
    { id:'spending',  label:'Spending'      },
    { id:'savings',   label:'Savings & Family'},
  ];

  const panels = {
    overview: `<div class="grid">
      <div class="span-12">
        <div class="person-header-card" style="border-top-color:var(--good)">
          <h2>Sonia A. Johnson</h2>
          <p><span class="pill">${S.payFrequency}</span>
          <span class="pill good">Savings first</span>
          <span class="pill warn">NW Loan ${goal('sonia-nw-apr')}% APR</span></p>
          <p>Priority: zero overdrafts → $1,000 emergency savings immediately → $${goal('sonia-savings-target').toLocaleString()} by month 6. NW loan at <strong class="private-value">${money(goal('sonia-nw-balance'))}</strong> — accelerate after savings goal is reached.</p>
        </div>
      </div>
      ${card('Key Metrics', `
        <div class="metric"><span>Monthly income</span><strong class="private-value">${money(goal('sonia-income'))}</strong></div>
        <div class="metric"><span>NW Loan balance</span><strong class="private-value bad">${money(goal('sonia-nw-balance'))}</strong></div>
        <div class="metric"><span>Monthly interest (NW Loan)</span><strong class="private-value bad">${money(Math.round(monthlyInterest(goal('sonia-nw-balance'),goal('sonia-nw-apr'))))}/mo</strong></div>
        <div class="metric"><span>Family debt</span><strong class="private-value">${money(goal('sonia-family-balance'))}</strong></div>
        <div class="metric"><span>Current savings</span><strong class="private-value good">${money(goal('sonia-savings-balance'))}</strong></div>
        <div class="metric"><span>Household share</span><strong class="private-value">${money(soniaShare())}/mo</strong></div>
      `,'span-6')}
      ${card('Action Checklist', checklist('sonia', S.checklist), 'span-6')}
    </div>`,

    paychecks: `<div class="grid">
      ${card('Next Paycheck Allocation', table(
        ['Use','Amount'],
        S.nextPaycheck.map(([a,b]) => [a, `<strong class="private-value">${b}</strong>`]),
        { label:'Sonia paycheck' }
      ), 'span-6')}
      ${card('Goal Slider — Savings Progress', goalSlider('sonia-savings','Emergency Savings','🛟','savings'), 'span-6')}
    </div>`,

    debt: `<div class="grid">
      ${card('Debt Snapshot', table(
        ['Debt','Balance','APR','Payment'],
        [
          ['NW Bank Loan',  priv(goal('sonia-nw-balance')),     `${goal('sonia-nw-apr')}%`, priv(goal('sonia-nw-minimum'))],
          ['Family Debt',   priv(goal('sonia-family-balance')), '0%',                       `${priv(goal('sonia-family-payment'))} → $300 mo 3+`],
          ['Apple Card',    '<em>TBD</em>',                     'TBD',                      priv(goal('sonia-apple-min'))],
        ], { label:'Sonia debts' }
      ), 'span-6')}
      ${card('NW Loan — Extra Payment Scenarios', `
        <p class="section-note">Balance <strong class="private-value">${money(goal('sonia-nw-balance'))}</strong> at <strong>${goal('sonia-nw-apr')}% APR</strong>. Min ${priv(goal('sonia-nw-minimum'))}/mo.</p>
        ${table(['Payment','Payoff','Est. Interest'], S.loanPayoff, { label:'NW loan options' })}
      `, 'span-6')}
      ${card('NW Loan Payoff Calculator — Drag to Model Payments', renderPayoffSlider('sonia-nw','sonia-nw-balance','sonia-nw-apr','sonia-nw-minimum','NW Loan'), 'span-12')}
    </div>`,

    spending: `<div class="grid">
      ${card(`Spending Caps — ${monthLabel()}`, renderSpendingCaps('sonia'), 'span-12')}
    </div>`,

    savings: `<div class="grid">
      ${card('Post-Move Monthly Budget', table(
        ['Category','Amount'],
        [
          ['Personal fixed bills',       priv(263.50)],
          ['Shared household (41%)',     priv(soniaShare())],
          ['Family debt months 1–2',     priv(goal('sonia-family-payment'))],
          ['Family debt month 3+',       priv(300)],
          ['Savings / sinking fund',     priv(270)],
          ['Gas',                        priv(120)],
          ['Beauty',                     priv(goal('cap-sonia-beauty'))],
          ['Fast food',                  priv(goal('cap-sonia-fastfood'))],
          ['Amazon',                     priv(goal('cap-sonia-amazon'))],
          ['Apple Cash',                 priv(goal('cap-sonia-applecash'))],
        ], { label:'Sonia budget' }
      ), 'span-6')}
      ${card('Apple Savings Targets', table(
        ['Milestone','Target'],
        S.savingsTargets.map(([a,b]) => [a, priv(b)]),
        { label:'Savings milestones' }
      ), 'span-6')}
      ${card('Family Debt Timeline', table(
        ['Milestone','Balance'],
        S.familyDebtTimeline.map(([a,b]) => [a, `<span class="private-value">${b}</span>`]),
        { label:'Family repayment' }
      ), 'span-6')}
      ${card('Family Repayment Message', `
        <p>Hey, I want to start paying you back consistently and make sure this is handled respectfully. After the move, I'm going to start at <strong>$200/month</strong> beginning with my first post-move paycheck. Starting month three I'll increase to <strong>$300/month</strong> and keep you updated so there's no confusion.</p>
        <p class="fine-print">Send as-is or in your own words.</p>
      `, 'span-6')}
    </div>`,
  };

  $('#sonia').innerHTML = buildSubTabs('sonia', tabs, last, panels);
}

/* ═══════════════════════════════════════════════════════════
   11. HOUSEHOLD
═══════════════════════════════════════════════════════════ */
function renderHousehold() {
  const H    = DATA.household;
  const dPct = goal('household-split-daniel');
  const sPct = 100 - dPct;
  const bills = [
    { label:'Rent',      key:'household-rent'      },
    { label:'Electric',  key:'household-electric'  },
    { label:'Internet',  key:'household-internet'  },
    { label:'Groceries', key:'household-groceries' },
  ];
  const splitRows = bills.map(b => {
    const amt = goal(b.key);
    const d   = Math.round(amt * dPct / 100 * 100)/100;
    const s   = Math.round(amt * sPct / 100 * 100)/100;
    return `<div class="split-row">
      <span>${b.label}</span>
      <div><input type="number" step="1" value="${amt}" data-goal="${b.key}" style="width:80px;padding:5px 6px;text-align:right" /></div>
      <span class="split-cell private-value">${money(d)}</span>
      <span class="split-cell private-value">${money(s)}</span>
    </div>`;
  }).join('');
  const nwRows = H.netWorth.map(r => [
    `Mo ${r[0]}`,
    `<span class="private-value">${r[1]}</span>`,
    `<span class="private-value">${r[2]}</span>`,
    `<span class="private-value">${r[3]}</span>`,
    r[4],
    `<span class="private-value">${r[5]}</span>`,
    `<span class="private-value">${r[6]}</span>`,
    `<span class="private-value" style="font-weight:700;color:${r[7].startsWith('-')?'var(--bad-light)':'var(--good-light)'}">${r[7]}</span>`,
  ]);

  $('#household').innerHTML = `<div class="grid">

    ${card('Live Bill Split Calculator', `
      <div class="split-row header"><span>Bill</span><span>Amount</span><span class="split-cell">Daniel (${dPct}%)</span><span class="split-cell">Sonia (${sPct}%)</span></div>
      ${splitRows}
      <div class="split-row" style="font-weight:700;border-top:2px solid var(--border);padding-top:10px;margin-top:6px">
        <span>Total</span>
        <span class="private-value">${money(bills.reduce((s,b)=>s+goal(b.key),0))}</span>
        <span class="split-cell private-value">${money(danielShare())}</span>
        <span class="split-cell private-value">${money(soniaShare())}</span>
      </div>
      <p class="section-note" style="margin-top:10px">Edit amounts above — splits recalculate live. Change the % in Settings → Goals.</p>
    `, 'span-6')}

    ${card('Debt Payoff Sequence', table(
      ['Priority','Action','Reason'],
      H.debtSequence, { label:'Payoff sequence' }
    ), 'span-6')}

    ${card('Net Worth Trajectory — Months 1–36', `
      <p class="section-note">Projection assumes plan is followed. Red = still in the hole, green = positive. This is a roadmap, not a guarantee.</p>
      ${table(['Mo','Visa','Vehicle','Family','NW Loan','Cash','Invest.','Net Worth'], nwRows, { label:'Net worth projection' })}
    `, 'span-12')}

  </div>`;
}

/* ═══════════════════════════════════════════════════════════
   12. PLANNING (replaces Review — sub-tabs)
═══════════════════════════════════════════════════════════ */
function renderPlanning() {
  const last = sessionStorage.getItem('subtab:planning') || 'roadmap';
  const tabs = [
    { id:'roadmap',   label:'Roadmap'        },
    { id:'investing', label:'Investing'       },
    { id:'quarterly', label:'Quarterly Check' },
    { id:'scenarios', label:'Scenarios'       },
  ];

  /* ── Roadmap ── */
  const milestones = [
    { label:'Emergency Fund: $1,000',     trackerKey:'sonia-savings',  goal: goal('sonia-savings-balance'),  target: 1000,                          icon:'🛟', est:'Immediate' },
    { label:'Move Fund: $1,950',          trackerKey:'move-fund',      goal: Number(LS.get('gs:move-fund',0)), target: goal('daniel-move-target'),  icon:'🏠', est:'July 10, 2026' },
    { label:'NW Loan Paid Off',           trackerKey:'sonia-nw-paid',  goal: Number(LS.get('gs:sonia-nw-paid',0)), target: goal('sonia-nw-balance'), icon:'📋', est:`~${payoffMonths(goal('sonia-nw-balance'),goal('sonia-nw-apr'),goal('sonia-nw-minimum'))} months at minimum` },
    { label:'Emergency Fund: $2,500',     trackerKey:'sonia-savings',  goal: goal('sonia-savings-balance'),  target: 2500,                          icon:'💰', est:'Month 6 target' },
    { label:'Visa Paid Off',              trackerKey:'visa-paydown',   goal: Number(LS.get('gs:visa-paydown',0)), target: goal('daniel-visa-balance'), icon:'💳', est:`~${payoffMonths(goal('daniel-visa-balance'),goal('daniel-visa-apr'),goal('daniel-visa-target-pmt'))} months at $${goal('daniel-visa-target-pmt')}/mo` },
    { label:'Family Debt Resolved',       trackerKey:'family-paid',    goal: Number(LS.get('gs:family-paid',0)), target: goal('sonia-family-balance'), icon:'🤝', est:'~34 months at $300/mo' },
    { label:'Vehicle Loan Paid Off',      trackerKey:null,             goal: 0,                              target: goal('daniel-vehicle-balance'), icon:'🚗', est:`~${payoffMonths(goal('daniel-vehicle-balance'),goal('daniel-vehicle-apr'),goal('daniel-vehicle-min'))} months at minimum` },
    { label:'Start Investing Regularly',  trackerKey:null,             goal: 0,                              target: 1,                              icon:'📈', est:'After Visa payoff + triggers met' },
  ];
  const roadmapHtml = milestones.map(m => {
    const pct   = m.target > 0 && m.target <= 1 ? 0 : Math.min(100, m.goal / m.target * 100);
    const done  = pct >= 100;
    const icon  = done ? '✅' : m.icon;
    return `<div class="roadmap-item">
      <span class="roadmap-icon">${icon}</span>
      <div class="roadmap-body">
        <div class="roadmap-label${done?' done':''}">${m.label}</div>
        <div class="roadmap-meta">${done ? 'Complete' : m.est}</div>
        ${!done && m.target > 1 ? `<div class="roadmap-bar"><div class="roadmap-fill" style="width:${pct}%"></div></div>` : ''}
      </div>
      ${!done && m.target > 1 ? `<div class="roadmap-bar-wrap"><div class="roadmap-pct">${pct.toFixed(0)}%</div></div>` : ''}
    </div>`;
  }).join('');

  /* ── Investing ── */
  const investCalc = () => {
    const monthly  = Number(LS.get('calc-monthly',  150));
    const rate     = Number(LS.get('calc-rate',     7));
    const years    = Number(LS.get('calc-years',    10));
    const end10    = compoundGrowth(monthly, rate, 10);
    const end20    = compoundGrowth(monthly, rate, 20);
    const end30    = compoundGrowth(monthly, rate, 30);
    const endVal   = compoundGrowth(monthly, rate, years);
    const contributed = monthly * years * 12;
    const growth   = endVal - contributed;
    return `
    <p class="section-note">Model what consistent investing looks like over time. Use this once triggers are met.</p>
    <div class="calc-inputs">
      <label>Monthly contribution<input type="number" step="25" min="0" value="${monthly}" id="calc-monthly" /></label>
      <label>Annual return %<input type="number" step="0.5" min="1" max="20" value="${rate}" id="calc-rate" /></label>
      <label>Years<input type="number" step="1" min="1" max="40" value="${years}" id="calc-years" /></label>
    </div>
    <div class="calc-result" id="calc-result">
      <div><span class="calc-result-val private-value">${money(Math.round(endVal))}</span><span class="calc-result-lbl">End Value</span></div>
      <div><span class="calc-result-val private-value" style="color:var(--muted)">${money(Math.round(contributed))}</span><span class="calc-result-lbl">You Contributed</span></div>
      <div><span class="calc-result-val private-value" style="color:var(--brand-light)">${money(Math.round(growth))}</span><span class="calc-result-lbl">Market Growth</span></div>
    </div>
    <div class="calc-projections">
      <div class="calc-proj-item"><span class="calc-proj-val private-value">${money(Math.round(end10))}</span><span class="calc-proj-lbl">At 10 years</span></div>
      <div class="calc-proj-item"><span class="calc-proj-val private-value">${money(Math.round(end20))}</span><span class="calc-proj-lbl">At 20 years</span></div>
      <div class="calc-proj-item"><span class="calc-proj-val private-value">${money(Math.round(end30))}</span><span class="calc-proj-lbl">At 30 years</span></div>
      <div class="calc-proj-item"><span class="calc-proj-val private-value" style="font-size:.85rem;color:var(--muted)">${money(monthly * 12)}/yr</span><span class="calc-proj-lbl">Annual contribution</span></div>
    </div>`;
  };

  const investTriggers = [
    ['Daniel',    'Visa paid off · $1,000+ emergency fund · no new card charges 90 days',                            '$50–$150/mo'],
    ['Sonia',     '$2,500 emergency fund · no overdrafts 90 days · family debt below $5,000 · NW loan current/paid', '$50–$150/mo'],
    ['Household', 'Both current · shared bills stable · no surprise old-address bills',                               'Review quarterly'],
  ];

  /* ── Quarterly ── */
  const qItems = [
    'Overdrafts: $0.',
    'Daniel NFCU Visa: $0 new charges.',
    'Daniel Visa balance fell each month.',
    'Sonia family debt payment made every month.',
    'Sonia NW loan current or accelerated.',
    'Emergency savings increased.',
    'Shared bills split at correct %.',
    'Subscriptions stayed flat.',
    'Spending caps respected.',
    'Net worth improved quarter over quarter.',
    'All old-address bills closed out.',
    'Investing only after trigger list is satisfied.',
  ];

  /* ── Scenarios ── */
  const scenRows = [
    ['Conservative', 'Daniel $600/mo to Visa · Sonia follows family plan · extra cash builds reserves', 'Safer, slower'],
    ['Balanced ✓',   'Daniel $700/mo to Visa · Sonia saves to $2,500 · family debt on schedule',        'Recommended'],
    ['Aggressive',   'Daniel $800–$900/mo to Visa · Sonia adds extra to NW loan after month 6',         'Fastest, higher risk'],
  ];

  const panels = {
    roadmap:   `<div class="grid">${card('Financial Roadmap',  roadmapHtml,                                                                                                                               'span-12')}</div>`,
    investing: `<div class="grid">
                  ${card('Compound Growth Calculator 📈', investCalc(), 'span-12')}
                  ${card('Investment Trigger Checklist', checklist('invest-triggers', ['Daniel: Visa paid off.','Daniel: $1,000+ emergency fund.','Daniel: No new card charges for 90 days.','Sonia: $2,500 emergency fund.','Sonia: No overdrafts for 90 days.','Sonia: Family debt below $5,000.','Sonia: NW loan current or paid.','Household: Both current, shared bills stable.']), 'span-6')}
                  ${card('When to Start', table(['Person','Condition','Amount'], investTriggers, {label:'Triggers'}), 'span-6')}
                </div>`,
    quarterly: `<div class="grid">${card('Quarterly Review Checklist', checklist('quarterly', qItems), 'span-12')}</div>`,
    scenarios: `<div class="grid">${card('Plan Scenarios', table(['Scenario','Action','Outcome'], scenRows, {label:'Scenarios'}), 'span-12')}</div>`,
  };

  $('#planning').innerHTML = buildSubTabs('planning', tabs, last, panels);
}

/* ═══════════════════════════════════════════════════════════
   13. SUB-TAB BUILDER & CONTROLLER
═══════════════════════════════════════════════════════════ */
function buildSubTabs(group, tabs, activeId, panels) {
  const nav = `<nav class="sub-tabs" role="tablist" aria-label="${group} sections">
    ${tabs.map(t => `<button class="sub-tab${t.id===activeId?' active':''}"
      role="tab" aria-selected="${t.id===activeId}"
      data-subtab="${t.id}" data-subtab-group="${group}">${t.label}</button>`).join('')}
  </nav>`;
  const content = tabs.map(t =>
    `<div id="sp-${group}-${t.id}" class="sub-panel${t.id===activeId?' active':''}" role="tabpanel">${panels[t.id]||''}</div>`
  ).join('');
  return nav + content;
}

function initSubTabs() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.sub-tab');
    if (!btn) return;
    const group = btn.dataset.subtabGroup;
    const id    = btn.dataset.subtab;
    // Deactivate all tabs in this group
    $$(`[data-subtab-group="${group}"].sub-tab`).forEach(b => {
      b.classList.remove('active'); b.setAttribute('aria-selected','false');
    });
    // Deactivate all panels in this group
    $$(`[id^="sp-${group}-"]`).forEach(p => p.classList.remove('active'));
    // Activate clicked tab and its panel
    btn.classList.add('active'); btn.setAttribute('aria-selected','true');
    document.getElementById(`sp-${group}-${id}`)?.classList.add('active');
    sessionStorage.setItem(`subtab:${group}`, id);
  });
}

/* ═══════════════════════════════════════════════════════════
   14. SETTINGS
═══════════════════════════════════════════════════════════ */
function renderSettings() {
  $('#settings').innerHTML = `<div class="grid">

    ${card('Goals & Limits — Live Editor', renderGoalsEditor(), 'span-12')}

    ${card('Monthly Balance Snapshot', renderBalanceLog(), 'span-12')}

    ${card('Export Progress', `
      <p class="section-note">Download a backup of all tracker values, spending, checklist states, and balance history.</p>
      <div class="btn-group">
        <button id="exportJsonBtn" class="btn-primary">Export JSON</button>
        <button id="exportCsvBtn"  class="btn-secondary">Export CSV</button>
      </div>
      <pre id="exportOut" class="callout" style="margin-top:12px;display:none"></pre>
    `, 'span-6')}

    ${card('Import Progress', `
      <p class="section-note">Restore a backup on a new device.</p>
      <div class="field-group" style="margin-top:8px">
        <label for="importFile">Select JSON export file</label>
        <input type="file" id="importFile" accept=".json" />
      </div>
      <button id="importBtn" class="btn-primary" style="margin-top:8px">Import & Restore</button>
      <p id="importStatus" role="alert" style="margin-top:8px;font-size:.84rem"></p>
    `, 'span-6')}

    ${card('Security', `
      ${notice('Passcode is client-side only — not bank-grade security. Use a private GitHub repository. Never store account numbers, SSNs, or credentials here.')}
      <p>All data stays on this device in localStorage. Nothing is transmitted.</p>
    `, 'span-6')}

    ${card('Reset All Data', `
      <p class="section-note">Permanently clears everything saved on this device.</p>
      <button id="resetBtn2" class="btn-danger" style="margin-top:8px">Reset Everything</button>
    `, 'span-6')}

  </div>`;
  bindSettingsEvents();
}

function bindSettingsEvents() {
  const allLSKeys = () => [...LS.keys('goal:'), ...LS.keys('gs:'), ...LS.keys('tracker:'), ...LS.keys('checks:'), ...LS.keys('spend:'), ...LS.keys('slider:'), ...LS.keys('notes:')];

  $('#exportJsonBtn')?.addEventListener('click', () => {
    const out = {};
    allLSKeys().forEach(k => { out[k] = LS.get(k); });
    out['balancelog'] = LS.get('balancelog'); out['lastUpdated'] = LS.get('lastUpdated');
    const json = JSON.stringify(out, null, 2);
    downloadFile(`gj-progress-${datestamp()}.json`, json, 'application/json');
    const pre = $('#exportOut'); pre.textContent = json; pre.style.display = 'block';
  });

  $('#exportCsvBtn')?.addEventListener('click', () => {
    const now = new Date().toISOString();
    const rows = [['Key','Value','ExportedAt']];
    allLSKeys().forEach(k => rows.push([k, LS.get(k), now]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    downloadFile(`gj-progress-${datestamp()}.csv`, csv, 'text/csv');
  });

  $('#importBtn')?.addEventListener('click', () => {
    const file = $('#importFile')?.files[0];
    const stat = $('#importStatus');
    if (!file) { stat.textContent = '⚠️ Select a file first.'; return; }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const imp = JSON.parse(e.target.result); let n = 0;
        Object.entries(imp).forEach(([k,v]) => {
          if (['balancelog','lastUpdated'].includes(k) ||
              ['goal:','gs:','tracker:','checks:','spend:','slider:','notes:'].some(p => k.startsWith(p))) {
            LS.set(k,v); n++;
          }
        });
        stat.textContent = `✅ Imported ${n} items. Reloading…`; stat.style.color = 'var(--good-light)';
        setTimeout(() => location.reload(), 1200);
      } catch { stat.textContent = '❌ Invalid file.'; stat.style.color = 'var(--bad-light)'; }
    };
    reader.readAsText(file);
  });

  $('#resetBtn2')?.addEventListener('click', () => {
    if (!confirm('Clear ALL saved data on this device? Cannot be undone.')) return;
    allLSKeys().forEach(k => LS.remove(k));
    ['balancelog','lastUpdated'].forEach(k => LS.remove(k));
    location.reload();
  });

  $('#logEntryBtn')?.addEventListener('click', () => {
    const entry = {
      dt:   $('#log-dt')?.value   || datestamp(),
      dv:   parseFloat($('#log-dv')?.value)   || 0,
      dveh: parseFloat($('#log-dveh')?.value) || 0,
      da:   parseFloat($('#log-da')?.value)   || 0,
      sn:   parseFloat($('#log-sn')?.value)   || 0,
      sf:   parseFloat($('#log-sf')?.value)   || 0,
      ss:   parseFloat($('#log-ss')?.value)   || 0,
      ds:   parseFloat($('#log-ds')?.value)   || 0,
    };
    setGoal('daniel-visa-balance',    entry.dv);
    setGoal('daniel-vehicle-balance', entry.dveh);
    setGoal('daniel-apple-balance',   entry.da);
    setGoal('sonia-nw-balance',       entry.sn);
    setGoal('sonia-family-balance',   entry.sf);
    setGoal('sonia-savings-balance',  entry.ss);
    setGoal('daniel-savings-balance', entry.ds);
    const log = LS.get('balancelog', []); log.push(entry); LS.set('balancelog', log);
    touchLastUpdated(); showToast('Snapshot saved ✓');
    const s = $('#logStatus');
    if (s) { s.textContent = `✅ Saved for ${entry.dt}`; s.style.color = 'var(--good-light)'; }
    renderAll(); setTimeout(() => renderSettings(), 400);
  });

  $('#clearLogBtn')?.addEventListener('click', () => {
    if (!confirm('Clear all balance history?')) return;
    LS.remove('balancelog'); renderSettings(); showToast('Log cleared');
  });
}

/* ═══════════════════════════════════════════════════════════
   15. MAIN TABS
═══════════════════════════════════════════════════════════ */
function initTabs() {
  const tabs = $$('.tab');
  function activate(tab) {
    tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
    $$('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active'); tab.setAttribute('aria-selected','true');
    $(`#${tab.dataset.target}`)?.classList.add('active');
  }
  tabs.forEach(tab => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', e => {
      const i = tabs.indexOf(tab);
      if (e.key === 'ArrowRight') { e.preventDefault(); tabs[(i+1)%tabs.length].focus(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); tabs[(i-1+tabs.length)%tabs.length].focus(); }
      if (e.key === 'Home') { e.preventDefault(); tabs[0].focus(); }
      if (e.key === 'End')  { e.preventDefault(); tabs[tabs.length-1].focus(); }
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   16. GLOBAL EVENTS
═══════════════════════════════════════════════════════════ */
function initEvents() {

  /* Checklists */
  document.addEventListener('change', e => {
    if (e.target.matches('input[type="checkbox"][data-list]')) {
      const { list, index } = e.target.dataset;
      const saved = LS.get(`checks:${list}`, {}); saved[index] = e.target.checked;
      LS.set(`checks:${list}`, saved);
      e.target.closest('.check-row').classList.toggle('done', e.target.checked);
      touchLastUpdated();
      const boxes = $$(`input[data-list="${list}"]`);
      const done  = boxes.filter(b => b.checked).length;
      const sum   = $(`#${list}-sum`); if (sum) sum.textContent = `${done} of ${boxes.length} complete`;
    }

    /* Goal inputs — Goals Editor, caps, bill split amounts */
    if (e.target.matches('input[data-goal]')) {
      const key = e.target.dataset.goal;
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) { setGoal(key, val); touchLastUpdated(); showToast('Saved ✓'); renderAll(); }
    }

    /* Spending "spent" inputs */
    if (e.target.matches('input[data-spend]')) {
      const [person, cat] = e.target.dataset.spend.split(':');
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val >= 0) { setSpent(person, cat, val); touchLastUpdated(); showToast('Updated ✓'); renderAll(); }
    }

    /* Paycheck notes */
    if (e.target.matches('textarea[data-note]')) {
      LS.set(`notes:${e.target.dataset.note}`, e.target.value); touchLastUpdated();
    }

    /* Compound calculator inputs */
    if (['calc-monthly','calc-rate','calc-years'].includes(e.target.id)) {
      LS.set(e.target.id, parseFloat(e.target.value));
      renderPlanning();
    }
  });

  /* Goal sliders and payoff sliders — live drag */
  document.addEventListener('input', e => {

    /* Goal sliders (debt paydown / savings progress) */
    if (e.target.matches('input[data-gs-input]')) {
      const id      = e.target.dataset.gsInput;
      const val     = parseFloat(e.target.value);
      const wrap    = e.target.closest('[data-gs]');
      const target  = parseFloat(wrap?.dataset.gsTarget || 0);
      LS.set(`gs:${id}`, val);
      touchLastUpdated();
      const pct       = target > 0 ? Math.min(100, val / target * 100) : 0;
      const remaining = Math.max(0, target - val);
      const pctEl  = $(`#gsp-${id}`);    if (pctEl)  pctEl.textContent  = `${pct.toFixed(0)}%`;
      const fillEl = $(`#gsf-${id}`);    if (fillEl) fillEl.style.width  = `${pct}%`;
      const numEl  = $(`#gsn-${id}`);    if (numEl)  numEl.textContent   = money(val);
      const stats  = $$('.goal-stat-val', wrap);
      if (stats[0]) stats[0].textContent = money(val);
      if (stats[1]) stats[1].textContent = money(remaining);
      // Update aria
      e.target.setAttribute('aria-valuetext', `${money(val)} of ${money(target)}`);
      // Refresh dashboard hero + interest (non-intrusive)
      if ($('#dashboard').classList.contains('active')) renderDashboard();
    }

    /* Payoff sliders */
    if (e.target.matches('input[type="range"][data-slider]')) {
      const id  = e.target.dataset.slider;
      const pmt = parseFloat(e.target.value);
      const bal = goal(e.target.dataset.balance);
      const apr = goal(e.target.dataset.apr);
      const min = goal(e.target.dataset.min);
      LS.set(`slider:${id}`, pmt);
      const n   = payoffMonths(bal, apr, pmt);
      const ti  = totalInterestPaid(bal, apr, pmt);
      const nM  = payoffMonths(bal, apr, min);
      const tM  = totalInterestPaid(bal, apr, min);
      const sv  = Math.max(0, (isFinite(tM)?tM:0) - (isFinite(ti)?ti:0));
      const svEl = $(`#sv-${id}`);  if (svEl) svEl.textContent = money(pmt);
      const mEl  = $(`#pom-${id}`); if (mEl)  mEl.textContent  = isFinite(n) ? n : '∞';
      const iEl  = $(`#poi-${id}`); if (iEl)  iEl.textContent  = isFinite(ti) ? money(Math.round(ti)) : '∞';
      const vEl  = $(`#pov-${id}`); if (vEl)  vEl.innerHTML    =
        `vs. minimum: ${isFinite(nM)?nM:'∞'} months · <strong class="private-value">save ${money(Math.round(sv))}</strong>`;
    }
  });

  /* Reset spending month */
  document.addEventListener('click', e => {
    if (e.target.matches('[data-reset-spend]')) {
      const person = e.target.dataset.resetSpend;
      if (!confirm(`Reset ${person}'s spending for ${monthLabel()}?`)) return;
      DATA.spendingCaps[person].forEach(c => LS.remove(`spend:${person}-${c.id}-${monthKey()}`));
      showToast('Month reset ✓'); renderAll();
    }
  });

  /* Header buttons */
  $('#printBtn')?.addEventListener('click', () => window.print());
  $('#resetBtn')?.addEventListener('click', () => {
    if (!confirm('Clear all saved data on this device?')) return;
    [...LS.keys('goal:'),...LS.keys('gs:'),...LS.keys('tracker:'),...LS.keys('checks:'),...LS.keys('spend:'),...LS.keys('slider:'),...LS.keys('notes:')].forEach(k => LS.remove(k));
    ['balancelog','lastUpdated'].forEach(k => LS.remove(k));
    location.reload();
  });
}

/* ═══════════════════════════════════════════════════════════
   17. UTILITIES
═══════════════════════════════════════════════════════════ */
function downloadFile(name, content, type) {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([content], { type })),
    download: name,
  });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function showToast(msg) {
  let t = document.getElementById('gj-toast');
  if (!t) {
    t = Object.assign(document.createElement('div'), { id:'gj-toast', className:'save-toast' });
    document.body.appendChild(t);
  }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2000);
}

function refreshLastUpdated() {
  const el = $('#lastUpdatedDisplay'); if (!el) return;
  const ts = LS.get('lastUpdated');
  if (ts) {
    const d = new Date(ts);
    el.textContent = `Saved ${d.toLocaleDateString()} ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;
  } else { el.textContent = ''; }
}

function touchLastUpdated() { LS.set('lastUpdated', new Date().toISOString()); refreshLastUpdated(); }

function renderAll() {
  renderDashboard(); renderDaniel(); renderSonia();
  renderHousehold(); renderPlanning();
  refreshLastUpdated();
}

/* ═══════════════════════════════════════════════════════════
   18. PRIVACY TOGGLE
═══════════════════════════════════════════════════════════ */
function initPrivacyToggle() {
  const btn = $('#privacyBtn'); if (!btn) return;
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
   19. INIT
═══════════════════════════════════════════════════════════ */
function init() {
  auth();
  renderDashboard();
  renderDaniel();
  renderSonia();
  renderHousehold();
  renderPlanning();
  renderSettings();
  initTabs();
  initSubTabs();
  initEvents();
  initPrivacyToggle();
  refreshLastUpdated();
}

init();
