// Modified TIMI score for emergency department chest pain (Hess; EE+ 451).
module.exports = {
  id: 'modified-timi',
  eeId: 451,
  title: 'Modified TIMI score',
  subtitle: 'Risk stratification of chest pain with possible ACS',
  question: 'In a patient with chest pain and possible acute coronary syndrome, what is the 30-day risk of death, MI or revascularization?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age 65 or older', points: 1, ee: 'AGE' },
    { id: 'rf', type: 'check', label: '3 or more coronary risk factors (family history, hypertension, hyperlipidemia, diabetes, current smoker)', points: 1, ee: 'CDRISK' },
    { id: 'cad', type: 'check', label: 'Known CAD (stenosis of 50% or more)', points: 1, ee: 'CAD' },
    { id: 'aspirin', type: 'check', label: 'Aspirin use in the past 7 days', points: 1, ee: 'ASPIRIN' },
    { id: 'angina', type: 'check', label: 'Severe angina (2 or more episodes within 24 hours)', points: 1, ee: 'ANGINA' },
    { id: 'st', type: 'check', label: 'ST-segment deviation of 0.05 mV or more', ee: 'ST' },
    { id: 'troponin', type: 'check', label: 'Abnormal troponin T', ee: 'TROPONIN' }
  ],
  footnote: 'ST deviation or an abnormal troponin adds 5 points (once, even if both are present).',
  compute(a) {
    const s = ['age', 'rf', 'cad', 'aspirin', 'angina'].filter(k => a[k]).length + (a.st || a.troponin ? 5 : 0);
    const r = s < 2 ? [1, 'Low risk (score 0 or 1)', '2.0%', '1.0%'] : s < 4 ? [2, 'Moderate risk (score 2 or 3)', '10.6%', '3.4%']
      : s < 6 ? [3, 'High risk (score 4 or 5)', '23.5%', '10.3%'] : [4, 'Very high risk (score 6 or more)', '44.2%', '34.1%'];
    return { score: { value: s, max: 10, label: 'Modified TIMI score' }, level: r[0], headline: r[1],
      lines: [{ label: 'Death, MI or revascularization within 30 days', value: r[2] }, { label: 'Death or MI within 30 days', value: r[3] }] };
  }
};
