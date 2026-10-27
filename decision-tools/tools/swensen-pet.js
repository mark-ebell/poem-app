// Swensen model combined with PET for a solitary pulmonary nodule (EE+ 319).
const { swensen, inputs } = require('./swensen-nodule');

module.exports = {
  id: 'swensen-pet',
  eeId: 319,
  title: 'Pulmonary nodule malignancy with PET (Swensen + PET)',
  subtitle: 'Malignancy in a solitary pulmonary nodule from clinical findings and PET',
  question: 'For a solitary pulmonary nodule with a PET scan, how likely is it to be malignant?',
  inputs: [
    ...inputs,
    { id: 'pet', type: 'choice', label: 'PET result', ee: 'COMBO_PET', options: [{ label: 'No uptake' }, { label: 'Faint uptake' }, { label: 'Moderate uptake' }, { label: 'Intense uptake' }] }
  ],
  footnote: 'Baseline probability of malignancy 26%.',
  compute(a) {
    const x = -4.739 + 3.691 * swensen(a) + [0, 2.322, 4.617, 4.771][a.pet];
    return { headline: `Probability of malignancy: ${(100 / (1 + Math.exp(-x))).toFixed(1)}%` };
  }
};
