// Prostate cancer-specific survival after biochemical recurrence following prostatectomy (Freedland 2005; EE+ 355).
// [PSA doubling time][recurrence after 3 years][Gleason under 8] -> [5, 10, 15 years]
const T = [
  [[['98', '86', '62'], ['99', '93', '81']], [['99', '96', '87'], ['100', '98', '94']]],
  [[['94', '69', '31'], ['97', '85', '59']], [['98', '90', '72'], ['99', '95', '86']]],
  [[['81', '26', '1'], ['91', '55', '16']], [['94', '68', '30'], ['97', '84', '59']]],
  [[['51', '1', 'under 1'], ['74', '15', 'under 1']], [['83', '30', '2'], ['92', '59', '19']]]
];

module.exports = {
  id: 'psa-recurrence-freedland',
  eeId: 355,
  title: 'Prostate cancer: prognosis with a rising PSA after surgery',
  subtitle: 'Cancer-specific survival after biochemical recurrence',
  question: 'For a man with biochemical recurrence (PSA over 0.2 ng/mL) after prostatectomy, what is the prostate cancer-specific survival?',
  inputs: [
    { id: 'pdt', type: 'choice', label: 'PSA doubling time', ee: 'combo1', options: [{ label: '15 months or more' }, { label: '9 to 14.9 months' }, { label: '3 to 8.9 months' }, { label: 'Under 3 months' }],
      note: 'Months for the PSA to double after the first abnormal postoperative value.' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'gleason', type: 'check', label: 'Gleason score under 8', ee: 'chk1' },
    { id: 'late', type: 'check', label: 'Recurrence more than 3 years after surgery', ee: 'chk2' }
  ],
  compute(a) {
    const [y5, y10, y15] = T[a.pdt][+a.late][+a.gleason];
    const pct = v => (/under/.test(v) ? `${v}%` : `${v}%`);
    return { headline: `Prostate cancer-specific survival: ${pct(y5)} at 5 years`, lines: [`${pct(y10)} at 10 years`, `${pct(y15)} at 15 years`] };
  }
};
