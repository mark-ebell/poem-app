// Success of medical treatment for carpal tunnel syndrome (Kaplan 1990; EE+ 243).
const P = ['66%', '40%', '17%', '7%', '0%', '0%'];

module.exports = {
  id: 'carpal-tunnel-medical',
  eeId: 243,
  title: 'Carpal tunnel syndrome: success of medical treatment',
  subtitle: 'Response to splinting and medication in carpal tunnel syndrome',
  question: 'For a patient with carpal tunnel syndrome, how likely is medical treatment to succeed?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age over 50', ee: 'CHK_Age' },
    { id: 'duration', type: 'check', label: 'Duration over 10 months', ee: 'CHK_Duration' },
    { id: 'trigger', type: 'check', label: 'History of trigger finger', ee: 'CHK_Trigger' },
    { id: 'constant', type: 'check', label: 'Constant paresthesias', ee: 'CHK_Paresthesias' },
    { id: 'phalen', type: 'check', label: "Phalen's sign positive in under 30 seconds", ee: 'CHK_Phalen' }
  ],
  footnote: 'Medical therapy was splinting plus NSAIDs (65%), oral steroids (27%) or injected steroids (16%). Not prospectively validated.',
  compute(a) {
    const n = a.age + a.duration + a.trigger + a.constant + a.phalen;
    return { score: { value: n, max: 5, label: 'Risk factors' }, headline: `Probability of successful medical therapy: ${P[n]}` };
  }
};
