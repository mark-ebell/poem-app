// STARWAVe: hospitalization of children with cough and respiratory infection (Hay 2016; EE+ 545).
module.exports = {
  id: 'starwave',
  eeId: 545,
  title: 'STARWAVe (children with cough)',
  subtitle: 'Hospitalization for respiratory infection within 30 days in children with cough',
  question: 'For a child 3 months to 16 years seen in primary care with acute cough and respiratory infection, what is the risk of hospitalization?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    ...[['temp', 'Temperature over 37.8°C, or parent-reported high or severe fever', 'cb7'], ['asthma', 'Current asthma', 'cb1'], ['recession', 'Intercostal or subcostal recession', 'cb2'],
      ['age', 'Age under 2', 'cb3'], ['duration', 'Illness for less than 4 days', 'cb4'], ['vomiting', 'Moderate or severe vomiting in the last 24 hours', 'cb5'], ['wheeze', 'Wheeze', 'cb6']]
      .map(([id, label, ee]) => ({ id, type: 'check', label, ee }))
  ],
  footnote: 'Developed and internally validated in UK primary care; not externally validated.',
  compute(a) {
    const s = a.temp + a.asthma + a.recession + a.age + a.duration + a.vomiting + a.wheeze;
    return s <= 1 ? { score: { value: s, max: 7, label: 'Score' }, level: 1, headline: 'Low risk: 17 of 5593 (0.3%, 95% CI 0.2 to 0.4%) hospitalized within 30 days' }
      : s <= 3 ? { score: { value: s, max: 7, label: 'Score' }, level: 2, headline: 'Average risk: 37 of 2520 (1.5%, 95% CI 1.0 to 1.9%) hospitalized within 30 days' }
      : { score: { value: s, max: 7, label: 'Score' }, level: 4, headline: 'High risk: 24 of 204 (11.8%, 95% CI 7.3 to 16%) hospitalized within 30 days' };
  }
};
