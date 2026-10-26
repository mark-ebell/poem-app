// Renal artery stenosis in hypertension (Krijnen; EE+ 124).
const english = a => a.units === 0, metric = a => a.units === 1;
module.exports = {
  id: 'renal-artery-stenosis',
  eeId: 124,
  title: 'Renal artery stenosis in hypertension',
  subtitle: 'Clinical prediction rule (Krijnen)',
  question: 'For a patient with drug-resistant hypertension, how likely is renal artery stenosis?',
  inputs: [
    { id: 'units', type: 'choice', label: 'Units', ee: 'UNITS', options: [{ label: 'US (in, lb, mg/dL)' }, { label: 'Metric (cm, kg, µmol/L)' }] },
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 100, step: 1, ee: 'AGE' },
    { id: 'creatMg', type: 'number', label: 'Serum creatinine', unit: 'mg/dL', min: 0.2, max: 15, step: 0.1, ee: 'SERUM', when: english },
    { id: 'creatUmol', type: 'number', label: 'Serum creatinine', unit: 'µmol/L', min: 20, max: 1300, step: 1, ee: 'SERUM', when: metric },
    { id: 'heightIn', type: 'number', label: 'Height', unit: 'in', min: 48, max: 90, step: 1, ee: 'HEIGHT', when: english },
    { id: 'heightCm', type: 'number', label: 'Height', unit: 'cm', min: 120, max: 230, step: 1, ee: 'HEIGHT', when: metric },
    { id: 'weightLb', type: 'number', label: 'Weight', unit: 'lb', min: 70, max: 700, step: 1, ee: 'WEIGHT', when: english },
    { id: 'weightKg', type: 'number', label: 'Weight', unit: 'kg', min: 30, max: 320, step: 1, ee: 'WEIGHT', when: metric },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'recent', type: 'check', label: 'Onset of hypertension within 2 years', ee: 'ONSET' },
    { id: 'bruit', type: 'check', label: 'Abdominal bruit', ee: 'BRUIT' },
    { id: 'lipids', type: 'check', label: 'Serum cholesterol above 240 mg/dL, or on cholesterol-lowering therapy', ee: 'THERAPY' },
    { id: 'vascular', type: 'check', label: 'Atherosclerotic vascular disease (femoral or carotid bruit, angina, MI, stroke, or vascular surgery)', ee: 'FEMORAL' },
    { id: 'male', type: 'check', label: 'Male', ee: 'MALE' },
    { id: 'smoked', type: 'check', label: 'Ever smoked', ee: 'EVER' }
  ],
  compute(a) {
    const m = english(a) ? (a.heightIn * 2.54) / 100 : a.heightCm / 100;
    const kg = english(a) ? a.weightLb / 2.2 : a.weightKg;
    const creat = english(a) ? a.creatMg * 88.4 : a.creatUmol; // µmol/L
    const bmi = kg / (m * m);
    const lp = -7.033 + 0.052 * a.age + 0.029 * (75 - a.age) * a.smoked - 0.877 * a.male + 0.515 * a.vascular + 0.565 * a.recent
      - 0.904 * (bmi < 25 ? 1 : 0) + 1.49 * a.bruit + 0.441 * a.lipids + 0.028 * creat;
    const p = 100 / (1 + Math.exp(-lp));
    return { level: p < 10 ? 1 : p < 25 ? 2 : p < 50 ? 3 : 4, headline: `Probability of renal artery stenosis: ${Math.round(p)}%`, lines: [`Body mass index ${bmi.toFixed(1)} kg/m².`] };
  }
};
