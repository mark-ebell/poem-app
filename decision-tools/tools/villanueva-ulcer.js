// Persistent bleeding after endoscopic injection of a bleeding peptic ulcer (Villanueva 1993; EE+ 24).
const PROB = { // [sites: superior wall of bulb, posterior wall of bulb, other][size group: up to 7, 8-15, 16-24, 25+ mm]
  disease: [[60, 66, 77, 85], [51, 57, 69, 79], [9, 12, 19, 29]],
  none: [[37, 43, 56, 68], [28, 34, 46, 59], [4, 5, 8, 13]]
};

module.exports = {
  id: 'villanueva-ulcer',
  eeId: 24,
  title: 'Persistent ulcer bleeding after injection (Villanueva)',
  subtitle: 'Failure of endoscopic injection for actively bleeding peptic ulcer',
  question: 'For a patient with an actively bleeding peptic ulcer treated by endoscopic injection, how likely is persistent bleeding?',
  inputs: [
    { id: 'site', type: 'choice', label: 'Ulcer site', ee: 'ULCER_SITE', options: [{ label: 'Superior wall of the duodenal bulb' }, { label: 'Posterior wall of the duodenal bulb' }, { label: 'Other' }] },
    { id: 'size', type: 'number', label: 'Ulcer size', unit: 'mm', min: 1, max: 60, step: 1, ee: 'SIZEOFULCER' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'chronic', type: 'check', label: 'Clinically significant chronic illness (cardiovascular, respiratory, hepatic, renal, cancer, metabolic or rheumatologic)', ee: 'Check_ID1' },
    { id: 'acute', type: 'check', label: 'Active problem needing close attention on admission (such as pneumonia or acute renal failure)', ee: 'Check_ID2' }
  ],
  compute(a) {
    const g = a.size <= 7 ? 0 : a.size <= 15 ? 1 : a.size <= 24 ? 2 : 3;
    return { headline: `Likelihood of persistent bleeding: ${PROB[a.chronic || a.acute ? 'disease' : 'none'][a.site][g]}%` };
  }
};
