// Coronary disease as the cause of chest pain in primary care (Bösner; EE+ 442).
module.exports = {
  id: 'marburg-heart',
  eeId: 442,
  title: 'Chest pain in primary care (Bösner)',
  subtitle: 'Likelihood that chest pain is due to coronary artery disease',
  question: 'For a primary care patient with non-traumatic chest pain, how likely is coronary artery disease as the cause?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age 55 or older (men) or 65 or older (women)', points: 1, ee: 'AGE' },
    { id: 'cad', type: 'check', label: 'Known CAD or cerebrovascular disease', points: 1, ee: 'CAD_CVD' },
    { id: 'notReproducible', type: 'check', label: 'Pain not reproducible by palpation', points: 1, ee: 'REPRODUCIBLE' },
    { id: 'exercise', type: 'check', label: 'Pain worse during exercise', points: 1, ee: 'EXERCISE' },
    { id: 'cardiac', type: 'check', label: 'Patient assumes the pain is from the heart', points: 1, ee: 'CARDIOGENIC' }
  ],
  points: { label: 'Score', max: 5 },
  compute(a) {
    const s = ['age', 'cad', 'notReproducible', 'exercise', 'cardiac'].filter(k => a[k]).length;
    const r = s < 2 ? { level: 1, label: 'Very low risk', text: '3 of 545 (0.6%)' }
      : s < 4 ? { level: 2, label: 'Intermediate risk', text: '91 of 750 (12.1%)' } : { level: 4, label: 'High risk', text: '94 of 150 (62.7%)' };
    return { level: r.level, headline: r.label, lines: [`${r.text} had coronary artery disease at 6 months.`] };
  }
};
