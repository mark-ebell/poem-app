// Ureteral calculi in patients undergoing IVP (Elton 1993; EE+ 177).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'stone-elton',
  eeId: 177,
  title: 'Renal lithiasis diagnosis (Elton)',
  subtitle: 'Likelihood of a positive IVP in suspected renal stones',
  question: 'For a patient with suspected renal stones undergoing IVP, is a positive IVP likely?',
  inputs: [
    { id: 'kub', type: 'check', label: 'Positive KUB radiograph', points: 2, ee: 'IDC_CHECKBOX_1' },
    { id: 'hematuria', type: 'check', label: 'Hematuria', points: 2, ee: 'IDC_CHECKBOX_2' },
    { id: 'flank', type: 'check', label: 'Flank pain', points: 1, ee: 'IDC_CHECKBOX_3' },
    { id: 'acute', type: 'check', label: 'Acute onset of symptoms', points: 1, ee: 'IDC_CHECKBOX_4' }
  ],
  points: { label: 'Points', max: 6 },
  compute(a) {
    return pointsOf(tool, a) >= 4 ? { level: 4, headline: 'More than 90% likelihood of a positive IVP' }
      : { level: 2, headline: 'Unable to estimate likelihood of a positive IVP, but less than 90%' };
  }
};
