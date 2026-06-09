/**
 * GJ Financial Tracker · app.js v9
 * Auth: sessionStorage 'financeUnlocked' === 'true' — unchanged from original
 */
'use strict';

const DATA = window.FINANCE_DATA;
const $    = (s, r=document) => r.querySelector(s);
const $$   = (s, r=document) => [...r.querySelectorAll(s)];
const fmt  = n => (parseFloat(n)||0).toLocaleString('en-US',{style:'currency',currency:'USD'});
const priv = v => `<span class="private-value">${fmt(v)}</span>`;
const cap  = s => s.charAt(0).toUpperCase()+s.slice(1);

/* ── localStorage ───────────────────────────────────────────── */
const LS = {
  get:  (k,d=null) => { try { const v=localStorage.getItem(k); return v===null?d:JSON.parse(v); } catch { return d; } },
  set:  (k,v)      => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} },
  num:  (k,d)      => { const v=localStorage.getItem(k); return v!==null?parseFloat(v):d; },
  keys: (p)        => { try { return Object.keys(localStorage).filter(k=>k.startsWith(p)); } catch { return []; } },
  rm:   (k)        => { try { localStorage.removeItem(k); } catch {} },
};

/* ── Auth — original logic preserved exactly ─────────────────── */
function auth() {
  const loginEl = $('#login');
  if (sessionStorage.getItem('financeUnlocked') === 'true') {
    loginEl.style.display = 'none'; return;
  }
  setTimeout(() => { const p=$('#passwordInput'); if(p) p.focus(); }, 80);
  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const val = $('#passwordInput').value.trim();
    if (val === DATA.password) {
      sessionStorage.setItem('financeUnlocked','true');
      loginEl.style.display = 'none';
      const mc=$('#main-content'); if(mc) mc.focus();
    } else {
      const err=$('#loginError');
      err.textContent = 'Incorrect passcode — try again.';
      $('#passwordInput').value = '';
      $('#passwordInput').focus();
      setTimeout(()=>{ err.textContent=''; },4000);
    }
  });
  $('#lockBtn').addEventListener('click', ()=>{ sessionStorage.removeItem('financeUnlocked'); location.reload(); });
}

