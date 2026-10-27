// Swensen (Mayo Clinic) model: malignancy in a solitary pulmonary nodule (Swensen 1997; EE+ 318).
module.exports = {
  id: 'swensen-nodule',
  eeId: 318,
  title: 'Pulmonary nodule malignancy (Swensen/Mayo)',
  subtitle: 'Malignancy in a radiographically detected solitary pulmonary nodule',
  question: 'For a solitary pulmonary nodule found on imaging, how likely is it to be malignant?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 100, step: 1, ee: 'EDIT_Age' },
    { id: 'diameter', type: 'number', label: 'Nodule diameter', unit: 'mm', min: 1, max: 100, step: 1, ee: 'EDIT_Diameter' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'smoker', type: 'check', label: 'Current or former smoker', ee: 'CHK_Smoker' },
    { id: 'cancer', type: 'check', label: 'Extrathoracic cancer diagnosed more than 5 years ago', ee: 'CHK_CA' },
    { id: 'spiculated', type: 'check', label: 'Spiculated edge', ee: 'CHK_Spicula' },
    { id: 'upper', type: 'check', label: 'Upper lobe', ee: 'CHK_Lesion' }
  ],
  footnote: 'Baseline probability of malignancy 26%.',
  swensen: a => 1 / (1 + Math.exp(-(-6.8272 + 0.0391 * a.age + 0.7917 * a.smoker + 1.3388 * a.cancer + 0.1274 * a.diameter + 1.0407 * a.spiculated + 0.7838 * a.upper))),
  compute(a) {
    return { headline: `Probability of malignancy: ${(100 * module.exports.swensen(a)).toFixed(1)}%` };
  }
};
