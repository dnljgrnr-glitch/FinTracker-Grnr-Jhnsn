/**
 * GJ Financial · app.js v7
 * Fixed sliders, wallet tracker, personal dashboards
 */
'use strict';

/* ─── 1. SETUP ─────────────────────────────────────────── */
const DATA = window.FINANCE_DATA;
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const money = n => typeof n==='number' ? n.toLocaleString('en-US',{style:'currency',currency:'USD'}) : (n??'—');
const priv  = v => `<span class="private-value">${money(v)}</span>`;

/* ─── 2. STORAGE ───────────────────────────────────────── */
const LS = {
  get:    (k, fb=null) => { try { const v=localStorage.getItem(k); return v===null?fb:JSON.parse(v); } catch { return fb; } },
  set:    (k, v)       => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} },
  remove: (k)          => { try { localStorage.removeItem(k); } catch {} },
  keys:   (p)          => { try { return Object.keys(localStorage).filter(k=>k.startsWith(p)); } catch { return []; } },
};

/* Goal system — every editable amount lives here */
const goal    = k => LS.get('goal:'+k, DATA.goalDefaults[k] ?? 0);
const setGoal = (k,v) => LS.set('goal:'+k, v);

/* Wallet balances (checking + savings per person) */
const getWallet = (person, acct) => Number(LS.get('wallet:'+person+'-'+acct, 0));
const setWallet = (person, acct, v) => LS.set('wallet:'+person+'-'+acct, v);

/* Spending caps (monthly) */
const monthKey   = () => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); };
const monthLabel = () => new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'});
const getSpent   = (person,cat) => Number(LS.get('spend:'+person+'-'+cat+'-'+monthKey(), 0));
const setSpent   = (person,cat,v) => LS.set('spend:'+person+'-'+cat+'-'+monthKey(), v);

/* ─── 3. AUTH ──────────────────────────────────────────── */
function auth() {
  const loginEl = $('#login');
  if (sessionStorage.getItem('gj-unlocked')==='true') { loginEl.style.display='none'; return; }
  setTimeout(()=>$('#passwordInput')?.focus(), 80);
  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    if ($('#passwordInput').value.trim()===DATA.password) {
      sessionStorage.setItem('gj-unlocked','true');
      loginEl.style.display='none';
    } else {
      const err=$('#loginError');
      err.textContent='Incorrect passcode.';
      $('#passwordInput').value=''; $('#passwordInput').focus();
      setTimeout(()=>{ err.textContent=''; },3000);
    }
  });
  $('#lockBtn')?.addEventListener('click', ()=>{ sessionStorage.removeItem('gj-unlocked'); location.reload(); });
}

/* ─── 4. MATH ──────────────────────────────────────────── */
const payoffMonths = (bal, apr, pmt) => {
  const r=apr/100/12; if(r<=0||pmt<=0||bal<=0) return 0;
  if(pmt<=bal*r) return Infinity;
  return Math.ceil(-Math.log(1-r*bal/pmt)/Math.log(1+r));
};
const totalInterest = (bal, apr, pmt) => { const n=payoffMonths(bal,apr,pmt); return isFinite(n)?Math.max(0,n*pmt-bal):Infinity; };
const moInterest    = (bal, apr) => bal*apr/100/12;
const compoundGrowth= (mo, rate, yrs) => { const r=rate/100/12,n=yrs*12; return r===0?mo*n:mo*((Math.pow(1+r,n)-1)/r)*(1+r); };
const danielShare   = () => { const t=goal('hh-rent')+goal('hh-electric')+goal('hh-internet')+goal('hh-groceries'); return Math.round(t*goal('hh-split-daniel')/100*100)/100; };
const soniaShare    = () => { const t=goal('hh-rent')+goal('hh-electric')+goal('hh-internet')+goal('hh-groceries'); return Math.round(t*(100-goal('hh-split-daniel'))/100*100)/100; };
const datestamp     = () => new Date().toISOString().slice(0,10);

/* ─── 5. UI BUILDERS ───────────────────────────────────── */
function table(hdrs, rows, lbl='Table') {
  return '<div class="table-wrap" tabindex="0" aria-label="'+lbl+'"><table><thead><tr>'+
    hdrs.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+
    rows.map(r=>'<tr>'+r.map((c,i)=>i===0?'<th scope="row">'+c+'</th>':'<td>'+c+'</td>').join('')+'</tr>').join('')+
    '</tbody></table></div>';
}
const card  = (t,b,s='span-6') => '<div class="card '+s+'"><h2>'+t+'</h2>'+b+'</div>';
const notice= t => '<div class="notice"><strong>⚠️</strong> '+t+'</div>';
const tip   = t => '<div class="pro-tip"><strong>💡</strong>'+t+'</div>';

function checklist(id, items) {
  const saved=LS.get('checks:'+id,{});
  const done=items.filter((_,i)=>saved[i]).length;
  return '<p class="checklist-summary" id="'+id+'-sum">'+done+' of '+items.length+' complete</p>'+
    '<div class="checklist">'+items.map((item,i)=>
      '<div class="check-row '+(saved[i]?'done':'')+'">'+
      '<input type="checkbox" id="'+id+'-'+i+'" data-list="'+id+'" data-index="'+i+'" '+(saved[i]?'checked':'')+' />'+
      '<label for="'+id+'-'+i+'">'+item+'</label></div>').join('')+'</div>';
}

/* ─── 6. SLIDER SYSTEM (fixed) ─────────────────────────
 * gslider(storeKey, label, icon, type, maxGoalKey, maxDefault)
 *   storeKey   — localStorage key (stored as track:{storeKey})
 *   type       — 'debt' | 'savings' | 'spend'
 *   maxGoalKey — goal() key for the max/target value
 *   maxDefault — fallback if goal key is 0
 *
 * For DEBT:   slider value = current remaining balance (drag left = paid off)
 * For SAVINGS/SPEND: slider value = current amount (drag right = more)
 ──────────────────────────────────────────────────────── */
