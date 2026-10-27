// Cancer in involuntary weight loss (Hernández 2003; EE+ 251).
module.exports = {
  id: 'weight-loss-cancer',
  eeId: 251,
  title: 'Cancer risk with unintentional weight loss',
  subtitle: 'Cancer in patients with involuntary weight loss',
  question: 'For a patient with involuntary weight loss, how likely is cancer?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age over 80', ee: 'AGE' },
    { id: 'albumin', type: 'check', label: 'Serum albumin over 3.5 g/dL', ee: 'SERUM' },
    { id: 'wbc', type: 'check', label: 'White cell count over 12,000/µL', ee: 'BLOOD' },
    { id: 'alp', type: 'check', label: 'Alkaline phosphatase over 300 U/L', ee: 'ALKALINE' },
    { id: 'ldh', type: 'check', label: 'LDH over 500 U/L', ee: 'LACTATE' }
  ],
  compute(a) {
    const s = a.age - 2 * a.albumin + a.wbc + 2 * a.alp + 3 * a.ldh;
    return { score: { value: s, label: 'Score' }, ...(s < 0 ? { level: 1, headline: 'Low risk: 8 of 123 (6.5%) had cancer' } : s <= 1 ? { level: 2, headline: 'Moderate risk: 30 of 81 (37%) had cancer' } : { level: 4, headline: 'High risk: 49 of 52 (94%) had cancer' }) };
  }
};
