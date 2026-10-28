// Hypersensitivity pneumonitis (Lacasse 2003; EE+ 250).
module.exports = {
  id: 'hypersensitivity-pneumonitis',
  eeId: 250,
  title: 'Hypersensitivity pneumonitis diagnosis',
  subtitle: 'Probability of hypersensitivity pneumonitis',
  question: 'For an adult with pulmonary symptoms in whom hypersensitivity pneumonitis is considered, what is its probability?',
  inputs: [
    { id: 'exposure', type: 'check', label: 'Exposure to a known offending antigen', ee: 'IDC_CHECKBOX_1' },
    { id: 'antibodies', type: 'check', label: 'Positive precipitating antibodies', ee: 'IDC_CHECKBOX_2' },
    { id: 'recurrent', type: 'check', label: 'Recurrent episodes of symptoms', ee: 'IDC_CHECKBOX_3' },
    { id: 'crackles', type: 'check', label: 'Inspiratory crackles', ee: 'IDC_CHECKBOX_4' },
    { id: 'timing', type: 'check', label: 'Symptoms 4 to 8 hours after exposure', ee: 'IDC_CHECKBOX_5' },
    { id: 'weight', type: 'check', label: 'Weight loss', ee: 'IDC_CHECKBOX_6' }
  ],
  compute(a) {
    const x = -6.57 + 3.66 * a.exposure + 1.68 * a.antibodies + 1.2 * a.recurrent + 1.51 * a.crackles + 1.97 * a.timing + 0.7 * a.weight;
    const p = 100 / (1 + Math.exp(-x));
    return { level: p < 10 ? 1 : p < 50 ? 2 : p < 90 ? 3 : 4, headline: `Probability of hypersensitivity pneumonitis ${Math.round(p * 10) / 10}%` };
  }
};
