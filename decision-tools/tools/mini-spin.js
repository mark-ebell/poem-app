// Mini-SPIN for social anxiety disorder (Connor 2001; EE+ 358).
const OPTS = ['Not at all', 'A little bit', 'Somewhat', 'Very much', 'Extremely'].map((label, points) => ({ label, points }));
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'mini-spin',
  eeId: 358,
  title: 'Social anxiety disorder (Mini-SPIN)',
  subtitle: 'Three-question screen for social anxiety disorder',
  question: 'For an adult, does the Mini-SPIN suggest social anxiety disorder?',
  inputs: [
    { id: 'avoid', type: 'choice', label: 'Fear of embarrassment causes me to avoid doing things or speaking to people.', ee: 'CMB_Fear2', options: OPTS },
    { id: 'center', type: 'choice', label: 'I avoid activities in which I am the center of attention.', ee: 'CMB_Fear1', options: OPTS },
    { id: 'fear', type: 'choice', label: 'Being embarrassed or looking stupid are among my worst fears.', ee: 'CMB_Fear3', options: OPTS }
  ],
  points: { label: 'Mini-SPIN', max: 12 },
  compute(a) {
    return pointsOf(tool, a) >= 6 ? { level: 3, headline: 'Positive for social anxiety disorder' } : { level: 1, headline: 'Negative for social anxiety disorder' };
  }
};
