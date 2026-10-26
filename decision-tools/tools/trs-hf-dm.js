// TIMI risk score for heart failure in diabetes (TRS-HF-DM, biomarker version; Berg 2021; EE+ 623).
module.exports = {
  id: 'trs-hf-dm',
  eeId: 623,
  title: 'Heart failure hospitalization in diabetes (TRS-HF-DM)',
  subtitle: 'Biomarker-based risk of hospitalization for heart failure',
  question: 'For a patient with diabetes, what is the risk of hospitalization for heart failure in the next 4 years?',
  inputs: [
    { id: 'tnt', type: 'choice', label: 'High-sensitivity troponin T', ee: 'ddl1', options: ['Below 6 ng/L', '6 to below 10 ng/L', '10 to below 14 ng/L', '14 ng/L or higher'].map((label, k) => ({ label, points: k })) },
    { id: 'bnp', type: 'choice', label: 'NT-proBNP', ee: 'ddl2', options: ['Below 50 ng/L', '50 to below 125 ng/L', '125 to below 450 ng/L', '450 ng/L or higher'].map((label, k) => ({ label, points: 2 * k })) },
    { id: 'hf', type: 'check', label: 'Prior history of heart failure', points: 2, ee: 'cb1' }
  ],
  points: { label: 'Score', max: 11 },
  compute(a) {
    const s = 2 * a.hf + a.tnt + 2 * a.bnp;
    const r = s <= 3 ? [1, 'Low risk', '1.1%'] : s <= 6 ? [2, 'Moderate risk', '7.7%'] : s <= 8 ? [3, 'High risk', '18.5%'] : [4, 'Very high risk', '53%'];
    return { level: r[0], headline: r[1], lines: [{ label: 'Hospitalization for heart failure within 4 years', value: r[2] }] };
  }
};
