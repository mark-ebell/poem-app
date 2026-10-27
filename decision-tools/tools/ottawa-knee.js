// Ottawa knee rule (Stiell 1996; EE+ 13).
module.exports = {
  id: 'ottawa-knee',
  eeId: 13,
  title: 'Ottawa knee rule',
  subtitle: 'Need for x-ray after a knee injury',
  question: 'For a patient with an acute knee injury, is a knee x-ray needed?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'fibula', type: 'check', label: 'Tenderness at the head of the fibula', ee: 'IDC_CHECKBOX_1' },
    { id: 'flex', type: 'check', label: 'Unable to flex to 90 degrees', ee: 'IDC_CHECKBOX_2' },
    { id: 'patella', type: 'check', label: 'Isolated tenderness of the patella (no bone tenderness of the knee other than the patella)', ee: 'IDC_CHECKBOX_4' },
    { id: 'weight', type: 'check', label: 'Unable to bear weight both immediately and in the ED (4 steps), i.e. unable to transfer weight twice onto each leg, regardless of limping', ee: 'IDC_CHECKBOX_3' },
    { id: 'age', type: 'check', label: 'Age 55 or older', ee: 'IDC_CHECKBOX_5' }
  ],
  compute(a) {
    return a.fibula || a.flex || a.patella || a.weight || a.age ? { level: 3, headline: 'X-ray needed' } : { level: 1, headline: 'X-ray not needed' };
  }
};
