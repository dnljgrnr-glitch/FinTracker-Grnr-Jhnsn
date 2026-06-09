/* ================================================================
   GJ Financial · app.js
   Auth: sessionStorage 'financeUnlocked' === 'true'
   const PASS = 'JASPER'
   No frameworks. No dependencies. No renderAll().
================================================================ */
'use strict';

/* ── Password ───────────────────────────────────────────────── */
const PASS = 'JASPER';

/* ── Financial data ─────────────────────────────────────────── */
/* Income is stored in localStorage (inc:daniel / inc:sonia) so it
   scales live. These objects hold the starting defaults only.      */
const D = {
  daniel: {
    incomeDefault: 3200,
    debts: [
      { id:'d0', name:'NFCU Visa',         bal:9315.95,  apr:17.5, min:452.82 },
      { id:'d1', name:'NFCU Vehicle Loan', bal:22010.21, apr:9.14, min:426.20 },
      { id:'d2', name:'Apple Card',        bal:930.39,   apr:20,   min:50     },
    ],
    savings: [
      { id:'s0', name:'Move Fund',      bal:0,   goal:1950 },
      { id:'s1', name:'Emergency Fund', bal:0,   goal:5000 },
    ],
    caps: [
      { id:'c0', name:'Gas / Transport',  cap:175 },
      { id:'c1', name:'Food & Personal',  cap:150 },
      { id:'c2', name:'Fast Food',        cap:60  },
      { id:'c3', name:'Online Shopping',  cap:50  },
    ],
    budgetCats: [
      { name:'Shared household expenses', key:'sharedD'   },
      { name:'Vehicle loan',              key:'vehicleD'  },
      { name:'Visa minimum',              key:'visaMinD'  },
      { name:'Extra Visa target',         key:'visaExD'   },
      { name:'Progressive insurance',     key:'insurD'    },
      { name:'Verizon',                   key:'verizonD'  },
      { name:'Gas / transportation',      key:'gasD'      },
      { name:'Personal / food / misc',    key:'miscD'     },
      { name:'Emergency savings',         key:'emerSavD'  },
    ],
    checklist: [
      'Cancel ChatGPT, Spotify, Xbox Game Pass, downgrade Notion.',
      'Cancel Planet Fitness in person — keep the receipt.',
      'Load $300 into Bills Bucket on June 5.',
      'Call Verizon and target $80–$120/month.',
      'Pay vehicle loan by June 20.',
      'Keep NFCU Visa at zero new charges.',
      'Build Bills Bucket to $1,950 by July 10.',
      'Start $700/month Visa payoff after the move.',
      'Protect EasyStart Certificate until December 2026.',
    ],
    paychecks: [
      ['Fri Jun 5',  '$621',    '$300 move fund · $100 vehicle · $100 food/gas · $54.16 rent reserve · $66.84 floor'],
      ['Fri Jun 12', '$621',    '$300 move fund · $150 vehicle · $134 Progressive · $37 spending'],
      ['Fri Jun 19', '$621',    '$300 move fund · $176.20 vehicle final · $30.73 Claude/Netflix · $12.50 TruStage · $50 Apple · $51.57 food/gas'],
      ['Fri Jun 26', '$621',    '$300 move fund · $152.22 Verizon · $50 Comcast · $68.78 food/personal · $50 buffer'],
      ['VA Jun 30',  '$795.84', '$645.84 rent · $150 move fund'],
      ['Fri Jul 3',  '$621',    '$300 move fund · $321 Visa reserve'],
      ['Fri Jul 10', '$621',    '$300 move fund · $131.82 Visa reserve · $189.18 food/personal'],
    ],
  },
  sonia: {
    incomeDefault: 2200,
    debts: [
      { id:'e0', name:'NW Bank Loan',  bal:2266.02, apr:12.5, min:135.83 },
      { id:'e1', name:'Family Debt',   bal:10000,   apr:0,    min:200    },
      { id:'e2', name:'Apple Card',    bal:0,        apr:20,   min:20     },
    ],
    savings: [
      { id:'f0', name:'Apple / Emergency', bal:900, goal:2500 },
      { id:'f1', name:'Sinking Fund',      bal:0,   goal:1000 },
    ],
    caps: [
      { id:'g0', name:'Beauty / Personal', cap:100 },
      { id:'g1', name:'Fast Food',         cap:60  },
      { id:'g2', name:'Amazon / Online',   cap:50  },
      { id:'g3', name:'Apple Cash',        cap:50  },
    ],
    budgetCats: [
      { name:'Personal fixed bills',    key:'fixedS'   },
      { name:'Shared household (41%)',  key:'sharedS'  },
      { name:'Family debt',             key:'famDebtS' },
      { name:'Savings / sinking fund',  key:'savS'     },
      { name:'Gas',                     key:'gasS'     },
      { name:'Beauty',                  key:'beautyS'  },
      { name:'Fast food',               key:'ffS'      },
      { name:'Amazon',                  key:'amzS'     },
      { name:'Apple Cash (named)',       key:'acashS'   },
    ],
    checklist: [
      'Move $900 Apple Cash to Apple Savings.',
      'Add $100 from next paycheck → $1,000 emergency savings.',
      'Cancel Planet Fitness in person.',
      'Log NW loan as $2,266.02 at 12.50% APR.',
      'Send family repayment message.',
      'Cap fast food at $60/month.',
      'Cap beauty/personal care at $100/month.',
      'Cap Amazon/online at $50/month.',
      'Confirm old address obligations end at move: Rocket, electric, JJ Peters, Suburban Water.',
    ],
    paychecks: [
      ['Apple Savings top-off',          '$100'],
      ['Rocket/current housing',         '$400'],
      ['Utilities/trash/water reserve',  '$150'],
      ['NW loan reserve',                '$68' ],
      ['Phone reserve',                  '$35' ],
      ['Food/gas',                       '$125'],
      ['Beauty/personal',                '$40' ],
      ['Fast food',                      '$20' ],
      ['Amazon',                         '$20' ],
      ['Named-purpose Apple Cash',       '$20' ],
      ['Checking floor',                 '$122'],
    ],
    loanPayoff: [
      ['$135.83 min','19 months','$236.27'],
      ['$150',       '17 months','$212.54'],
      ['$200',       '13 months','$157.92'],
      ['$250',       '10 months','$126.92'],
      ['$300',       '8 months', '$106.52'],
    ],
    familyTimeline: [
      ['Start','$10,000'], ['Mo 1','$9,800'],  ['Mo 2','$9,600'],
      ['Mo 3','$9,300'],   ['Mo 6','$8,400'],  ['Mo 12','$6,600'],
      ['Mo 18','$4,800'],  ['Mo 24','$3,000'], ['Mo 30','$1,200'], ['Mo 34','$0'],
    ],
  },
  household: {
    split: { daniel:0.59, sonia:0.41 },
    bills: [
      { name:'Rent',      total:800  },
      { name:'Electric',  total:150  },
      { name:'Internet',  total:50   },
      { name:'Groceries', total:300  },
    ],
    debtOrder: [
      [1,'No overdrafts / no new Visa charges','Stops new damage'             ],
      [2,'Daniel NFCU Visa',                   'Highest APR'                  ],
      [3,'Sonia family debt',                  'Relationship preservation'    ],
      [4,'Sonia NW loan',                      '12.50% — extra after savings' ],
      [5,'Daniel vehicle loan',                'Large balance at 9.14%'       ],
      [6,'Investing',                          'Only after triggers are met'  ],
    ],
    netWorth: [
      [1, '$8,756','$21,752','$9,800','$2,148',  '$4,237', '$0',    '-$38,218'],
      [6, '$5,826','$20,429','$8,400','$1,544',  '$6,087', '$0',    '-$30,112'],
      [12,'$2,009','$18,774','$6,600','$757',    '$7,887', '$0',    '-$20,253'],
      [18,'$0',    '$14,926','$4,800','$95 est.','$9,687', '$0',    '-$10,134'],
      [24,'$0',    '$8,734', '$3,000','$0',      '$10,887','$900',  '$53'     ],
      [30,'$0',    '$2,254', '$1,200','$0',      '$12,087','$1,800','$10,433' ],
      [34,'$0',    '$0',     '$0',    '$0',      '$12,887','$2,400','$15,287' ],
      [36,'$0',    '$0',     '$0',    '$0',      '$13,487','$3,000','$16,487' ],
    ],
  },
};

/* ── Storage ─────────────────────────────────────────────────── */
const LS = {
  g:  (k,d=null)=>{ try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v);}catch{return d;} },
  s:  (k,v)=>     { try{localStorage.setItem(k,JSON.stringify(v));}catch{} },
  n:  (k,d)=>     { const v=localStorage.getItem(k);return v!==null?parseFloat(v):d; },
  rm: (k)=>       { try{localStorage.removeItem(k);}catch{} },
  ks: (p)=>       { try{return Object.keys(localStorage).filter(k=>k.startsWith(p));}catch{return[];} },
};

/* ── Income helpers ──────────────────────────────────────────── */
/* Income is editable — stored as inc:daniel / inc:sonia in LS.    */
function getIncome(person) {
  const def = person==='daniel' ? D.daniel.incomeDefault : D.sonia.incomeDefault;
  return LS.n('inc:'+person, def);
}
function setIncome(person, val) {
  LS.s('inc:'+person, val);
  touchSaved();
  updHeroStats();
  // re-render savings rate
  updSavingsRate();
  // nudge the allocator header if visible
  const iEl = document.getElementById('alloc-income-val');
  if (iEl) iEl.textContent = M(getIncome('daniel'));
}

