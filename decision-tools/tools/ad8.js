// AD8 informant interview for dementia (Galvin 2005; EE+ 454).
const Q = [['judgment', 'Problems with judgment (e.g. falls for scams, bad financial decisions)', 'JUDGMENT'], ['hobbies', 'Less interest in hobbies or activities', 'HOBBIES'],
  ['repeats', 'Repeats questions, stories or statements', 'REPEATS'], ['learning', 'Trouble learning to use a tool, appliance or gadget (computer, microwave, remote control)', 'LEARNING'],
  ['forgets', 'Forgets the correct month or year', 'FORGETS'], ['financial', 'Difficulty handling complicated financial affairs (e.g. balancing a checkbook, income taxes, paying bills)', 'FINANCIAL'],
  ['appointments', 'Difficulty remembering appointments', 'APPOINTMENTS'], ['thinking', 'Consistent problems with thinking or memory', 'THINKING']];

module.exports = {
  id: 'ad8',
  eeId: 454,
  title: 'Cognitive impairment screening (AD8)',
  subtitle: 'Informant interview for dementia',
  question: 'For an older patient, does an informant\'s report on the AD8 suggest cognitive impairment?',
  inputs: [
    { type: 'heading', label: 'Ask a reliable informant whether the patient has shown any of these changes' },
    ...Q.map(([id, label, ee]) => ({ id, type: 'check', label, ee }))
  ],
  compute(a) {
    const n = Q.reduce((t, [id]) => t + a[id], 0);
    return n >= 2 ? { score: { value: n, max: 8, label: 'AD8' }, level: 3, headline: 'Positive screen for cognitive impairment' }
      : { score: { value: n, max: 8, label: 'AD8' }, level: 1, headline: 'Negative screen for cognitive impairment' };
  }
};
