// Sleep apnea clinical score (Flemons 1994; EE+ 238).
module.exports = {
  id: 'sleep-apnea-flemons',
  eeId: 238,
  title: 'Sleep apnea diagnosis',
  subtitle: 'Sleep apnea clinical score (Flemons)',
  question: 'For a patient referred for possible sleep apnea, what is the probability of an AHI over 10 or over 20?',
  inputs: [
    { id: 'htn', type: 'check', label: 'Hypertensive', ee: 'IDC_CHECKBOX_1' },
    { id: 'snoring', type: 'check', label: 'Habitual snoring (usually or always present)', ee: 'IDC_CHECKBOX_2' },
    { id: 'choking', type: 'check', label: 'Reports of nocturnal choking or gasping', ee: 'IDC_CHECKBOX_3' },
    { id: 'units', type: 'choice', label: 'Neck circumference units', ee: 'UNITS', options: [{ label: 'Inches' }, { label: 'Centimeters' }] },
    { id: 'neckIn', type: 'number', label: 'Neck circumference', unit: 'inches', min: 12.6, max: 23.6, step: 0.1, ee: 'IDC_EDIT_1', when: a => a.units === 0 },
    { id: 'neckCm', type: 'number', label: 'Neck circumference', unit: 'cm', min: 32, max: 60, step: 0.1, ee: 'IDC_EDIT_1', when: a => a.units === 1 }
  ],
  footnote: 'AHI is the apnea-hypopnea index: apneic and hypopneic episodes per hour of sleep. Probabilities assume a pretest probability of 45%.',
  compute(a) {
    const cm = a.units === 1 ? a.neckCm : a.neckIn * 2.54;
    const s = Math.pow(10, -2.132 + 0.0686 * cm + 0.3141 * a.htn + 0.2062 * a.snoring + 0.2238 * a.choking) - 1;
    const [level, h] = s <= 5 ? [1, 'Low risk: 17% probability of AHI > 10, 8% of AHI > 20'] : s <= 10 ? [2, 'Moderate risk: 47% probability of AHI > 10, 29% of AHI > 20'] : s <= 15 ? [3, 'High risk: 62% probability of AHI > 10, 41% of AHI > 20'] : [4, 'Very high risk: 81% probability of AHI > 10, 62% of AHI > 20'];
    return { score: { value: Math.round(s * 100) / 100, label: 'Sleep apnea risk score' }, level, headline: h };
  }
};
