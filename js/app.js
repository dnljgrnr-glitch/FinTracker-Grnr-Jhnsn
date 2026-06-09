/**
 * Garner-Johnson Financial Tracker · app.js
 * Vanilla JS — no dependencies — GitHub Pages compatible
 * Requires: financeData.js loaded first (window.FINANCE_DATA)
 */

'use strict';

/* ─── Globals ─────────────────────────────────────────── */
const DATA = window.FINANCE_DATA;

// Short selector helpers
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// Currency formatter
const money = n =>
  typeof n === 'number'
    ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    : (n ?? '—');

// Wrap a money value in a span that privacy-mode can blur
const priv = (val) => `<span class="private-value">${money(val)}</span>`;

/* ─── LocalStorage helpers ────────────────────────────── */
const LS = {
  get:    (k, fallback = null) => { try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set:    (k, v)              => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota / private mode */ } },
  remove: (k)                 => { try { localStorage.removeItem(k); } catch {} },
  keys:   (prefix)            => { try { return Object.keys(localStorage).filter(k => k.startsWith(prefix)); } catch { return []; } },
};

/* ─── Auth ────────────────────────────────────────────── */
function auth() {
  const loginEl = $('#login');

  // Already unlocked this session
  if (sessionStorage.getItem('financeUnlocked') === 'true') {
    loginEl.style.display = 'none';
    return;
  }

  // Focus passcode input after small delay (overlay is visible)
  setTimeout(() => $('#passwordInput').focus(), 80);

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
      // Clear error after 4 s
      setTimeout(() => { err.textContent = ''; }, 4000);
    }
  });

  $('#lockBtn').addEventListener('click', () => {
    sessionStorage.removeItem('financeUnlocked');
    location.reload();
  });
}

/* ─── Builder helpers ─────────────────────────────────── */

/** Responsive scrollable table */
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

/** Card wrapper */
function card(title, body, span = 'span-6') {
  return `<div class="card ${span}"><h2>${title}</h2>${body}</div>`;
}

/** Callout / tip block */
function proTip(text) {
  return `<div class="pro-tip"><strong>💡 Key Rule</strong>${text}</div>`;
}

/** Notice / warning block */
function notice(text) {
  return `<div class="notice"><strong>⚠️ Note</strong>${text}</div>`;
}

/* ─── Progress tracker ────────────────────────────────── */

/**
 * Renders a progress bar + editable input bound to localStorage.
 * @param {string} id        - unique storage key
 * @param {string} label     - display name
 * @param {number} fallback  - default starting value
 * @param {number} target    - goal value
 */
function tracker(id, label, fallback, target) {
  const current = Number(LS.get(`tracker:${id}`, fallback));
  const pct = Math.max(0, Math.min(100, (current / target) * 100)).toFixed(1);
  const fillClass = pct >= 100 ? 'full' : pct >= 60 ? '' : pct >= 30 ? 'warn' : 'bad';

  return `
  <div class="progress-wrap" data-tracker="${id}" data-target="${target}" data-fallback="${fallback}">
    <div class="progress-header">
      <span class="progress-label-text">${label}</span>
      <span class="progress-amounts private-value">${money(current)} / ${money(target)}</span>
      <span class="progress-pct" aria-label="${pct}% complete">${pct}%</span>
    </div>
    <div class="progress-bar" role="progressbar" aria-valuenow="${current}" aria-valuemin="0" aria-valuemax="${target}" aria-label="${label}">
      <div class="progress-fill ${fillClass}" style="width:${pct}%"></div>
    </div>
    <div class="tracker-row">
      <label>
        Update balance
        <input type="number" step="0.01" min="0" value="${current}"
          aria-label="Current value for ${label}"
          data-tracker-input="${id}" />
      </label>
      <label>
        Target
        <input type="number" value="${target}" disabled
          aria-label="Target value for ${label}" />
      </label>
    </div>
  </div>`;
}

