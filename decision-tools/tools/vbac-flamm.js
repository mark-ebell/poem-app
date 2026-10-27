// Vaginal birth after cesarean: admission score (Flamm 1997; EE+ 11).
const { pointsOf } = require('../lib');
const PCT = ['49%', '49%', '49%', '60%', '67%', '77%', '89%', '93%', '95%', '95%', '95%'];

const tool = module.exports = {
  id: 'vbac-flamm',
  eeId: 11,
  title: 'VBAC admission score (Flamm)',
  subtitle: 'Vaginal birth after cesarean, at admission in labor',
  question: 'For a woman in labor attempting vaginal birth after a cesarean, how likely is a vaginal birth?',
  inputs: [
    { id: 'history', type: 'choice', label: 'Previous vaginal birth', ee: 'IDC_COMBOBOX_1', options: [
      { label: 'Before and after the first cesarean', points: 4 }, { label: 'After the first cesarean only', points: 2 }, { label: 'Before the first cesarean only', points: 1 }, { label: 'None', points: 0 }] },
    { id: 'effacement', type: 'choice', label: 'Cervical effacement on admission', ee: 'IDC_RADIO', options: [{ label: 'Over 75%', points: 2 }, { label: '25% to 75%', points: 1 }, { label: 'Under 25%', points: 0 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age under 40', points: 2, ee: 'IDC_CHECKBOX_1' },
    { id: 'reason', type: 'check', label: 'First cesarean for a reason other than failure to progress', points: 1, ee: 'IDC_CHECKBOX_2' },
    { id: 'dilation', type: 'check', label: 'Cervical dilation 4 cm or more on admission', points: 1, ee: 'IDC_CHECKBOX_3' }
  ],
  points: { label: 'Score', max: 10 },
  compute(a) {
    return { headline: `Probability of successful VBAC: ${PCT[pointsOf(tool, a)]}` };
  },
  evidence: { population: 'Consecutive pregnant women at Kaiser Permanente who had a trial of labor after a previous cesarean delivery.' }
};
