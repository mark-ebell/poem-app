// Meningitis Score for Emergencies (Mintegi 2020; EE+ 601).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'meningitis-mse',
  eeId: 601,
  title: 'Meningitis Score for Emergencies (MSE)',
  subtitle: 'Bacterial vs aseptic meningitis in children',
  question: 'For a child 29 days to 14 years diagnosed with meningitis in the ED, how likely is a bacterial cause?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'pct', type: 'check', label: 'Procalcitonin above 1.2 ng/mL', points: 3, ee: 'cb1' },
    { id: 'protein', type: 'check', label: 'CSF protein above 80 mg/dL', points: 2, ee: 'cb4' },
    { id: 'crp', type: 'check', label: 'C-reactive protein above 40 mg/L', points: 1, ee: 'cb2' },
    { id: 'anc', type: 'check', label: 'CSF absolute neutrophil count above 1000/µL', points: 1, ee: 'cb3' }
  ],
  points: { label: 'MSE', max: 7 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s === 0 ? { level: 1, headline: '0 of 763 children with a score of 0 had bacterial meningitis' }
      : s === 1 ? { level: 1, headline: '0 of 72 children with a score of 1 had bacterial meningitis' }
      : { level: 4, headline: '92 of 174 children (53%) with a score of 2 or more had bacterial meningitis' };
  }
};
