// Killip class and mortality in non-ST-elevation acute coronary syndromes (Khot; EE+ 255).
const R = [[['2.8%', '5.0%'], ['8.8%', '14.7%'], ['14.4%', '23.0%'], ['14.4%', '23.0%']], [['2.4%', '4.6%'], ['6.4%', '11.9%'], ['11.8%', '21.4%'], ['11.8%', '21.4%']], [['3.4%', '5.5%'], ['11.9%', '18.0%'], ['18.0%', '26.0%'], ['18.0%', '26.0%']]];
module.exports = {
  id: 'killip-acs',
  eeId: 255,
  title: 'Killip class in non-ST-elevation ACS',
  subtitle: 'Heart failure on examination and mortality (Khot)',
  question: 'For a patient with a non-ST-elevation acute coronary syndrome, what are the 30-day and 6-month mortality by Killip class?',
  inputs: [
    { id: 'killip', type: 'choice', label: 'Killip class', ee: 'IDC_RADIO_1', options: [
      { label: 'I: no heart failure' }, { label: 'II: mild heart failure (rales over a third or less of the posterior lung fields; systolic BP 90 or higher)' },
      { label: 'III: pulmonary edema (rales over more than a third of the lung fields; systolic BP 90 or higher)' }, { label: 'IV: cardiogenic shock (any rales and systolic BP below 90)' }] },
    { id: 'acs', type: 'choice', label: 'Clinical presentation', ee: 'IDC_COMBOBOX_1', options: [{ label: 'Any acute coronary syndrome' }, { label: 'Unstable angina' }, { label: 'Non-ST-elevation MI' }] }
  ],
  compute(a) {
    const r = R[a.acs][a.killip];
    return { level: a.killip + 1, lines: [{ label: '30-day mortality', value: r[0] }, { label: '6-month mortality', value: r[1] }], note: 'Classes III and IV are combined in this analysis.' };
  }
};