function gslider(storeKey, label, icon, type, maxGoalKey, maxDefault) {
  const maxVal  = goal(maxGoalKey) || maxDefault || 1;
  const defVal  = type==='debt' ? maxVal : 0;
  const curVal  = Math.max(0, Math.min(maxVal, Number(LS.get('track:'+storeKey, defVal))));
  const step    = maxVal>10000?50 : maxVal>1000?10 : maxVal>100?5 : 1;

  let pct, v1, v2, l1, l2, fillCls;
  if (type==='debt') {
    pct    = maxVal>0 ? Math.max(0,Math.min(100,(1-curVal/maxVal)*100)) : 0;
    v1=curVal; v2=maxVal-curVal; l1='Remaining'; l2='Paid Down';
    fillCls= pct>=100?'full':'debt';
  } else {
    pct    = maxVal>0 ? Math.min(100,(curVal/maxVal)*100) : 0;
    v1=curVal; v2=maxVal-curVal; l1='Saved'; l2='To Goal';
    fillCls= pct>=100?'full': pct>=60?'':'warn';
  }

  return '<div class="gslider" data-sk="'+storeKey+'" data-type="'+type+'" data-max-key="'+maxGoalKey+'"'+
    ' data-max="'+maxVal+'" data-min="0">'+
    '<div class="gslider-head">'+
      '<span class="gslider-icon">'+icon+'</span>'+
      '<span class="gslider-label">'+label+'</span>'+
      '<span class="gslider-pct" id="gsp-'+storeKey+'">'+Math.round(pct)+'%</span>'+
    '</div>'+
    '<div class="gslider-bar"><div class="gslider-fill '+fillCls+'" id="gsf-'+storeKey+'" style="width:'+pct+'%"></div></div>'+
    '<div class="gslider-stats">'+
      '<div class="gslider-stat">'+
        '<span class="gslider-stat-val '+(type==='debt'?'bad':'good')+' private-value" id="gsv1-'+storeKey+'">'+money(v1)+'</span>'+
        '<span class="gslider-stat-lbl">'+l1+'</span>'+
      '</div>'+
      '<div class="gslider-stat">'+
        '<span class="gslider-stat-val private-value" id="gsv2-'+storeKey+'">'+money(v2)+'</span>'+
        '<span class="gslider-stat-lbl">'+l2+'</span>'+
      '</div>'+
    '</div>'+
    '<div class="gslider-controls">'+
      '<input type="range" min="0" max="'+maxVal+'" step="'+step+'" value="'+curVal+'"'+
        ' data-si="'+storeKey+'" aria-label="'+label+'" />'+
      '<div class="gslider-edit-row">'+
        '<label class="gslider-edit-lbl">Goal:<input type="number" step="'+step+'" value="'+maxVal+'"'+
          ' data-goal="'+maxGoalKey+'" data-si-goal="'+storeKey+'" class="gslider-goal-input" /></label>'+
        '<span class="gslider-cur-lbl">Now:<input type="number" step="'+step+'" value="'+curVal+'"'+
          ' data-si-num="'+storeKey+'" class="gslider-cur-input" aria-label="Current value" /></span>'+
      '</div>'+
    '</div>'+
  '</div>';
}

/* ─── 7. WALLET CARD ───────────────────────────────────── */
function walletCard(person) {
  const name    = person==='daniel' ? 'Daniel' : 'Sonia';
  const accent  = person==='daniel' ? 'var(--brand)' : 'var(--good)';
  const checking= getWallet(person,'checking');
  const savings = getWallet(person,'savings');
  const total   = checking+savings;
  return '<div class="wallet-card" style="border-top-color:'+accent+'">'+
    '<div class="wallet-header">'+
      '<span class="wallet-name">'+name+'\'s Wallet</span>'+
      '<span class="wallet-total private-value" id="wt-'+person+'">'+money(total)+'</span>'+
    '</div>'+
    '<div class="wallet-row">'+
      '<span class="wallet-lbl">💵 Checking</span>'+
      '<input type="number" step="0.01" value="'+checking+'" data-wallet="'+person+'-checking"'+
        ' aria-label="'+name+' checking" class="wallet-input" />'+
    '</div>'+
    '<div class="wallet-row">'+
      '<span class="wallet-lbl">🏦 Savings</span>'+
      '<input type="number" step="0.01" value="'+savings+'" data-wallet="'+person+'-savings"'+
        ' aria-label="'+name+' savings" class="wallet-input" />'+
    '</div>'+
    '<div class="wallet-total-row">'+
      '<span>Total on hand</span>'+
      '<strong class="private-value" id="wt-total-'+person+'">'+money(total)+'</strong>'+
    '</div>'+
  '</div>';
}

/* ─── 8. RENDER DASHBOARD ──────────────────────────────── */
function renderDashboard() {
  const totalDebt = goal('d-visa-bal')+goal('d-vehicle-bal')+goal('d-apple-bal')+goal('s-nw-bal')+goal('s-family-bal');
  const totalSav  = getWallet('daniel','savings')+getWallet('sonia','savings');
  const nw        = totalSav - totalDebt;

  $('#dashboard').innerHTML =
    '<div class="hero-grid">'+
      '<div class="hero-stat"><span class="hero-val brand private-value">'+money(goal('d-income')+goal('s-income'))+'</span><span class="hero-lbl">Combined Income</span></div>'+
      '<div class="hero-stat"><span class="hero-val bad private-value">'+money(Math.round(totalDebt))+'</span><span class="hero-lbl">Total Debt</span><span class="hero-sub">decreasing</span></div>'+
      '<div class="hero-stat"><span class="hero-val '+(nw>=0?'good':'bad')+' private-value">'+money(Math.round(nw))+'</span><span class="hero-lbl">Est. Net Worth</span><span class="hero-sub">'+(nw<0?'improving':'positive')+'</span></div>'+
    '</div>'+
    '<div class="grid">'+
      card('Daniel\'s Wallet', walletCard('daniel'), 'span-6')+
      card('Sonia\'s Wallet',  walletCard('sonia'),  'span-6')+

      card('Daniel — Goal Trackers',
        gslider('d-move',    'Move Fund',         '🏠','savings','d-move-target',  1950)+
        gslider('d-visa',    'NFCU Visa Payoff',  '💳','debt',   'd-visa-bal',     9315.95)+
        gslider('d-vehicle', 'Vehicle Loan',      '🚗','debt',   'd-vehicle-bal',  22010.21)+
        gslider('d-apple',   'Apple Card',        '🍎','debt',   'd-apple-bal',    930.39),
      'span-6')+

      card('Sonia — Goal Trackers',
        gslider('s-nw',      'NW Bank Loan',      '📋','debt',   's-nw-bal',       2266.02)+
        gslider('s-family',  'Family Debt',       '🤝','debt',   's-family-bal',   10000)+
        gslider('s-savings', 'Emergency Savings', '🛟','savings','s-savings-target',2500),
      'span-6')+

      card('Daniel — Spending ('+monthLabel()+')', spendingMini('daniel'), 'span-6')+
      card('Sonia — Spending ('+monthLabel()+')',  spendingMini('sonia'),  'span-6')+

      card('Operating Rule', tip('Every paycheck is assigned before spending starts. No discretionary spending until bills, debt, and savings are covered first.'), 'span-12')+
    '</div>';
}

/* ─── 9. SPENDING MINI (dashboard) ─────────────────────── */
function spendingMini(person) {
  return DATA.spendingCaps[person].map(c=>{
    const spent=getSpent(person,c.id), cap=goal('cap-'+person+'-'+c.id);
    const pct=cap>0?Math.min(100,spent/cap*100):0;
    const cls=pct>=100?'over':pct>=75?'warn':'';
    return '<div class="spend-mini-row">'+
      '<span class="spend-mini-label">'+c.label+'</span>'+
      '<div class="spend-mini-bar"><div class="spend-mini-fill '+cls+'" style="width:'+pct+'%"></div></div>'+
      '<span class="spend-mini-pct">'+Math.round(pct)+'%</span>'+
    '</div>';
  }).join('');
}

/* ─── 10. SPENDING CAPS (full) ─────────────────────────── */
function spendingFull(person) {
  return '<div class="cap-month-header">'+
    '<span class="month-badge">'+monthLabel()+'</span>'+
    '<button class="btn-ghost" style="font-size:.76rem;padding:4px 10px" data-reset-spend="'+person+'">Reset Month</button>'+
  '</div>'+
  DATA.spendingCaps[person].map(c=>{
    const spent=getSpent(person,c.id), cap=goal('cap-'+person+'-'+c.id);
    const pct=cap>0?Math.min(200,spent/cap*100):0;
    const cls=pct>=100?'over':pct>=75?'warn':'';
    const stCls=pct>=100?'over':pct>=75?'warn':'ok';
    const stMsg=pct>=100?'🔴 Over by '+money(spent-cap):pct>=75?'⚠️ '+money(cap-spent)+' left':'✓ '+money(cap-spent)+' remaining';
    return '<div class="cap-row">'+
      '<div class="cap-row-header"><span class="cap-label">'+c.label+'</span><span class="cap-amounts private-value">'+money(spent)+' / '+money(cap)+'</span></div>'+
      '<div class="cap-bar"><div class="cap-fill '+cls+'" style="width:'+Math.min(100,pct)+'%"></div></div>'+
      '<div class="cap-input-row">'+
        '<label>Spent<input type="number" step="0.01" min="0" value="'+spent+'" data-spend="'+person+':'+c.id+'" /></label>'+
        '<label>Cap<input type="number" step="1" min="0" value="'+cap+'" data-goal="cap-'+person+'-'+c.id+'" /></label>'+
      '</div>'+
      '<p class="cap-status '+stCls+'">'+stMsg+'</p>'+
    '</div>';
  }).join('');
}

