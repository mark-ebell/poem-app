// Ottawa foot rule (Stiell 1992; EE+ 14).
module.exports = {
  id: 'ottawa-foot',
  eeId: 14,
  title: 'Ottawa foot rule',
  subtitle: 'Need for x-ray after a foot injury',
  question: 'For a patient with an acute foot injury, is a foot x-ray needed?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'pain', type: 'check', label: 'Pain in the midfoot', ee: 'IDC_CHECKBOX_1' },
    { id: 'weight', type: 'check', label: 'Unable to bear weight both immediately and in the ED (4 steps)', ee: 'IDC_CHECKBOX_2' },
    { id: 'tender', type: 'check', label: 'Bone tenderness at the navicular or the base of the fifth metatarsal', ee: 'IDC_CHECKBOX_3' }
  ],
  compute(a) {
    return a.pain && (a.weight || a.tender) ? { level: 3, headline: 'X-ray needed' } : { level: 1, headline: 'X-ray not needed' };
  }
};
