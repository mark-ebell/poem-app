// EFFECT model: mortality in patients hospitalized for heart failure (Lee 2003; EE+ 246).
const SBP = ['180 or higher', '160 to 179', '140 to 159', '120 to 139', '100 to 119', '90 to 99', 'Below 90'];
const ITEMS = [['sodium', 'Sodium below 136 mEq/L', 10, 10, 'IDC_CHECKBOX_1'], ['cvd', 'Cerebrovascular disease', 10, 10, 'IDC_CHECKBOX_2'], ['dementia', 'Dementia', 20, 15, 'IDC_CHECKBOX_3'],
  ['copd', 'COPD', 10, 10, 'IDC_CHECKBOX_4'], ['cancer', 'Cancer', 15, 15, 'IDC_CHECKBOX_6'], ['cirrhosis', 'Hepatic cirrhosis', 25, 35, 'IDC_CHECKBOX_5'], ['hgb', 'Hemoglobin below 10 g/dL', 0, 10, 'IDC_CHECKBOX_7']];
const band = (s, rates) => (s <= 60 ? [1, 'very low', rates[0]] : s <= 90 ? [1, 'low', rates[1]] : s <= 120 ? [2, 'intermediate', rates[2]] : s <= 150 ? [3, 'high', rates[3]] : [4, 'very high', rates[4]]);

module.exports = {
  id: 'effect-hf',
  eeId: 246,
  title: 'Heart failure mortality after admission (EFFECT, Lee)',
  subtitle: '30-day and 1-year mortality for patients hospitalized with heart failure',
  question: 'For a patient admitted with heart failure, what is the risk of death at 30 days and 1 year?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 20, max: 110, step: 1, ee: 'AGE' },
    { id: 'rr', type: 'number', label: 'Respiratory rate', unit: 'breaths/min', min: 5, max: 60, step: 1, ee: 'RATE' },
    { id: 'bun', type: 'number', label: 'Blood urea nitrogen', unit: 'mg/dL', min: 1, max: 200, step: 1, ee: 'UREA' },
    { id: 'sbp', type: 'choice', label: 'Systolic BP (mm Hg)', ee: 'BP', options: SBP.map(label => ({ label })) },
    { type: 'heading', label: 'Check all that apply' },
    ...ITEMS.map(([id, label, , , ee]) => ({ id, type: 'check', label, ee }))
  ],
  footnote: 'Respiratory rate counts from 20 to 45, and BUN up to 60 mg/dL.',
  compute(a) {
    const age = Math.trunc(a.age), bun = Math.min(Math.trunc(a.bun), 60), rr = Math.min(Math.max(Math.trunc(a.rr), 20), 45);
    const base = age + rr + bun;
    const s30 = base - (30 + (6 - a.sbp) * 5) + ITEMS.reduce((n, [id, , p]) => n + (a[id] ? p : 0), 0);
    const s1y = base - (20 + (6 - a.sbp) * 5) + ITEMS.reduce((n, [id, , , p]) => n + (a[id] ? p : 0), 0);
    const d30 = band(s30, ['0.6%', '4.2%', '13.7%', '26.0%', '50.0%']), d1y = band(s1y, ['2.7%', '14.4%', '30.2%', '55.5%', '74.7%']);
    return { level: d30[0], lines: [{ label: `30-day mortality (${d30[1]}; score ${s30})`, value: d30[2] }, { label: `1-year mortality (${d1y[1]}; score ${s1y})`, value: d1y[2] }] };
  }
};