/* ─── 11. PAYOFF CALCULATOR SLIDER ────────────────────── */
function payoffCalc(sid, balKey, aprKey, minKey, label) {
  const bal=goal(balKey), apr=goal(aprKey), minP=goal(minKey);
  const maxP=Math.ceil(minP*3/50)*50;
  const initP=Math.max(minP,Math.min(maxP,LS.get('pslider:'+sid,Math.round((minP+maxP*.4)/10)*10)));
  const n=payoffMonths(bal,apr,initP), ti=totalInterest(bal,apr,initP);
  const nMin=payoffMonths(bal,apr,minP), tMin=totalInterest(bal,apr,minP);
  const sv=Math.max(0,(isFinite(tMin)?tMin:0)-(isFinite(ti)?ti:0));
  return '<p class="section-note">Balance '+priv(bal)+' · APR <strong>'+apr+'%</strong></p>'+
    '<div class="slider-section">'+
      '<label>Monthly payment <span id="psv-'+sid+'" class="private-value">'+money(initP)+'</span></label>'+
      '<input type="range" min="'+minP+'" max="'+maxP+'" step="10" value="'+initP+'"'+
        ' data-psi="'+sid+'" data-bal="'+balKey+'" data-apr="'+aprKey+'" data-min="'+minKey+'" />'+
      '<div class="slider-range-labels"><span class="private-value">'+money(minP)+' min</span><span class="private-value">'+money(maxP)+'</span></div>'+
    '</div>'+
    '<div class="payoff-output">'+
      '<div class="payoff-stat"><span class="payoff-stat-val good" id="pom-'+sid+'">'+(isFinite(n)?n:'∞')+'</span><span class="payoff-stat-lbl">Months</span></div>'+
      '<div class="payoff-stat"><span class="payoff-stat-val bad private-value" id="poi-'+sid+'">'+(isFinite(ti)?money(Math.round(ti)):'∞')+'</span><span class="payoff-stat-lbl">Total Interest</span></div>'+
      '<div class="payoff-vs-min" id="pov-'+sid+'">vs. minimum '+nMin+' months · <strong class="private-value">save '+money(Math.round(sv))+'</strong></div>'+
    '</div>';
}

/* ─── 12. SUB-TAB BUILDER ──────────────────────────────── */
function buildSubTabs(group, tabs, panels) {
  const last=sessionStorage.getItem('st:'+group)||tabs[0].id;
  return '<nav class="sub-tabs" role="tablist">'+
    tabs.map(t=>'<button class="sub-tab'+(t.id===last?' active':'')+'" role="tab"'+
      ' aria-selected="'+(t.id===last)+'" data-subtab="'+t.id+'" data-subtab-group="'+group+'">'+t.label+'</button>').join('')+
  '</nav>'+
  tabs.map(t=>'<div id="sp-'+group+'-'+t.id+'" class="sub-panel'+(t.id===last?' active':'')+'" role="tabpanel">'+
    (panels[t.id]||'')+'</div>').join('');
}

