// Risk of death in acute MI, time-insensitive predictive instrument (Selker; EE+ 44).
module.exports = {
  id: 'selker-ami-mortality',
  eeId: 44,
  title: 'Risk of death in acute MI (Selker)',
  subtitle: 'Time-insensitive predictive instrument for acute MI mortality',
  question: 'For an adult with acute MI in the emergency department, what is the risk of death?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 30, max: 120, step: 1, ee: 'AGE' },
    { id: 'sbp', type: 'number', label: 'Systolic BP', unit: 'mm Hg', min: 1, max: 300, step: 1, ee: 'SYSTOLIC' },
    { id: 'q', type: 'choice', label: 'Q waves', ee: 'Q_WAVE', default: 4, options: [
      { label: 'Anterior-lateral Q waves' }, { label: 'Anterior-septal significant Q waves' }, { label: 'Anterior Q waves' }, { label: 'Poor R-wave progression' }, { label: 'None of these' }] },
    { id: 't', type: 'choice', label: 'T waves', ee: 'T_WAVE', default: 2, options: [{ label: 'Peaked' }, { label: 'Inverted' }, { label: 'Neither' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'svt', type: 'check', label: 'Supraventricular tachycardia present', ee: 'SVT' },
    { id: 'hr', type: 'check', label: 'Heart rate below 110 beats/min', ee: 'HR' }
  ],
  compute(a) {
    const q = [2, 1, 1, 1, 0][a.q] * 0.6453, t = [2, 1, 0][a.t] * 0.6008;
    const ageF = Math.min(80, Math.max(50, a.age)) * 0.0733;
    const s = a.sbp;
    const f1 = Math.min(s, 175) * -0.0145;
    const f2 = s < 80 ? 36 * 0.0347 : s > 140 ? 0 : (((140 - s) ** 2) / 100) * 0.0347;
    let f3 = 0;
    if (!(a.hr || a.svt)) f3 = s <= 90 ? 0.7683 : s <= 110 ? ((s - 70) / 20) * 0.7683 : s <= 140 ? 2 * 0.7683 : 0;
    const x = Math.exp(-5.6769 + ageF + f1 + f2 + f3 + t + q);
    const p = 100 * (1 - 1 / (1 + x));
    return { level: p < 5 ? 1 : p < 15 ? 2 : p < 30 ? 3 : 4, headline: `Mortality: ${p < 10 ? p.toFixed(1) : Math.round(p)}%` };
  }
};
