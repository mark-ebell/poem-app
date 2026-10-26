// Chest x-ray in non-traumatic chest pain (Newsom; EE+ 640).
const ITEMS = [
  ['age', 'Age 60 or older'], ['hemoptysis', 'Hemoptysis'], ['history', 'Prior or current alcohol abuse, tuberculosis, or thromboembolic disease'],
  ['sat', 'Oxygen saturation below 90%'], ['rr', 'Respiratory rate above 24 breaths/min'], ['temp', 'Temperature 38.0 °C (100.4 °F) or higher'],
  ['rales', 'Rales or diminished breath sounds'], ['hf', 'History of heart failure'], ['smoking', 'History of smoking']
];

module.exports = {
  id: 'cxr-chest-pain',
  eeId: 640,
  title: 'Chest x-ray in non-traumatic chest pain',
  subtitle: 'Which patients with chest pain need a chest radiograph?',
  question: 'For a patient in the ED with atraumatic chest pain, is a chest x-ray likely to be helpful?',
  inputs: [{ type: 'heading', label: 'Check all that apply' }, ...ITEMS.map(([id, label], k) => ({ id, type: 'check', label, ee: `cb${k + 1}` }))],
  compute(a) {
    return ITEMS.some(([id]) => a[id])
      ? { level: 3, headline: 'Chest x-ray recommended', lines: ['About 11% were abnormal in the validation study of 1089 patients.'] }
      : { level: 1, headline: 'Chest x-ray unlikely to be helpful', lines: ['Negative predictive value 98.4%: it would miss only 5 of 70 clinically significant chest x-rays among 1089 patients.'] };
  }
};
