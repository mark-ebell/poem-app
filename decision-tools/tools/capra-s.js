// CAPRA-S: recurrence after radical prostatectomy (Cooperberg 2011; EE+ 513).
const OUT = [['89', '82'], ['75', '69'], ['72', '64'], ['60', '49'], ['47', '37'], ['38', '27'], ['33', '30'], ['18', '18'], ['12.3', '0'], ['7.2', '0']];
const { pointsOf } = require('../lib');
const opts = list => list.map(([label, points]) => ({ label, points }));

const tool = module.exports = {
  id: 'capra-s',
  eeId: 513,
  title: 'Prostate cancer after prostatectomy (CAPRA-S)',
  subtitle: 'Progression-free survival after radical prostatectomy',
  question: 'For a man after radical prostatectomy, what is the progression-free survival at 3 and 5 years?',
  inputs: [
    { id: 'psa', type: 'choice', label: 'Preoperative PSA', ee: 'PSA', options: opts([['0 to 6.0 ng/mL', 0], ['6.01 to 10', 1], ['10.01 to 20', 2], ['Over 20', 3]]) },
    { id: 'gleason', type: 'choice', label: 'Pathologic Gleason score', ee: 'GLEASON', options: opts([['2 to 6', 0], ['3 + 4', 1], ['4 + 3', 2], ['8 to 10', 3]]) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'margin', type: 'check', label: 'Positive surgical margin', points: 2, ee: 'SURGICAL' },
    { id: 'svi', type: 'check', label: 'Seminal vesicle invasion', points: 2, ee: 'SEMINAL' },
    { id: 'ece', type: 'check', label: 'Extracapsular extension', points: 1, ee: 'CAPSULE' },
    { id: 'lni', type: 'check', label: 'Lymph node involvement', points: 1, ee: 'NODES' }
  ],
  points: { label: 'CAPRA-S score', max: 12 },
  compute(a) {
    const [y3, y5] = OUT[Math.min(pointsOf(tool, a), 9)];
    return { headline: `Progression-free survival: ${y3}% at 3 years, ${y5}% at 5 years` };
  }
};
