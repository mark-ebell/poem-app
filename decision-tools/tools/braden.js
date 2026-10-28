// Braden scale for pressure ulcer risk (studied by Fife 2001 in a neurologic ICU; EE+ 144).
const opts = labels => labels.map((label, k) => ({ label, points: k + 1 }));
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'braden',
  eeId: 144,
  title: 'Predicting pressure ulcer development with Braden Score',
  subtitle: 'Braden scale for pressure ulcer risk',
  question: 'For a patient in a neurologic intensive or intermediate care unit (data gathered within 6 hours), what is the Braden score?',
  inputs: [
    { id: 'sensory', type: 'choice', label: 'Sensory perception', ee: 'IDC_COMBOBOX_1', options: opts(['Completely limited', 'Very limited', 'Slightly limited', 'No impairment']) },
    { id: 'moisture', type: 'choice', label: 'Moisture', ee: 'IDC_COMBOBOX_2', options: opts(['Constantly moist', 'Very moist', 'Occasionally moist', 'Rarely moist']) },
    { id: 'activity', type: 'choice', label: 'Activity', ee: 'IDC_COMBOBOX_3', options: opts(['Bedfast', 'Chairfast', 'Walks occasionally', 'Walks frequently']) },
    { id: 'mobility', type: 'choice', label: 'Mobility', ee: 'IDC_COMBOBOX_4', options: opts(['Completely immobile', 'Very limited', 'Slightly limited', 'No limitations']) },
    { id: 'nutrition', type: 'choice', label: 'Nutrition', ee: 'IDC_COMBOBOX_5', options: opts(['Very poor', 'Probably inadequate', 'Adequate', 'Excellent']) },
    { id: 'friction', type: 'choice', label: 'Friction and shear', ee: 'IDC_COMBOBOX_6', options: opts(['Problem', 'Potential problem', 'No apparent problem']) }
  ],
  points: { label: 'Braden score', max: 23 },
  footnote: 'Lower scores mean higher risk. EE+ noted a 20% risk of ulcer if the score is over 15.',
  compute(a) {
    const s = pointsOf(tool, a);
    return { level: s <= 12 ? 4 : s <= 14 ? 3 : s <= 18 ? 2 : 1, headline: `Braden score ${s}` };
  }
};
