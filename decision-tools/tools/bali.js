// BALI score: mortality in acute pancreatitis (Spitzer 2006; EE+ 350).
const { pointsOf } = require('../lib');
const RISK = ['0% (0 of 77)', '5% (1 of 20)', '5% (1 of 20)', '27% (3 of 11)', '54% (7 of 13)'];

const tool = module.exports = {
  id: 'bali',
  eeId: 350,
  title: 'BALI score (acute pancreatitis)',
  subtitle: '3-month mortality in acute pancreatitis',
  question: 'For a patient with acute pancreatitis, using the first laboratory values, what is the risk of death within 3 months?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'bun', type: 'check', label: 'BUN above 25 mg/dL (8.9 mmol/L)', points: 1, ee: 'chk1' },
    { id: 'age', type: 'check', label: 'Age 65 or older', points: 1, ee: 'chk2' },
    { id: 'ldh', type: 'check', label: 'LDH 300 IU/L or more', points: 1, ee: 'chk3' },
    { id: 'il6', type: 'check', label: 'Interleukin-6 300 pg/mL or more', points: 1, ee: 'chk4' }
  ],
  points: { label: 'BALI score', max: 4 },
  compute(a) {
    const s = pointsOf(tool, a);
    return { headline: `3-month mortality: ${RISK[s]}` };
  }
};
