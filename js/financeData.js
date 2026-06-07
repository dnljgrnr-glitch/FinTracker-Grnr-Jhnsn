window.FINANCE_DATA = {
  password: "JASPER",
  reportDate: "June 2026",

  /* ── Goal defaults — all editable via Settings ── */
  goalDefaults: {
    /* Daniel — debts */
    'd-visa-bal':      9315.95,
    'd-visa-min':      452.82,
    'd-visa-target':   700,
    'd-visa-apr':      17,
    'd-vehicle-bal':   22010.21,
    'd-vehicle-min':   426.20,
    'd-vehicle-apr':   9.14,
    'd-apple-bal':     930.39,
    'd-apple-min':     50,
    /* Daniel — goals */
    'd-move-target':   1950,
    'd-income':        3200,
    /* Sonia — debts */
    's-nw-bal':        2266.02,
    's-nw-min':        135.83,
    's-nw-apr':        12.50,
    's-family-bal':    10000,
    's-family-pmt':    200,
    's-apple-min':     20,
    /* Sonia — goals */
    's-savings-target':2500,
    's-income':        2200,
    /* Household */
    'hh-rent':         800,
    'hh-electric':     150,
    'hh-internet':     50,
    'hh-groceries':    300,
    'hh-split-daniel': 59,
    /* Spending caps */
    'cap-daniel-gas':      175,
    'cap-daniel-personal': 150,
    'cap-daniel-fastfood': 60,
    'cap-daniel-online':   50,
    'cap-sonia-beauty':    100,
    'cap-sonia-fastfood':  60,
    'cap-sonia-amazon':    50,
    'cap-sonia-applecash': 50,
  },

  /* ── Spending cap definitions ── */
  spendingCaps: {
    daniel: [
      { id: 'gas',      label: 'Gas / Transportation'  },
      { id: 'personal', label: 'Personal / Food / Misc'},
      { id: 'fastfood', label: 'Fast Food'              },
      { id: 'online',   label: 'Online Shopping'        },
    ],
    sonia: [
      { id: 'beauty',    label: 'Beauty / Personal Care'},
      { id: 'fastfood',  label: 'Fast Food'             },
      { id: 'amazon',    label: 'Amazon / Online'       },
      { id: 'applecash', label: 'Apple Cash Transfers'  },
    ],
  },

  daniel: {
    payFrequency: "Weekly RAC pay + monthly VA",
    checklist: [
      "Cancel ChatGPT, Spotify, Xbox Game Pass, downgrade Notion.",
      "Cancel Planet Fitness in person — keep the receipt.",
      "Load $300 into Bills Bucket on June 5.",
      "Call Verizon and target $80–$120/month.",
      "Pay vehicle loan by June 20.",
      "Keep NFCU Visa at zero new charges.",
      "Build Bills Bucket to $1,950 by July 10.",
      "Start $700/month Visa payoff after the move.",
      "Protect EasyStart Certificate until December 2026.",
    ],
    paychecks: [
      ["Fri Jun 5",  "$621",    "$300 move fund · $100 vehicle reserve · $100 food/gas · $54.16 rent reserve · $66.84 floor"],
      ["Fri Jun 12", "$621",    "$300 move fund · $150 vehicle reserve · $134 Progressive · $37 spending"],
      ["Fri Jun 19", "$621",    "$300 move fund · $176.20 vehicle final · $30.73 Claude/Netflix · $12.50 TruStage · $50 Apple · $51.57 food/gas"],
      ["Fri Jun 26", "$621",    "$300 move fund · $152.22 Verizon · $50 Comcast · $68.78 food/gas/personal · $50 buffer"],
      ["VA Jun 30",  "$795.84", "$645.84 rent · $150 move fund"],
      ["Fri Jul 3",  "$621",    "$300 move fund · $321 Visa reserve/payment"],
      ["Fri Jul 10", "$621",    "$300 move fund · $131.82 Visa reserve · $189.18 food/gas/personal"],
    ],
    visaTimeline: [
      ["Minimum only", "$452.82", "25–27 months"],
      ["Recommended",  "$700",    "~15 months"],
      ["Aggressive",   "$900",    "11–12 months"],
    ],
  },

  sonia: {
    payFrequency: "Biweekly payroll",
    checklist: [
      "Move $900 Apple Cash to Apple Savings.",
      "Add $100 from next paycheck → $1,000 emergency savings.",
      "Cancel Planet Fitness in person.",
      "Log NW loan as $2,266.02 at 12.50% APR.",
      "Send family repayment message.",
      "Cap fast food at $60/month.",
      "Cap beauty/personal care at $100/month.",
      "Cap Amazon/online at $50/month.",
      "Confirm old address obligations end at move: Rocket, electric, JJ Peters, Suburban Water.",
    ],
    nextPaycheck: [
      ["Apple Savings top-off",          "$100"],
      ["Rocket/current housing reserve", "$400"],
      ["Utilities/trash/water reserve",  "$150"],
      ["Northwest loan reserve",         "$68"],
      ["Phone reserve",                  "$35"],
      ["Food/gas",                       "$125"],
      ["Beauty/personal",                "$40"],
      ["Fast food",                      "$20"],
      ["Amazon",                         "$20"],
      ["Named-purpose Apple Cash",       "$20"],
      ["Checking floor",                 "$122"],
    ],
    loanPayoff: [
      ["$135.83 min", "19 months", "$236.27"],
      ["$150",        "17 months", "$212.54"],
      ["$200",        "13 months", "$157.92"],
      ["$250",        "10 months", "$126.92"],
      ["$300",        "8 months",  "$106.52"],
    ],
    familyDebtTimeline: [
      ["Start","$10,000"],["Month 1","$9,800"],["Month 2","$9,600"],
      ["Month 3","$9,300"],["Month 6","$8,400"],["Month 12","$6,600"],
      ["Month 18","$4,800"],["Month 24","$3,000"],["Month 30","$1,200"],["Month 34","$0"],
    ],
    savingsTargets: [
      ["Today",900],["Next paycheck",1000],["Month 1",1270],["Month 2",1540],
      ["Month 3",1810],["Month 6",2620],["Month 12",3820],["Month 24",5620],
    ],
  },

  household: {
    debtSequence: [
      [1,"No overdrafts / no new Visa charges","Stops new damage"],
      [2,"Daniel NFCU Visa","Highest APR"],
      [3,"Sonia family debt","Relationship preservation"],
      [4,"Sonia NW loan","$2,266.02 at 12.50% — extra after savings target"],
      [5,"Daniel vehicle loan","Large balance at 9.14%"],
      [6,"Investing","Only after triggers are met"],
    ],
    netWorth: [
      [1, "$8,756","$21,752","$9,800","$2,148",  "$4,237", "$0",    "-$38,218"],
      [6, "$5,826","$20,429","$8,400","$1,544",  "$6,087", "$0",    "-$30,112"],
      [12,"$2,009","$18,774","$6,600","$757",    "$7,887", "$0",    "-$20,253"],
      [18,"$0",    "$14,926","$4,800","$95 est.","$9,687", "$0",    "-$10,134"],
      [24,"$0",    "$8,734", "$3,000","$0",      "$10,887","$900",  "$53"],
      [30,"$0",    "$2,254", "$1,200","$0",      "$12,087","$1,800","$10,433"],
      [34,"$0",    "$0",     "$0",    "$0",      "$12,887","$2,400","$15,287"],
      [36,"$0",    "$0",     "$0",    "$0",      "$13,487","$3,000","$16,487"],
    ],
  },
};