/* ── Utilities ───────────────────────────────────────────────── */
function tbl(headers, rows, lbl='Table') {
  return `<div class="table-wrap" role="region" aria-label="${lbl}" tabindex="0">
    <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
}
function card(title, body, span='span-6') {
  return `<div class="card ${span}"><h2>${title}</h2>${body}</div>`;
}
function pill(text, cls='brand') { return `<span class="pill ${cls}">${text}</span>`; }

/* ── Slider builder ──────────────────────────────────────────── */
function buildSlider(id, label, type, defaultBal, defaultGoal, apr) {
  const current = LS.num(`sl:${id}`, defaultBal);
  const goalVal = LS.num(`gl:${id}`, defaultGoal);
  const pct = goalVal > 0
    ? type==='debt'
      ? Math.max(0,Math.min(100,((goalVal-current)/goalVal)*100))
      : Math.max(0,Math.min(100,(current/goalVal)*100))
    : 0;
  const rangeVal = type==='debt' ? Math.max(0,goalVal-current) : current;
  const s1val = type==='debt' ? fmt(goalVal-current) : fmt(current);
  const s2val = type==='debt' ? fmt(current) : fmt(Math.max(0,goalVal-current));
  const fillCls = pct>=100?'full':pct>=60?'green':pct>=30?'':pct>=10?'warn':'bad';
  const moInt = (type==='debt'&&apr) ? ` · ${fmt(current*(apr/100/12))}/mo interest` : '';
  return `
  <div class="slider-wrap" data-si="${id}" data-st="${type}">
    <div class="slider-header">
      <span class="slider-name">${label}</span>
      <span class="slider-pct" id="sp-${id}">${pct.toFixed(1)}%</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill ${fillCls}" id="sf-${id}" style="width:${pct.toFixed(1)}%"></div>
    </div>
    <input type="range" class="slider-range" id="sr-${id}"
      min="0" max="${goalVal}" step="1" value="${rangeVal}"
      aria-label="${label} slider" />
    <div class="slider-stats">
      <div class="slider-stat">
        <span class="slider-stat-val ${type==='debt'?'good':'brand'} private-value" id="ss1-${id}">${s1val}</span>
        <span class="slider-stat-lbl">${type==='debt'?'Paid Down':'Saved'}</span>
      </div>
      <div class="slider-stat">
        <span class="slider-stat-val bad private-value" id="ss2-${id}">${s2val}</span>
        <span class="slider-stat-lbl">${type==='debt'?'Remaining':'To Goal'}</span>
      </div>
    </div>
    <div class="slider-edit-row">
      <label class="slider-edit-label">${type==='debt'?'Current Balance':'Current Saved'}
        <input type="number" step="0.01" min="0" class="slider-edit-input"
          id="sb-${id}" value="${current}" data-sb="${id}" data-st="${type}" />
      </label>
      <label class="slider-edit-label">Goal
        <input type="number" step="0.01" min="1" class="slider-edit-input"
          id="sg-${id}" value="${goalVal}" data-sg="${id}" data-st="${type}" />
      </label>
    </div>
    <div class="slider-meta private-value" id="sm-${id}">${s2val} ${type==='debt'?'remaining':'to go'}${moInt}</div>
  </div>`;
}

function updateSlider(id, type, current, goalVal) {
  const pct = goalVal>0
    ? type==='debt'
      ? Math.max(0,Math.min(100,((goalVal-current)/goalVal)*100))
      : Math.max(0,Math.min(100,(current/goalVal)*100))
    : 0;
  const s1val = type==='debt'?fmt(goalVal-current):fmt(current);
  const s2val = type==='debt'?fmt(current):fmt(Math.max(0,goalVal-current));
  const fillCls = pct>=100?'full':pct>=60?'green':pct>=30?'':pct>=10?'warn':'bad';
  const fill=$('#sf-'+id), pctEl=$('#sp-'+id), s1=$('#ss1-'+id), s2=$('#ss2-'+id);
  const meta=$('#sm-'+id), range=$('#sr-'+id), bal=$('#sb-'+id);
  if(fill)  { fill.style.width=pct.toFixed(1)+'%'; fill.className=`progress-fill ${fillCls}`; }
  if(pctEl)  pctEl.textContent=pct.toFixed(1)+'%';
  if(s1)     s1.textContent=s1val;
  if(s2)     s2.textContent=s2val;
  if(meta)   meta.textContent=s2val+(type==='debt'?' remaining':' to go');
  if(range && document.activeElement!==range) { range.max=goalVal; range.value=type==='debt'?Math.max(0,goalVal-current):current; }
  if(bal && document.activeElement!==bal) bal.value=current;
}

/* ── Spending cap builder ────────────────────────────────────── */
function buildCap(person, capObj, idx) {
  const id    = `${person}-c${idx}`;
  const cap   = LS.num(`cl:${id}`, capObj.cap);
  const spent = LS.num(`cs:${id}`, 0);
  const pct   = cap>0?Math.min(100,(spent/cap)*100):0;
  const left  = Math.max(0,cap-spent);
  const cls   = pct>=100?'bad':pct>=80?'warn':'';
  return `
  <div class="cap-row" data-ci="${id}">
    <div class="cap-header">
      <span class="cap-name">${capObj.name}</span>
      <span class="cap-status ${cls}" id="cst-${id}">${pct>=100?'OVER':fmt(left)+' left'}</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill ${cls}" id="cf-${id}" style="width:${pct.toFixed(1)}%"></div>
    </div>
    <div class="cap-inputs">
      <label class="cap-input-label">Spent this month
        <input type="number" step="0.01" min="0" class="cap-input"
          id="csp-${id}" value="${spent}" data-csp="${id}" />
      </label>
      <label class="cap-input-label">Monthly cap
        <input type="number" step="0.01" min="1" class="cap-input"
          id="clm-${id}" value="${cap}" data-clm="${id}" />
      </label>
    </div>
  </div>`;
}

function updateCap(id, spent, cap) {
  const pct=cap>0?Math.min(100,(spent/cap)*100):0;
  const left=Math.max(0,cap-spent);
  const cls=pct>=100?'bad':pct>=80?'warn':'';
  const fill=$('#cf-'+id), stat=$('#cst-'+id);
  if(fill) { fill.style.width=pct.toFixed(1)+'%'; fill.className=`progress-fill ${cls}`; }
  if(stat) { stat.textContent=pct>=100?'OVER':fmt(left)+' left'; stat.className=`cap-status ${cls}`; }
}

/* ── Wallet builder ──────────────────────────────────────────── */
function buildWallet(person) {
  const c=LS.num(`w:${person}:c`,0), s=LS.num(`w:${person}:s`,0);
  return `
  <div class="wallet-block">
    <div class="wallet-total-row">
      <span class="wallet-total-label">Total on hand</span>
      <span class="wallet-total-val private-value" id="wt-${person}">${fmt(c+s)}</span>
    </div>
    <div class="wallet-inputs">
      <label class="wallet-label">Checking
        <input type="number" step="0.01" min="0" class="wallet-input"
          value="${c}" data-w="${person}" data-wt="c" />
      </label>
      <label class="wallet-label">Savings
        <input type="number" step="0.01" min="0" class="wallet-input"
          value="${s}" data-w="${person}" data-wt="s" />
      </label>
    </div>
  </div>`;
}

/* ── Checklist builder ───────────────────────────────────────── */
function buildChecklist(id, items) {
  const saved=LS.get(`ck:${id}`,{});
  const done=items.filter((_,i)=>saved[i]).length;
  const rows=items.map((item,i)=>`
    <div class="check-row${saved[i]?' done':''}">
      <input type="checkbox" id="c-${id}-${i}"
        data-list="${id}" data-idx="${i}" ${saved[i]?'checked':''} />
      <label for="c-${id}-${i}">${item}</label>
    </div>`).join('');
  return `<p class="checklist-summary" id="cks-${id}">${done} of ${items.length} complete</p>
    <div class="checklist">${rows}</div>`;
}

/* ══════════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════════ */
function renderDashboard() {
  const D=DATA.daniel, S=DATA.sonia, H=DATA.household;
  let totalDebt=0;
  D.debts.forEach((d,i)=>{ totalDebt+=LS.num(`sl:d-dt-${i}`,d.balance); });
  S.debts.forEach((d,i)=>{ totalDebt+=LS.num(`sl:s-dt-${i}`,d.balance||0); });
  let totalSav=0;
  D.savings.forEach((s,i)=>{ totalSav+=LS.num(`sl:d-sv-${i}`,s.balance); });
  S.savings.forEach((s,i)=>{ totalSav+=LS.num(`sl:s-sv-${i}`,s.balance); });
  const dW=LS.num('w:daniel:c',0)+LS.num('w:daniel:s',0);
  const sW=LS.num('w:sonia:c',0)+LS.num('w:sonia:s',0);
  const netWorth=totalSav+dW+sW-totalDebt;
  // Move fund
  const moveSaved=LS.num('sl:d-sv-0',D.savings[0].balance);
  const moveGoal=LS.num('gl:d-sv-0',D.savings[0].goal);
  const moveTarget=new Date('2026-07-10'), today=new Date();
  const daysLeft=Math.max(0,Math.ceil((moveTarget-today)/86400000));
  const payLeft=Math.max(1,Math.floor(daysLeft/14));
  const moveRem=Math.max(0,moveGoal-moveSaved);
  const movePct=(moveGoal>0?Math.min(100,(moveSaved/moveGoal)*100):0).toFixed(1);
  // Interest burn
  let burn=0;
  D.debts.forEach((d,i)=>{ if(d.apr) burn+=LS.num(`sl:d-dt-${i}`,d.balance)*(d.apr/100/12); });
  S.debts.forEach((d,i)=>{ if(d.apr&&d.balance) burn+=LS.num(`sl:s-dt-${i}`,d.balance||0)*(d.apr/100/12); });

  $('#dashboard').innerHTML = `<div class="grid">

    <div class="span-12">
      <div class="hero-grid">
        <div class="hero-stat">
          <span class="hero-val bad private-value">${fmt(totalDebt)}</span>
          <span class="hero-lbl">Total Debt</span>
        </div>
        <div class="hero-stat">
          <span class="hero-val good private-value">${fmt(totalSav+dW+sW)}</span>
          <span class="hero-lbl">Total Assets</span>
          <span class="hero-sub">${fmt(dW+sW)} liquid wallets</span>
        </div>
        <div class="hero-stat">
          <span class="hero-val ${netWorth>=0?'good':'bad'} private-value">${fmt(netWorth)}</span>
          <span class="hero-lbl">Net Worth</span>
          <span class="hero-sub">${fmt(burn)}/mo interest burn</span>
        </div>
      </div>
    </div>

    ${card('Move Fund Countdown', `
      <div class="metric"><span>Days to July 10</span><strong class="brand">${daysLeft}</strong></div>
      <div class="metric"><span>Paychecks left</span><strong>${payLeft}</strong></div>
      <div class="metric"><span>Saved so far</span><strong class="private-value good">${fmt(moveSaved)}</strong></div>
      <div class="metric"><span>Still needed</span><strong class="private-value bad">${fmt(moveRem)}</strong></div>
      <div class="metric" style="font-weight:700"><span>Needed per paycheck</span><strong class="brand private-value">${fmt(moveRem/payLeft)}</strong></div>
      <div class="progress-bar" style="margin-top:12px">
        <div class="progress-fill ${movePct>=100?'full':'green'}" style="width:${movePct}%"></div>
      </div>
      <p class="section-note" style="text-align:right;margin-top:4px">${fmt(moveSaved)} of ${fmt(moveGoal)} · ${movePct}%</p>
    `, 'span-6')}

    ${card('Wallets — On Hand', `
      <p class="section-note" style="margin-bottom:12px">Live cash on hand. Updates net worth above.</p>
      <p style="font-size:.8rem;font-weight:700;color:var(--ink-3);margin-bottom:6px">DANIEL</p>
      ${buildWallet('daniel')}
      <p style="font-size:.8rem;font-weight:700;color:var(--ink-3);margin:14px 0 6px">SONIA</p>
      ${buildWallet('sonia')}
      <div class="metric" style="margin-top:12px">
        <span>Combined</span>
        <strong class="good private-value" id="wt-combined">${fmt(dW+sW)}</strong>
      </div>
    `, 'span-6')}

    ${card('Household', `
      <div class="metric"><span>Combined income</span><strong class="private-value">${fmt(H.incomeMonthly)}/mo</strong></div>
      <div class="metric"><span>Split</span><strong>Daniel 59% · Sonia 41%</strong></div>
      <div class="metric"><span>Monthly interest burn</span><strong class="bad private-value">${fmt(burn)}</strong></div>
      <div class="metric"><span>Shared bills (Daniel share)</span><strong class="private-value">${fmt(H.sharedBills[4][2])}/mo</strong></div>
      <div class="metric"><span>Shared bills (Sonia share)</span><strong class="private-value">${fmt(H.sharedBills[4][3])}/mo</strong></div>
    `, 'span-6')}

    ${card('Priority Rule', `
      <div class="pro-tip">
        <strong>Operating Rule</strong>
        Every paycheck is assigned before spending starts. Bills, debt payments, and savings come first — every time, no exceptions.
      </div>
      <div class="notice" style="margin-top:8px">
        <strong>EasyStart Certificate</strong>
        $2,137.75 — matures 12/06/2026. Do not touch before maturity.
      </div>
    `, 'span-6')}

  </div>`;
}

/* ══════════════════════════════════════════════════════════════
   DANIEL — Sub-tabs
══════════════════════════════════════════════════════════════ */
const D_TABS = [
  {id:'overview',  lbl:'Overview'   },
  {id:'wallet',    lbl:'💵 Wallet'  },
  {id:'debt',      lbl:'💳 Debt'    },
  {id:'savings',   lbl:'💰 Savings' },
  {id:'spending',  lbl:'📊 Spending'},
  {id:'paychecks', lbl:'📅 Paychecks'},
  {id:'checklist', lbl:'✅ Checklist'},
];
function renderDaniel() {
  const active=LS.get('st:daniel','overview');
  const D=DATA.daniel;
  $('#daniel').innerHTML=`
    <div class="person-header">
      <h2>Daniel</h2>
      ${pill('RAC SAM','brand')}
      ${pill('Move target: $1,950','warn')}
      ${pill('Visa priority','bad')}
    </div>
    <div class="sub-tabs">${D_TABS.map(t=>`
      <button class="sub-tab${t.id===active?' active':''}"
        data-person="daniel" data-st="${t.id}">${t.lbl}</button>`).join('')}
    </div>
    <div id="d-body">${renderDanielTab(active)}</div>`;
}
function renderDanielTab(tab) {
  const D=DATA.daniel;
  switch(tab) {
    case 'overview': return `<div class="grid">
      ${card('Summary', `
        <p>Primary focus: get NFCU Visa to zero new charges and build the move fund to $1,950 by July 10. After the move, redirect move fund contributions to $700/mo Visa paydown.</p>
        ${D.visaTimeline ? `<div style="margin-top:12px">${tbl(['Visa Scenario','Monthly Pmt','Timeline'],D.visaTimeline,'Visa payoff')}</div>` : ''}
      `,'span-12')}
      ${D.budget ? card('Post-Move Budget', tbl(['Category','Amount'],D.budget.map(([a,b])=>[a,priv(b)]),'Budget'),'span-12') : ''}
    </div>`;
    case 'wallet': return `<div class="grid">
      ${card('Daniel\'s Wallet', `
        <p class="section-note" style="margin-bottom:12px">Track current cash. Updates hero net worth on dashboard.</p>
        ${buildWallet('daniel')}
      `,'span-12')}
    </div>`;
    case 'debt': return `<div class="grid">
      ${card('Debt Trackers', `
        <p class="section-note" style="margin-bottom:14px">Drag the slider or type a balance. Edit Goal to change the original amount. All values save instantly.</p>
        ${D.debts.map((d,i)=>buildSlider(`d-dt-${i}`,d.name,'debt',d.balance,d.balance,d.apr)).join('')}
      `,'span-12')}
    </div>`;
    case 'savings': return `<div class="grid">
      ${card('Savings Goals', `
        <p class="section-note" style="margin-bottom:14px">Drag or type to track savings progress toward each goal.</p>
        ${D.savings.map((s,i)=>buildSlider(`d-sv-${i}`,s.name,'savings',s.balance,s.goal,null)).join('')}
      `,'span-12')}
    </div>`;
    case 'spending': return `<div class="grid">
      ${card('Monthly Spending Caps', `
        <p class="section-note" style="margin-bottom:14px">Enter what you've spent this month. Bar turns amber at 80%, red at 100%. Tap Reset to clear for a new month.</p>
        ${D.spendCaps.map((c,i)=>buildCap('daniel',c,i)).join('')}
        <button class="btn-ghost" style="margin-top:16px;font-size:.8rem" id="rst-d">Reset Month</button>
      `,'span-12')}
    </div>`;
    case 'paychecks': return `<div class="grid">
      ${card('Paycheck Plan: June 5 – July 10',
        tbl(['Date','Income','Allocation'],
          D.paychecks.map(r=>[r[0],`<strong class="private-value">${r[1]}</strong>`,r[2]]),
          'Daniel paychecks'),
      'span-12')}
    </div>`;
    case 'checklist': return `<div class="grid">
      ${card('Action Checklist', buildChecklist('daniel',D.checklist),'span-12')}
    </div>`;
    default: return '';
  }
}

/* ══════════════════════════════════════════════════════════════
   SONIA — Sub-tabs
══════════════════════════════════════════════════════════════ */
const S_TABS = [
  {id:'overview',  lbl:'Overview'     },
  {id:'wallet',    lbl:'💵 Wallet'    },
  {id:'debt',      lbl:'💳 Debt'      },
  {id:'savings',   lbl:'💰 Savings'   },
  {id:'spending',  lbl:'📊 Spending'  },
  {id:'paychecks', lbl:'📅 Paychecks' },
  {id:'checklist', lbl:'✅ Checklist' },
];
function renderSonia() {
  const active=LS.get('st:sonia','overview');
  $('#sonia').innerHTML=`
    <div class="person-header">
      <h2>Sonia</h2>
      ${pill('Savings first','good')}
      ${pill('NW Loan 12.50% APR','warn')}
    </div>
    <div class="sub-tabs">${S_TABS.map(t=>`
      <button class="sub-tab${t.id===active?' active':''}"
        data-person="sonia" data-st="${t.id}">${t.lbl}</button>`).join('')}
    </div>
    <div id="s-body">${renderSoniaTab(active)}</div>`;
}
function renderSoniaTab(tab) {
  const S=DATA.sonia;
  switch(tab) {
    case 'overview': return `<div class="grid">
      ${card('Summary', `
        <p>Reach $1,000 emergency savings immediately, then grow to $2,500 by month 6.
        Northwest loan is $2,266.02 at 12.50% APR — accelerate after savings target hit.</p>
      `,'span-12')}
      ${card('NW Loan Scenarios', tbl(['Payment','Months','Est. Interest'],S.loanPayoff,'NW Loan'),'span-6')}
      ${card('Family Debt Timeline', tbl(['Period','Balance'],S.familyDebtTimeline.map(([a,b])=>[a,`<span class="private-value">${b}</span>`]),'Family debt'),'span-6')}
      ${card('Family Repayment Message', `
        <p style="font-style:italic;color:var(--ink-2);line-height:1.7">
        "Hey — I want to start paying you back consistently and make sure this is handled respectfully.
        After the move I'm going to start paying <strong>$200/month</strong> beginning with my first
        post-move paycheck. Starting month three I'll increase to <strong>$300/month</strong>.
        I'll keep you updated so there's no confusion."</p>
      `,'span-12')}
    </div>`;
    case 'wallet': return `<div class="grid">
      ${card('Sonia\'s Wallet',`<p class="section-note" style="margin-bottom:12px">Track current cash. Updates net worth on dashboard.</p>${buildWallet('sonia')}`,'span-12')}
    </div>`;
    case 'debt': return `<div class="grid">
      ${card('Debt Trackers',`
        <p class="section-note" style="margin-bottom:14px">Drag or type to update balances. Edit Goal to adjust original amount.</p>
        ${S.debts.map((d,i)=>buildSlider(`s-dt-${i}`,d.name,'debt',d.balance||0,d.balance||1,d.apr)).join('')}
      `,'span-12')}
    </div>`;
    case 'savings': return `<div class="grid">
      ${card('Savings Goals',`
        <p class="section-note" style="margin-bottom:14px">Track progress toward each savings goal.</p>
        ${S.savings.map((s,i)=>buildSlider(`s-sv-${i}`,s.name,'savings',s.balance,s.goal,null)).join('')}
      `,'span-12')}
    </div>`;
    case 'spending': return `<div class="grid">
      ${card('Monthly Spending Caps',`
        <p class="section-note" style="margin-bottom:14px">Amber at 80%, red at 100%. Edit cap amount anytime.</p>
        ${S.spendCaps.map((c,i)=>buildCap('sonia',c,i)).join('')}
        <button class="btn-ghost" style="margin-top:16px;font-size:.8rem" id="rst-s">Reset Month</button>
      `,'span-12')}
    </div>`;
    case 'paychecks': return `<div class="grid">
      ${card('Next Paycheck',tbl(['Category','Amount'],S.nextPaycheck.map(([a,b])=>[a,`<strong class="private-value">${b}</strong>`]),'Sonia paycheck'),'span-12')}
    </div>`;
    case 'checklist': return `<div class="grid">
      ${card('Action Checklist',buildChecklist('sonia',S.checklist),'span-12')}
    </div>`;
    default: return '';
  }
}

/* ══════════════════════════════════════════════════════════════
   HOUSEHOLD
══════════════════════════════════════════════════════════════ */
function renderHousehold() {
  const H=DATA.household;
  const bills=H.sharedBills.map(r=>[r[0],priv(r[1]),priv(r[2]),priv(r[3])]);
  const nwRows=H.netWorth.map(r=>[
    `Mo ${r[0]}`,r[1],r[2],r[3],r[4],r[5],r[6],
    `<strong style="color:${r[7].startsWith('-')?'var(--red)':'var(--green)'}">${r[7]}</strong>`
  ]);
  $('#household').innerHTML=`<div class="grid">
    ${card('Shared Bill Split', tbl(['Bill','Total','Daniel 59%','Sonia 41%'],bills,'Shared bills'),'span-6')}
    ${card('Payoff Sequence', tbl(['#','Target','Reason'],H.debtSequence,'Payoff sequence'),'span-6')}
    ${card('Net Worth Trajectory', `
      <p class="section-note" style="margin-bottom:10px">Projected assuming plan is followed.</p>
      ${tbl(['Month','Visa','Vehicle','Family','NW Loan','Cash','Invest','Net Worth'],nwRows,'Net worth')}
    `,'span-12')}
  </div>`;
}

/* ══════════════════════════════════════════════════════════════
   PLANNING (replaces Review)
══════════════════════════════════════════════════════════════ */
const P_TABS=[
  {id:'roadmap',   lbl:'🗺 Roadmap'  },
  {id:'investing', lbl:'📈 Investing'},
  {id:'quarterly', lbl:'📋 Quarterly'},
  {id:'scenarios', lbl:'🔬 Scenarios'},
];
function renderPlanning() {
  const active=LS.get('st:planning','roadmap');
  $('#review').innerHTML=`
    <div class="sub-tabs">${P_TABS.map(t=>`
      <button class="sub-tab${t.id===active?' active':''}"
        data-person="planning" data-st="${t.id}">${t.lbl}</button>`).join('')}
    </div>
    <div id="p-body">${renderPlanningTab(active)}</div>`;
}
function renderPlanningTab(tab) {
  switch(tab) {
    case 'roadmap':   return buildRoadmap();
    case 'investing': return buildInvesting();
    case 'quarterly': return buildQuarterly();
    case 'scenarios': return buildScenarios();
    default: return '';
  }
}

function buildRoadmap() {
  const D=DATA.daniel, S=DATA.sonia;
  function ms(icon, label, current, goal, unit='', doneVal=null) {
    const pct=goal>0?Math.min(100,(current/goal)*100):0;
    const done=doneVal!==null?current>=doneVal:pct>=100;
    const fillW=pct.toFixed(1)+'%';
    return `<div class="roadmap-item">
      <span class="roadmap-icon">${icon}</span>
      <div class="roadmap-body">
        <div class="roadmap-label${done?' done':''}">${label}</div>
        <div class="roadmap-meta">${unit==='$'?fmt(current):current.toFixed(0)} / ${unit==='$'?fmt(goal):goal} ${unit!=='$'?unit:''}</div>
        <div class="progress-bar" style="margin-top:5px">
          <div class="progress-fill ${done?'full':'green'}" style="width:${fillW}"></div>
        </div>
      </div>
      <div class="roadmap-bar-wrap">
        <div class="roadmap-pct">${pct.toFixed(0)}%</div>
      </div>
    </div>`;
  }
  const moveSaved=LS.num('sl:d-sv-0',D.savings[0].balance);
  const moveGoal=LS.num('gl:d-sv-0',D.savings[0].goal);
  const emerD=LS.num('sl:d-sv-1',D.savings[1].balance);
  const emerDGoal=LS.num('gl:d-sv-1',D.savings[1].goal);
  const emerS=LS.num('sl:s-sv-0',S.savings[0].balance);
  const emerSGoal=LS.num('gl:s-sv-0',S.savings[0].goal);
  const visaBal=LS.num('sl:d-dt-0',D.debts[0].balance);
  const nwBal=LS.num('sl:s-dt-0',S.debts[0].balance);
  const famBal=LS.num('sl:s-dt-1',S.debts[1].balance);
  const vehBal=LS.num('sl:d-dt-1',D.debts[1].balance);
  return `<div class="grid">
    ${card('Financial Roadmap', `
      ${ms('📦','Move Fund Complete',moveSaved,moveGoal,'$')}
      ${ms('💰','Daniel Emergency Fund',emerD,emerDGoal,'$')}
      ${ms('💰','Sonia Savings $2,500',emerS,emerSGoal,'$')}
      ${ms('💳','NFCU Visa Paid Off',D.debts[0].balance-visaBal,D.debts[0].balance,'$')}
      ${ms('🏦','NW Loan Paid Off',S.debts[0].balance-nwBal,S.debts[0].balance,'$')}
      ${ms('👨‍👩‍👧','Family Debt Cleared',S.debts[1].balance-famBal,S.debts[1].balance,'$')}
      ${ms('🚗','Vehicle Loan Paid Off',D.debts[1].balance-vehBal,D.debts[1].balance,'$')}
      ${ms('📈','Begin Investing',0,1,'$')}
    `,'span-12')}
  </div>`;
}

function buildInvesting() {
  function compound(mo, rate, yrs) {
    const r=rate/100/12, n=yrs*12;
    return r>0 ? mo*((Math.pow(1+r,n)-1)/r) : mo*n;
  }
  function calcHTML(mo, rate, yrs) {
    const fv=compound(mo,rate,yrs);
    const contrib=mo*yrs*12;
    const growth=fv-contrib;
    return `
      <div class="calc-result">
        <div class="calc-stat"><span class="calc-stat-val">${fmt(fv)}</span><span class="calc-stat-lbl">End Value</span></div>
        <div class="calc-stat"><span class="calc-stat-val" style="color:var(--ink-2)">${fmt(contrib)}</span><span class="calc-stat-lbl">Contributed</span></div>
        <div class="calc-stat"><span class="calc-stat-val" style="color:var(--purple)">${fmt(growth)}</span><span class="calc-stat-lbl">Market Growth</span></div>
      </div>
      <div class="calc-projections" style="margin-top:10px">
        ${[10,20,30].map(y=>`<div class="calc-proj">
          <span class="calc-proj-val">${fmt(compound(mo,rate,y))}</span>
          <span class="calc-proj-lbl">${y} yrs</span>
        </div>`).join('')}
      </div>`;
  }
  const defMo=200, defRate=7, defYrs=10;
  return `<div class="grid">
    ${card('Compound Growth Calculator', `
      <p class="section-note" style="margin-bottom:12px">Long-term planning. Updates live as you type.</p>
      <div class="calc-inputs">
        <label>Monthly Contribution<input type="number" id="ci-mo" value="${defMo}" step="25" /></label>
        <label>Annual Return %<input type="number" id="ci-rate" value="${defRate}" step=".5" /></label>
        <label>Years<input type="number" id="ci-yrs" value="${defYrs}" step="1" /></label>
      </div>
      <div id="calc-out">${calcHTML(defMo,defRate,defYrs)}</div>
    `,'span-12')}
  </div>`;
}

function buildQuarterly() {
  const items=[
    'Overdrafts are $0 for the quarter.',
    'Daniel NFCU Visa has $0 new charges.',
    'Daniel Visa balance fell every month.',
    'Sonia family debt payment made every month.',
    'Sonia NW loan current or accelerated.',
    'Emergency savings increased.',
    'Shared bills split correctly at 59/41.',
    'Subscriptions did not creep back.',
    'All spending caps honored.',
    'Net worth improved quarter over quarter.',
    'Old address obligations fully closed.',
    'Investing started only after all triggers met.',
  ];
  const triggers=[
    ['Daniel',    'Visa paid off, $1K+ emergency fund, no new charges 90 days','$50–$150/mo'],
    ['Sonia',     '$2,500 emergency fund, no overdrafts 90 days, family debt below $5K','$50–$150/mo'],
    ['Household', 'Both current, shared bills stable, no legacy bills','Review quarterly'],
  ];
  return `<div class="grid">
    ${card('Quarterly Review Checklist', buildChecklist('quarterly',items),'span-6')}
    ${card('Investing Triggers', tbl(['Person','Condition','Start Amount'],triggers,'Triggers'),'span-6')}
  </div>`;
}

function buildScenarios() {
  const scens=[
    ['Conservative','Daniel $600/mo to Visa; Sonia follows family plan; extras build reserve','Safer, slower'],
    ['Balanced ✓',  'Daniel $700/mo to Visa; Sonia saves to $2,500 and pays family on schedule','Recommended'],
    ['Aggressive',  'Daniel $800–$900/mo to Visa; Sonia adds extra to NW loan after month 6','Fastest, higher risk'],
  ];
  return `<div class="grid">
    ${card('Scenario Options', tbl(['Scenario','Approach','Outcome'],scens,'Scenarios'),'span-12')}
    ${card('Post-Debt Life', `
      <div class="pro-tip"><strong>Once Visa Is Gone</strong>Redirect $700/mo: $400 to vehicle loan acceleration, $200 to Sonia family debt, $100 to joint emergency fund.</div>
      <div class="pro-tip" style="margin-top:8px"><strong>Once All Debt Is Gone</strong>Combined $1,400+/mo freed up. Split between Roth IRAs ($500 each), brokerage ($200+), and lifestyle buffer. Run the compound calculator on the Investing tab.</div>
    `,'span-12')}
  </div>`;
}

/* ══════════════════════════════════════════════════════════════
   SETTINGS
══════════════════════════════════════════════════════════════ */
function renderSettings() {
  const D=DATA.daniel, S=DATA.sonia;
  $('#settings').innerHTML=`<div class="grid">
    ${card('Security', `
      <div class="notice"><strong>Client-Side Only</strong>Passcode prevents casual viewing — not bank-grade security. Never store account numbers, SSNs, or bank passwords here.</div>
    `,'span-12')}
    <div class="card span-6">
      <h2>APRs & Income</h2>
      ${D.debts.map((d,i)=>`<div class="settings-row"><label>${d.name} APR</label>
        <input type="number" step=".01" class="settings-input" data-apr="d-dt-${i}" value="${d.apr}" />
        <span class="settings-unit">%</span></div>`).join('')}
      ${S.debts.map((d,i)=>`<div class="settings-row"><label>${d.name} APR</label>
        <input type="number" step=".01" class="settings-input" data-apr="s-dt-${i}" value="${d.apr||0}" />
        <span class="settings-unit">%</span></div>`).join('')}
      <div class="settings-row"><label>Daniel Income/mo</label>
        <input type="number" class="settings-input" id="set-dinc" value="${D.incomeMonthly}" /></div>
      <div class="settings-row"><label>Sonia Income/mo</label>
        <input type="number" class="settings-input" id="set-sinc" value="${S.incomeMonthly}" /></div>
    </div>
    <div class="card span-6">
      <h2>Balance Snapshot Log</h2>
      <p class="section-note" style="margin-bottom:10px">One-tap monthly snapshot of all current slider values. No re-entry needed.</p>
      <button class="btn-primary" id="snap-btn">Snapshot Now</button>
      <div class="balance-log" id="bal-log">${buildLogHTML()}</div>
    </div>
    ${card('Export / Import', `
      <div class="btn-group">
        <button class="btn-primary" id="exp-json">Export JSON</button>
        <button class="btn-secondary" id="exp-csv">Export CSV</button>
      </div>
      <div style="margin-top:14px">
        <label style="font-size:.82rem;font-weight:600;color:var(--ink-3)">Import JSON
          <input type="file" id="imp-file" accept=".json" style="display:block;margin-top:4px" />
        </label>
        <button class="btn-ghost" style="margin-top:8px" id="imp-btn">Restore from File</button>
        <p id="imp-status" style="font-size:.82rem;margin-top:6px"></p>
      </div>
      <pre class="export-box" id="exp-box"></pre>
    `,'span-12')}
    <div class="card span-12 settings-section danger-zone" style="background:var(--surface-1);border-color:rgba(239,68,68,.3)">
      <h2 style="color:var(--red)">Reset</h2>
      <p class="section-note" style="margin-bottom:10px">Permanently clears all saved progress on this device.</p>
      <button class="btn-danger" id="rst-all">Clear All Progress Data</button>
    </div>
  </div>`;
  bindSettings();
}

function buildLogHTML() {
  const log=LS.get('snaplog',[]);
  if(!log.length) return '<p class="section-note" style="margin-top:8px">No snapshots yet.</p>';
  return log.slice(0,6).map(e=>`
    <div class="log-entry">
      <strong>${e.date}</strong>
      <div class="log-row">
        ${Object.entries(e.balances).map(([k,v])=>`<span>${k}: ${fmt(v)}</span>`).join('')}
      </div>
    </div>`).join('');
}

function bindSettings() {
  $('#snap-btn').addEventListener('click', ()=>{
    const balances={};
    [...DATA.daniel.debts.map((_,i)=>`d-dt-${i}`),...DATA.sonia.debts.map((_,i)=>`s-dt-${i}`),
     ...DATA.daniel.savings.map((_,i)=>`d-sv-${i}`),...DATA.sonia.savings.map((_,i)=>`s-sv-${i}`)
    ].forEach(id=>{ const v=LS.num(`sl:${id}`,0); if(v>0) balances[id]=v; });
    const log=LS.get('snaplog',[]);
    log.unshift({date:new Date().toLocaleDateString(), balances});
    if(log.length>24) log.splice(24);
    LS.set('snaplog',log);
    const el=$('#bal-log'); if(el) el.innerHTML=buildLogHTML();
    touchSaved();
  });
  $('#exp-json').addEventListener('click', ()=>{
    const data={};
    ['sl:','gl:','w:','ck:','cl:','cs:','st:','snaplog'].forEach(p=>{
      if(p==='snaplog') { data.snaplog=LS.get('snaplog',[]); return; }
      LS.keys(p).forEach(k=>{ data[k]=LS.get(k); });
    });
    const j=JSON.stringify(data,null,2);
    dlFile(`gj-${ds()}.json`,j,'application/json');
    const box=$('#exp-box'); if(box){ box.textContent=j; box.style.display='block'; }
  });
  $('#exp-csv').addEventListener('click', ()=>{
    const rows=[['Key','Value','Date']];
    const now=new Date().toISOString();
    ['sl:','gl:','w:','ck:','cl:','cs:'].forEach(p=>
      LS.keys(p).forEach(k=>rows.push([k,JSON.stringify(LS.get(k)),now]))
    );
    dlFile(`gj-${ds()}.csv`,rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n'),'text/csv');
  });
  $('#imp-btn').addEventListener('click', ()=>{
    const file=$('#imp-file').files[0];
    const status=$('#imp-status');
    if(!file){ status.textContent='⚠️ Select a JSON file first.'; return; }
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const d=JSON.parse(e.target.result); let n=0;
        Object.entries(d).forEach(([k,v])=>{
          if(['sl:','gl:','w:','ck:','cl:','cs:','st:'].some(p=>k.startsWith(p))||k==='snaplog')
          { LS.set(k,v); n++; }
        });
        status.textContent=`✅ Imported ${n} items. Reloading…`;
        setTimeout(()=>location.reload(),1200);
      } catch{ status.textContent='❌ Invalid file.'; }
    };
    reader.readAsText(file);
  });
  $('#rst-all').addEventListener('click', ()=>{
    if(!confirm('Clear all saved progress? This cannot be undone.')) return;
    ['sl:','gl:','w:','ck:','cl:','cs:','st:','snaplog'].forEach(p=>{
      if(p==='snaplog'){ LS.rm('snaplog'); return; }
      LS.keys(p).forEach(k=>LS.rm(k));
    });
    LS.rm('lastUpdated');
    location.reload();
  });
}

/* ══════════════════════════════════════════════════════════════
   EVENT DELEGATION
══════════════════════════════════════════════════════════════ */
function initEvents() {
  /* Sub-tab switching */
  document.addEventListener('click', e=>{
    if(!e.target.matches('.sub-tab')) return;
    const person=e.target.dataset.person;
    const st=e.target.dataset.st;
    LS.set(`st:${person}`, st);
    $$('.sub-tab', e.target.closest('.sub-tabs').parentElement).forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    let body, html;
    if(person==='daniel')   { body=$('#d-body'); html=renderDanielTab(st); }
    else if(person==='sonia'){ body=$('#s-body'); html=renderSoniaTab(st); }
    else                     { body=$('#p-body'); html=renderPlanningTab(st); }
    if(body) body.innerHTML=html;
    // Re-bind calc if investing tab
    if(st==='investing') bindCalc();
  });

  /* Reset caps */
  document.addEventListener('click', e=>{
    if(e.target.id==='rst-d'){ LS.keys('cs:daniel').forEach(k=>LS.rm(k)); renderDaniel(); renderDashboard(); }
    if(e.target.id==='rst-s'){ LS.keys('cs:sonia').forEach(k=>LS.rm(k)); renderSonia(); renderDashboard(); }
  });

  /* Checklists */
  document.addEventListener('change', e=>{
    if(!e.target.matches('input[type="checkbox"][data-list]')) return;
    const {list,idx}=e.target.dataset;
    const saved=LS.get(`ck:${list}`,{});
    saved[idx]=e.target.checked;
    LS.set(`ck:${list}`,saved);
    e.target.closest('.check-row').classList.toggle('done',e.target.checked);
    const boxes=$$(`input[data-list="${list}"]`);
    const s=$(`#cks-${list}`);
    if(s) s.textContent=`${boxes.filter(b=>b.checked).length} of ${boxes.length} complete`;
    touchSaved();
  });

  /* Slider range drag */
  document.addEventListener('input', e=>{
    if(e.target.matches('.slider-range')){
      const wrap=e.target.closest('[data-si]'); if(!wrap) return;
      const id=wrap.dataset.si, type=wrap.dataset.st;
      const gEl=$('#sg-'+id);
      const goalVal=gEl?parseFloat(gEl.value)||0:0;
      const rv=parseFloat(e.target.value);
      const current=type==='debt'?Math.max(0,goalVal-rv):rv;
      LS.set(`sl:${id}`,current); touchSaved();
      updateSlider(id,type,current,goalVal);
      updateDashboardTotals();
    }
    /* Wallet inputs */
    if(e.target.matches('[data-w]')){
      const p=e.target.dataset.w, t=e.target.dataset.wt;
      localStorage.setItem(`w:${p}:${t}`, parseFloat(e.target.value)||0);
      const c=LS.num(`w:${p}:c`,0), s=LS.num(`w:${p}:s`,0);
      const el=$(`#wt-${p}`); if(el) el.textContent=fmt(c+s);
      updateDashboardTotals(); touchSaved();
    }
    /* Cap spent */
    if(e.target.matches('[data-csp]')){
      const id=e.target.dataset.csp;
      const spent=parseFloat(e.target.value)||0;
      localStorage.setItem(`cs:${id}`,spent);
      const limEl=$('#clm-'+id);
      const cap=limEl?parseFloat(limEl.value)||0:0;
      updateCap(id,spent,cap); touchSaved();
    }
  });

  /* Slider balance direct-type & goal edit */
  document.addEventListener('change', e=>{
    if(e.target.matches('[data-sb]')){
      const id=e.target.dataset.sb, type=e.target.dataset.st;
      const current=parseFloat(e.target.value)||0;
      const gEl=$('#sg-'+id);
      const goalVal=gEl?parseFloat(gEl.value)||0:0;
      LS.set(`sl:${id}`,current); touchSaved();
      updateSlider(id,type,current,goalVal);
      updateDashboardTotals();
    }
    if(e.target.matches('[data-sg]')){
      const id=e.target.dataset.sg, type=e.target.dataset.st;
      const goalVal=parseFloat(e.target.value)||1;
      LS.set(`gl:${id}`,goalVal);
      const bEl=$('#sb-'+id);
      const current=bEl?parseFloat(bEl.value)||0:LS.num(`sl:${id}`,0);
      const rng=$('#sr-'+id);
      if(rng){ rng.max=goalVal; rng.value=type==='debt'?Math.max(0,goalVal-current):current; }
      updateSlider(id,type,current,goalVal);
      updateDashboardTotals(); touchSaved();
    }
    if(e.target.matches('[data-clm]')){
      const id=e.target.dataset.clm;
      const cap=parseFloat(e.target.value)||0;
      localStorage.setItem(`cl:${id}`,cap);
      const spEl=$('#csp-'+id);
      const spent=spEl?parseFloat(spEl.value)||0:0;
      updateCap(id,spent,cap); touchSaved();
    }
  });

  /* Header buttons */
  $('#printBtn').addEventListener('click', ()=>window.print());
  $('#resetBtn').addEventListener('click', ()=>{
    if(!confirm('Clear all saved progress?')) return;
    ['sl:','gl:','w:','ck:','cl:','cs:','st:'].forEach(p=>LS.keys(p).forEach(k=>LS.rm(k)));
    LS.rm('snaplog'); LS.rm('lastUpdated'); location.reload();
  });
}

