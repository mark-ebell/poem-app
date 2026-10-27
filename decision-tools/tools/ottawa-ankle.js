// Ottawa ankle rule (Stiell 1992; EE+ 12).
module.exports = {
  id: 'ottawa-ankle',
  eeId: 12,
  title: 'Ottawa ankle rule',
  subtitle: 'Need for x-ray after an ankle injury',
  question: 'For a patient with an acute ankle injury, is an ankle x-ray needed?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'pain', type: 'check', label: 'Pain near the malleoli', ee: 'PAIN' },
    { id: 'weight', type: 'check', label: 'Unable to bear weight both immediately and in the ED (4 steps)', ee: 'WEIGHT' },
    { id: 'tender', type: 'check', label: 'Bone tenderness at the posterior edge or tip of either malleolus', ee: 'TENDERNESS' }
  ],
  compute(a) {
    return a.pain && (a.weight || a.tender) ? { level: 3, headline: 'X-ray needed' } : { level: 1, headline: 'X-ray not needed' };
  }
};