function initSubTabs() {
  document.addEventListener('click', e=>{
    const btn=e.target.closest('.sub-tab'); if(!btn) return;
    const group=btn.dataset.subtabGroup, id=btn.dataset.subtab;
    $$('[data-subtab-group="'+group+'"].sub-tab').forEach(b=>{ b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    $$('[id^="sp-'+group+'-"]').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active'); btn.setAttribute('aria-selected','true');
    document.getElementById('sp-'+group+'-'+id)?.classList.add('active');
    sessionStorage.setItem('st:'+group,id);
  });
}

/* ─── 13. RENDER DANIEL ─────────────────────────────────── */
function renderDaniel() {
  const D=DATA.daniel;
  const tabs=[
    {id:'wallet',   label:'💵 Wallet'},
    {id:'debt',     label:'Debt'},
    {id:'spending', label:'Spending'},
    {id:'paychecks',label:'Paychecks'},
    {id:'budget',   label:'Budget'},
    {id:'checklist',label:'Checklist'},
  ];
  const panels={
    wallet:
      '<div class="grid">'+
      card('Daniel\'s Wallet', walletCard('daniel')+
        '<div style="margin-top:14px">'+
          '<div class="metric"><span>Monthly income</span><strong class="private-value" id="d-income-disp">'+money(goal('d-income'))+'</strong></div>'+
          '<div class="metric"><span>Household share ('+goal('hh-split-daniel')+'%)</span><strong class="private-value">'+money(danielShare())+'/mo</strong></div>'+
          '<div class="metric"><span>Move fund target</span><strong class="private-value">'+money(goal('d-move-target'))+' by July 10</strong></div>'+
          notice('EasyStart Certificate <strong>$2,137.75</strong> — do NOT touch before 12/06/2026.')+
        '</div>', 'span-6')+
      card('Goal Sliders — drag to update',
        gslider('d-move',    'Move Fund',        '🏠','savings','d-move-target', 1950)+
        gslider('d-visa',    'NFCU Visa Payoff', '💳','debt',   'd-visa-bal',    9315.95)+
        gslider('d-vehicle', 'Vehicle Loan',     '🚗','debt',   'd-vehicle-bal', 22010.21)+
        gslider('d-apple',   'Apple Card',       '🍎','debt',   'd-apple-bal',   930.39),
      'span-6')+
      '</div>',

    debt:
      '<div class="grid">'+
      card('Debt Snapshot', table(
        ['Debt','Balance','APR','Payment'],
        [
          ['NFCU Visa',  priv(goal('d-visa-bal')),    goal('d-visa-apr')+'%',    priv(goal('d-visa-min'))+' min / '+priv(goal('d-visa-target'))+' target'],
          ['Vehicle',    priv(goal('d-vehicle-bal')), goal('d-vehicle-apr')+'%', priv(goal('d-vehicle-min'))],
          ['Apple Card', priv(goal('d-apple-bal')),   'TBD',                     priv(goal('d-apple-min'))],
        ], 'Daniel debts'
      ), 'span-6')+
      card('Visa Payoff Calculator',  payoffCalc('d-visa',  'd-visa-bal',    'd-visa-apr',    'd-visa-min',    'Visa'),    'span-6')+
      card('Visa Payoff Scenarios', table(
        ['Scenario','Payment','Timeline'], D.visaTimeline, 'Visa scenarios'
      ), 'span-12')+
      '</div>',

    spending: '<div class="grid">'+card('Monthly Spending Caps', spendingFull('daniel'), 'span-12')+'</div>',

    paychecks:
      '<div class="grid">'+
      card('Paycheck Allocation: June 5 – July 10',
        '<div class="table-wrap" tabindex="0"><table><thead><tr><th>Date</th><th>Amount</th><th>Plan</th><th>Notes</th></tr></thead><tbody>'+
        D.paychecks.map((r,i)=>'<tr><th scope="row">'+r[0]+'</th><td><strong class="private-value">'+r[1]+'</strong></td><td>'+r[2]+'</td>'+
          '<td><textarea rows="2" data-note="d-'+i+'" style="width:100%;font-size:.78rem;background:var(--surface);color:var(--ink);border:1px solid var(--border);border-radius:4px;padding:4px">'+
          (LS.get('notes:d-'+i,'')||'')+'</textarea></td></tr>').join('')+
        '</tbody></table></div>', 'span-12')+
      '</div>',

    budget:
      '<div class="grid">'+
      card('Post-Move Monthly Budget', table(
        ['Category','Amount'],
        [
          ['Household share',         priv(danielShare())],
          ['Vehicle loan',            priv(goal('d-vehicle-min'))],
          ['Visa minimum',            priv(goal('d-visa-min'))],
          ['Visa extra (target)',      priv(goal('d-visa-target'))],
          ['Progressive',             priv(134)],
          ['Verizon',                 priv(120)],
          ['TruStage',                priv(12.50)],
          ['Apple Card',              priv(goal('d-apple-min'))],
          ['Claude + Netflix',        priv(30.73)],
          ['Gas / transport',         priv(goal('cap-daniel-gas'))],
          ['Personal / food / misc',  priv(goal('cap-daniel-personal'))],
          ['Emergency savings',       priv(100)],
        ], 'Daniel budget'
      ), 'span-12')+
      '</div>',

    checklist: '<div class="grid">'+card('Action Checklist', checklist('daniel', D.checklist), 'span-12')+'</div>',
  };
  $('#daniel').innerHTML = buildSubTabs('daniel', tabs, panels);
}

/* ─── 14. RENDER SONIA ─────────────────────────────────── */
function renderSonia() {
  const S=DATA.sonia;
  const tabs=[
    {id:'wallet',   label:'💵 Wallet'},
    {id:'debt',     label:'Debt'},
    {id:'spending', label:'Spending'},
    {id:'paychecks',label:'Paychecks'},
    {id:'budget',   label:'Budget & Savings'},
    {id:'checklist',label:'Checklist'},
  ];
  const panels={
    wallet:
      '<div class="grid">'+
      card('Sonia\'s Wallet', walletCard('sonia')+
        '<div style="margin-top:14px">'+
          '<div class="metric"><span>Monthly income</span><strong class="private-value">'+money(goal('s-income'))+'</strong></div>'+
          '<div class="metric"><span>Household share ('+(100-goal('hh-split-daniel'))+'%)</span><strong class="private-value">'+money(soniaShare())+'/mo</strong></div>'+
          '<div class="metric"><span>NW Loan APR</span><strong class="private-value">'+goal('s-nw-apr')+'%</strong></div>'+
        '</div>', 'span-6')+
      card('Goal Sliders — drag to update',
        gslider('s-nw',      'NW Bank Loan',      '📋','debt',   's-nw-bal',        2266.02)+
        gslider('s-family',  'Family Debt',       '🤝','debt',   's-family-bal',    10000)+
        gslider('s-savings', 'Emergency Savings', '🛟','savings','s-savings-target',2500),
      'span-6')+
      '</div>',

    debt:
      '<div class="grid">'+
      card('Debt Snapshot', table(
        ['Debt','Balance','APR','Payment'],
        [
          ['NW Loan',     priv(goal('s-nw-bal')),     goal('s-nw-apr')+'%', priv(goal('s-nw-min'))],
          ['Family Debt', priv(goal('s-family-bal')), '0%',                 priv(goal('s-family-pmt'))+' → $300 mo 3+'],
          ['Apple Card',  '<em>TBD</em>',              'TBD',               priv(goal('s-apple-min'))],
        ], 'Sonia debts'
      ), 'span-6')+
      card('NW Loan Payoff Calculator', payoffCalc('s-nw', 's-nw-bal', 's-nw-apr', 's-nw-min', 'NW Loan'), 'span-6')+
      card('NW Loan Extra Payment Scenarios', table(
        ['Payment','Payoff','Est. Interest'], S.loanPayoff, 'NW loan options'
      ), 'span-12')+
      '</div>',

    spending: '<div class="grid">'+card('Monthly Spending Caps', spendingFull('sonia'), 'span-12')+'</div>',

    paychecks:
      '<div class="grid">'+
      card('Next Paycheck Allocation', table(
        ['Use','Amount'],
        S.nextPaycheck.map(([a,b])=>[a,'<strong class="private-value">'+b+'</strong>']),
        'Sonia paycheck'
      ), 'span-12')+
      '</div>',

    budget:
      '<div class="grid">'+
      card('Post-Move Monthly Budget', table(
        ['Category','Amount'],
        [
          ['Personal fixed bills',    priv(263.50)],
          ['Household share',         priv(soniaShare())],
          ['Family debt months 1–2',  priv(goal('s-family-pmt'))],
          ['Family debt month 3+',    priv(300)],
          ['Savings / sinking fund',  priv(270)],
          ['Gas',                     priv(120)],
          ['Beauty',                  priv(goal('cap-sonia-beauty'))],
          ['Fast food',               priv(goal('cap-sonia-fastfood'))],
          ['Amazon',                  priv(goal('cap-sonia-amazon'))],
          ['Apple Cash',              priv(goal('cap-sonia-applecash'))],
        ], 'Sonia budget'
      ), 'span-6')+
      card('Apple Savings Targets', table(
        ['Milestone','Target'],
        S.savingsTargets.map(([a,b])=>[a,priv(b)]),
        'Savings milestones'
      ), 'span-6')+
      card('Family Debt Timeline', table(
        ['Milestone','Balance'],
        S.familyDebtTimeline.map(([a,b])=>[a,'<span class="private-value">'+b+'</span>']),
        'Family repayment'
      ), 'span-6')+
      card('Family Repayment Message',
        '<p>Hey, I want to start paying you back consistently. After the move I\'ll start at <strong>$200/month</strong> beginning with my first post-move paycheck. Starting month three I\'ll increase to <strong>$300/month</strong> and keep you updated.</p>',
      'span-6')+
      '</div>',

    checklist: '<div class="grid">'+card('Action Checklist', checklist('sonia', S.checklist), 'span-12')+'</div>',
  };
  $('#sonia').innerHTML = buildSubTabs('sonia', tabs, panels);
}

/* ─── 15. RENDER HOUSEHOLD ─────────────────────────────── */
function renderHousehold() {
  const H=DATA.household;
  const dPct=goal('hh-split-daniel'), sPct=100-dPct;
  const bills=[
    {label:'Rent',      key:'hh-rent'},
    {label:'Electric',  key:'hh-electric'},
    {label:'Internet',  key:'hh-internet'},
    {label:'Groceries', key:'hh-groceries'},
  ];
  const splitRows=bills.map(b=>{
    const amt=goal(b.key), d=Math.round(amt*dPct/100*100)/100, s=Math.round(amt*sPct/100*100)/100;
    return '<div class="split-row"><span>'+b.label+'</span>'+
      '<div><input type="number" step="1" value="'+amt+'" data-goal="'+b.key+'" style="width:80px;padding:5px 6px;text-align:right" /></div>'+
      '<span class="split-cell private-value">'+money(d)+'</span>'+
      '<span class="split-cell private-value">'+money(s)+'</span></div>';
  }).join('');
  const totAmt=bills.reduce((s,b)=>s+goal(b.key),0);
  const nwRows=H.netWorth.map(r=>[
    'Mo '+r[0],
    '<span class="private-value">'+r[1]+'</span>',
    '<span class="private-value">'+r[2]+'</span>',
    '<span class="private-value">'+r[3]+'</span>',
    r[4],
    '<span class="private-value">'+r[5]+'</span>',
    '<span class="private-value">'+r[6]+'</span>',
    '<span class="private-value" style="font-weight:700;color:'+(r[7].startsWith('-')?'var(--bad-light)':'var(--good-light)')+'">'+r[7]+'</span>',
  ]);
  $('#household').innerHTML='<div class="grid">'+
    card('Live Bill Split',
      '<div class="split-row header"><span>Bill</span><span>Amount</span><span class="split-cell">Daniel ('+dPct+'%)</span><span class="split-cell">Sonia ('+sPct+'%)</span></div>'+
      splitRows+
      '<div class="split-row" style="font-weight:700;border-top:2px solid var(--border);padding-top:10px;margin-top:6px">'+
        '<span>Total</span><span class="private-value">'+money(totAmt)+'</span>'+
        '<span class="split-cell private-value">'+money(danielShare())+'</span>'+
        '<span class="split-cell private-value">'+money(soniaShare())+'</span>'+
      '</div>'+
      '<p class="section-note" style="margin-top:10px">Edit amounts above — splits recalculate live.</p>',
    'span-6')+
    card('Debt Payoff Sequence', table(
      ['Priority','Action','Reason'], H.debtSequence, 'Payoff sequence'
    ), 'span-6')+
    card('Net Worth Trajectory — Months 1–36',
      '<p class="section-note">Projection assuming the plan is followed. Negative early is normal.</p>'+
      table(['Mo','Visa','Vehicle','Family','NW Loan','Cash','Invest.','Net Worth'], nwRows, 'Net worth'),
    'span-12')+
  '</div>';
}

/* ─── 16. RENDER PLANNING ──────────────────────────────── */
function renderPlanning() {
  const last=sessionStorage.getItem('st:planning')||'roadmap';
  const tabs=[
    {id:'roadmap',   label:'Roadmap'},
    {id:'investing', label:'Investing'},
    {id:'quarterly', label:'Quarterly'},
    {id:'scenarios', label:'Scenarios'},
  ];

  /* Roadmap */
  const milestones=[
    {label:'Emergency Fund $1,000',  pct:Math.min(100,(getWallet('sonia','savings')/1000)*100),       est:'Immediate'},
    {label:'Move Fund $1,950',       pct:Math.min(100,(Number(LS.get('track:d-move',0))/1950)*100),  est:'July 10, 2026'},
    {label:'NW Loan Paid Off',       pct:Math.min(100,((goal('s-nw-bal')-Number(LS.get('track:s-nw',goal('s-nw-bal'))))/goal('s-nw-bal'))*100), est:'~'+payoffMonths(goal('s-nw-bal'),goal('s-nw-apr'),goal('s-nw-min'))+' months'},
    {label:'Savings $2,500',         pct:Math.min(100,(getWallet('sonia','savings')/2500)*100),       est:'Month 6'},
    {label:'Visa Paid Off',          pct:Math.min(100,((goal('d-visa-bal')-Number(LS.get('track:d-visa',goal('d-visa-bal'))))/goal('d-visa-bal'))*100), est:'~'+payoffMonths(goal('d-visa-bal'),goal('d-visa-apr'),goal('d-visa-min'))+' months'},
    {label:'Family Debt Resolved',   pct:Math.min(100,((goal('s-family-bal')-Number(LS.get('track:s-family',goal('s-family-bal'))))/goal('s-family-bal'))*100), est:'~34 months'},
    {label:'Vehicle Loan Paid Off',  pct:0, est:'~'+payoffMonths(goal('d-vehicle-bal'),goal('d-vehicle-apr'),goal('d-vehicle-min'))+' months'},
    {label:'Start Investing',        pct:0, est:'After Visa payoff'},
  ];
  const roadmapHtml=milestones.map(m=>{
    const done=m.pct>=100;
    return '<div class="roadmap-item">'+
      '<span class="roadmap-icon">'+(done?'✅':'⬜')+'</span>'+
      '<div class="roadmap-body">'+
        '<div class="roadmap-label'+(done?' done':'')+'">'+m.label+'</div>'+
        '<div class="roadmap-meta">'+(done?'Complete':m.est)+'</div>'+
        (!done?'<div class="roadmap-bar"><div class="roadmap-fill" style="width:'+m.pct.toFixed(0)+'%"></div></div>':'')+
      '</div>'+
      (!done?'<div class="roadmap-bar-wrap"><div class="roadmap-pct">'+m.pct.toFixed(0)+'%</div></div>':'')+
    '</div>';
  }).join('');

  /* Compound calc */
  const cmo=Number(LS.get('calc-mo',150)), crate=Number(LS.get('calc-rate',7)), cyrs=Number(LS.get('calc-yrs',10));
  const end=compoundGrowth(cmo,crate,cyrs), contrib=cmo*cyrs*12, growth=end-contrib;
  const calcHtml=
    '<p class="section-note">Model what consistent investing looks like. Use once debt is under control.</p>'+
    '<div class="calc-inputs">'+
      '<label>Monthly<input type="number" step="25" value="'+cmo+'" id="calc-mo" /></label>'+
      '<label>Return %<input type="number" step="0.5" value="'+crate+'" id="calc-rate" /></label>'+
      '<label>Years<input type="number" step="1" value="'+cyrs+'" id="calc-yrs" /></label>'+
    '</div>'+
    '<div class="calc-result">'+
      '<div><span class="calc-result-val private-value">'+money(Math.round(end))+'</span><span class="calc-result-lbl">End Value</span></div>'+
      '<div><span class="calc-result-val private-value" style="color:var(--muted)">'+money(Math.round(contrib))+'</span><span class="calc-result-lbl">Contributed</span></div>'+
      '<div><span class="calc-result-val private-value" style="color:var(--brand-light)">'+money(Math.round(growth))+'</span><span class="calc-result-lbl">Market Growth</span></div>'+
    '</div>'+
    '<div class="calc-projections">'+
      '<div class="calc-proj-item"><span class="calc-proj-val private-value">'+money(Math.round(compoundGrowth(cmo,crate,10)))+'</span><span class="calc-proj-lbl">10 years</span></div>'+
      '<div class="calc-proj-item"><span class="calc-proj-val private-value">'+money(Math.round(compoundGrowth(cmo,crate,20)))+'</span><span class="calc-proj-lbl">20 years</span></div>'+
      '<div class="calc-proj-item"><span class="calc-proj-val private-value">'+money(Math.round(compoundGrowth(cmo,crate,30)))+'</span><span class="calc-proj-lbl">30 years</span></div>'+
      '<div class="calc-proj-item"><span class="calc-proj-val private-value">'+money(cmo*12)+'/yr</span><span class="calc-proj-lbl">Annual</span></div>'+
    '</div>';

  const qItems=['Overdrafts: $0.','Daniel Visa: $0 new charges.','Visa balance fell each month.','Sonia family debt paid every month.','NW loan current or accelerated.','Emergency savings increased.','Bills split at correct %.','Subscriptions stayed flat.','Spending caps respected.','Net worth improved.','Investing only after triggers met.'];
  const scenRows=[
    ['Conservative','Daniel $600/mo to Visa · Sonia follows plan · extra builds reserves','Safer, slower'],
    ['Balanced ✓',  'Daniel $700/mo to Visa · Sonia saves to $2,500 · family debt on track','Recommended'],
    ['Aggressive',  'Daniel $800–$900/mo to Visa · Sonia adds extra to NW loan after month 6','Fastest, higher risk'],
  ];

  const panels={
    roadmap:   '<div class="grid">'+card('Financial Roadmap', roadmapHtml, 'span-12')+'</div>',
    investing: '<div class="grid">'+card('Compound Growth Calculator 📈', calcHtml, 'span-12')+
                 card('Investment Triggers', checklist('invest', [
                   'Daniel: Visa paid off.','Daniel: $1,000+ emergency fund.','Daniel: No new card charges 90 days.',
                   'Sonia: $2,500 emergency fund.','Sonia: No overdrafts 90 days.','Sonia: Family debt below $5,000.','Sonia: NW loan paid or current.',
                 ]), 'span-12')+'</div>',
    quarterly: '<div class="grid">'+card('Quarterly Checklist', checklist('quarterly', qItems), 'span-12')+'</div>',
    scenarios: '<div class="grid">'+card('Plan Scenarios', table(['Scenario','Action','Outcome'], scenRows, 'Scenarios'), 'span-12')+'</div>',
  };
  $('#planning').innerHTML=buildSubTabs('planning', tabs, panels);
}

/* ─── 17. RENDER SETTINGS ──────────────────────────────── */
function renderSettings() {
  const f=(key,lbl,step='0.01')=>'<div class="goal-field"><label>'+lbl+'<input type="number" step="'+step+'" value="'+goal(key)+'" data-goal="'+key+'" /></label></div>';
  const goalsHtml=
    '<p class="section-note">Every value here flows live through the entire app instantly.</p>'+
    '<div class="goals-section-title">Daniel — Debts</div><div class="goal-grid">'+
      f('d-visa-bal','Visa Balance')+f('d-visa-min','Visa Min')+f('d-visa-target','Visa Target Pmt')+f('d-visa-apr','Visa APR %')+
      f('d-vehicle-bal','Vehicle Balance')+f('d-vehicle-min','Vehicle Min')+f('d-vehicle-apr','Vehicle APR %')+
      f('d-apple-bal','Apple Balance')+f('d-apple-min','Apple Min')+
    '</div>'+
    '<div class="goals-section-title">Daniel — Goals</div><div class="goal-grid">'+
      f('d-move-target','Move Fund Target')+f('d-income','Monthly Income')+
    '</div>'+
    '<div class="goals-section-title">Sonia — Debts</div><div class="goal-grid">'+
      f('s-nw-bal','NW Loan Balance')+f('s-nw-min','NW Loan Min')+f('s-nw-apr','NW Loan APR %')+
      f('s-family-bal','Family Debt')+f('s-family-pmt','Family Payment')+f('s-apple-min','Apple Min')+
    '</div>'+
    '<div class="goals-section-title">Sonia — Goals</div><div class="goal-grid">'+
      f('s-savings-target','Savings Goal')+f('s-income','Monthly Income')+
    '</div>'+
    '<div class="goals-section-title">Household</div><div class="goal-grid">'+
      f('hh-rent','Rent')+f('hh-electric','Electric')+f('hh-internet','Internet')+f('hh-groceries','Groceries')+
      f('hh-split-daniel',"Daniel Split %",'1')+
    '</div>'+
    '<div class="goals-section-title">Spending Caps — Daniel</div><div class="goal-grid">'+
      f('cap-daniel-gas','Gas/Transport')+f('cap-daniel-personal','Personal/Food')+f('cap-daniel-fastfood','Fast Food')+f('cap-daniel-online','Online Shopping')+
    '</div>'+
    '<div class="goals-section-title">Spending Caps — Sonia</div><div class="goal-grid">'+
      f('cap-sonia-beauty','Beauty')+f('cap-sonia-fastfood','Fast Food')+f('cap-sonia-amazon','Amazon')+f('cap-sonia-applecash','Apple Cash')+
    '</div>';

  const logHtml=renderBalanceLog();

  $('#settings').innerHTML='<div class="grid">'+
    card('Goals & Limits — Live Editor', goalsHtml, 'span-12')+
    card('Monthly Balance Snapshot', logHtml, 'span-12')+
    card('Export', '<p class="section-note">Download all progress data.</p><div class="btn-group"><button id="exportJsonBtn" class="btn-primary">Export JSON</button><button id="exportCsvBtn" class="btn-secondary">Export CSV</button></div><pre id="exportOut" class="callout" style="margin-top:10px;display:none"></pre>', 'span-6')+
    card('Import', '<p class="section-note">Restore a backup on a new device.</p><div class="field-group" style="margin-top:8px"><label for="importFile">Select JSON file</label><input type="file" id="importFile" accept=".json" /></div><button id="importBtn" class="btn-primary" style="margin-top:8px">Import & Restore</button><p id="importStatus" role="alert" style="margin-top:8px;font-size:.84rem"></p>', 'span-6')+
    card('Security', notice('Passcode is client-side only. Use a private GitHub repo. Never store account numbers or SSNs.')+'<p>All data stays on this device in localStorage.</p>', 'span-6')+
    card('Reset', '<p class="section-note">Clears all saved data on this device.</p><button id="resetBtn2" class="btn-danger" style="margin-top:8px">Reset Everything</button>', 'span-6')+
  '</div>';
  bindSettingsEvents();
}

function renderBalanceLog() {
  const log=LS.get('balancelog',[]);
  const today=datestamp();
  const formHtml=
    '<p class="section-note">Log balances monthly to track real progress over time.</p>'+
    '<div class="log-form-grid">'+
      '<label>Daniel Visa<input type="number" step="0.01" id="log-dv" value="'+goal('d-visa-bal')+'" /></label>'+
      '<label>Vehicle<input type="number" step="0.01" id="log-dveh" value="'+goal('d-vehicle-bal')+'" /></label>'+
      '<label>Apple<input type="number" step="0.01" id="log-da" value="'+goal('d-apple-bal')+'" /></label>'+
      '<label>NW Loan<input type="number" step="0.01" id="log-sn" value="'+goal('s-nw-bal')+'" /></label>'+
      '<label>Family Debt<input type="number" step="0.01" id="log-sf" value="'+goal('s-family-bal')+'" /></label>'+
      '<label>Sonia Savings<input type="number" step="0.01" id="log-ss" value="'+getWallet('sonia','savings')+'" /></label>'+
      '<label>Daniel Savings<input type="number" step="0.01" id="log-ds" value="'+getWallet('daniel','savings')+'" /></label>'+
      '<label>Date<input type="date" id="log-dt" value="'+today+'" /></label>'+
    '</div>'+
    '<button id="logEntryBtn" class="btn-primary">📋 Log Snapshot</button>'+
    '<p id="logStatus" role="alert" style="font-size:.84rem;margin-top:6px"></p>';
  if (!log.length) return formHtml;
  const rows=[...log].reverse().slice(0,18).map((e,i)=>{
    const prev=log[log.length-2-i];
    const debt=(e.dv||0)+(e.dveh||0)+(e.da||0)+(e.sn||0)+(e.sf||0);
    const sav=(e.ds||0)+(e.ss||0);
    const nw=sav-debt;
    const prevNW=prev?((prev.ds||0)+(prev.ss||0))-((prev.dv||0)+(prev.dveh||0)+(prev.da||0)+(prev.sn||0)+(prev.sf||0)):null;
    const trend=prevNW!==null?(nw>prevNW?'<span class="trend-up">↑'+money(Math.round(nw-prevNW))+'</span>':nw<prevNW?'<span class="trend-down">↓'+money(Math.round(prevNW-nw))+'</span>':'<span class="trend-flat">—</span>'):'<span class="trend-flat">—</span>';
    return [e.dt||'—','<span class="private-value">'+money(e.dv)+'</span>','<span class="private-value">'+money(e.sn)+'</span>','<span class="private-value">'+money(sav)+'</span>','<span class="private-value" style="font-weight:700;color:'+(nw>=0?'var(--good-light)':'var(--bad-light)')+'">'+money(Math.round(nw))+'</span>',trend];
  });
  return formHtml+'<div class="log-history-wrap"><p class="log-history-title">Snapshot History</p>'+
    table(['Date','Visa','NW Loan','Savings','Net Worth','Δ'],rows,'Balance history')+
    '<button id="clearLogBtn" class="btn-ghost" style="margin-top:8px;font-size:.78rem">Clear History</button></div>';
}

function bindSettingsEvents() {
  const allKeys=()=>[...LS.keys('goal:'),...LS.keys('track:'),...LS.keys('wallet:'),...LS.keys('checks:'),...LS.keys('spend:'),...LS.keys('pslider:'),...LS.keys('notes:')];

  $('#exportJsonBtn')?.addEventListener('click',()=>{
    const out={}; allKeys().forEach(k=>{out[k]=LS.get(k);}); out['balancelog']=LS.get('balancelog'); out['lastUpdated']=LS.get('lastUpdated');
    const json=JSON.stringify(out,null,2);
    dlFile('gj-'+datestamp()+'.json',json,'application/json');
    const pre=$('#exportOut'); pre.textContent=json; pre.style.display='block';
  });

  $('#exportCsvBtn')?.addEventListener('click',()=>{
    const rows=[['Key','Value','ExportedAt']]; const now=new Date().toISOString();
    allKeys().forEach(k=>rows.push([k,LS.get(k),now]));
    dlFile('gj-'+datestamp()+'.csv',rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n'),'text/csv');
  });

  $('#importBtn')?.addEventListener('click',()=>{
    const file=$('#importFile')?.files[0]; const stat=$('#importStatus');
    if(!file){stat.textContent='⚠️ Select a file first.';return;}
    const reader=new FileReader();
    reader.onload=e=>{
      try {
        const imp=JSON.parse(e.target.result); let n=0;
        Object.entries(imp).forEach(([k,v])=>{ if(['balancelog','lastUpdated'].includes(k)||['goal:','track:','wallet:','checks:','spend:','pslider:','notes:'].some(p=>k.startsWith(p))){LS.set(k,v);n++;} });
        stat.textContent='✅ Imported '+n+' items. Reloading…'; stat.style.color='var(--good-light)';
        setTimeout(()=>location.reload(),1200);
      } catch { stat.textContent='❌ Invalid file.'; stat.style.color='var(--bad-light)'; }
    };
    reader.readAsText(file);
  });

  $('#resetBtn2')?.addEventListener('click',()=>{
    if(!confirm('Clear ALL saved data? Cannot be undone.'))return;
    allKeys().forEach(k=>LS.remove(k)); ['balancelog','lastUpdated'].forEach(k=>LS.remove(k)); location.reload();
  });

  $('#logEntryBtn')?.addEventListener('click',()=>{
    const e={dt:$('#log-dt')?.value||datestamp(),dv:parseFloat($('#log-dv')?.value)||0,dveh:parseFloat($('#log-dveh')?.value)||0,da:parseFloat($('#log-da')?.value)||0,sn:parseFloat($('#log-sn')?.value)||0,sf:parseFloat($('#log-sf')?.value)||0,ss:parseFloat($('#log-ss')?.value)||0,ds:parseFloat($('#log-ds')?.value)||0};
    setGoal('d-visa-bal',e.dv); setGoal('d-vehicle-bal',e.dveh); setGoal('d-apple-bal',e.da);
    setGoal('s-nw-bal',e.sn); setGoal('s-family-bal',e.sf);
    setWallet('sonia','savings',e.ss); setWallet('daniel','savings',e.ds);
    const log=LS.get('balancelog',[]); log.push(e); LS.set('balancelog',log);
    touchLastUpdated(); showToast('Snapshot saved ✓');
    const s=$('#logStatus'); if(s){s.textContent='✅ Saved for '+e.dt; s.style.color='var(--good-light)';}
    renderAll(); setTimeout(()=>renderSettings(),400);
  });

  $('#clearLogBtn')?.addEventListener('click',()=>{ if(!confirm('Clear history?'))return; LS.remove('balancelog'); renderSettings(); showToast('Log cleared'); });
}

/* ─── 18. TABS ─────────────────────────────────────────── */
function initTabs() {
  const tabs=$$('.tab');
  function activate(tab) {
    tabs.forEach(t=>{t.classList.remove('active');t.setAttribute('aria-selected','false');});
    $$('.panel').forEach(p=>p.classList.remove('active'));
    tab.classList.add('active'); tab.setAttribute('aria-selected','true');
    document.getElementById(tab.dataset.target)?.classList.add('active');
  }
  tabs.forEach(tab=>{
    tab.addEventListener('click',()=>activate(tab));
    tab.addEventListener('keydown',e=>{
      const i=tabs.indexOf(tab);
      if(e.key==='ArrowRight'){e.preventDefault();tabs[(i+1)%tabs.length].focus();}
      if(e.key==='ArrowLeft'){e.preventDefault();tabs[(i-1+tabs.length)%tabs.length].focus();}
    });
  });
}

/* ─── 19. EVENTS ───────────────────────────────────────── */
function initEvents() {

  /* Checklists */
  document.addEventListener('change', e=>{
    if (e.target.matches('input[type="checkbox"][data-list]')) {
      const {list,index}=e.target.dataset;
      const saved=LS.get('checks:'+list,{}); saved[index]=e.target.checked;
      LS.set('checks:'+list,saved);
      e.target.closest('.check-row').classList.toggle('done',e.target.checked);
      touchLastUpdated();
      const boxes=$$('input[data-list="'+list+'"]');
      const done=boxes.filter(b=>b.checked).length;
      const sum=document.getElementById(list+'-sum'); if(sum) sum.textContent=done+' of '+boxes.length+' complete';
    }

    /* Goal inputs — settings editor, caps, bill split */
    if (e.target.matches('input[data-goal]')) {
      const key=e.target.dataset.goal, val=parseFloat(e.target.value);
      if(!isNaN(val)){ setGoal(key,val); touchLastUpdated(); showToast('Saved ✓'); renderAll(); }
    }

    /* Wallet inputs */
    if (e.target.matches('input[data-wallet]')) {
      const [person,acct]=e.target.dataset.wallet.split('-');
      const val=parseFloat(e.target.value)||0;
      setWallet(person,acct,val); touchLastUpdated(); showToast('Wallet updated ✓');
      /* Update totals in place */
      const checking=getWallet(person,'checking'), savings=getWallet(person,'savings');
      const tot=checking+savings;
      const totEl=document.getElementById('wt-total-'+person); if(totEl) totEl.textContent=money(tot);
      const totEl2=document.getElementById('wt-'+person); if(totEl2) totEl2.textContent=money(tot);
      if($('#dashboard')?.classList.contains('active')) renderDashboard();
    }

    /* Spending inputs */
    if (e.target.matches('input[data-spend]')) {
      const [person,cat]=e.target.dataset.spend.split(':');
      const val=parseFloat(e.target.value)||0;
      setSpent(person,cat,val); touchLastUpdated(); showToast('Spending updated ✓'); renderAll();
    }

    /* Goal slider — goal amount edit (updates max of slider) */
    if (e.target.matches('input[data-si-goal]')) {
      const sk=e.target.dataset.siGoal, goalKey=e.target.dataset.goal;
      const newMax=parseFloat(e.target.value)||1;
      if(goalKey){setGoal(goalKey,newMax); touchLastUpdated(); showToast('Goal updated ✓');}
      /* Update slider max in place */
      const sliderEl=$('input[data-si="'+sk+'"]');
      if(sliderEl){
        sliderEl.max=newMax;
        sliderEl.closest('[data-sk]')?.setAttribute('data-max',newMax);
      }
      renderAll();
    }

    /* Goal slider — current value number input */
    if (e.target.matches('input[data-si-num]')) {
      const sk=e.target.dataset.siNum;
      const val=Math.max(0,parseFloat(e.target.value)||0);
      LS.set('track:'+sk,val); touchLastUpdated(); updateSliderUI(sk,val);
    }

    /* Paycheck notes */
    if (e.target.matches('textarea[data-note]')) {
      LS.set('notes:'+e.target.dataset.note, e.target.value); touchLastUpdated();
    }

    /* Compound calculator */
    if(['calc-mo','calc-rate','calc-yrs'].includes(e.target.id)) {
      LS.set(e.target.id,parseFloat(e.target.value)); renderPlanning();
    }
  });

  /* SLIDER DRAG — fires on every move */
  document.addEventListener('input', e=>{

    /* Goal sliders */
    if (e.target.matches('input[data-si]')) {
      const sk=e.target.dataset.si;
      const val=parseFloat(e.target.value);
      LS.set('track:'+sk, val);
      touchLastUpdated();
      updateSliderUI(sk, val);
    }

    /* Payoff calculator sliders */
    if (e.target.matches('input[data-psi]')) {
      const sid=e.target.dataset.psi;
      const pmt=parseFloat(e.target.value);
      const bal=goal(e.target.dataset.bal), apr=goal(e.target.dataset.apr), min=goal(e.target.dataset.min);
      LS.set('pslider:'+sid, pmt);
      const n=payoffMonths(bal,apr,pmt), ti=totalInterest(bal,apr,pmt);
      const nM=payoffMonths(bal,apr,min), tM=totalInterest(bal,apr,min);
      const sv=Math.max(0,(isFinite(tM)?tM:0)-(isFinite(ti)?ti:0));
      const svEl=document.getElementById('psv-'+sid); if(svEl) svEl.textContent=money(pmt);
      const mEl=document.getElementById('pom-'+sid);  if(mEl)  mEl.textContent=isFinite(n)?n:'∞';
      const iEl=document.getElementById('poi-'+sid);  if(iEl)  iEl.textContent=isFinite(ti)?money(Math.round(ti)):'∞';
      const vEl=document.getElementById('pov-'+sid);  if(vEl)  vEl.innerHTML='vs. minimum '+nM+' months · <strong class="private-value">save '+money(Math.round(sv))+'</strong>';
    }
  });

  /* Reset spending month */
  document.addEventListener('click', e=>{
    if(e.target.matches('[data-reset-spend]')){
      const person=e.target.dataset.resetSpend;
      if(!confirm('Reset '+person+'\'s spending for '+monthLabel()+'?'))return;
      DATA.spendingCaps[person].forEach(c=>LS.remove('spend:'+person+'-'+c.id+'-'+monthKey()));
      showToast('Month reset ✓'); renderAll();
    }
  });

  /* Header buttons */
  $('#printBtn')?.addEventListener('click',()=>window.print());
  $('#resetBtn')?.addEventListener('click',()=>{
    if(!confirm('Clear all saved data?'))return;
    [...LS.keys('goal:'),...LS.keys('track:'),...LS.keys('wallet:'),...LS.keys('checks:'),...LS.keys('spend:'),...LS.keys('pslider:'),...LS.keys('notes:')].forEach(k=>LS.remove(k));
    ['balancelog','lastUpdated'].forEach(k=>LS.remove(k));
    location.reload();
  });
}

/* Update a goal slider's UI elements without re-rendering the whole section */
function updateSliderUI(sk, val) {
  const wrap=document.querySelector('[data-sk="'+sk+'"]');
  if(!wrap) return;
  const type=wrap.dataset.type;
  const maxVal=parseFloat(wrap.dataset.max||1);
  let pct;
  if(type==='debt'){
    pct=maxVal>0?Math.max(0,Math.min(100,(1-val/maxVal)*100)):0;
    const v1=document.getElementById('gsv1-'+sk); if(v1) v1.textContent=money(val);
    const v2=document.getElementById('gsv2-'+sk); if(v2) v2.textContent=money(maxVal-val);
  } else {
    pct=maxVal>0?Math.min(100,(val/maxVal)*100):0;
    const v1=document.getElementById('gsv1-'+sk); if(v1) v1.textContent=money(val);
    const v2=document.getElementById('gsv2-'+sk); if(v2) v2.textContent=money(Math.max(0,maxVal-val));
  }
  const pctEl=document.getElementById('gsp-'+sk); if(pctEl) pctEl.textContent=Math.round(pct)+'%';
  const fill=document.getElementById('gsf-'+sk);
  if(fill){ fill.style.width=pct+'%'; fill.className='gslider-fill'+(type==='debt'?' debt':'')+(pct>=100?' full':''); }
  /* Also sync the number input */
  const numInput=document.querySelector('input[data-si-num="'+sk+'"]'); if(numInput) numInput.value=val;
  /* Sync the range input */
  const rangeInput=document.querySelector('input[data-si="'+sk+'"]'); if(rangeInput) rangeInput.value=val;
}

/* ─── 20. UTILITIES ────────────────────────────────────── */
const dlFile = (name,content,type) => {
  const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([content],{type})),download:name});
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
};

