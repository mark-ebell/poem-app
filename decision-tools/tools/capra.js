// UCSF-CAPRA score: recurrence after radical prostatectomy (Cooperberg 2005; EE+ 303).
const OUT = [[1, '7.0%', 401], [2, '9.5%', 432], [3, '18.2%', 296], [4, '17.4%', 155], [5, '26.2%', 84], [6, '37.2%', 43], [Infinity, '79%', 28]];
const { pointsOf } = require('../lib');
const opts = list => list.map(([label, points]) => ({ label, points }));

const tool = module.exports = {
  id: 'capra',
  eeId: 303,
  title: 'Prostate cancer recurrence (UCSF-CAPRA)',
  subtitle: '5-year recurrence after radical prostatectomy',
  question: 'For a man with clinically localized prostate cancer (T1c to T3a) treated by radical prostatectomy alone, what is the risk of recurrence within 5 years?',
  inputs: [
    { id: 'psa', type: 'choice', label: 'PSA', ee: 'IDC_COMBOBOX_1', options: opts([['2.1 to 6 ng/mL', 0], ['6.1 to 10', 1], ['10.1 to 20', 2], ['20.1 to 30', 3], ['Over 30', 4]]) },
    { id: 'gleason', type: 'choice', label: 'Gleason score', ee: 'IDC_COMBOBOX_2', options: opts([['1 to 6', 0], ['7 to 8', 1], ['9 to 10', 3]]) },
    { id: 'stage', type: 'choice', label: 'Stage', ee: 'IDC_COMBOBOX_3', options: opts([['T1 or T2', 0], ['T3a', 1]]) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'cores', type: 'check', label: 'More than 33% of biopsies positive', points: 1, ee: 'IDC_CHECKBOX_1' },
    { id: 'age', type: 'check', label: 'Age 50 or older', points: 1, ee: 'IDC_CHECKBOX_2' }
  ],
  points: { label: 'CAPRA score', max: 10 },
  footnote: 'Developed in a large population but not prospectively validated.',
  compute(a) {
    const s = pointsOf(tool, a), [, p, size] = OUT.find(([max]) => s <= max);
    return { level: s <= 2 ? 1 : s <= 5 ? 2 : 4, headline: `5-year recurrence: ${p}`, lines: [`n = ${size} with this score.`] };
  }
};