function updateDashboardTotals() {
  const D=DATA.daniel, S=DATA.sonia;
  let td=0;
  D.debts.forEach((_,i)=>td+=LS.num(`sl:d-dt-${i}`,D.debts[i].balance));
  S.debts.forEach((_,i)=>td+=LS.num(`sl:s-dt-${i}`,S.debts[i].balance||0));
  let ta=0;
  D.savings.forEach((_,i)=>ta+=LS.num(`sl:d-sv-${i}`,D.savings[i].balance));
  S.savings.forEach((_,i)=>ta+=LS.num(`sl:s-sv-${i}`,S.savings[i].balance));
  const dW=LS.num('w:daniel:c',0)+LS.num('w:daniel:s',0);
  const sW=LS.num('w:sonia:c',0)+LS.num('w:sonia:s',0);
  ta+=dW+sW;
  const nw=ta-td;
  // Update hero stats if dashboard is active
  const heroVals=$$('.hero-val.private-value');
  if(heroVals[0]) heroVals[0].textContent=fmt(td);
  if(heroVals[1]) heroVals[1].textContent=fmt(ta);
  if(heroVals[2]){ heroVals[2].textContent=fmt(nw); heroVals[2].className=`hero-val ${nw>=0?'good':'bad'} private-value`; }
  const cw=$('#wt-combined'); if(cw) cw.textContent=fmt(dW+sW);
}

