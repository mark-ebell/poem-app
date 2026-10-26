// Cardiac death after adenosine stress myocardial perfusion imaging (Hachamovitch; EE+ 295).
module.exports = {
  id: 'adenosine-spect',
  eeId: 295,
  title: 'Adenosine stress SPECT prognosis',
  subtitle: 'Annual cardiac death rate after adenosine perfusion imaging',
  question: 'For a patient having adenosine stress myocardial perfusion imaging, what is the annual risk of cardiac death?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 120, step: 1, ee: 'age' },
    { id: 'ischemic', type: 'number', label: 'Myocardium ischemic', unit: '%', min: 0, max: 100, step: 1, ee: 'ischemic' },
    { id: 'fixed', type: 'number', label: 'Myocardium with a fixed defect', unit: '%', min: 0, max: 100, step: 1, ee: 'fixed' },
    { id: 'resting', type: 'number', label: 'Resting heart rate', unit: 'beats/min', min: 20, max: 200, step: 1, ee: 'resting' },
    { id: 'peak', type: 'number', label: 'Peak heart rate', unit: 'beats/min', min: 20, max: 300, step: 1, ee: 'peak' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'dyspnea', type: 'check', label: 'Dyspnea as the presenting symptom', ee: 'IDC_CHECKBOX_1' },
    { id: 'ecg', type: 'check', label: 'Abnormal resting ECG', ee: 'IDC_CHECKBOX_2' }
  ],
  compute(a) {
    const t = Math.trunc;
    const s = t(a.age) + t(a.ischemic) + t(a.fixed) + t(a.resting) * 0.5 - t(a.peak) * 0.5 + (a.dyspnea ? 10 : 0) + (a.ecg ? 30 : 0);
    const r = s < 80 ? { level: 1, label: 'Low risk', rate: '0.6%' } : s <= 100 ? { level: 2, label: 'Moderate risk', rate: '2.1%' } : { level: 3, label: 'High risk', rate: '5.6%' };
    return { score: { value: s, label: 'Score' }, level: r.level, headline: r.label, lines: [{ label: 'Cardiac death per year', value: r.rate }],
      note: 'Low risk: score below 80; moderate: 80 to 100; high: above 100.' };
  }
};
