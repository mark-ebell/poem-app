// Pneumonia in adults with respiratory symptoms (Singal model, validated by Emerman 1991; EE+ 185).
module.exports = {
  id: 'pneumonia-singal',
  eeId: 185,
  title: 'Diagnosis of pneumonia (Singal)',
  subtitle: 'Pneumonia in adults with respiratory symptoms',
  question: 'For an adult with respiratory symptoms, what is the probability of pneumonia?',
  inputs: [
    { id: 'cough', type: 'check', label: 'Cough', ee: 'IDC_CHECKBOX_1' },
    { id: 'fever', type: 'check', label: 'Fever', ee: 'IDC_CHECKBOX_2' },
    { id: 'crackles', type: 'check', label: 'Crackles', ee: 'IDC_CHECKBOX_3' }
  ],
  compute(a) {
    const p = 100 / (1 + Math.exp(-(-3.095 + 1.214 * a.cough + 1.007 * a.fever + 0.823 * a.crackles)));
    return { level: p < 10 ? 1 : p < 25 ? 2 : 3, headline: `Probability of pneumonia ${Math.round(p * 10) / 10}%` };
  }
};
