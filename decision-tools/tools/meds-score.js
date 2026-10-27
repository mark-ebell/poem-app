// MEDS score: 28-day mortality in ED patients with suspected infection (Shapiro 2003; EE+ 227).
const { pointsOf } = require('../lib');
const check = (id, label, points, ee) => ({ id, type: 'check', label, points, ee });

const tool = module.exports = {
  id: 'meds-score',
  eeId: 227,
  title: 'Sepsis mortality risk (MEDS score)',
  subtitle: 'Mortality in Emergency Department Sepsis',
  question: 'For a patient in the ED with suspected infection (blood culture drawn), what is the risk of death within 28 days?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    check('terminal', 'Terminal illness (expected death within 30 days)', 6, 'IDC_CHECKBOX_1'), check('rr', 'Tachypnea (respiratory rate over 20) or hypoxia (oxygen saturation under 90%)', 3, 'IDC_CHECKBOX_2'),
    check('shock', 'Septic shock (severe sepsis with systolic BP under 90)', 3, 'IDC_CHECKBOX_3'), check('plt', 'Platelets under 150,000/µL', 3, 'IDC_CHECKBOX_4'),
    check('bands', 'Bands over 5%', 3, 'IDC_CHECKBOX_5'), check('age', 'Age over 65', 3, 'IDC_CHECKBOX_6'), check('lri', 'Lower respiratory infection', 2, 'IDC_CHECKBOX_7'),
    check('nh', 'Nursing home resident', 2, 'IDC_CHECKBOX_8'), check('ams', 'Altered mental status', 2, 'IDC_CHECKBOX_9')
  ],
  points: { label: 'MEDS score', max: 27 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 4 ? { level: 1, headline: 'Very low risk: 1.0% 28-day mortality (5 of 456)' } : s <= 7 ? { level: 1, headline: 'Low risk: 4.4% 28-day mortality (12 of 273)' }
      : s <= 12 ? { level: 2, headline: 'Moderate risk: 9.3% 28-day mortality (28 of 301)' } : s <= 15 ? { level: 3, headline: 'High risk: 16.1% 28-day mortality (9 of 56)' }
      : { level: 4, headline: 'Very high risk: 39.1% 28-day mortality (9 of 23)' };
  }
};