/* ── Compound calculator live binding ─────────────────────── */
function bindCalc() {
  function calc() {
    const mo=parseFloat($('#ci-mo').value)||0;
    const rate=parseFloat($('#ci-rate').value)||0;
    const yrs=parseFloat($('#ci-yrs').value)||0;
    function compound(m,r,y){ const mr=r/100/12,n=y*12; return mr>0?m*((Math.pow(1+mr,n)-1)/mr):m*n; }
    const fv=compound(mo,rate,yrs);
    const contrib=mo*yrs*12;
    const growth=fv-contrib;
    const out=$('#calc-out');
    if(!out) return;
    out.innerHTML=`
      <div class="calc-result">
        <div class="calc-stat"><span class="calc-stat-val">${fmt(fv)}</span><span class="calc-stat-lbl">End Value</span></div>
        <div class="calc-stat"><span class="calc-stat-val" style="color:var(--ink-2)">${fmt(contrib)}</span><span class="calc-stat-lbl">Contributed</span></div>
        <div class="calc-stat"><span class="calc-stat-val" style="color:var(--purple)">${fmt(growth)}</span><span class="calc-stat-lbl">Market Growth</span></div>
      </div>
      <div class="calc-projections" style="margin-top:10px">
        ${[10,20,30].map(y=>`<div class="calc-proj">
          <span class="calc-proj-val">${fmt(compound(mo,rate,y))}</span>
          <span class="calc-proj-lbl">${y} yrs</span>
        </div>`).join('')}
      </div>`;
  }
  ['#ci-mo','#ci-rate','#ci-yrs'].forEach(sel=>{ const el=$(sel); if(el) el.addEventListener('input',calc); });
}