/* ─── Checklist ───────────────────────────────────────── */
function checklist(id, items) {
  const saved = LS.get(`checks:${id}`, {});
  const doneCount = items.filter((_, i) => saved[i]).length;
  const rows = items.map((item, i) => {
    const checked = saved[i] ? 'checked' : '';
    const doneClass = saved[i] ? 'done' : '';
    return `
    <div class="check-row ${doneClass}">
      <input type="checkbox" id="${id}-${i}"
        data-list="${id}" data-index="${i}" ${checked}
        aria-describedby="${id}-label-${i}" />
      <label for="${id}-${i}" id="${id}-label-${i}">${item}</label>
    </div>`;
  }).join('');

  return `
  <p class="checklist-summary" aria-live="polite" id="${id}-summary">
    ${doneCount} of ${items.length} complete
  </p>
  <div class="checklist" role="group" aria-label="${id} checklist">${rows}</div>`;
}

/* ─── Debt snapshot rows ──────────────────────────────── */
function debtRows(person) {
  return person.debts.map(d => [
    d.name,
    d.balance ? priv(d.balance) : '<em>TBD</em>',
    d.apr,
    d.targetPayment
      ? `${priv(d.minimum)} min / ${priv(d.targetPayment)} target`
      : d.targetPaymentMonth3
        ? `${priv(d.minimum)} → ${priv(d.targetPaymentMonth3)} (mo 3+)`
        : priv(d.minimum),
  ]);
}