function showToast(msg) {
  let t=document.getElementById('gj-toast');
  if(!t){t=Object.assign(document.createElement('div'),{id:'gj-toast',className:'save-toast'});document.body.appendChild(t);}
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2000);
}

function refreshLastUpdated() {
  const el=document.getElementById('lastUpdatedDisplay'); if(!el) return;
  const ts=LS.get('lastUpdated');
  if(ts){const d=new Date(ts);el.textContent='Saved '+d.toLocaleDateString()+' '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}
  else el.textContent='';
}
function touchLastUpdated(){LS.set('lastUpdated',new Date().toISOString());refreshLastUpdated();}

function renderAll(){
  renderDashboard(); renderDaniel(); renderSonia(); renderHousehold(); renderPlanning();
  refreshLastUpdated();
}

/* ─── 21. PRIVACY TOGGLE ───────────────────────────────── */
function initPrivacyToggle() {
  const btn=document.getElementById('privacyBtn'); if(!btn) return;
  const on=LS.get('privacyMode',false);
  document.body.classList.toggle('privacy-mode',on);
  btn.setAttribute('aria-pressed',String(on));
  btn.addEventListener('click',()=>{
    const next=!document.body.classList.contains('privacy-mode');
    LS.set('privacyMode',next);
    document.body.classList.toggle('privacy-mode',next);
    btn.setAttribute('aria-pressed',String(next));
    const lbl=btn.querySelector('.btn-label'); if(lbl)lbl.textContent=next?'Show $':'Hide $';
  });
}

/* ─── 22. INIT ─────────────────────────────────────────── */
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
