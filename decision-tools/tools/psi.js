// Pneumonia Severity Index (Fine 1997; EE+ 5). For men EE+ joined the age and the points as text
// (age 60 + 20 points gave 6020), putting most men with any finding in class V.
const CLASSES = [['I', '0.3% (2/668)', 1], ['II', '0.4% (3/777)', 1], ['III', '3.6% (26/718)', 2], ['IV', '7.5% (67/896)', 3], ['V', '19% (24/247)', 4]];
const FIND = [
  ['nursingHome', 'Nursing home resident', 10],
  { heading: 'Comorbidities' },
  ['liver', 'Liver disease', 20], ['cancer', 'Neoplastic disease', 30], ['chf', 'Congestive heart failure', 10], ['cvd', 'Cerebrovascular disease', 10], ['renal', 'Renal disease', 10],
  { heading: 'Physical examination' },
  ['mental', 'Abnormal mental status', 20], ['rr', 'Respiratory rate 30/min or more', 20], ['sbp', 'Systolic BP under 90 mm Hg', 20], ['temp', 'Temperature under 35 °C (95 °F) or 40 °C (104 °F) or more', 15], ['pulse', 'Pulse 125/min or more', 10],
  { heading: 'Laboratory and x-ray findings' },
  ['ph', 'Arterial pH under 7.35', 30], ['bun', 'BUN 30 mg/dL or more', 20], ['na', 'Sodium under 130 mmol/L', 20], ['glucose', 'Glucose 250 mg/dL or more', 10], ['hct', 'Hematocrit under 30%', 10], ['pao2', 'PaO₂ under 60 mm Hg', 10], ['effusion', 'Pleural effusion (x-ray)', 10]
];
const EE = { nursingHome: 'nursingHome', liver: 'comorb1', cancer: 'comorb2', chf: 'comorb3', cvd: 'comorb4', renal: 'comorb5', mental: 'pe1', rr: 'pe2', sbp: 'pe3', temp: 'pe4', pulse: 'pe5', ph: 'lab1', bun: 'lab2', na: 'lab3', glucose: 'lab4', hct: 'lab5', pao2: 'lab6', effusion: 'lab7' };
const STEP1 = ['liver', 'cancer', 'chf', 'cvd', 'renal', 'mental', 'rr', 'sbp', 'temp', 'pulse'];
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'psi',
  eeId: 5,
  title: 'Pneumonia prognosis (Pneumonia Severity Index)',
  subtitle: 'PSI / PORT score for community-acquired pneumonia',
  question: 'For an adult with community-acquired pneumonia, what is the risk class and mortality?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 110, ee: 'age' },
    { id: 'male', type: 'check', label: 'Male', ee: 'male' },
    ...FIND.map(f => (f.heading ? { type: 'heading', label: f.heading } : { id: f[0], type: 'check', label: f[1], points: f[2], ee: EE[f[0]] }))
  ],
  footnote: 'Risk class I: can usually be treated as an outpatient. Risk class II and III: consider outpatient therapy for some patients. Risk class IV and V: hospitalize. Community-dwelling patients 50 or younger, with none of the comorbidities and none of the examination findings, are risk class I and do not usually need further laboratory or x-ray evaluation.',
  compute(a) {
    const s = a.age - (a.male ? 0 : 10) + pointsOf(tool, a);
    const k = a.age <= 50 && !STEP1.some(id => a[id]) ? 0 : s <= 70 ? 1 : s <= 90 ? 2 : s <= 130 ? 3 : 4;
    const [cls, mort, level] = CLASSES[k];
    return { score: { value: s, label: 'PSI points' }, level, headline: `Risk class ${cls}: mortality ${mort}` };
  }
};