/* ── Utilities ───────────────────────────────────────────────── */
const $ = (s,r=document)=>r.querySelector(s);
const $$= (s,r=document)=>[...r.querySelectorAll(s)];
const M = n=>(parseFloat(n)||0).toLocaleString('en-US',{style:'currency',currency:'USD'});
const pv= v=>`<span class="pv">${M(v)}</span>`;
const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));

function toast(msg, type='info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateX(20px)'; el.style.transition='all .3s'; setTimeout(()=>el.remove(),300); }, 2800);
}

function touchSaved() {
  LS.s('lastUpdated', new Date().toISOString());
  const el = document.getElementById('lastSaved');
  if (el) {
    const d = new Date();
    el.textContent = `Saved ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;
  }
}

/* ── Auth ────────────────────────────────────────────────────── */
function initAuth() {
  const loginEl = document.getElementById('login');
  const appEl   = document.getElementById('app');
  if (sessionStorage.getItem('financeUnlocked')==='true') {
    loginEl.style.display='none'; appEl.hidden=false; return;
  }
  setTimeout(()=>{ const p=document.getElementById('pwInput'); if(p)p.focus(); },80);
  document.getElementById('loginForm').addEventListener('submit', e=>{
    e.preventDefault();
    const val = document.getElementById('pwInput').value.trim().toUpperCase();
    if (val===PASS) {
      sessionStorage.setItem('financeUnlocked','true');
      loginEl.style.display='none';
      appEl.hidden=false;
    } else {
      const err=document.getElementById('pwError');
      err.textContent='Incorrect passcode — try again.';
      document.getElementById('pwInput').value='';
      document.getElementById('pwInput').focus();
      setTimeout(()=>{err.textContent='';},3500);
    }
  });
  document.getElementById('lockBtn').addEventListener('click',()=>{
    sessionStorage.removeItem('financeUnlocked'); location.reload();
  });
}

/* ── Live totals ─────────────────────────────────────────────── */
function totals() {
  let debt=0, sav=0;
  [...D.daniel.debts,...D.sonia.debts].forEach(d=>debt+=LS.n('b:'+d.id,d.bal));
  [...D.daniel.savings,...D.sonia.savings].forEach(s=>sav+=LS.n('b:'+s.id,s.bal));
  const dW = LS.n('w:daniel:c',0)+LS.n('w:daniel:s',0);
  const sW = LS.n('w:sonia:c',0)+LS.n('w:sonia:s',0);
  const liquid = sav+dW+sW;
  const nw = liquid-debt;
  let burn=0;
  [...D.daniel.debts,...D.sonia.debts].forEach(d=>{
    if(d.apr) burn+=LS.n('b:'+d.id,d.bal)*(d.apr/100/12);
  });
  return {debt,sav,liquid,nw,dW,sW,burn};
}

function updHeroStats() {
  const t = totals();
  const ids = {
    'h-debt':  {val:t.debt,   cls:'red'},
    'h-liq':   {val:t.liquid, cls:'green'},
    'h-nw':    {val:t.nw,     cls:t.nw>=0?'green':'red'},
  };
  Object.entries(ids).forEach(([id,{val,cls}])=>{
    const el=document.getElementById(id); if(!el)return;
    el.textContent=M(val);
    el.className='hero-val '+cls+' pv';
  });
  const burnEl=document.getElementById('dash-burn');
  if(burnEl) burnEl.textContent=M(t.burn)+'/mo';
  const dwtEl=document.getElementById('wt-daniel');
  if(dwtEl) dwtEl.textContent=M(t.dW);
  const swtEl=document.getElementById('wt-sonia');
  if(swtEl) swtEl.textContent=M(t.sW);
  const comEl=document.getElementById('wt-combined');
  if(comEl) comEl.textContent=M(t.dW+t.sW);
  updSavingsRate();
  updNWSnippet();
}

/* ── Payoff math ─────────────────────────────────────────────── */
function payoffEst(bal,apr,pmt) {
  if(pmt<=0||bal<=0) return {months:0,interest:0,date:'—'};
  const r=apr/100/12; let b=bal,mo=0,int=0;
  while(b>0&&mo<600){const i=b*r;int+=i;b=b+i-pmt;mo++;}
  const d=new Date(); d.setMonth(d.getMonth()+mo);
  return {months:mo,interest:int,date:d.toLocaleString('default',{month:'short',year:'numeric'})};
}
function intSavings(bal,apr,pmt,min) {
  const a=payoffEst(bal,apr,pmt), b=payoffEst(bal,apr,min);
  return {moSaved:b.months-a.months, intSaved:b.interest-a.interest};
}

/* ── Slider builder ──────────────────────────────────────────── */
function buildSlider(item, type) {
  const id   = item.id;
  const cur  = LS.n('b:'+id, item.bal);
  const goal = LS.n('g:'+id, type==='debt'?item.bal:item.goal);
  const pct  = goal>0
    ? type==='debt'
      ? clamp(((goal-cur)/goal)*100,0,100)
      : clamp((cur/goal)*100,0,100)
    : 0;
  const rv = type==='debt' ? Math.max(0,goal-cur) : cur;
  const v1cls = type==='debt'?'red':'green';
  const v2cls = 'blue';
  const v1lbl = type==='debt'?'Remaining':'Saved';
  const v2lbl = type==='debt'?'Paid Down':'To Goal';
  const fillCls = pct>=100?'full': type==='debt'?'blue':'green';
  const allD = [...D.daniel.debts,...D.sonia.debts];
  const dObj = allD.find(d=>d.id===id)||null;

  let pestHTML='';
  if(type==='debt'&&item.apr>0) {
    const curPmt = LS.n('p:'+id,0);
    const est = payoffEst(cur,item.apr,curPmt>0?curPmt:item.min);
    const sav = curPmt>0 ? intSavings(cur,item.apr,curPmt,item.min) : {moSaved:0,intSaved:0};
    pestHTML=`
    <div class="payoff-box">
      <div class="payoff-title">Payoff Estimator</div>
      <div class="payoff-pmt-row">
        <label for="pmt-${id}">Monthly payment</label>
        <input id="pmt-${id}" type="number" step="5" min="0"
          data-pmt="${id}" value="${curPmt||''}" placeholder="${item.min}"/>
      </div>
      <div class="payoff-stats">
        <div class="payoff-stat">
          <span class="stat-val blue" id="pd-${id}">${est.date}</span>
          <span class="stat-lbl">Paid Off</span>
        </div>
        <div class="payoff-stat">
          <span class="stat-val" id="pm-${id}">${est.months}</span>
          <span class="stat-lbl">Months</span>
        </div>
        <div class="payoff-stat">
          <span class="stat-val red" id="pi-${id}">${M(est.interest)}</span>
          <span class="stat-lbl">Total Interest</span>
        </div>
      </div>
      <div class="payoff-savings" id="ps-${id}">${sav.intSaved>0?`Saves ${M(sav.intSaved)} · ${sav.moSaved} months sooner vs minimum`:''}</div>
    </div>`;
  }

  return `
  <div class="slider-block" data-sid="${id}" data-stype="${type}">
    <div class="slider-header">
      <span class="slider-name">${item.name}</span>
      <span class="slider-pct" id="sp-${id}">${pct.toFixed(1)}%</span>
    </div>
    <div class="prog"><div class="prog-fill ${fillCls}" id="sf-${id}" style="width:${pct.toFixed(1)}%"></div></div>
    <input type="range" id="sr-${id}" min="0" max="${goal}" step="1" value="${rv}"
      aria-label="${item.name} progress" data-sirange="${id}" data-stype="${type}"/>
    <div class="slider-stats">
      <div>
        <span class="stat-val ${v1cls} pv" id="sv1-${id}">${M(type==='debt'?cur:cur)}</span>
        <span class="stat-lbl">${v1lbl}</span>
      </div>
      <div>
        <span class="stat-val ${v2cls} pv" id="sv2-${id}">${M(type==='debt'?goal-cur:Math.max(0,goal-cur))}</span>
        <span class="stat-lbl">${v2lbl}</span>
      </div>
    </div>
    <div class="slider-inputs">
      <div class="input-group">
        <label class="input-label" for="sb-${id}">${type==='debt'?'Current Balance':'Current Saved'}</label>
        <input id="sb-${id}" type="number" step="0.01" min="0"
          value="${cur}" data-sbal="${id}" data-stype="${type}"/>
      </div>
      <div class="input-group">
        <label class="input-label" for="sg-${id}">Goal</label>
        <input id="sg-${id}" type="number" step="0.01" min="1"
          value="${goal}" data-sgoal="${id}" data-stype="${type}"/>
      </div>
    </div>
    ${type==='debt'&&item.apr>0?`<div class="slider-meta">APR ${item.apr}% · ${M(cur*(item.apr/100/12))}/mo interest</div>`:''}
    ${pestHTML}
  </div>`;
}

function updSlider(id,type,cur,goal) {
  const pct = goal>0
    ? type==='debt' ? clamp(((goal-cur)/goal)*100,0,100) : clamp((cur/goal)*100,0,100)
    : 0;
  const fillCls = pct>=100?'full': type==='debt'?'blue':'green';
  const fill  = document.getElementById('sf-'+id);
  const pctEl = document.getElementById('sp-'+id);
  const sv1   = document.getElementById('sv1-'+id);
  const sv2   = document.getElementById('sv2-'+id);
  const rng   = document.getElementById('sr-'+id);
  const bal   = document.getElementById('sb-'+id);
  if(fill)  { fill.style.width=pct.toFixed(1)+'%'; fill.className='prog-fill '+fillCls; }
  if(pctEl)   pctEl.textContent=pct.toFixed(1)+'%';
  if(sv1)     sv1.textContent=M(type==='debt'?cur:cur);
  if(sv2)     sv2.textContent=M(type==='debt'?goal-cur:Math.max(0,goal-cur));
  if(rng&&document.activeElement!==rng){ rng.max=goal; rng.value=type==='debt'?Math.max(0,goal-cur):cur; }
  if(bal&&document.activeElement!==bal) bal.value=cur;
  // APR meta line
  const wrap = document.querySelector(`[data-sid="${id}"]`);
  if(wrap) {
    const meta = wrap.querySelector('.slider-meta');
    if(meta) {
      const allD=[...D.daniel.debts,...D.sonia.debts];
      const d=allD.find(x=>x.id===id);
      if(d&&d.apr) meta.textContent=`APR ${d.apr}% · ${M(cur*(d.apr/100/12))}/mo interest`;
    }
  }
}

function updPayoffEst(id) {
  const allD=[...D.daniel.debts,...D.sonia.debts];
  const debt=allD.find(d=>d.id===id); if(!debt||!debt.apr) return;
  const cur=LS.n('b:'+id,debt.bal);
  const pmt=LS.n('p:'+id,0); if(!pmt) return;
  const est=payoffEst(cur,debt.apr,pmt);
  const sav=intSavings(cur,debt.apr,pmt,debt.min);
  const pd=document.getElementById('pd-'+id), pm=document.getElementById('pm-'+id);
  const pi=document.getElementById('pi-'+id), ps=document.getElementById('ps-'+id);
  if(pd) pd.textContent=est.date;
  if(pm) pm.textContent=est.months;
  if(pi) pi.textContent=M(est.interest);
  if(ps) ps.textContent=sav.intSaved>0?`Saves ${M(sav.intSaved)} · ${sav.moSaved} months sooner vs minimum`:'';
}

/* ── Spending cap ────────────────────────────────────────────── */
function buildCap(cap) {
  const spent=LS.n('cs:'+cap.id,0);
  const lim=LS.n('cl:'+cap.id,cap.cap);
  const pct=lim>0?Math.min(100,(spent/lim)*100):0;
  const left=Math.max(0,lim-spent);
  const cls=pct>=100?'over':pct>=80?'warn':'ok';
  const fCls=pct>=100?'red':pct>=80?'amber':'green';
  return `
  <div class="cap-row" data-capid="${cap.id}">
    <div class="cap-header">
      <span class="cap-name">${cap.name}</span>
      <span class="cap-status ${cls}" id="cst-${cap.id}">${pct>=100?'OVER':M(left)+' left'}</span>
    </div>
    <div class="prog"><div class="prog-fill ${fCls}" id="cf-${cap.id}" style="width:${pct.toFixed(1)}%"></div></div>
    <div class="cap-inputs">
      <div class="input-group">
        <label class="input-label">Spent this month</label>
        <input type="number" step="0.01" min="0" id="csp-${cap.id}"
          value="${spent}" data-csp="${cap.id}"/>
      </div>
      <div class="input-group">
        <label class="input-label">Monthly cap</label>
        <input type="number" step="0.01" min="1" id="clm-${cap.id}"
          value="${lim}" data-clm="${cap.id}"/>
      </div>
    </div>
  </div>`;
}

function updCap(id,spent,lim) {
  const pct=lim>0?Math.min(100,(spent/lim)*100):0;
  const left=Math.max(0,lim-spent);
  const cls=pct>=100?'over':pct>=80?'warn':'ok';
  const fCls=pct>=100?'red':pct>=80?'amber':'green';
  const fill=document.getElementById('cf-'+id);
  const stat=document.getElementById('cst-'+id);
  if(fill){ fill.style.width=pct.toFixed(1)+'%'; fill.className='prog-fill '+fCls; }
  if(stat){ stat.textContent=pct>=100?'OVER':M(left)+' left'; stat.className='cap-status '+cls; }
}

/* ── Wallet ──────────────────────────────────────────────────── */
function buildWallet(person) {
  const c=LS.n('w:'+person+':c',0), s=LS.n('w:'+person+':s',0);
  const name=person==='daniel'?'Daniel':'Sonia';
  return `
  <div class="wallet-card">
    <div class="wallet-header">
      <span class="wallet-name">${name}</span>
      <span class="wallet-total pv" id="wt-${person}">${M(c+s)}</span>
    </div>
    <div class="wallet-inputs">
      <div class="input-group">
        <label class="input-label">Checking</label>
        <input type="number" step="0.01" min="0" value="${c}" data-w="${person}" data-wt="c"/>
      </div>
      <div class="input-group">
        <label class="input-label">Savings</label>
        <input type="number" step="0.01" min="0" value="${s}" data-w="${person}" data-wt="s"/>
      </div>
    </div>
  </div>`;
}

/* ── Checklist ───────────────────────────────────────────────── */
function buildChecklist(id,items) {
  const saved=LS.g('ck:'+id,{});
  const done=items.filter((_,i)=>saved[i]).length;
  return `
  <p class="cl-summary" id="cks-${id}">${done} of ${items.length} complete</p>
  <div>${items.map((text,i)=>`
    <div class="cl-item${saved[i]?' done':''}">
      <input type="checkbox" id="ck-${id}-${i}" data-ckl="${id}" data-cki="${i}" ${saved[i]?'checked':''}/>
      <label class="cl-label" for="ck-${id}-${i}">${text}</label>
    </div>`).join('')}</div>`;
}

/* ── Table ───────────────────────────────────────────────────── */
function tbl(headers,rows,label='') {
  return `<div class="table-wrap" role="region" aria-label="${label}" tabindex="0">
    <table>
      <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
}

/* ── Savings rate ────────────────────────────────────────────── */
function updSavingsRate() {
  const inc = getIncome('daniel')+getIncome('sonia');
  const allD=[...D.daniel.debts,...D.sonia.debts];
  const debtPmts=allD.reduce((a,d)=>a+(LS.n('p:'+d.id,0)||d.min),0);
  const debtPct=Math.round(Math.min(100,(debtPmts/inc)*100));
  const savBal=[...D.daniel.savings,...D.sonia.savings].reduce((a,s)=>a+LS.n('b:'+s.id,s.bal),0);
  // savings rate: compare monthly savings progress vs income
  const savPct=Math.round(Math.min(60,(savBal/(inc*4))*100));
  const expPct=Math.max(0,100-debtPct-savPct);
  const rows=[
    {lbl:'Debt Payments',pct:debtPct,cls:'red'},
    {lbl:'Savings Goals',pct:savPct, cls:'green'},
    {lbl:'Living / Other',pct:expPct, cls:'blue'},
  ];
  const wrap=document.getElementById('savings-rate-inner');
  if(!wrap) return;
  wrap.innerHTML=rows.map(r=>`
    <div class="rate-row">
      <span class="rate-lbl">${r.lbl}</span>
      <div class="rate-bar"><div class="prog" style="margin:0">
        <div class="prog-fill ${r.cls}" style="width:${Math.min(100,r.pct)}%"></div>
      </div></div>
      <span class="rate-pct">${r.pct}%</span>
    </div>`).join('');
}

/* ── NW history snippet ──────────────────────────────────────── */
function updNWSnippet() {
  const log=LS.g('nwlog',[]);
  const el=document.getElementById('nw-history-inner');
  if(!el) return;
  if(!log.length){ el.innerHTML='<p class="empty-state">No snapshots yet — Settings → Record Snapshot.</p>'; return; }
  el.innerHTML=log.slice(0,6).map((e,i)=>{
    const prev=log[i+1];
    const delta=prev?e.nw-prev.nw:null;
    const dHtml=delta!==null
      ? `<span class="nw-delta ${delta>=0?'up':'dn'}">${delta>=0?'+':''}${M(delta)}</span>` : '';
    return `<div class="nw-entry">
      <span class="nw-date">${e.date}</span>
      <span class="nw-val ${e.nw>=0?'text-green':'text-red'} pv">${M(e.nw)} ${dHtml}</span>
    </div>`;
  }).join('');
}

/* ── Budget spend tracker builder ───────────────────────────── */
function buildBudgetSpend(cats, storePfx) {
  return cats.map(c=>{
    const spent=LS.n(`bsp:${storePfx}:${c.key}`,0);
    const budget=LS.n(`bb:${storePfx}:${c.key}`,0);
    const pct=budget>0?Math.min(100,(spent/budget)*100):0;
    const statusCls=pct>=100?'over':pct>=80?'warn':'ok';
    const statusTxt=budget>0?(pct>=100?'OVER':(Math.round(pct))+'%'):'—';
    return `<div class="budget-spend-row" data-bscat="${storePfx}:${c.key}">
      <span class="bsr-name">${c.name}</span>
      <div class="bsr-amounts">
        <input type="number" step="0.01" min="0" class="bsr-spent-inp"
          value="${spent}" data-bsp="${storePfx}:${c.key}"
          placeholder="0" aria-label="${c.name} spent"/>
        <span class="bsr-of">of</span>
        <input type="number" step="1" min="0" class="bsr-spent-inp"
          style="color:var(--t3)"
          value="${budget||''}" data-bbudget="${storePfx}:${c.key}"
          placeholder="budget" aria-label="${c.name} budget"/>
        <span class="bsr-status ${statusCls}" id="bss-${storePfx}:${c.key}">${statusTxt}</span>
      </div>
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════
   RENDER FUNCTIONS — called once on init()
═══════════════════════════════════════════════════════════════ */

/* ── DASHBOARD ───────────────────────────────────────────────── */
function renderDashboard() {
  const t=totals();
  const mv    =LS.n('b:s0',D.daniel.savings[0].bal);
  const mg    =LS.n('g:s0',D.daniel.savings[0].goal);
  const mvTgt =new Date('2026-07-10'), today=new Date();
  const days  =Math.max(0,Math.ceil((mvTgt-today)/86400000));
  const pays  =Math.max(1,Math.floor(days/14));
  const mvRem =Math.max(0,mg-mv);
  const mvPct =(mg>0?Math.min(100,(mv/mg)*100):0).toFixed(1);
  const bills =D.household.bills;
  const billTot=bills.reduce((a,b)=>a+b.total,0);
  const split =D.household.split;
  const dInc  =getIncome('daniel'), sInc=getIncome('sonia');

  document.getElementById('panel-dashboard').innerHTML=`
  <!-- Hero stats -->
  <div class="hero-grid">
    <div class="hero-stat">
      <span class="hero-val red pv" id="h-debt">${M(t.debt)}</span>
      <span class="hero-lbl">Total Debt</span>
    </div>
    <div class="hero-stat">
      <span class="hero-val green pv" id="h-liq">${M(t.liquid)}</span>
      <span class="hero-lbl">Total Assets</span>
      <span class="hero-sub">${M(t.dW+t.sW)} liquid</span>
    </div>
    <div class="hero-stat">
      <span class="hero-val ${t.nw>=0?'green':'red'} pv" id="h-nw">${M(t.nw)}</span>
      <span class="hero-lbl">Net Worth</span>
    </div>
  </div>

  <!-- Household snapshot FIRST -->
  <div class="card">
    <div class="card-title">Household Snapshot</div>
    <div class="metric">
      <span class="metric-lbl">Daniel income</span>
      <span class="metric-val green tabular">
        <input type="number" step="50" min="0"
          class="metric-val editable green tabular"
          id="dash-dinc" value="${dInc}"
          aria-label="Daniel monthly income"
          data-income="daniel"/>
        <span style="font-size:.72rem;color:var(--t3);margin-left:3px">/mo</span>
      </span>
    </div>
    <div class="metric">
      <span class="metric-lbl">Sonia income</span>
      <span class="metric-val green tabular">
        <input type="number" step="50" min="0"
          class="metric-val editable green tabular"
          id="dash-sinc" value="${sInc}"
          aria-label="Sonia monthly income"
          data-income="sonia"/>
        <span style="font-size:.72rem;color:var(--t3);margin-left:3px">/mo</span>
      </span>
    </div>
    <div class="metric">
      <span class="metric-lbl">Combined income</span>
      <span class="metric-val green pv tabular" id="dash-combined">${M(dInc+sInc)}/mo</span>
    </div>
    <div class="metric">
      <span class="metric-lbl">Shared bills total</span>
      <span class="metric-val pv">${M(billTot)}/mo</span>
    </div>
    <div class="metric">
      <span class="metric-lbl">Daniel's share (59%)</span>
      <span class="metric-val pv">${M(billTot*split.daniel)}/mo</span>
    </div>
    <div class="metric">
      <span class="metric-lbl">Sonia's share (41%)</span>
      <span class="metric-val pv">${M(billTot*split.sonia)}/mo</span>
    </div>
    <div class="metric">
      <span class="metric-lbl">Monthly interest burn</span>
      <span class="metric-val red tabular" id="dash-burn">${M(t.burn)}/mo</span>
    </div>
  </div>

  <!-- Wallets side by side -->
  <div class="g2" style="margin-bottom:var(--gap)">
    <div class="card" style="margin-bottom:0">${buildWallet('daniel')}</div>
    <div class="card" style="margin-bottom:0">${buildWallet('sonia')}</div>
  </div>
  <div class="card">
    <div class="metric">
      <span class="metric-lbl">Combined wallets</span>
      <span class="metric-val green pv" id="wt-combined">${M(t.dW+t.sW)}</span>
    </div>
  </div>

  <!-- Move fund -->
  <div class="card">
    <div class="card-title">Move Fund Countdown</div>
    <div class="metric"><span class="metric-lbl">Days to July 10</span><span class="metric-val blue">${days}</span></div>
    <div class="metric"><span class="metric-lbl">Paychecks left</span><span class="metric-val">${pays}</span></div>
    <div class="metric"><span class="metric-lbl">Saved so far</span><span class="metric-val green pv">${M(mv)}</span></div>
    <div class="metric"><span class="metric-lbl">Still needed</span><span class="metric-val red pv">${M(mvRem)}</span></div>
    <div class="metric" style="font-weight:700">
      <span class="metric-lbl">Per paycheck</span>
      <span class="metric-val blue pv">${M(mvRem/pays)}</span>
    </div>
    <div class="prog" style="margin-top:10px">
      <div class="prog-fill ${parseFloat(mvPct)>=100?'full':'green'}" style="width:${mvPct}%"></div>
    </div>
    <p style="font-size:.7rem;color:var(--t3);text-align:right;margin-top:4px">${M(mv)} of ${M(mg)} · ${mvPct}%</p>
  </div>

  <!-- Interest burn detail -->
  <div class="card">
    <div class="card-title">Monthly Interest Burn</div>
    ${[...D.daniel.debts,...D.sonia.debts].filter(d=>d.apr>0).map(d=>{
      const b=LS.n('b:'+d.id,d.bal);
      return `<div class="burn-row"><span>${d.name}</span><strong>${M(b*(d.apr/100/12))}</strong></div>`;
    }).join('')}
    <div class="burn-total"><span>Total / month</span><strong id="dash-burn-detail">${M(t.burn)}/mo</strong></div>
  </div>

  <!-- Savings rate -->
  <div class="card">
    <div class="card-title">Savings Rate</div>
    <p class="section-note">Combined income ${M(dInc+sInc)}/mo · Target: 20%+ to debt+savings</p>
    <div id="savings-rate-inner"></div>
  </div>

  <!-- NW history -->
  <div class="card">
    <div class="card-title">
      Net Worth History
      <button class="btn-neutral btn-sm" id="snap-btn-dash">Record Snapshot</button>
    </div>
    <div id="nw-history-inner"></div>
  </div>
  `;

  updSavingsRate();
  updNWSnippet();

  // Dashboard snapshot button
  document.getElementById('snap-btn-dash').addEventListener('click',()=>{
    recordSnapshot(); toast('Snapshot recorded','success');
  });
}

/* ── DANIEL ──────────────────────────────────────────────────── */
const DTABS=[
  {id:'snapshot', lbl:'📊 Snapshot'},
  {id:'spending', lbl:'💳 Spending'},
  {id:'budget',   lbl:'📂 Budget'},
  {id:'paychecks',lbl:'📅 Paychecks'},
  {id:'checklist',lbl:'✅ Checklist'},
];

function renderDaniel() {
  const active=LS.g('st:daniel','snapshot');
  const dInc=getIncome('daniel');
  document.getElementById('panel-daniel').innerHTML=`
  <div class="person-header">
    <span class="person-name">Daniel</span>
    <span class="pill pill-green">${M(dInc)}/mo</span>
    <span class="pill pill-red">Visa priority</span>
    <span class="pill pill-amber">Move: $1,950</span>
  </div>
  <div class="sub-tab-bar">
    ${DTABS.map(t=>`<button class="sub-tab${t.id===active?' active':''}" data-person="daniel" data-st="${t.id}">${t.lbl}</button>`).join('')}
  </div>
  <div id="d-body">${renderDanielTab(active)}</div>`;
}

function renderDanielTab(tab) {
  const d=D.daniel;
  switch(tab) {
    case 'snapshot': return `
      <div class="card">
        <div class="card-title">Debt Trackers</div>
        <p class="section-note">Drag or type balance directly. Set payment to see payoff date.</p>
        ${d.debts.map(dt=>buildSlider(dt,'debt')).join('')}
      </div>
      <div class="card">
        <div class="card-title">Savings Goals</div>
        ${d.savings.map(sv=>buildSlider(sv,'savings')).join('')}
      </div>`;

    case 'spending': return `
      <div class="card">
        <div class="card-title">Monthly Spending Caps</div>
        ${d.caps.map(c=>buildCap(c)).join('')}
        <div class="btn-row">
          <button class="btn-neutral btn-sm" id="rst-dcaps">Reset Month</button>
        </div>
      </div>`;

    case 'budget': return `
      <div class="card">
        <div class="card-title">Monthly Budget Tracker
          <button class="btn-neutral btn-sm" id="rst-dbudget">Reset Month</button>
        </div>
        <p class="section-note">Type what you've spent · Edit budget amount in second field · Scales with income.</p>
        ${buildBudgetSpend(d.budgetCats,'d')}
      </div>`;

    case 'paychecks': return `
      <div class="card">
        <div class="card-title">Paycheck Plan: Jun 5 – Jul 10</div>
        ${tbl(['Date','Amount','Allocation'],d.paychecks.map(r=>[r[0],`<strong class="pv">${r[1]}</strong>`,r[2]]),'Daniel paychecks')}
        <div class="tip" style="margin-top:12px"><strong>Operating Rule</strong>Every paycheck is assigned before spending starts.</div>
      </div>`;

    case 'checklist': return `
      <div class="card"><div class="card-title">Action Checklist</div>
        ${buildChecklist('daniel',d.checklist)}</div>`;

    default: return '';
  }
}

/* ── SONIA ───────────────────────────────────────────────────── */
const STABS=[
  {id:'snapshot', lbl:'📊 Snapshot'},
  {id:'spending', lbl:'💳 Spending'},
  {id:'budget',   lbl:'📂 Budget'},
  {id:'paychecks',lbl:'📅 Paychecks'},
  {id:'checklist',lbl:'✅ Checklist'},
];

function renderSonia() {
  const active=LS.g('st:sonia','snapshot');
  const sInc=getIncome('sonia');
  document.getElementById('panel-sonia').innerHTML=`
  <div class="person-header">
    <span class="person-name">Sonia</span>
    <span class="pill pill-green">${M(sInc)}/mo</span>
    <span class="pill pill-blue">Savings first</span>
    <span class="pill pill-amber">NW Loan 12.50%</span>
  </div>
  <div class="sub-tab-bar">
    ${STABS.map(t=>`<button class="sub-tab${t.id===active?' active':''}" data-person="sonia" data-st="${t.id}">${t.lbl}</button>`).join('')}
  </div>
  <div id="s-body">${renderSoniaTab(active)}</div>`;
}

function renderSoniaTab(tab) {
  const s=D.sonia;
  switch(tab) {
    case 'snapshot': return `
      <div class="card">
        <div class="card-title">Debt Trackers</div>
        ${s.debts.map(dt=>buildSlider({...dt,bal:dt.bal||0},dt.bal>0?'debt':'debt')).join('')}
      </div>
      <div class="card">
        <div class="card-title">Savings Goals</div>
        ${s.savings.map(sv=>buildSlider(sv,'savings')).join('')}
      </div>
      <div class="card">
        <div class="card-title">NW Loan Payoff Scenarios</div>
        ${tbl(['Payment','Months','Est. Interest'],s.loanPayoff,'NW loan')}
      </div>
      <div class="card">
        <div class="card-title">Family Debt Timeline</div>
        ${tbl(['Period','Balance'],s.familyTimeline.map(([a,b])=>[a,`<strong class="pv">${b}</strong>`]),'Family debt')}
        <div class="tip" style="margin-top:10px"><strong>Message Template</strong>
        "I'm starting at $200/month beginning first post-move paycheck, increasing to $300/month from month three. I'll stay consistent and keep you updated."</div>
      </div>`;

    case 'spending': return `
      <div class="card">
        <div class="card-title">Monthly Spending Caps</div>
        ${s.caps.map(c=>buildCap(c)).join('')}
        <div class="btn-row"><button class="btn-neutral btn-sm" id="rst-scaps">Reset Month</button></div>
      </div>`;

    case 'budget': return `
      <div class="card">
        <div class="card-title">Monthly Budget Tracker
          <button class="btn-neutral btn-sm" id="rst-sbudget">Reset Month</button>
        </div>
        <p class="section-note">Type what you've spent · Edit budget in second field · Updates with income changes.</p>
        ${buildBudgetSpend(s.budgetCats,'s')}
      </div>`;

    case 'paychecks': return `
      <div class="card">
        <div class="card-title">Next Paycheck Allocation</div>
        ${tbl(['Category','Amount'],s.paychecks.map(([a,b])=>[a,`<strong class="pv">${b}</strong>`]),'Sonia paychecks')}
      </div>`;

    case 'checklist': return `
      <div class="card"><div class="card-title">Action Checklist</div>
        ${buildChecklist('sonia',s.checklist)}</div>`;

    default: return '';
  }
}

/* ── HOUSEHOLD ───────────────────────────────────────────────── */
function renderHousehold() {
  const h=D.household, bills=h.bills, split=h.split;
  const billTot=bills.reduce((a,b)=>a+b.total,0);
  const dInc=getIncome('daniel'), sInc=getIncome('sonia');

  document.getElementById('panel-household').innerHTML=`
  <!-- Income editors -->
  <div class="card">
    <div class="card-title">Income — Edit to scale all calculations</div>
    <div class="income-edit-row">
      <label>Daniel monthly income</label>
      <input class="inc-input" type="number" step="50" min="0" value="${dInc}" data-income="daniel"/>
      <span class="inc-unit">/mo</span>
    </div>
    <div class="income-edit-row">
      <label>Sonia monthly income</label>
      <input class="inc-input" type="number" step="50" min="0" value="${sInc}" data-income="sonia"/>
      <span class="inc-unit">/mo</span>
    </div>
    <div class="metric" style="margin-top:8px">
      <span class="metric-lbl">Combined</span>
      <span class="metric-val green pv" id="hh-combined">${M(dInc+sInc)}/mo</span>
    </div>
  </div>

  <!-- Bill split -->
  <div class="card">
    <div class="card-title">Live Bill Split Calculator</div>
    <p class="section-note">Edit any amount — 59/41 split recalculates instantly.</p>
    <div class="split-grid hdr">
      <span>Bill</span><span style="text-align:right">Amount</span>
      <span style="text-align:right">Daniel 59%</span>
      <span style="text-align:right">Sonia 41%</span>
    </div>
    ${bills.map(b=>`
    <div class="split-grid">
      <span>${b.name}</span>
      <input type="number" step="1" min="0" data-bill="${b.name}" value="${b.total}" style="text-align:right"/>
      <span class="split-val pv" id="bsd-${b.name}">${M(b.total*split.daniel)}</span>
      <span class="split-val pv" id="bss-${b.name}">${M(b.total*split.sonia)}</span>
    </div>`).join('')}
    <div class="split-grid split-tot">
      <strong>Total</strong>
      <strong class="pv" id="split-tot">${M(billTot)}</strong>
      <strong class="pv" id="split-tot-d">${M(billTot*split.daniel)}</strong>
      <strong class="pv" id="split-tot-s">${M(billTot*split.sonia)}</strong>
    </div>
  </div>

  <!-- Debt sequence -->
  <div class="card">
    <div class="card-title">Debt Payoff Sequence</div>
    ${tbl(['#','Target','Reason'],h.debtOrder,'Payoff sequence')}
  </div>

  <!-- Net worth trajectory -->
  <div class="card">
    <div class="card-title">Net Worth Trajectory (Projected 36 Months)</div>
    ${tbl(['Mo','Visa','Vehicle','Family','NW Loan','Cash','Invest','Net Worth'],
      h.netWorth.map(r=>[`Mo ${r[0]}`,r[1],r[2],r[3],r[4],r[5],r[6],
        `<strong style="color:${r[7].startsWith('-')?'var(--red)':'var(--green)'}">${r[7]}</strong>`]),
      'Net worth trajectory')}
  </div>`;
}

/* ── PLANNING ────────────────────────────────────────────────── */
const PTABS=[
  {id:'roadmap',   lbl:'🗺 Roadmap'  },
  {id:'investing', lbl:'📈 Investing'},
  {id:'allocator', lbl:'💸 Paycheck' },
  {id:'quarterly', lbl:'📋 Quarterly'},
];

function renderPlanning() {
  const active=LS.g('st:planning','roadmap');
  document.getElementById('panel-planning').innerHTML=`
  <div class="sub-tab-bar">
    ${PTABS.map(t=>`<button class="sub-tab${t.id===active?' active':''}" data-person="planning" data-st="${t.id}">${t.lbl}</button>`).join('')}
  </div>
  <div id="p-body">${renderPlanningTab(active)}</div>`;
}

function renderPlanningTab(tab) {
  switch(tab){
    case 'roadmap':   return buildRoadmap();
    case 'investing': return buildInvesting();
    case 'allocator': return buildAllocator();
    case 'quarterly': return buildQuarterly();
    default: return '';
  }
}

function buildRoadmap() {
  const dd=D.daniel, ss=D.sonia;
  function ms(ico,lbl,cur,goal) {
    const pct=goal>0?Math.min(100,(cur/goal)*100):0;
    const done=pct>=100;
    const fc=done?'full':pct>=60?'green':pct>=30?'blue':'amber';
    return `<div class="rm-item">
      <span class="rm-icon">${ico}</span>
      <div class="rm-body">
        <div class="rm-label${done?' done':''}">${lbl}</div>
        <div class="rm-prog">${M(cur)} / ${M(goal)}</div>
        <div class="prog" style="margin:4px 0 0">
          <div class="prog-fill ${fc}" style="width:${pct.toFixed(1)}%"></div>
        </div>
      </div>
      <div class="rm-right"><span class="rm-pct">${pct.toFixed(0)}%</span></div>
    </div>`;
  }
  return `<div class="card">
    <div class="card-title">Financial Roadmap</div>
    ${ms('📦','Move Fund Complete',     LS.n('b:s0',dd.savings[0].bal), LS.n('g:s0',dd.savings[0].goal))}
    ${ms('💰','Daniel Emergency Fund',  LS.n('b:s1',dd.savings[1].bal), LS.n('g:s1',dd.savings[1].goal))}
    ${ms('💰','Sonia Savings Goal',     LS.n('b:f0',ss.savings[0].bal), LS.n('g:f0',ss.savings[0].goal))}
    ${ms('💳','NFCU Visa Paid Off',     dd.debts[0].bal-LS.n('b:d0',dd.debts[0].bal), dd.debts[0].bal)}
    ${ms('🏦','NW Loan Paid Off',       ss.debts[0].bal-LS.n('b:e0',ss.debts[0].bal), ss.debts[0].bal)}
    ${ms('👨‍👩‍👧','Family Debt Cleared',   ss.debts[1].bal-LS.n('b:e1',ss.debts[1].bal), ss.debts[1].bal)}
    ${ms('🚗','Vehicle Loan Paid Off',  dd.debts[1].bal-LS.n('b:d1',dd.debts[1].bal), dd.debts[1].bal)}
    ${ms('📈','Begin Investing',        0, 1)}
  </div>`;
}

function buildInvesting() {
  function c(mo,rate,yrs){ const r=rate/100/12,n=yrs*12; return r>0?mo*((Math.pow(1+r,n)-1)/r):mo*n; }
  function cHTML(mo,rate,yrs){
    const fv=c(mo,rate,yrs),contrib=mo*yrs*12,growth=fv-contrib;
    return `<div class="calc-result">
      <div class="calc-stat"><span class="stat-val green">${M(fv)}</span><span class="stat-lbl">End Value</span></div>
      <div class="calc-stat"><span class="stat-val">${M(contrib)}</span><span class="stat-lbl">Contributed</span></div>
      <div class="calc-stat"><span class="stat-val blue">${M(growth)}</span><span class="stat-lbl">Market Growth</span></div>
    </div>
    <div class="calc-projections">
      ${[10,20,30].map(y=>`<div class="proj-item"><span class="proj-val">${M(c(mo,rate,y))}</span><span class="proj-lbl">${y} years</span></div>`).join('')}
    </div>`;
  }
  return `<div class="card">
    <div class="card-title">Compound Growth Calculator</div>
    <div class="calc-inputs">
      <div class="input-group"><label class="input-label">Monthly $</label><input type="number" id="ci-mo" value="200" step="25"/></div>
      <div class="input-group"><label class="input-label">Return %</label><input type="number" id="ci-rate" value="7" step=".5"/></div>
      <div class="input-group"><label class="input-label">Years</label><input type="number" id="ci-yrs" value="10" step="1"/></div>
    </div>
    <div id="calc-out">${cHTML(200,7,10)}</div>
  </div>
  <div class="card">
    <div class="card-title">Post-Visa Freedom Scenario</div>
    <p class="section-note">Visa gone ≈ late 2027. Investing $350/mo at 7% from that point:</p>
    <div class="calc-projections">
      ${[5,10,20].map(y=>`<div class="proj-item"><span class="proj-val">${M(c(350,7,y))}</span><span class="proj-lbl">${y} years</span></div>`).join('')}
    </div>
    <div class="tip" style="margin-top:14px"><strong>Income Scaling Note</strong>
    As income grows, redirect new income ≥50% to investing before upgrading lifestyle. The math compounds fastest when started early.</div>
  </div>`;
}

function buildAllocator() {
  const income=getIncome('daniel');
  const allocs=[
    {name:'Bills (Daniel share)', fixed:Math.round(D.household.bills.reduce((a,b)=>a+b.total,0)*0.59), editable:false},
    {name:'Visa payment',         fixed:700,  editable:true },
    {name:'Vehicle loan',         fixed:426,  editable:true },
    {name:'Move / Emergency',     fixed:300,  editable:true },
    {name:'Gas / transport',      fixed:175,  editable:true },
    {name:'Food & personal',      fixed:150,  editable:true },
    {name:'Buffer',               fixed:0,    editable:false},
  ];
  const editable=allocs.reduce((a,x)=>a+(x.editable?x.fixed:0),0);
  const fixed   =allocs.reduce((a,x)=>a+(!x.editable?x.fixed:0),0);
  allocs[allocs.length-1].fixed=Math.max(0,income-editable-fixed+allocs[allocs.length-1].fixed);

  return `<div class="card">
    <div class="card-title">Paycheck Allocator</div>
    <p class="section-note">Based on Daniel income ${M(income)}/mo · Edit any amount — Unassigned updates live.</p>
    <div id="paloc">
      ${allocs.map((a,i)=>`
      <div class="alloc-row" data-alloc="${i}" data-fixed="${!a.editable?a.fixed:0}">
        <span class="alloc-name">${a.name}</span>
        ${a.editable
          ? `<div class="alloc-input"><input type="number" step="5" min="0" data-ai="${i}" value="${a.fixed}" style="text-align:right"/></div>`
          : `<span class="alloc-val pv">${M(a.fixed)}</span>`}
      </div>`).join('')}
    </div>
    <div class="alloc-totals">
      <div class="alloc-total-row"><span class="l">Income</span><span class="v pv" id="alloc-income-val">${M(income)}</span></div>
      <div class="alloc-total-row" id="alloc-assigned"><span class="l">Assigned</span><span class="v pv">${M(income)}</span></div>
      <div class="alloc-total-row" id="alloc-remain" ><span class="l">Unassigned</span><span class="v pv">${M(0)}</span></div>
    </div>
  </div>`;
}

function buildQuarterly() {
  const qItems=[
    'Overdrafts are $0 for the quarter.',
    'Daniel NFCU Visa has $0 new charges.',
    'Daniel Visa balance fell every month.',
    'Sonia family debt payment made every month.',
    'Sonia NW loan current or accelerated.',
    'Emergency savings increased.',
    'Shared bills split correctly 59/41.',
    'Subscriptions did not creep back.',
    'All spending caps honored.',
    'Net worth improved quarter over quarter.',
    'Old address obligations fully closed.',
    'Investing started only after all triggers met.',
  ];
  const triggers=[
    ['Daniel',   'Visa paid off · $1K emergency · 90 days no new charges','$50–$150/mo'],
    ['Sonia',    '$2,500 savings · no overdrafts 90 days · family debt <$5K','$50–$150/mo'],
    ['Household','Both current · shared bills stable · no legacy bills','Review quarterly'],
  ];
  return `<div class="card">
    <div class="card-title">Quarterly Review Checklist</div>
    ${buildChecklist('quarterly',qItems)}
  </div>
  <div class="card">
    <div class="card-title">Investing Triggers</div>
    ${tbl(['Person','Condition','Start'],triggers,'Investing triggers')}
    <div class="ok-box" style="margin-top:12px">
      <strong>Post-Debt Life</strong>
      Combined ~$1,400+/mo freed once all debt is cleared. Target: Roth IRAs for both + brokerage + lifestyle upgrade — in that order.
    </div>
  </div>`;
}

/* ── SETTINGS ────────────────────────────────────────────────── */
function renderSettings() {
  const allD=[...D.daniel.debts,...D.sonia.debts];
  const dInc=getIncome('daniel'), sInc=getIncome('sonia');

  document.getElementById('panel-settings').innerHTML=`

  <!-- Income -->
  <div class="card">
    <div class="card-title">Income — Scales entire app</div>
    <p class="section-note">Change either income and all budgets, allocations, and projections update automatically.</p>
    <div class="income-edit-row">
      <label>Daniel monthly income</label>
      <input class="inc-input" type="number" step="50" min="0" value="${dInc}" data-income="daniel"/>
      <span class="inc-unit">/mo</span>
    </div>
    <div class="income-edit-row">
      <label>Sonia monthly income</label>
      <input class="inc-input" type="number" step="50" min="0" value="${sInc}" data-income="sonia"/>
      <span class="inc-unit">/mo</span>
    </div>
  </div>

  <!-- Snapshot -->
  <div class="card">
    <div class="card-title">Monthly Net Worth Snapshot</div>
    <p class="section-note">Tap once a month. Captures all current slider values — no re-entry needed.</p>
    <button class="btn-primary btn-sm" id="snap-btn">Record Snapshot</button>
    <div class="snap-log" id="snap-log">${buildSnapLog()}</div>
  </div>

  <!-- APR editor -->
  <div class="card">
    <div class="card-title">APR Editor</div>
    ${allD.map(d=>`
    <div class="metric">
      <span class="metric-lbl">${d.name}</span>
      <div style="display:flex;align-items:center;gap:6px">
        <input type="number" step=".01" style="max-width:80px;min-height:34px;padding:4px 8px;font-size:.82rem;text-align:right"
          data-apr="${d.id}" value="${d.apr}"/>
        <span style="font-size:.8rem;color:var(--t3)">%</span>
      </div>
    </div>`).join('')}
  </div>

  <!-- Export/Import -->
  <div class="card">
    <div class="card-title">Export / Import</div>
    <div class="btn-row">
      <button class="btn-primary btn-sm" id="exp-json">Export JSON</button>
      <button class="btn-secondary btn-sm" id="exp-csv">Export CSV</button>
    </div>
    <div style="margin-top:14px">
      <label class="input-label" style="display:block;margin-bottom:6px">Import JSON backup</label>
      <input type="file" id="imp-file" accept=".json"/>
      <button class="btn-secondary btn-sm" style="margin-top:8px" id="imp-btn">Restore from File</button>
      <p id="imp-status" style="font-size:.78rem;margin-top:6px;color:var(--green)"></p>
    </div>
    <pre class="export-out" id="export-out"></pre>
  </div>

  <!-- Future features callout -->
  <div class="card">
    <div class="card-title">Coming: AI Integration</div>
    <div class="tip"><strong>Planned Capabilities</strong>
      Agent-driven monthly spending analysis · Automatic debt payoff optimization · Natural language queries ("What's our fastest path to debt-free?") · Auto-categorization of transactions via bank CSV import · Recurring income detection and projection scaling.
    </div>
    <div class="tip"><strong>How to connect</strong>
      Export JSON → paste into Claude, GPT-4, or Gemini with the prompt "Analyze this financial data and suggest optimizations." Your snapshot log makes this conversation context-aware over time.
    </div>
  </div>

  <!-- Danger zone -->
  <div class="card" style="border:1px solid rgba(255,69,58,.25)">
    <div class="card-title" style="color:var(--red)">Danger Zone</div>
    <p class="section-note">Permanently clears all saved progress on this device.</p>
    <button class="btn-danger btn-sm" id="rst-all">Clear All Progress</button>
  </div>`;

  bindSettings();
}

function buildSnapLog() {
  const log=LS.g('nwlog',[]);
  if(!log.length) return '<p class="empty-state">No snapshots yet.</p>';
  return log.slice(0,10).map((e,i)=>{
    const prev=log[i+1];
    const delta=prev?e.nw-prev.nw:null;
    const dHtml=delta!==null
      ? `<span class="nw-delta ${delta>=0?'up':'dn'}">${delta>=0?'+':''}${M(delta)}</span>` : '';
    return `<div class="snap-entry">
      <div class="snap-top">
        <span class="snap-date">${e.date}</span>
        <span class="snap-nw ${e.nw>=0?'text-green':'text-red'} pv">${M(e.nw)} ${dHtml}</span>
      </div>
      <span class="snap-detail">Debt ${M(e.debt)} · Assets ${M(e.liquid)} · Burn ${M(e.burn)}/mo</span>
    </div>`;
  }).join('');
}

function recordSnapshot() {
  const t=totals();
  const log=LS.g('nwlog',[]);
  log.unshift({date:new Date().toLocaleDateString(),debt:t.debt,liquid:t.liquid,nw:t.nw,burn:t.burn});
  if(log.length>36) log.splice(36);
  LS.s('nwlog',log);
  const sl=document.getElementById('snap-log'); if(sl) sl.innerHTML=buildSnapLog();
  updNWSnippet();
  touchSaved();
}

function bindSettings() {
  const prefixes=['b:','g:','w:','cs:','cl:','p:','ck:','st:','inc:','bsp:','bb:'];

  document.getElementById('snap-btn').addEventListener('click',()=>{
    recordSnapshot(); toast('Net worth snapshot recorded','success');
  });

  document.getElementById('exp-json').addEventListener('click',()=>{
    const data={};
    prefixes.forEach(p=>LS.ks(p).forEach(k=>{data[k]=LS.g(k);}));
    data.nwlog=LS.g('nwlog',[]);
    const j=JSON.stringify(data,null,2);
    dlFile(`gj-${dateStr()}.json`,j,'application/json');
    const out=document.getElementById('export-out');
    if(out){out.textContent=j;out.style.display='block';}
    toast('Export downloaded','success');
  });

  document.getElementById('exp-csv').addEventListener('click',()=>{
    const rows=[['Key','Value','Date']];
    const now=new Date().toISOString();
    prefixes.forEach(p=>LS.ks(p).forEach(k=>rows.push([k,JSON.stringify(LS.g(k)),now])));
    const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    dlFile(`gj-${dateStr()}.csv`,csv,'text/csv');
    toast('CSV downloaded','success');
  });

  document.getElementById('imp-btn').addEventListener('click',()=>{
    const file=document.getElementById('imp-file').files[0];
    const status=document.getElementById('imp-status');
    if(!file){status.textContent='⚠️ Select a JSON file first.'; return;}
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const data=JSON.parse(e.target.result); let n=0;
        Object.entries(data).forEach(([k,v])=>{
          if(prefixes.some(p=>k.startsWith(p))||k==='nwlog'){LS.s(k,v);n++;}
        });
        status.textContent=`✅ Imported ${n} items. Reloading…`;
        setTimeout(()=>location.reload(),1200);
      }catch{status.textContent='❌ Invalid file.';}
    };
    reader.readAsText(file);
  });

  document.getElementById('rst-all').addEventListener('click',()=>{
    if(!confirm('Clear all saved progress? This cannot be undone.')) return;
    prefixes.forEach(p=>LS.ks(p).forEach(k=>LS.rm(k)));
    LS.rm('nwlog'); LS.rm('lastUpdated'); location.reload();
  });
}

/* ═══════════════════════════════════════════════════════════════
   EVENT DELEGATION — all live interactions
═══════════════════════════════════════════════════════════════ */
function initEvents() {

  /* ── Main tabs ── */
  $$('.tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      $$('.tab').forEach(t=>{t.classList.remove('active');t.setAttribute('aria-selected','false');});
      $$('.panel').forEach(p=>p.classList.add('hidden'));
      tab.classList.add('active'); tab.setAttribute('aria-selected','true');
      document.getElementById(`panel-${tab.dataset.tab}`).classList.remove('hidden');
    });
    tab.addEventListener('keydown',e=>{
      const tabs=$$('.tab'), i=tabs.indexOf(tab);
      if(e.key==='ArrowRight'){e.preventDefault();tabs[(i+1)%tabs.length].focus();}
      if(e.key==='ArrowLeft') {e.preventDefault();tabs[(i-1+tabs.length)%tabs.length].focus();}
    });
  });

  /* ── Sub-tabs ── */
  document.addEventListener('click',e=>{
    if(!e.target.matches('.sub-tab')) return;
    const person=e.target.dataset.person, st=e.target.dataset.st;
    LS.s('st:'+person,st);
    $$('.sub-tab').filter(b=>b.dataset.person===person).forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    const bodies={daniel:'#d-body',sonia:'#s-body',planning:'#p-body'};
    const fns={daniel:renderDanielTab,sonia:renderSoniaTab,planning:renderPlanningTab};
    const body=$(bodies[person]);
    if(body){
      body.innerHTML=fns[person](st);
      if(st==='investing') bindCalc();
    }
  });

  /* ── Income inputs (inline editable — fires on change) ── */
  document.addEventListener('change',e=>{
    if(!e.target.matches('[data-income]')) return;
    const person=e.target.dataset.income;
    const val=parseFloat(e.target.value)||0;
    setIncome(person,val);
    // sync all income inputs for same person
    $$(`[data-income="${person}"]`).forEach(el=>{ if(el!==e.target) el.value=val; });
    // update combined display
    const comEls=['dash-combined','hh-combined'];
    const combo=getIncome('daniel')+getIncome('sonia');
    comEls.forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=M(combo)+'/mo'; });
    toast(`${person==='daniel'?'Daniel':'Sonia'} income updated to ${M(val)}/mo`,'success');
  });

  /* ── Range slider drag ── */
  document.addEventListener('input',e=>{
    if(e.target.matches('[data-sirange]')){
      const id=e.target.dataset.sirange, type=e.target.dataset.stype;
      const wrap=e.target.closest('[data-sid]'); if(!wrap) return;
      const goalEl=document.getElementById('sg-'+id);
      const goal=goalEl?parseFloat(goalEl.value)||0:0;
      const rv=parseFloat(e.target.value);
      const cur=type==='debt'?Math.max(0,goal-rv):rv;
      LS.s('b:'+id,cur); touchSaved();
      updSlider(id,type,cur,goal); updPayoffEst(id); updHeroStats();
    }
  });

  /* ── Wallet ── */
  document.addEventListener('input',e=>{
    if(!e.target.matches('[data-w]')) return;
    const p=e.target.dataset.w, wt=e.target.dataset.wt;
    localStorage.setItem('w:'+p+':'+wt, parseFloat(e.target.value)||0);
    const c=LS.n('w:'+p+':c',0), sv=LS.n('w:'+p+':s',0);
    const el=document.getElementById('wt-'+p); if(el) el.textContent=M(c+sv);
    updHeroStats(); touchSaved();
  });

  /* ── Cap spent ── */
  document.addEventListener('input',e=>{
    if(!e.target.matches('[data-csp]')) return;
    const id=e.target.dataset.csp;
    const spent=parseFloat(e.target.value)||0;
    localStorage.setItem('cs:'+id,spent);
    const limEl=document.getElementById('clm-'+id);
    const lim=limEl?parseFloat(limEl.value)||0:LS.n('cl:'+id,0);
    updCap(id,spent,lim); touchSaved();
  });

  /* ── Budget spend tracker ── */
  document.addEventListener('input',e=>{
    if(e.target.matches('[data-bsp]')){
      const key=e.target.dataset.bsp;
      LS.s('bsp:'+key, parseFloat(e.target.value)||0);
      // update status badge
      const budget=LS.n('bb:'+key,0);
      const spent=parseFloat(e.target.value)||0;
      const pct=budget>0?Math.min(100,(spent/budget)*100):0;
      const cls=pct>=100?'over':pct>=80?'warn':'ok';
      const txt=budget>0?(pct>=100?'OVER':(Math.round(pct))+'%'):'—';
      const badge=document.getElementById('bss-'+key);
      if(badge){badge.textContent=txt;badge.className='bsr-status '+cls;}
      touchSaved();
    }
    if(e.target.matches('[data-bbudget]')){
      const key=e.target.dataset.bbudget;
      LS.s('bb:'+key, parseFloat(e.target.value)||0);
      const spent=LS.n('bsp:'+key,0);
      const budget=parseFloat(e.target.value)||0;
      const pct=budget>0?Math.min(100,(spent/budget)*100):0;
      const cls=pct>=100?'over':pct>=80?'warn':'ok';
      const txt=budget>0?(pct>=100?'OVER':(Math.round(pct))+'%'):'—';
      const badge=document.getElementById('bss-'+key);
      if(badge){badge.textContent=txt;badge.className='bsr-status '+cls;}
      touchSaved();
    }
  });

  /* ── change events ── */
  document.addEventListener('change',e=>{

    /* Slider balance direct-type */
    if(e.target.matches('[data-sbal]')){
      const id=e.target.dataset.sbal, type=e.target.dataset.stype;
      const cur=parseFloat(e.target.value)||0;
      const gEl=document.getElementById('sg-'+id);
      const goal=gEl?parseFloat(gEl.value)||0:0;
      LS.s('b:'+id,cur); touchSaved();
      updSlider(id,type,cur,goal); updPayoffEst(id); updHeroStats();
    }

    /* Slider goal edit */
    if(e.target.matches('[data-sgoal]')){
      const id=e.target.dataset.sgoal, type=e.target.dataset.stype;
      const goal=parseFloat(e.target.value)||1;
      LS.s('g:'+id,goal);
      const bEl=document.getElementById('sb-'+id);
      const cur=bEl?parseFloat(bEl.value)||0:LS.n('b:'+id,0);
      const rng=document.getElementById('sr-'+id);
      if(rng){rng.max=goal;rng.value=type==='debt'?Math.max(0,goal-cur):cur;}
      updSlider(id,type,cur,goal); updHeroStats(); touchSaved();
    }

    /* Cap limit */
    if(e.target.matches('[data-clm]')){
      const id=e.target.dataset.clm;
      const lim=parseFloat(e.target.value)||0;
      localStorage.setItem('cl:'+id,lim);
      const spEl=document.getElementById('csp-'+id);
      const sp=spEl?parseFloat(spEl.value)||0:0;
      updCap(id,sp,lim); touchSaved();
    }

    /* Payoff payment */
    if(e.target.matches('[data-pmt]')){
      const id=e.target.dataset.pmt;
      LS.s('p:'+id,parseFloat(e.target.value)||0);
      updPayoffEst(id); touchSaved();
    }

    /* APR editor */
    if(e.target.matches('[data-apr]')){
      const id=e.target.dataset.apr;
      const apr=parseFloat(e.target.value)||0;
      const allD=[...D.daniel.debts,...D.sonia.debts];
      const d=allD.find(x=>x.id===id); if(d) d.apr=apr;
      updHeroStats();
    }

    /* Bill split */
    if(e.target.matches('[data-bill]')){
      const name=e.target.dataset.bill;
      const val=parseFloat(e.target.value)||0;
      const split=D.household.split;
      const dEl=document.getElementById('bsd-'+name);
      const sEl=document.getElementById('bss-'+name);
      if(dEl) dEl.textContent=M(val*split.daniel);
      if(sEl) sEl.textContent=M(val*split.sonia);
      let tot=0; $$('[data-bill]').forEach(inp=>tot+=parseFloat(inp.value)||0);
      const tEl=document.getElementById('split-tot');
      const tdEl=document.getElementById('split-tot-d');
      const tsEl=document.getElementById('split-tot-s');
      if(tEl)  tEl.textContent=M(tot);
      if(tdEl) tdEl.textContent=M(tot*split.daniel);
      if(tsEl) tsEl.textContent=M(tot*split.sonia);
    }

    /* Paycheck allocator */
    if(e.target.matches('[data-ai]')){
      const income=getIncome('daniel'); let editTotal=0;
      $$('[data-ai]').forEach(inp=>editTotal+=parseFloat(inp.value)||0);
      $$('#paloc .alloc-row').forEach(row=>{
        const fv=parseFloat(row.dataset.fixed)||0; if(fv) editTotal+=fv;
      });
      const remain=income-editTotal;
      const aEl=document.getElementById('alloc-assigned');
      const rEl=document.getElementById('alloc-remain');
      if(aEl) aEl.querySelector('.v').textContent=M(editTotal);
      if(rEl){
        rEl.querySelector('.v').textContent=M(Math.abs(remain));
        rEl.classList.toggle('over',remain<0);
        rEl.querySelector('.l').textContent=remain<0?'Over by':'Unassigned';
      }
    }

    /* Checklists */
    if(e.target.matches('[data-ckl]')){
      const {ckl,cki}=e.target.dataset;
      const saved=LS.g('ck:'+ckl,{});
      saved[cki]=e.target.checked;
      LS.s('ck:'+ckl,saved);
      e.target.closest('.cl-item').classList.toggle('done',e.target.checked);
      const boxes=$$(`[data-ckl="${ckl}"]`);
      const doneCount=boxes.filter(b=>b.checked).length;
      const sum=document.getElementById('cks-'+ckl);
      if(sum) sum.textContent=`${doneCount} of ${boxes.length} complete`;
      touchSaved();
    }
  });

  /* ── Reset buttons ── */
  document.addEventListener('click',e=>{
    if(e.target.id==='rst-dcaps'){
      LS.ks('cs:c').forEach(k=>LS.rm(k));
      const b=document.getElementById('d-body');
      if(b) b.innerHTML=renderDanielTab('spending');
      toast('Spending caps reset','success');
    }
    if(e.target.id==='rst-scaps'){
      LS.ks('cs:g').forEach(k=>LS.rm(k));
      const b=document.getElementById('s-body');
      if(b) b.innerHTML=renderSoniaTab('spending');
      toast('Spending caps reset','success');
    }
    if(e.target.id==='rst-dbudget'){
      LS.ks('bsp:d').forEach(k=>LS.rm(k));
      const b=document.getElementById('d-body');
      if(b) b.innerHTML=renderDanielTab('budget');
      toast('Budget tracker reset','success');
    }
    if(e.target.id==='rst-sbudget'){
      LS.ks('bsp:s').forEach(k=>LS.rm(k));
      const b=document.getElementById('s-body');
      if(b) b.innerHTML=renderSoniaTab('budget');
      toast('Budget tracker reset','success');
    }
  });

  /* ── Privacy toggle ── */
  document.getElementById('privBtn').addEventListener('click', function(){
    const on=!document.body.classList.contains('pm');
    document.body.classList.toggle('pm',on);
    LS.s('pm',on);
    this.setAttribute('aria-pressed',String(on));
    toast(on?'Privacy on — tap values to reveal':'Privacy off','info');
  });
  if(LS.g('pm',false)){
    document.body.classList.add('pm');
    const btn=document.getElementById('privBtn');
    if(btn) btn.setAttribute('aria-pressed','true');
  }

  /* ── Print ── */
  document.getElementById('printBtn').addEventListener('click',()=>window.print());

  /* ── lastSaved restore ── */
  const ts=LS.g('lastUpdated',null);
  if(ts){
    const d=new Date(ts), el=document.getElementById('lastSaved');
    if(el) el.textContent=`Saved ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;
  }
}

/* ── Compound calc live ──────────────────────────────────────── */
function bindCalc() {
  function run(){
    const mo=parseFloat(document.getElementById('ci-mo')?.value)||0;
    const rate=parseFloat(document.getElementById('ci-rate')?.value)||0;
    const yrs=parseFloat(document.getElementById('ci-yrs')?.value)||0;
    function c(m,r,y){const mr=r/100/12,n=y*12;return mr>0?m*((Math.pow(1+mr,n)-1)/mr):m*n;}
    const fv=c(mo,rate,yrs),contrib=mo*yrs*12,growth=fv-contrib;
    const out=document.getElementById('calc-out'); if(!out) return;
    out.innerHTML=`<div class="calc-result">
      <div class="calc-stat"><span class="stat-val green">${M(fv)}</span><span class="stat-lbl">End Value</span></div>
      <div class="calc-stat"><span class="stat-val">${M(contrib)}</span><span class="stat-lbl">Contributed</span></div>
      <div class="calc-stat"><span class="stat-val blue">${M(growth)}</span><span class="stat-lbl">Market Growth</span></div>
    </div>
    <div class="calc-projections">
      ${[10,20,30].map(y=>`<div class="proj-item"><span class="proj-val">${M(c(mo,rate,y))}</span><span class="proj-lbl">${y} years</span></div>`).join('')}
    </div>`;
  }
  ['ci-mo','ci-rate','ci-yrs'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.addEventListener('input',run);
  });
}

/* ── Utilities ───────────────────────────────────────────────── */
function dateStr(){return new Date().toISOString().slice(0,10);}
function dlFile(name,content,mime){
  const b=new Blob([content],{type:mime}),u=URL.createObjectURL(b);
  const a=document.createElement('a');a.href=u;a.download=name;
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);
}

/* ═══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */
function init(){
  initAuth();
  renderDashboard();
  renderDaniel();
  renderSonia();
  renderHousehold();
  renderPlanning();
  renderSettings();
  initEvents();
}

document.addEventListener('DOMContentLoaded', init);
