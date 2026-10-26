// Success of initial medical therapy in unstable angina / non-Q-wave MI (Solomon; EE+ 254).
const R = [[1, 60], [4, 44], [7, 28], [9, 18], [Infinity, 5]];

module.exports = {
  id: 'medical-therapy-success',
  eeId: 254,
  title: 'Successful medical therapy in unstable angina',
  subtitle: 'Who will need catheterization within 6 weeks (Solomon, TIMI IIIB)',
  question: 'In unstable angina or non-Q-wave MI, how likely is initial medical therapy to succeed (no catheterization needed within 6 weeks)?',
  inputs: [
    { id: 'troponin', type: 'choice', label: 'Cardiac troponin I (ng/mL)', ee: 'IDC_COMBOBOX_1', options: [{ label: 'Below 0.4', points: 0 }, { label: '0.4 to 4.9', points: 1 }, { label: 'Above 4.9', points: 3 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'st', type: 'check', label: 'ST depression of 0.1 mV or more', points: 4, ee: 'IDC_CHECKBOX_1' },
    { id: 'accelerated', type: 'check', label: 'Accelerated angina in the prior 2 months', points: 2, ee: 'IDC_CHECKBOX_2' },
    { id: 'exertional', type: 'check', label: 'Exertional angina in the prior 2 months', points: 2, ee: 'IDC_CHECKBOX_4' },
    { id: 'nitrate', type: 'check', label: 'Nitrate use in the prior week', points: 2, ee: 'IDC_CHECKBOX_3' }
  ],
  points: { label: 'Score', max: 13 },
  compute(a) {
    const s = [0, 1, 3][a.troponin] + 4 * a.st + 2 * (a.accelerated + a.exertional + a.nitrate);
    const ok = R.find(([max]) => s <= max)[1];
    return { level: ok >= 60 ? 1 : ok >= 28 ? 2 : ok >= 18 ? 3 : 4, lines: [{ label: 'Successful medical therapy', value: `${ok}%` }, { label: 'Need catheterization within 6 weeks', value: `${100 - ok}%` }] };
  }
};
