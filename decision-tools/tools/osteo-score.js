// SCORE: Simple Calculated Osteoporosis Risk Estimation (Lydick 1998; EE+ 148).
module.exports = {
  id: 'osteo-score',
  eeId: 148,
  title: 'Osteoporosis screening (SCORE)',
  subtitle: 'Simple Calculated Osteoporosis Risk Estimation in women',
  question: 'For a postmenopausal woman, is the risk of osteoporosis high enough to measure bone density?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'IDC_COMBOBOX_1', options: ['20 to 29', '30 to 39', '40 to 49', '50 to 59', '60 to 69', '70 to 79', '80 to 89', '90 to 99'].map(label => ({ label })) },
    { id: 'weight', type: 'choice', label: 'Weight', ee: 'IDC_COMBOBOX_2', options: Array.from({ length: 29 }, (_, k) => ({ label: `${60 + 10 * k} to ${69 + 10 * k} lb` })) },
    { id: 'fractures', type: 'choice', label: 'Minimal-trauma fractures of the wrist, rib or hip after age 45', ee: 'IDC_COMBOBOX_3', options: [{ label: 'None' }, { label: '1' }, { label: '2' }, { label: 'More than 2' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'black', type: 'check', label: 'African American', ee: 'IDC_CHECKBOX_1' },
    { id: 'ra', type: 'check', label: 'Rheumatoid arthritis', ee: 'IDC_CHECKBOX_2' },
    { id: 'noEstrogen', type: 'check', label: 'Never used estrogen therapy', ee: 'IDC_CHECKBOX_3' }
  ],
  compute(a) {
    const s = (a.black ? 0 : 5) + 4 * a.ra + a.noEstrogen + 3 * (a.age + 2) - (a.weight + 6) + 4 * a.fractures;
    return s >= 6 ? { score: { value: s, label: 'SCORE' }, level: 3, headline: 'Average to high risk for osteoporosis (T-score −2.5 or below)', lines: ['99.6% sensitive, 17.9% specific; LR+ 1.2, LR− 0.02.'] }
      : { score: { value: s, label: 'SCORE' }, level: 1, headline: 'Low risk for osteoporosis (T-score −2.5 or below)' };
  }
};
