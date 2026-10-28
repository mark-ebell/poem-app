// Rapid shallow breathing index (Yang and Tobin 1991; EE+ 235).
module.exports = {
  id: 'rsbi',
  eeId: 235,
  title: 'Rapid Shallow Breathing score',
  subtitle: 'Rapid shallow breathing index for ventilator weaning',
  question: 'During one minute of spontaneous breathing, is successful weaning predicted?',
  inputs: [
    { id: 'f', type: 'number', label: 'Number of breaths', unit: 'per minute', min: 1, max: 80, ee: 'IDC_EDIT_1' },
    { id: 'vt', type: 'number', label: 'Tidal volume', unit: 'liters', min: 0.05, max: 2, step: 0.01, ee: 'IDC_EDIT_2' }
  ],
  footnote: 'Rapid shallow breathing is associated with failure to wean. An index of 105 or less is 97% sensitive and 64% specific (78% PPV, 95% NPV given a 56% pretest probability), and is more accurate during the first 8 days of mechanical ventilation. Not validated in children.',
  compute(a) {
    const r = a.f / a.vt, v = Math.round(r * 100) / 100;
    return { score: { value: v, label: 'RSB index' }, ...(r <= 105 ? { level: 1, headline: 'Successful wean predicted (cut-off 105)' } : { level: 3, headline: 'Unsuccessful wean predicted (cut-off 105)' }) };
  }
};