/* ── Privacy toggle ──────────────────────────────────────── */
function initPrivacy() {
  const btn=$('#privacyBtn'); if(!btn) return;
  const on=LS.get('privMode',false);
  applyPriv(on,btn);
  btn.addEventListener('click',()=>{ const n=!document.body.classList.contains('privacy-mode'); LS.set('privMode',n); applyPriv(n,btn); });
}
function applyPriv(on,btn){
  document.body.classList.toggle('privacy-mode',on);
  btn.setAttribute('aria-pressed',String(on));
  const lbl=btn.querySelector('.btn-label'); if(lbl) lbl.textContent=on?'Show $':'Hide $';
}

/* ── lastUpdated ─────────────────────────────────────────── */
function touchSaved(){ LS.set('lastUpdated',new Date().toISOString()); refreshSaved(); }
function refreshSaved(){
  const ts=LS.get('lastUpdated',null), el=$('#lastUpdatedDisplay'); if(!el) return;
  if(ts){ const d=new Date(ts); el.textContent=`Saved ${d.toLocaleDateString()} ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`; }
}

/* ── Main tabs ───────────────────────────────────────────── */
function initTabs(){
  const tabs=$$('.tab'), panels=$$('.panel');
  function activate(tab){
    tabs.forEach(t=>{ t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
    panels.forEach(p=>p.classList.remove('active'));
    tab.classList.add('active'); tab.setAttribute('aria-selected','true');
    const p=$(`#${tab.dataset.target}`); if(p) p.classList.add('active');
  }
  tabs.forEach(tab=>{
    tab.addEventListener('click',()=>activate(tab));
    tab.addEventListener('keydown',e=>{
      const i=tabs.indexOf(tab);
      if(e.key==='ArrowRight'){ e.preventDefault(); tabs[(i+1)%tabs.length].focus(); }
      if(e.key==='ArrowLeft') { e.preventDefault(); tabs[(i-1+tabs.length)%tabs.length].focus(); }
    });
  });
}

/* ── File helpers ────────────────────────────────────────── */
function ds(){ return new Date().toISOString().slice(0,10); }
function dlFile(name,content,mime){
  const b=new Blob([content],{type:mime}), u=URL.createObjectURL(b);
  const a=document.createElement('a'); a.href=u; a.download=name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u);
}

/* ── Boot ────────────────────────────────────────────────── */
function init(){
  auth();
  renderDashboard();
  renderDaniel();
  renderSonia();
  renderHousehold();
  renderPlanning();
  renderSettings();
  initTabs();
  initEvents();
  initPrivacy();
  refreshSaved();
}
init();
