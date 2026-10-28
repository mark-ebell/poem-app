// AUDIT-C alcohol screen (Bush 1998; EE+ 216). EE+ used 2 or more for everyone; at Mark Ebell's request
// (2026-10-27) the cut-offs are 4 or more for men and 3 or more for women (Bradley 2007).
const { pointsOf } = require('../lib');
const opts = labels => labels.map((label, points) => ({ label, points }));

const tool = module.exports = {
  id: 'audit-c',
  eeId: 216,
  title: 'AUDIT-C (alcohol use disorder screen)',
  subtitle: 'Three-question screen for unhealthy alcohol use',
  question: 'For an adult, does the AUDIT-C suggest hazardous drinking or an alcohol use disorder?',
  inputs: [
    { id: 'sex', type: 'choice', label: 'Sex', options: [{ label: 'Male' }, { label: 'Female' }] },
    { id: 'freq', type: 'choice', label: 'How often did you have a drink containing alcohol in the past year?', ee: 'IDC_COMBOBOX_1', options: opts(['Never', 'Monthly or less', '2 to 4 times a month', '2 to 3 times a week', 'More than 3 times a week']) },
    { id: 'typical', type: 'choice', label: 'How many drinks did you have on a typical drinking day in the past year?', ee: 'IDC_COMBOBOX_2', options: opts(['0 to 2', '3 to 4', '5 to 6', '7 to 9', 'More than 9']) },
    { id: 'binge', type: 'choice', label: 'How often in the past year did you have 6 or more drinks on one occasion?', ee: 'IDC_COMBOBOX_3', options: opts(['Never', 'Less than monthly', 'Monthly', 'Weekly', 'Daily or almost daily']) }
  ],
  points: { label: 'AUDIT-C', max: 12 },
  footnote: 'A drink is 12 oz of beer, 4 oz of wine, a wine cooler, or 1.25 oz of liquor.',
  compute(a) {
    const female = a.sex === 1, cut = female ? 3 : 4;
    const lr = female ? { pos: '8.1', neg: '0.30' } : { pos: '7.8', neg: '0.16' };
    return pointsOf(tool, a) >= cut ? { level: 3, headline: `Positive screen for alcohol misuse (${cut} or more in ${female ? 'women' : 'men'}; LR+ ${lr.pos})` }
      : { level: 1, headline: `Negative screen for alcohol misuse (below ${cut} in ${female ? 'women' : 'men'}; LR− ${lr.neg})` };
  },
  evidence: {
    comment: 'Cut-offs of 4 or more for men (sensitivity 86%, specificity 89%) and 3 or more for women (73%, 91%) for alcohol misuse in primary care: Bradley KA, DeBenedetti AF, Volk RJ, et al. Alcohol Clin Exp Res. 2007;31(7):1208-17 (PMID 17451397). EE+ used 2 or more for everyone (LR+ 5.9, LR− 0.2).'
  }
};
