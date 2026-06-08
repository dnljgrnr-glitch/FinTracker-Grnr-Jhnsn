// ============================================================
//  FINANCEDATA.JS  — Static configuration for FinTracker
//  Garner-Johnson Household
// ============================================================

'use strict';

const DATA = {

  // ── Auth ────────────────────────────────────────────────
  jasper: {
    pass: 'JASPER',
  },

  // ── Household ───────────────────────────────────────────
  people: ['daniel', 'sonia'],

  names: {
    daniel: 'Daniel',
    sonia:  'Sonia',
  },

  // Income (monthly take-home)
  income: {
    daniel: { monthly: 3200, payFreq: 'biweekly' },
    sonia:  { monthly: 2600, payFreq: 'biweekly' },
  },

  // Household split (%)
  split: {
    daniel: 55,
    sonia:  45,
  },

  // ── Move Fund ────────────────────────────────────────────
  moveFund: {
    targetDate:   '2026-07-10',
    targetAmount: 3000,
    paychecksPerMonth: 2,
  },

  // ── Debt Definitions ─────────────────────────────────────
  debts: [
    { id: 'd-visa',   owner: 'daniel', label: 'Visa',          apr: 22.99, startBal: 9315.00  },
    { id: 'd-disc',   owner: 'daniel', label: 'Discover',      apr: 19.99, startBal: 4200.00  },
    { id: 'd-nwln',   owner: 'daniel', label: 'NW Loan',       apr:  7.99, startBal: 2266.02  },
    { id: 's-citi',   owner: 'sonia',  label: 'Citi Card',     apr: 24.99, startBal: 3800.00  },
    { id: 's-stdt',   owner: 'sonia',  label: 'Student Loan',  apr:  5.50, startBal: 11400.00 },
    { id: 'j-car',    owner: 'joint',  label: 'Car Loan',      apr:  6.25, startBal: 14800.00 },
  ],

  // ── Savings Definitions ──────────────────────────────────
  savings: [
    { id: 'd-emer',   owner: 'daniel', label: 'Emergency Fund', goalBal: 5000.00 },
    { id: 'd-move',   owner: 'daniel', label: 'Move Fund',      goalBal: 3000.00 },
    { id: 's-emer',   owner: 'sonia',  label: 'Emergency Fund', goalBal: 3000.00 },
    { id: 's-svng',   owner: 'sonia',  label: 'Savings $2,500', goalBal: 2500.00 },
  ],

  // ── Monthly Spending Caps ────────────────────────────────
  spendCaps: {
    daniel: {
      groceries: 400,
      dining:    150,
      transport: 200,
      personal:  100,
      other:     150,
    },
    sonia: {
      groceries: 300,
      dining:    120,
      transport: 180,
      personal:  120,
      other:     130,
    },
  },

};

// ── Derived helpers ──────────────────────────────────────────

function trackGet(id) {
  const raw = localStorage.getItem('track:' + id);
  return raw !== null ? parseFloat(raw) : null;
}

function currentBal(item) {
  const live = trackGet(item.id);
  if (live !== null) return live;
  return item.startBal !== undefined ? item.startBal : item.goalBal;
}

function monthlyInterest(debt) {
  return currentBal(debt) * (debt.apr / 100 / 12);
}

function totalInterestBurn() {
  return DATA.debts.reduce((sum, d) => sum + monthlyInterest(d), 0);
}

function totalDebt() {
  return DATA.debts.reduce((sum, d) => sum + currentBal(d), 0);
}

function totalSavings() {
  return DATA.savings.reduce((sum, s) => {
    const live = trackGet(s.id);
    return sum + (live !== null ? live : 0);
  }, 0);
}

function moveFundCountdown() {
  const today      = new Date();
  const target     = new Date(DATA.moveFund.targetDate);
  const diffMs     = target - today;
  const daysLeft   = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const paychecksLeft = Math.max(1, Math.floor(daysLeft / 14));
  const currentMoveBal = trackGet('d-move') || 0;
  const remaining  = Math.max(0, DATA.moveFund.targetAmount - currentMoveBal);
  const perPaycheck = remaining / paychecksLeft;
  return { daysLeft, paychecksLeft, remaining, perPaycheck, targetAmount: DATA.moveFund.targetAmount, currentBal: currentMoveBal };
}

function walletGet(person, type) {
  const raw = localStorage.getItem('wallet:' + person + ':' + type);
  return raw !== null ? parseFloat(raw) : 0;
}

function walletSet(person, type, val) {
  localStorage.setItem('wallet:' + person + ':' + type, val);
}
