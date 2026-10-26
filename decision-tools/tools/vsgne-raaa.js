// VSGNE risk score: mortality after open repair of ruptured AAA (Robinson 2013; EE+ 484).
const { pointsOf } = require('../lib');
const RISK = ['5 of 61 (8%)', '12 of 48 (25%)', '21 of 57 (37%)', '24 of 40 (60%)', '21 of 25 (84%)'];

const tool = module.exports = {
  id: 'vsgne-raaa',
  eeId: 484,
  title: 'VSGNE score (ruptured AAA)',
  subtitle: 'Death after open repair of a ruptured abdominal aortic aneurysm',
  question: 'For a patient having open repair of a ruptured abdominal aortic aneurysm, what is the risk of death?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age over 76', points: 2, ee: 'AGE' },
    { id: 'arrest', type: 'check', label: 'Cardiac arrest before surgery', points: 2, ee: 'CARDIAC' },
    { id: 'loc', type: 'check', label: 'Loss of consciousness at presentation', points: 1, ee: 'LOSS' },
    { id: 'clamp', type: 'check', label: 'Suprarenal aortic clamp needed', points: 1, ee: 'CLAMP' }
  ],
  points: { label: 'VSGNE score', max: 6 },
  compute(a) {
    const s = pointsOf(tool, a);
    return { headline: `Mortality: ${RISK[Math.min(4, s)]} died`, lines: s >= 4 ? ['Scores of 4 or more are grouped.'] : [] };
  }
};
