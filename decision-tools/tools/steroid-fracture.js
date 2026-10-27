// Fracture risk in oral glucocorticoid users (van Staa 2005; EE+ 356). EE+ asked about an osteoporotic
// fracture during glucocorticoid treatment but never used the answer, so the question is left out here.
const RISK = [[15, '1%', '2%'], [20, '2%', '4%'], [25, '3%', '6%'], [30, '5%', '10%'], [35, '8%', '15%'], [40, '12%', '23%'], [45, '18%', '33%'], [50, '28%', '47%'], [Infinity, '43%', '65%']];
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
    { id: 'dose', type: 'choice', label: 'Daily prednisone dose', ee: 'combo1', options: [{ label: '7.5 mg' }, { label: '15 mg' }] },
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
  compute(a) {
    const cm = a.units === 0 ? a.heightIn * 2.54 : a.heightCm, kg = a.units === 0 ? a.weightLb / 2.2 : a.weightKg, bmi = kg / Math.pow(cm / 100, 2);
    let s = (a.dose === 0 ? [8, 6, 5] : [11, 9, 7])[a.age < 58 ? 0 : a.age <= 72 ? 1 : 2] + a.age / 10 * 4;
    s += -6 * a.male + (bmi < 20 ? 3 : bmi >= 26 ? -1 : 0) + a.smoker + 8 * a.fall + 6 * a.fracture + 4 * a.hosp + (a.indication > 0 ? 1 : 0)
      + 2 * (a.anemia + a.dementia + a.cvd + a.anticonv + a.antiarrhythmic + a.hypnotic + a.antidep + a.parkinson);
    const [, five, ten] = RISK.find(([max]) => s <= max);
    return { score: { value: Number(s.toFixed(1)), label: 'Score' }, headline: `Risk of a clinical osteoporotic fracture: ${five} over 5 years of treatment, ${ten} over 10 years`, lines: [`BMI ${bmi.toFixed(1)} kg/m²`] };
  }
};
