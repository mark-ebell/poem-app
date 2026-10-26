// Clinical likelihood of obstructive CAD: ESC 2024 risk factor-weighted clinical likelihood
// (RF-CL), Figure 4 of the 2024 ESC chronic coronary syndromes guideline. Replaces EE+ 585
// (the 2011 Genders model) at Mark Ebell's request (2026-10-26).
//
// LIKELIHOOD[sex][symptom group][risk factor group][age group], in %: sex male | female;
// symptom score 0-1 | 2 | 3; risk factors 0-1 | 2-3 | 4-5; age 30-39 | 40-49 | 50-59 | 60-69 | 70-80.
// Transcribed from ESC 2024 Figure 4 as implemented in the pretestcad R package (v1.2.0).
const LIKELIHOOD = {
  male: [[[1, 2, 4, 8, 15], [2, 4, 7, 12, 19], [5, 8, 12, 17, 24]], [[2, 3, 6, 12, 22], [4, 6, 11, 17, 27], [8, 12, 17, 25, 34]], [[9, 14, 21, 32, 44], [14, 20, 27, 35, 44], [22, 27, 33, 39, 45]]],
  female: [[[0, 1, 1, 2, 4], [1, 1, 2, 4, 7], [2, 3, 5, 7, 11]], [[0, 1, 2, 3, 6], [1, 2, 3, 6, 10], [3, 5, 7, 11, 16]], [[2, 4, 6, 10, 16], [5, 7, 10, 14, 19], [10, 12, 15, 19, 23]]]
};
const RISK_FACTORS = [
  ['family', 'Family history of early CAD (a first-degree relative: men under 55, women under 65)'],
  ['smoking', 'Current or past smoker'], ['lipids', 'Dyslipidaemia'], ['htn', 'Hypertension'], ['diabetes', 'Diabetes']
];

module.exports = {
  id: 'esc-2024-cad',
  eeId: 585,
  title: 'Clinical likelihood of obstructive CAD (ESC 2024)',
  subtitle: 'Risk factor-weighted clinical likelihood (RF-CL) for suspected chronic coronary syndrome',
  question: 'For an adult with symptoms suggesting chronic coronary syndrome, how likely is obstructive coronary artery disease?',
  inputs: [
    { id: 'sex', type: 'choice', label: 'Sex', options: [{ label: 'Male' }, { label: 'Female' }] },
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 30, max: 80, step: 1, default: 40,
      note: 'The model covers ages 30 to 80, in 10-year groups.' },
    { id: 'pain', type: 'choice', label: 'Chest pain', options: [
      { label: 'All 3 features (typical), 3 points' }, { label: '2 features (atypical), 2 points' }, { label: '0 or 1 feature, or no chest pain, 0 to 1 point' }],
      note: 'Features: (1) constricting discomfort in the front of the chest or in the neck, jaw, shoulder or arm; (2) brought on by physical exertion; (3) relieved by rest or nitrates within 5 minutes.' },
    { id: 'dyspnoea', type: 'choice', label: 'Dyspnoea as a main symptom', options: [{ label: 'No' }, { label: 'Yes (2 points)' }] },
    { type: 'heading', label: 'Risk factors: check all that apply' },
    ...RISK_FACTORS.map(([id, label]) => ({ id, type: 'check', label }))
  ],
  compute(a) {
    const symptoms = Math.max([3, 2, 0][a.pain], a.dyspnoea === 1 ? 2 : 0);
    const group = symptoms <= 1 ? 0 : symptoms - 1;
    const n = RISK_FACTORS.filter(([id]) => a[id]).length;
    const rf = n <= 1 ? 0 : n <= 3 ? 1 : 2;
    const ageGroup = Math.min(4, Math.floor((a.age - 30) / 10)); // 30-39 .. 60-69, and 70-80
    const p = LIKELIHOOD[a.sex === 0 ? 'male' : 'female'][group][rf][ageGroup];
    const cat = p <= 5 ? [1, 'Very low likelihood (5% or less)'] : p <= 15 ? [2, 'Low likelihood (more than 5% to 15%)'] : [3, 'Moderate likelihood (more than 15% to 50%)'];
    return {
      level: cat[0],
      headline: `Likelihood of obstructive CAD: ${p}%`,
      lines: [cat[1], `Age group ${['30 to 39', '40 to 49', '50 to 59', '60 to 69', '70 to 80'][ageGroup]}; symptom score ${symptoms <= 1 ? '0 to 1' : symptoms}; ${n} risk factor${n === 1 ? '' : 's'}.`],
      note: 'The model gives at most 45%. The guideline adjusts this likelihood with clinical findings (e.g. ECG changes, left ventricular dysfunction, peripheral artery disease) and, where available, the coronary artery calcium score.'
    };
  },
  evidence: {
    reference: 'Vrints C, Andreotti F, Koskinas KC, et al. 2024 ESC Guidelines for the management of chronic coronary syndromes. Eur Heart J. 2024;45(36):3415-3537. (Figure 4.)',
    pmid: '39210710',
    population: 'Model derived by Winther et al. (J Am Coll Cardiol 2020;76:2421-32) from more than 40,000 symptomatic patients referred for coronary CT angiography in Western Denmark (2008 to 2017), and adopted with a symptom score in the 2024 ESC guideline.',
    validation: null, prevalence: null, developed: null, validated: null,
    comment: 'Likelihood categories: very low 5% or less, low more than 5% to 15%, moderate more than 15% to 50%. Replaces the 2011 Genders model (EE+ 585).'
  }
};
