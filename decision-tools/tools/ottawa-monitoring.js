// Ottawa Chest Pain Cardiac Monitoring Rule (Syed; EE+ 560).
module.exports = {
  id: 'ottawa-monitoring',
  eeId: 560,
  title: 'Ottawa Chest Pain Cardiac Monitoring Rule',
  subtitle: 'Safe removal from cardiac monitoring',
  question: 'Can a patient with chest pain be removed from cardiac monitoring on initial physician assessment?',
  inputs: [
    { id: 'painFree', type: 'choice', label: 'Is the patient currently chest pain free?', options: [{ label: 'Yes' }, { label: 'No' }] },
    { id: 'ecg', type: 'choice', label: 'Is the ECG normal or with only nonspecific changes?', options: [{ label: 'Yes' }, { label: 'No' }],
      note: 'Not normal: signs of acute ischemia or infarction, bundle branch block, prolonged QRS, QT or PR interval, LVH with strain, arrhythmia, or paced rhythm.' }
  ],
  evidence: { population: 'Adults with chest pain presenting to the ED were prospectively enrolled to develop the model. Mean age 64 years, 56% male, and 9% ultimately admitted to hospital.' },
  compute(a) {
    const ok = a.painFree === 0 && a.ecg === 0;
    return { level: ok ? 1 : 3,
      headline: ok ? 'Can be removed from cardiac monitoring' : 'Does not meet the rule for removal from monitoring',
      lines: ['For detecting arrhythmia (present in 1.9% overall), the rule was 100% sensitive (it missed no one) and 36% specific.'] };
  }
};
