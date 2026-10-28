// Repeat self-harm after an episode of self-harm (EE+ 396).
module.exports = {
  id: 'self-harm-repeat',
  eeId: 396,
  title: 'Risk of repeated self-harm or suicide',
  subtitle: 'Repeat self-harm within 6 months',
  question: 'For a patient seen after self-harm or a suicide attempt, what is the risk of repeated self-harm within 6 months?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'treatment', type: 'check', label: 'Current or previous psychiatric treatment', ee: 'CHK_Tx' },
    { id: 'previous', type: 'check', label: 'Any previous self-harm', ee: 'CHK_Prev' },
    { id: 'benzo', type: 'check', label: 'Benzodiazepine use in this attempt', ee: 'CHK_Benzo' }
  ],
  compute(a) {
    return a.treatment || a.previous || a.benzo ? { level: 3, headline: 'Moderate or high risk: 22% repeated self-harm within 6 months' } : { level: 1, headline: 'Low risk: 2.6% repeated self-harm within 6 months' };
  }
};
