// Stroke within 90 days of a TIA diagnosed in the ED (Johnston 2000, California score; EE+ 132).
const { pointsOf } = require('../lib');
const RISK = [['0%', 22], ['3%', 179], ['7%', 509], ['11%', 584], ['15%', 337], ['34%', 76]];

const tool = module.exports = {
  id: 'tia-johnston',
  eeId: 132,
  title: 'TIA prognosis (California score)',
  subtitle: 'Stroke within 90 days of a TIA diagnosed in the ED',
  question: 'For a patient seen in the ED with a TIA, what is the risk of stroke within 90 days?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age over 60', points: 1, ee: 'AGE' },
    { id: 'dm', type: 'check', label: 'Diabetes', points: 1, ee: 'DIABETES' },
    { id: 'duration', type: 'check', label: 'Episode lasted more than 10 minutes', points: 1, ee: 'DURATION' },
    { id: 'weakness', type: 'check', label: 'Weakness during the episode', points: 1, ee: 'WEAKNESS' },
    { id: 'speech', type: 'check', label: 'Speech impairment during the episode', points: 1, ee: 'SPEECH' }
  ],
  points: { label: 'Score', max: 5 },
  compute(a) {
    const [p, n] = RISK[pointsOf(tool, a)];
    return { headline: `Risk of stroke within 90 days: ${p}`, lines: [`${n} of 1707 patients had this score.`] };
  }
};
