// 90-day mortality after hepatic resection (Hyder 2013; EE+ 485).
module.exports = {
  id: 'hepatic-resection',
  eeId: 485,
  title: 'Hepatic resection 90-day mortality (Hyder)',
  subtitle: 'Death within 90 days of liver resection',
  question: 'For a patient after liver resection for a malignant or benign lesion, what is the risk of death within 90 days?',
  inputs: [
    { id: 'inr', type: 'number', label: 'INR on day 3', min: 0.5, max: 30, step: 0.1, ee: 'INR' },
    { id: 'bili', type: 'number', label: 'Serum bilirubin on day 3', unit: 'mg/dL', min: 0, max: 99, step: 0.1, ee: 'BILI' },
    { id: 'creat', type: 'number', label: 'Serum creatinine on day 3', unit: 'mg/dL', min: 0, max: 30, step: 0.1, ee: 'CREAT' },
    { id: 'complication', type: 'choice', label: 'Complication grade', ee: 'COMPLICATION', options: [
      { label: 'None' }, { label: 'Grade I: any deviation from the expected course, without intervention' }, { label: 'Grade II: needing medication or transfusion' },
      { label: 'Grade III: needing surgical intervention' }, { label: 'Grade IV: life-threatening' }] }
  ],
  compute(a) {
    const s = 2.5 * a.inr + 0.15 * a.bili + 0.5 * a.creat + a.complication;
    const r = s < 6 ? [1, 'Very low risk', '0.2%'] : s < 9 ? [2, 'Low risk', '1.2%'] : s < 11 ? [3, 'Moderate risk', '34%'] : [4, 'High risk', '83%'];
    return { score: { value: Number(s.toFixed(1)), label: 'Score' }, level: r[0], headline: `${r[1]}: 90-day mortality ${r[2]}` };
  }
};
