// Nerve function impairment in leprosy (Croft 2000; EE+ 129).
module.exports = {
  id: 'leprosy-nfi',
  eeId: 129,
  title: 'Leprosy: nerve function impairment (Croft)',
  subtitle: 'Disabling nerve damage in new leprosy patients',
  question: 'For a new leprosy patient, what is the risk of disabling nerve function impairment over 2 years?',
  inputs: [
    { id: 'type', type: 'choice', label: 'Type of leprosy', ee: 'IDC_RADIO_1', options: [{ label: 'Paucibacillary' }, { label: 'Multibacillary' }] },
    { type: 'heading', label: 'Check if present' },
    { id: 'nfi', type: 'check', label: 'Any nerve function loss at presentation', ee: 'IDC_CHECKBOX_1' }
  ],
  compute(a) {
    const s = a.type + a.nfi;
    return s === 0 ? { level: 1, headline: 'Low risk: 1.3% disabling nerve function impairment', lines: ['0.2% with no truncal nerve enlargement.'] }
      : s === 1 ? { level: 2, headline: 'Moderate risk: 16% disabling nerve function impairment' } : { level: 4, headline: 'High risk: 65% disabling nerve function impairment' };
  },
  evidence: { pmid: '10821364' }
};