/* ─── lastUpdated display ─────────────────────────────── */
function refreshLastUpdated() {
  const ts = LS.get('lastUpdated', null);
  const el = $('#lastUpdatedDisplay');
  if (!el) return;
  if (ts) {
    const d = new Date(ts);
    el.textContent = `Saved ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    el.textContent = '';
  }
}

function touchLastUpdated() {
  LS.set('lastUpdated', new Date().toISOString());
  refreshLastUpdated();
}

/* ─── Render sections ─────────────────────────────────── */

function renderDashboard() {
  const D = DATA.daniel;
  const S = DATA.sonia;
  const H = DATA.household;

  $('#dashboard').innerHTML = `<div class="grid">

    ${card('Household Snapshot', `
      <div class="metric">
        <span>Combined monthly income</span>
        <strong class="private-value">${money(H.incomeMonthly)}</strong>
      </div>
      <div class="metric">
        <span>Shared bill split</span>
        <strong>Daniel 59% · Sonia 41%</strong>
      </div>
      <div class="metric">
        <span>Total shared bills</span>
        <strong class="private-value">$1,300/mo</strong>
      </div>
      <div class="metric">
        <span>Daniel share</span>
        <strong class="private-value">$768/mo</strong>
      </div>
      <div class="metric">
        <span>Sonia share</span>
        <strong class="private-value">$534/mo</strong>
      </div>
      <div class="metric">
        <span>Move fund target</span>
        <strong class="private-value">$1,950 by July 10</strong>
      </div>
    `, 'span-6')}

    ${card('Live Progress Trackers', `
      ${tracker('daniel-move-fund',  'Daniel — Move Fund',         0,       1950)}
      ${tracker('daniel-visa-paid',  'Daniel — Visa Paid Down',    0,       9315.95)}
      ${tracker('sonia-savings',     'Sonia — Apple Savings',      900,     2500)}
      ${tracker('sonia-family-paid', 'Sonia — Family Debt Paid',   0,       10000)}
      ${tracker('sonia-nw-paid',     'Sonia — Northwest Loan Paid',0,       2266.02)}
    `, 'span-6')}

    ${card('Operating Rule', proTip(
      'No discretionary spending happens until bills, debt payments, and savings are assigned for the pay cycle. ' +
      'Every paycheck gets a job <em>before</em> it hits the account.'
    ), 'span-12')}

  </div>`;
}

function renderDaniel() {
  const D = DATA.daniel;

  const paychecks = D.paychecks.map(r => [r[0], `<strong class="private-value">${r[1]}</strong>`, r[2]]);
  const budget    = D.budget.map(([a, b]) => [a, priv(b)]);

  $('#daniel').innerHTML = `<div class="grid">

    ${card('Daniel', `
      <p>
        <span class="pill">${D.payFrequency}</span>
        <span class="pill warn">NFCU Visa priority</span>
        <span class="pill good">Move target: $1,950</span>
      </p>
      <p>Primary rule: keep NFCU Visa at zero new charges and build the move fund to $1,950 by July 10.
      Protect the EasyStart Certificate — do not touch before December 2026.</p>
      ${notice('EasyStart Certificate: <strong class="private-value">$2,137.75</strong> — matures 12/06/2026. Do not withdraw early.')}
    `, 'span-12')}

    ${card('Paycheck Allocation: June 5 – July 10',
      table(['Date', 'Income', 'Allocation'], paychecks, { caption: 'Daniel paycheck allocation June through July', label: 'Daniel paycheck allocation' }),
    'span-12')}

    ${card('June–July Checklist', checklist('daniel', D.checklist), 'span-6')}

    ${card('Debt Snapshot',
      table(['Debt', 'Balance', 'APR', 'Payment'], debtRows(D), { caption: 'Daniel debt snapshot', label: 'Daniel debts' }),
    'span-6')}

    ${card('Post-Move Monthly Budget',
      table(['Category', 'Amount'], budget, { caption: 'Daniel post-move budget', label: 'Daniel monthly budget' }),
    'span-6')}

    ${card('Visa Payoff Scenarios',
      table(['Scenario', 'Monthly Pmt', 'Timeline'], D.visaTimeline, { caption: 'Visa payoff scenarios', label: 'Visa payoff options' }),
    'span-6')}

  </div>`;
}

function renderSonia() {
  const S = DATA.sonia;

  const nextPay  = S.nextPaycheck.map(([a, b]) => [a, `<strong class="private-value">${b}</strong>`]);
  const budget   = S.budget.map(([a, b]) => [a, priv(b)]);
  const savings  = S.savingsTargets.map(([a, b]) => [a, priv(b)]);

  $('#sonia').innerHTML = `<div class="grid">

    ${card('Sonia', `
      <p>
        <span class="pill">${S.payFrequency}</span>
        <span class="pill good">Savings first</span>
        <span class="pill warn">NW Loan 12.50% APR</span>
      </p>
      <p>Primary rule: zero overdrafts, reach $1,000 emergency savings immediately,
      then grow to $2,500 by month 6. Northwest loan is $2,266.02 at 12.50% APR —
      consider extra payments after savings target is met.</p>
    `, 'span-12')}

    ${card('Next Paycheck Allocation',
      table(['Use', 'Amount'], nextPay, { caption: 'Sonia next paycheck allocation', label: 'Sonia paycheck' }),
    'span-6')}

    ${card('Action Checklist', checklist('sonia', S.checklist), 'span-6')}

    ${card('Debt Snapshot',
      table(['Debt', 'Balance', 'APR', 'Payment'], debtRows(S), { caption: 'Sonia debt snapshot', label: 'Sonia debts' }),
    'span-12')}

    ${card('Northwest Loan Payoff — Extra Payment Scenarios', `
      <p class="section-note">Balance: <strong class="private-value">$2,266.02</strong> at <strong>12.50% APR</strong>.
      Minimum: <strong class="private-value">$135.83/mo</strong>.
      Higher payments save real money — consider accelerating after $2,500 savings goal is reached.</p>
      ${table(['Monthly Payment', 'Payoff', 'Est. Interest'], S.loanPayoff, { caption: 'Northwest loan payoff scenarios', label: 'Northwest loan options' })}
    `, 'span-6')}

    ${card('Post-Move Monthly Budget',
      table(['Category', 'Amount'], budget, { caption: 'Sonia post-move budget', label: 'Sonia monthly budget' }),
    'span-6')}

    ${card('Family Debt Timeline',
      table(['Milestone', 'Remaining Balance'], S.familyDebtTimeline.map(([a, b]) => [a, `<span class="private-value">${b}</span>`]),
        { caption: 'Sonia family debt timeline', label: 'Family debt repayment' }),
    'span-6')}

    ${card('Apple Savings Targets',
      table(['Milestone', 'Target'], savings, { caption: 'Apple savings milestone targets', label: 'Savings milestones' }),
    'span-6')}

    ${card('Family Repayment Message', `
      <p>Hey, I want to start paying you back consistently and make sure this is handled respectfully.
      After the move, I'm going to start paying <strong>$200/month</strong> beginning with my first
      post-move paycheck cycle. Starting in month three, I'll increase it to <strong>$300/month</strong>.
      I'll keep you updated and stay consistent so there's no confusion.</p>
      <p class="fine-print">Send as-is or in your own words. The commitment is what matters.</p>
    `, 'span-12')}

  </div>`;
}

function renderHousehold() {
  const H = DATA.household;

  const bills = H.sharedBills.map(r => [
    r[0],
    priv(r[1]),
    priv(r[2]),
    priv(r[3]),
  ]);

  // Net-worth rows — highlight positive/negative final column
  const nwRows = H.netWorth.map(r => [
    `Mo ${r[0]}`,
    priv(Number(r[1].replace(/[$,]/g, ''))),
    priv(Number(r[2].replace(/[$,]/g, ''))),
    priv(Number(r[3].replace(/[$,]/g, ''))),
    r[4],   // NW loan — may have 'est.' suffix
    priv(Number(r[5].replace(/[$,]/g, ''))),
    priv(Number(r[6].replace(/[$,]/g, ''))),
    `<span class="private-value" style="font-weight:700;color:${r[7].startsWith('-') ? 'var(--bad)' : 'var(--good)'}">${r[7]}</span>`,
  ]);

  $('#household').innerHTML = `<div class="grid">

    ${card('Shared Bill Split',
      table(
        ['Bill', 'Total', 'Daniel (59%)', 'Sonia (41%)'],
        bills,
        { caption: 'Monthly shared bill split', label: 'Shared bills' }
      ),
    'span-6')}

    ${card('Debt Payoff Sequence',
      table(['Priority', 'Action', 'Reason'], H.debtSequence,
        { caption: 'Household debt payoff sequence', label: 'Payoff sequence' }),
    'span-6')}

    ${card('Net Worth Trajectory (Months 1–36)', `
      <p class="section-note">Projected combined net worth assuming plan is followed. Negative values in red.</p>
      ${table(
        ['Month', 'Visa', 'Vehicle', 'Family Debt', 'NW Loan', 'Cash', 'Investments', 'Net Worth'],
        nwRows,
        { caption: 'Projected net worth trajectory', label: 'Net worth projection' }
      )}
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
    'Shared bills split correctly at 59/41.',
    'Subscriptions did not creep back.',
    'Fast food, beauty, and Amazon stayed under cap.',
    'Net worth improved quarter over quarter.',
    'Move-related final bills are closed out.',
    'Investing only started after trigger list is satisfied.',
  ];

  const investTriggers = [
    ['Daniel',    'Visa paid off, $1,000+ emergency fund, no new card charges for 90 days', '$50–$150/mo'],
    ['Sonia',     '$2,500 emergency fund, no overdrafts 90 days, family debt below $5,000, NW loan current or paid', '$50–$150/mo'],
    ['Household', 'Both current, shared bills stable, no surprise old-address bills', 'Review quarterly'],
  ];

  const scenarios = [
    ['Conservative', 'Daniel $600/mo to Visa; Sonia follows family plan; extra cash builds reserves', 'Safer but slower'],
    ['Balanced ✓',   'Daniel $700/mo to Visa; Sonia saves to $2,500 and pays family debt on schedule', 'Recommended'],
    ['Aggressive',   'Daniel $800–$900/mo to Visa; Sonia adds extra to NW loan after month 6', 'Fastest — higher cash-flow risk'],
  ];

  $('#review').innerHTML = `<div class="grid">

    ${card('Quarterly Review Checklist',
      checklist('quarterly', reviewItems),
    'span-6')}

    ${card('Investment Triggers',
      table(['Person', 'Trigger Condition', 'Start Amount'], investTriggers,
        { caption: 'Investment trigger conditions', label: 'Investment triggers' }),
    'span-6')}

    ${card('Scenario Options',
      table(['Scenario', 'Action', 'Outcome'], scenarios,
        { caption: 'Financial scenario comparison', label: 'Scenarios' }),
    'span-12')}

  </div>`;
}

function renderSettings() {
  $('#settings').innerHTML = `<div class="grid">

    ${card('Security & Privacy', `
      ${notice('The passcode is client-side only — it protects against casual viewing, not a determined attacker. Do not store bank logins, full account numbers, SSNs, or sensitive documents in this app. Use a private GitHub repository.')}
      <p>Progress data (checklist states and tracker values) is saved to this device's <code>localStorage</code> only. Nothing is sent to any server.</p>
    `, 'span-12')}

    ${card('Export Progress', `
      <p class="section-note">Download your saved checklist and tracker data as a JSON file or CSV for your records.</p>
      <div class="btn-group">
        <button id="exportJsonBtn" class="btn-primary">Export JSON</button>
        <button id="exportCsvBtn"  class="btn-secondary">Export CSV</button>
      </div>
      <pre id="exportOut" class="callout" aria-live="polite" style="margin-top:12px;display:none"></pre>
    `, 'span-6')}

    ${card('Import Progress', `
      <p class="section-note">Restore a previously exported JSON file to pick up where you left off on another device.</p>
      <div class="field-group" style="margin-top:8px">
        <label for="importFile">Select JSON export file</label>
        <input type="file" id="importFile" accept=".json,application/json" aria-describedby="importHelp" />
      </div>
      <p id="importHelp" class="fine-print">Only files exported from this app are supported. Your current data will be replaced.</p>
      <button id="importBtn" class="btn-primary" style="margin-top:8px">Import & Restore</button>
      <p id="importStatus" role="alert" aria-live="assertive" style="margin-top:8px;font-size:.875rem"></p>
    `, 'span-6')}

    ${card('Data Reset', `
      <p class="section-note">Permanently clear all saved checklist states and tracker values from this device.</p>
      <button id="resetBtn2" class="btn-danger" style="margin-top:8px">Reset All Progress</button>
    `, 'span-12')}

  </div>`;

  /* ── Export JSON ── */
  $('#exportJsonBtn').addEventListener('click', () => {
    const out = {};
    LS.keys('checks:').forEach(k => { out[k] = LS.get(k); });
    LS.keys('tracker:').forEach(k => { out[k] = LS.get(k); });
    out['lastUpdated'] = LS.get('lastUpdated');
    const json = JSON.stringify(out, null, 2);
    downloadFile(`garner-johnson-progress-${datestamp()}.json`, json, 'application/json');
    const pre = $('#exportOut');
    pre.textContent = json;
    pre.style.display = 'block';
  });

  /* ── Export CSV ── */
  $('#exportCsvBtn').addEventListener('click', () => {
    const rows = [['Key', 'Value', 'ExportedAt']];
    const now = new Date().toISOString();
    LS.keys('checks:').forEach(k => rows.push([k, JSON.stringify(LS.get(k)), now]));
    LS.keys('tracker:').forEach(k => rows.push([k, LS.get(k), now]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadFile(`garner-johnson-progress-${datestamp()}.csv`, csv, 'text/csv');
  });

  /* ── Import JSON ── */
  $('#importBtn').addEventListener('click', () => {
    const file = $('#importFile').files[0];
    const status = $('#importStatus');
    if (!file) { status.textContent = '⚠️ Please select a JSON file first.'; status.style.color = 'var(--warn)'; return; }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const imported = JSON.parse(e.target.result);
        let count = 0;
        Object.entries(imported).forEach(([k, v]) => {
          if (k.startsWith('checks:') || k.startsWith('tracker:') || k === 'lastUpdated') {
            LS.set(k, v);
            count++;
          }
        });
        status.textContent = `✅ Imported ${count} items. Reloading…`;
        status.style.color = 'var(--good)';
        setTimeout(() => location.reload(), 1200);
      } catch {
        status.textContent = '❌ Invalid file — make sure it is a JSON exported from this app.';
        status.style.color = 'var(--bad)';
      }
    };
    reader.readAsText(file);
  });

  /* ── Reset (second button in settings) ── */
  $('#resetBtn2').addEventListener('click', () => {
    if (!confirm('This will permanently clear all saved progress on this device. Continue?')) return;
    [...LS.keys('checks:'), ...LS.keys('tracker:')].forEach(k => LS.remove(k));
    LS.remove('lastUpdated');
    location.reload();
  });
}

/* ─── Utility helpers ─────────────────────────────────── */
function datestamp() {
  return new Date().toISOString().slice(0, 10);
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
    tabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    panels.forEach(p => p.classList.remove('active'));

    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    const target = $(`#${tab.dataset.target}`);
    if (target) {
      target.classList.add('active');
      // Don't steal focus on initial load
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activate(tab));

    // Arrow key navigation within tab list
    tab.addEventListener('keydown', e => {
      const idx  = tabs.indexOf(tab);
      if (e.key === 'ArrowRight') { e.preventDefault(); tabs[(idx + 1) % tabs.length].focus(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); tabs[(idx - 1 + tabs.length) % tabs.length].focus(); }
      if (e.key === 'Home')       { e.preventDefault(); tabs[0].focus(); }
      if (e.key === 'End')        { e.preventDefault(); tabs[tabs.length - 1].focus(); }
    });
  });
}

/* ─── Global event delegation ─────────────────────────── */
function initEvents() {
  /* Checkbox checklists */
  document.addEventListener('change', e => {
    if (e.target.matches('input[type="checkbox"][data-list]')) {
      const { list, index } = e.target.dataset;
      const saved = LS.get(`checks:${list}`, {});
      saved[index] = e.target.checked;
      LS.set(`checks:${list}`, saved);
      e.target.closest('.check-row').classList.toggle('done', e.target.checked);
      touchLastUpdated();

      // Update summary counter
      const allBoxes = $$(`input[data-list="${list}"]`);
      const doneCount = allBoxes.filter(b => b.checked).length;
      const summary = $(`#${list}-summary`);
      if (summary) summary.textContent = `${doneCount} of ${allBoxes.length} complete`;
    }

    /* Tracker numeric inputs */
    if (e.target.matches('input[data-tracker-input]')) {
      const id = e.target.dataset.trackerInput;
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val >= 0) {
        LS.set(`tracker:${id}`, val);
        touchLastUpdated();
        // Re-render dashboard trackers live (only if dashboard is visible)
        if ($('#dashboard').classList.contains('active')) {
          renderDashboard();
        }
      }
    }
  });

  /* Print */
  $('#printBtn').addEventListener('click', () => window.print());

  /* Reset (header button) */
  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all saved checklist and tracker data on this device?')) return;
    [...LS.keys('checks:'), ...LS.keys('tracker:')].forEach(k => LS.remove(k));
    LS.remove('lastUpdated');
    location.reload();
  });
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
