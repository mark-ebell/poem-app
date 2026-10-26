// CADILLAC score: mortality after primary PCI for acute MI (Halkin; EE+ 299).
module.exports = {
  id: 'cadillac',
  eeId: 299,
  title: 'CADILLAC score',
  subtitle: 'Mortality after primary PCI for acute MI',
  question: 'After primary percutaneous coronary intervention for acute MI, what is the risk of death at 30 days and 1 year?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'lvef', type: 'check', label: 'Baseline LVEF below 40%', points: 4, ee: 'IDC_CHECKBOX_1' },
    { id: 'renal', type: 'check', label: 'Renal insufficiency (creatinine clearance below 60 mL/min)', points: 3, ee: 'IDC_CHECKBOX_2' },
    { id: 'killip', type: 'check', label: 'Killip class 2 or 3 (2: crackles, S3 gallop and raised JVP; 3: frank pulmonary edema)', points: 3, ee: 'IDC_CHECKBOX_3' },
    { id: 'timi', type: 'check', label: 'Final TIMI flow grade 0, 1 or 2 (0: no perfusion; 1: penetration without perfusion; 2: partial perfusion)', points: 2, ee: 'IDC_CHECKBOX_4' },
    { id: 'anemia', type: 'check', label: 'Anemia', points: 2, ee: 'IDC_CHECKBOX_5' },
    { id: 'threeVessel', type: 'check', label: 'Three-vessel disease', points: 2, ee: 'IDC_CHECKBOX_6' },
    { id: 'age', type: 'check', label: 'Age over 65', points: 2, ee: 'IDC_CHECKBOX_7' }
  ],
  points: { label: 'CADILLAC score', max: 18 },
  compute(a) {
    const s = 4 * a.lvef + 3 * (a.renal + a.killip) + 2 * (a.timi + a.anemia + a.threeVessel + a.age);
    const r = s <= 2 ? [1, 'Low risk', '0.2%', '0.9%'] : s <= 5 ? [2, 'Moderate risk', '1.3%', '4.5%'] : [4, 'High risk', '8.1%', '12.4%'];
    return { level: r[0], headline: r[1], lines: [{ label: '30-day mortality', value: r[2] }, { label: '1-year mortality', value: r[3] }] };
  }
};
