// Arterial blood gas interpretation (EE+ 104). Rebuilt: EE+ called alkalemia with a low PaCO2 metabolic
// (and with a high PaCO2 respiratory), joined numbers as text in the expected PaCO2 ("1.5 × HCO3" then "8"),
// gave negative chronic compensations, and gave no answer for a normal pH with an abnormal PaCO2 that did
// not fit its two compensated patterns. EE+'s compensation coefficients are kept.
const r1 = x => Math.round(x * 10) / 10;
module.exports = {
  id: 'abg',
  eeId: 104,
  title: 'ABG interpretation',
  subtitle: 'Primary acid-base disorder and expected compensation',
  question: 'What is the primary acid-base disorder, and what compensation is expected?',
  inputs: [
    { id: 'ph', type: 'number', label: 'pH', min: 6.8, max: 7.8, step: 0.01, ee: 'IDC_EDIT_1' },
    { id: 'pco2', type: 'number', label: 'PaCO₂', unit: 'mm Hg', min: 10, max: 150, ee: 'IDC_EDIT_2' },
    { id: 'hco3', type: 'number', label: 'HCO₃⁻', unit: 'mEq/L', min: 2, max: 60, ee: 'IDC_EDIT_3' }
  ],
  compute(a) {
    const { ph, pco2, hco3 } = a;
    if (ph >= 7.35 && ph <= 7.45) {
      if (pco2 >= 35 && pco2 <= 45) return { level: 1, headline: 'Normal blood gas', lines: ['In rare cases, could represent complete compensation.'] };
      const acidSide = ph < 7.4;
      const h = pco2 > 45 ? (acidSide ? 'Compensated respiratory acidosis' : 'Compensated metabolic alkalosis') : (acidSide ? 'Compensated metabolic acidosis' : 'Compensated respiratory alkalosis');
      return { level: 2, headline: h };
    }
    if (ph < 7.35) {
      if (pco2 > 40) {
        const d = (pco2 - 40) / 10;
        return { level: 3, headline: 'Primary problem: respiratory acidosis', lines: [{ label: 'Acute', value: `compensatory increase in HCO₃ of ${r1(d)} mEq/L (expected about ${r1(24 + d)})` }, { label: 'Chronic', value: `increase in HCO₃ of ${r1(d * 3.25)} mEq/L (expected about ${r1(24 + d * 3.25)})` }] };
      }
      return { level: 3, headline: 'Primary problem: metabolic acidosis', lines: [{ label: 'Expected PaCO₂', value: `${r1(1.5 * hco3 + 8)} ± 2 mm Hg` }] };
    }
    if (pco2 < 40) {
      const d = (40 - pco2) / 10;
      return { level: 3, headline: 'Primary problem: respiratory alkalosis', lines: [{ label: 'Acute', value: `compensatory decrease in HCO₃ of ${r1(d * 2.25)} mEq/L (expected about ${r1(24 - d * 2.25)})` }, { label: 'Chronic', value: `decrease in HCO₃ of ${r1(d * 4.5)} mEq/L (expected about ${r1(24 - d * 4.5)})` }] };
    }
    return { level: 3, headline: 'Primary problem: metabolic alkalosis', lines: [{ label: 'Expected PaCO₂', value: `${r1(0.75 * hco3 + 19)} ± 7.5 mm Hg` }] };
  }
};
