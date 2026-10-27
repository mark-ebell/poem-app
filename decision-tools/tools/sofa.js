// SOFA score with in-hospital mortality in suspected infection (Raith 2017; EE+ 567). EE+ worked out the
// respiratory points from PaO2/FiO2 and then overwrote them; here they are added to the other five systems.
const { pointsOf } = require('../lib');
const sys = (id, label, ee, labels) => ({ id, type: 'choice', label, ee, options: labels.map((l, points) => ({ label: l, points })) });
const BANDS = [[4, 'less than 10%'], [7, '10% to 20%'], [10, '20% to 40%'], [13, '40% to 60%'], [17, '60% to 80%'], [24, 'more than 80%']];

const tool = module.exports = {
  id: 'sofa',
  eeId: 567,
  title: 'SOFA score',
  subtitle: 'Organ dysfunction and in-hospital mortality in suspected infection',
  question: 'For an adult with suspected infection, what is the SOFA score and the expected in-hospital mortality?',
  inputs: [
    { id: 'pao2', type: 'number', label: 'PaO2', unit: 'mm Hg', min: 20, max: 700, step: 1, ee: 'txt_PaO2' },
    { id: 'fio2', type: 'number', label: 'FiO2', unit: '%', min: 21, max: 100, step: 1, ee: 'txt_FIO2' },
    sys('plt', 'Platelets', 'ddl1', ['Over 150 × 10³/µL', '101 to 150', '51 to 100', '21 to 50', '20 or less']),
    sys('bili', 'Bilirubin', 'ddl2', ['Under 1.2 mg/dL', '1.2 to 1.9', '2.0 to 5.9', '6.0 to 11.9', '12.0 or more']),
    sys('cv', 'Cardiovascular', 'ddl3', ['No hypotension', 'MAP under 70 mm Hg', 'Dopamine 5 or less, or dobutamine (any dose)', 'Dopamine over 5, or epinephrine or norepinephrine 0.1 or less', 'Dopamine over 15, or epinephrine or norepinephrine over 0.1']),
    sys('gcs', 'Glasgow Coma Scale', 'ddl4', ['15', '13 to 14', '10 to 12', '6 to 9', 'Under 6']),
    sys('renal', 'Creatinine or urine output', 'ddl5', ['Under 1.2 mg/dL', '1.2 to 1.9', '2.0 to 3.4', '3.5 to 4.9, or under 500 mL/day', '5.0 or more, or under 200 mL/day'])
  ],
  footnote: 'Vasopressor doses in µg/kg/min. In SOFA, 3 or 4 respiratory points require ventilatory support.',
  compute(a) {
    const pf = a.pao2 / (a.fio2 / 100);
    const resp = pf > 400 ? 0 : pf > 300 ? 1 : pf > 200 ? 2 : pf > 100 ? 3 : 4;
    const s = resp + pointsOf(tool, a);
    return { score: { value: s, max: 24, label: 'SOFA score' }, headline: `In-hospital mortality ${BANDS.find(([max]) => s <= max)[1]}`,
      lines: [`PaO2/FiO2 ${Math.round(pf)} (${resp} respiratory point${resp === 1 ? '' : 's'}).`, 'A rising SOFA score in the first 48 hours also predicts higher mortality.'] };
  },
  evidence: { reference: 'Raith EP, Udy AA, Bailey M, et al. Prognostic accuracy of the SOFA score, SIRS criteria, and qSOFA score for in-hospital mortality among adults with suspected infection admitted to the intensive care unit. JAMA. 2017;317(3):290-300.' }
};
