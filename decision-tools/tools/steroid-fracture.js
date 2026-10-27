// Fracture risk in oral glucocorticoid users (van Staa 2005; EE+ 356), clinical osteoporotic fracture score
// (Table 3 of the paper). Corrected from the paper (Mark Ebell, 2026-10-27): the age term uses age at the
// midpoint of the 5-year period (age + 2.5), as in the paper's Table 4, and the risk comes from the paper's
// curve, not EE+'s 5-point bands. The 5-year cumulative hazard is fitted to the published 5-year risks at
// scores of 30, 40 and 50 (6.2%, 15.3%, 35.2%); it reproduces the paper's examples (score 54: 47%; 48: 30.1%).
// The 10-year risk applies the same average hazard over 10 years, as the paper describes. An osteoporotic
// fracture during treatment scores only for hip and vertebral fracture, so it is not asked.
const H30 = -Math.log(1 - 0.062), PER10 = Math.log(1 - 0.352) / Math.log(1 - 0.062); // hazard at 30; ratio per 20 points
const risk = (s, years) => 1 - Math.exp(-(years / 5) * H30 * Math.pow(PER10, (s - 30) / 20));
const check = (id, label, ee) => ({ id, type: 'check', label, ee });

module.exports = {
  id: 'steroid-fracture',
  eeId: 356,
  title: 'Fracture risk with glucocorticoid treatment (van Staa)',
  subtitle: 'Long-term osteoporotic fracture risk in oral glucocorticoid users',
  question: 'For a patient over 40 taking oral glucocorticoids, what is the risk of a clinical osteoporotic fracture over 5 and 10 years of treatment?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 40, max: 110, step: 1, ee: 'age' },
    { id: 'units', type: 'choice', label: 'Units', ee: 'UNIT', options: [{ label: 'Inches and pounds' }, { label: 'Centimeters and kilograms' }] },
    { id: 'heightIn', type: 'number', label: 'Height', unit: 'in', min: 48, max: 84, step: 1, ee: 'height', when: a => a.units === 0 },
    { id: 'weightLb', type: 'number', label: 'Weight', unit: 'lb', min: 60, max: 450, step: 1, ee: 'weight', when: a => a.units === 0 },
    { id: 'heightCm', type: 'number', label: 'Height', unit: 'cm', min: 122, max: 213, step: 1, ee: 'height', when: a => a.units === 1 },
    { id: 'weightKg', type: 'number', label: 'Weight', unit: 'kg', min: 27, max: 205, step: 1, ee: 'weight', when: a => a.units === 1 },
    { id: 'dose', type: 'choice', label: 'Daily prednisone (or prednisolone) dose', ee: 'combo1', options: [{ label: '7.5 mg' }, { label: '15 mg' }] },
    { id: 'indication', type: 'choice', label: 'Indication for glucocorticoids', ee: 'combo2', options: [{ label: 'Other' }, { label: 'Rheumatoid arthritis' }, { label: "Ulcerative colitis, Crohn's disease or similar" }] },
    { type: 'heading', label: 'Check all that apply' },
    check('male', 'Male', 'chk4'),
    check('smoker', 'Smoker', 'chk5'),
    check('fall', 'Fall in the previous 6 months', 'chk6'),
    check('fracture', 'Fracture before glucocorticoid use', 'chk7'),
    check('hosp', 'Recent hospitalization for the condition treated with glucocorticoids', 'chk9'),
    check('anemia', 'History of anemia', 'chk1'),
    check('dementia', 'Dementia', 'chk2'),
    check('cvd', 'Cerebrovascular disease', 'chk3'),
    { type: 'heading', label: 'Prescription in the past 6 months for' },
    check('anticonv', 'Anticonvulsants', 'chk10'),
    check('antiarrhythmic', 'Antiarrhythmics', 'chk11'),
    check('hypnotic', 'Hypnotics or anxiolytics', 'chk12'),
    check('antidep', 'Antidepressants', 'chk13'),
    check('parkinson', "Parkinson's drugs", 'chk14')
  ],
  footnote: 'Clinical osteoporotic fractures are of the radius or ulna, humerus, rib, hip, pelvis or vertebrae. Risks assume the patient survives the period, and come from UK general practice data. Points for dose: 7.5 mg daily gives 8, 6 or 5 points at about age 50, 65 or 80; 15 mg gives 11, 9 or 7.',
  compute(a) {
    const cm = a.units === 0 ? a.heightIn * 2.54 : a.heightCm, kg = a.units === 0 ? a.weightLb / 2.2 : a.weightKg, bmi = kg / Math.pow(cm / 100, 2);
    let s = (a.dose === 0 ? [8, 6, 5] : [11, 9, 7])[a.age < 58 ? 0 : a.age <= 72 ? 1 : 2] + (a.age + 2.5) / 10 * 4;
    s += -6 * a.male + (bmi <= 20 ? 3 : bmi >= 26 ? -1 : 0) + a.smoker + 8 * a.fall + 6 * a.fracture + 4 * a.hosp + (a.indication > 0 ? 1 : 0)
      + 2 * (a.anemia + a.dementia + a.cvd + a.anticonv + a.antiarrhythmic + a.hypnotic + a.antidep + a.parkinson);
    const pct = p => `${(100 * p).toFixed(1)}%`;
    return { score: { value: Math.round(s), label: 'Score' }, headline: `Risk of a clinical osteoporotic fracture: ${pct(risk(s, 5))} over 5 years of treatment, ${pct(risk(s, 10))} over 10 years`,
      lines: [`BMI ${bmi.toFixed(1)} kg/m²`] };
  },
};
