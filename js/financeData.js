window.FINANCE_DATA = {
  password: "JASPER",
  reportDate: "June 2026",
  updatedNote: "Sonia Northwest loan payoff balance updated to $2,266.02 at 12.50% APR.",
  daniel: {
    incomeMonthly: 3200,
    payFrequency: "Weekly RAC pay + monthly VA",
    debts: [
      { name: "NFCU Visa", balance: 9315.95, apr: "16.49%-18%", minimum: 452.82, targetPayment: 700 },
      { name: "NFCU Vehicle Loan", balance: 22010.21, apr: "9.14%", minimum: 426.20 },
      { name: "Apple Card", balance: 930.39, apr: "TBD", minimum: 50 }
    ],
    checklist: [
      "Cancel ChatGPT, Spotify, Xbox Game Pass, and downgrade Notion.",
      "Cancel Planet Fitness in person and keep proof.",
      "Load $300 into Bills Bucket on June 5.",
      "Call Verizon and target $80-$120/month.",
      "Pay vehicle loan by June 20.",
      "Keep NFCU Visa at zero new charges.",
      "Build Bills Bucket to $1,950 by July 10.",
      "Start $700/month Visa payoff after the move.",
      "Protect EasyStart Certificate until December 2026."
    ],
    paychecks: [
      ["Fri Jun 5", "$621", "$300 move fund; $100 vehicle reserve; $100 food/gas; $54.16 rent reserve; $66.84 checking floor"],
      ["Fri Jun 12", "$621", "$300 move fund; $150 vehicle reserve; $134 Progressive; $37 spending only"],
      ["Fri Jun 19", "$621", "$300 move fund; $176.20 vehicle final piece; $30.73 Claude/Netflix; $12.50 TruStage; $50 Apple Card; $51.57 food/gas"],
      ["Fri Jun 26", "$621", "$300 move fund; $152.22 Verizon; $50 Comcast; $68.78 food/gas/personal; $50 buffer"],
      ["VA - Jun 30 est.", "$795.84", "$645.84 rent; $150 move fund"],
      ["Fri Jul 3", "$621", "$300 move fund; $321 Visa reserve/payment"],
      ["Fri Jul 10", "$621", "$300 move fund; $131.82 Visa reserve/payment; $189.18 food/gas/personal"]
    ],
    budget: [
      ["Shared household expenses", 768], ["Vehicle loan", 426.20], ["Visa minimum", 452.82], ["Extra Visa target", 247.18],
      ["Progressive", 134], ["Verizon target", 120], ["TruStage", 12.50], ["Apple Card estimate", 50],
      ["Claude", 21.20], ["Netflix", 9.53], ["Gas/transportation", 175], ["Personal/food out/misc.", 150], ["Emergency savings", 100]
    ],
    visaTimeline: [["Minimum only", "$452.82", "25-27 months"],["Recommended", "$700", "about 15 months"],["Aggressive", "$900", "11-12 months"]]
  },
  sonia: {
    incomeMonthly: 2200,
    payFrequency: "Biweekly payroll",
    debts: [
      { name: "Northwest Bank Personal Loan", balance: 2266.02, apr: "12.50%", minimum: 135.83, payoffMonthsAtMinimum: 19 },
      { name: "Family Debt", balance: 10000, apr: "0%", minimum: 200, targetPaymentMonth3: 300 },
      { name: "Apple Card", balance: null, apr: "TBD", minimum: 20 }
    ],
    checklist: [
      "Move $900 Apple Cash to Apple Savings.",
      "Add $100 from next paycheck to reach $1,000 emergency savings.",
      "Cancel Planet Fitness in person.",
      "Log Northwest loan as $2,266.02 at 12.50% APR.",
      "Send family repayment message.",
      "Cap fast food at $60/month.",
      "Cap beauty/personal care at $100/month maximum.",
      "Cap Amazon/online purchases at $50/month.",
      "Confirm old address obligations end at move: Rocket, electric, JJ Peters, Suburban Water."
    ],
    nextPaycheck: [
      ["Apple Savings top-off", "$100"], ["Rocket/current housing reserve", "$400"], ["Current utilities/trash/water reserve", "$150"],
      ["Northwest loan reserve", "$68"], ["Phone reserve", "$35"], ["Food/gas", "$125"], ["Beauty/personal", "$40"],
      ["Fast food", "$20"], ["Amazon", "$20"], ["Named-purpose Apple Cash only", "$20"], ["Checking floor", "$122"]
    ],
    budget: [["Personal fixed bills",263.50],["Shared household expenses",534],["Family debt months 1-2",200],["Family debt month 3+",300],["Savings/sinking fund",270],["Gas",120],["Beauty",100],["Fast food",60],["Amazon",50],["Apple Cash named-purpose transfers",50]],
    loanPayoff: [["$135.83 minimum","19 months","$236.27"],["$150","17 months","$212.54"],["$200","13 months","$157.92"],["$250","10 months","$126.92"],["$300","8 months","$106.52"]],
    familyDebtTimeline: [["Start","$10,000"],["Month 1","$9,800"],["Month 2","$9,600"],["Month 3","$9,300"],["Month 6","$8,400"],["Month 12","$6,600"],["Month 18","$4,800"],["Month 24","$3,000"],["Month 30","$1,200"],["Month 34","$0"]],
    savingsTargets: [["Today",900],["Next paycheck",1000],["Month 1",1270],["Month 2",1540],["Month 3",1810],["Month 6",2620],["Month 12",3820],["Month 24",5620]]
  },
  household: {
    incomeMonthly: 5400,
    split: { Daniel: 0.59, Sonia: 0.41 },
    sharedBills: [["Rent",800,472,328],["Electric",150,89,62],["Internet",50,30,21],["Groceries",300,177,123],["Total",1300,768,534]],
    debtSequence: [[1,"No overdrafts / no new Visa charges","Stops new damage"],[2,"Daniel NFCU Visa","Highest known APR"],[3,"Sonia family debt agreement","Relationship preservation"],[4,"Sonia Northwest loan","$2,266.02 at 12.50%; consider extra after savings target"],[5,"Daniel vehicle loan","Large balance at 9.14%"],[6,"Investing","Only after triggers are met"]],
    netWorth: [[1,"$8,756","$21,752","$9,800","$2,148","$4,237","$0","-$38,218"],[6,"$5,826","$20,429","$8,400","$1,544","$6,087","$0","-$30,112"],[12,"$2,009","$18,774","$6,600","$757","$7,887","$0","-$20,253"],[18,"$0","$14,926","$4,800","$95 est.","$9,687","$0","-$10,134"],[24,"$0","$8,734","$3,000","$0","$10,887","$900","$53"],[30,"$0","$2,254","$1,200","$0","$12,087","$1,800","$10,433"],[34,"$0","$0","$0","$0","$12,887","$2,400","$15,287"],[36,"$0","$0","$0","$0","$13,487","$3,000","$16,487"]]
  }
};
