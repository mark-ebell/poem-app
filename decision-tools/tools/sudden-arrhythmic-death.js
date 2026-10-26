// Sudden arrhythmic death in coronary disease from the ECG (Chatterjee; EE+ 618).
module.exports = {
  id: 'sudden-arrhythmic-death',
  eeId: 618,
  title: 'Sudden arrhythmic death in coronary disease',
  subtitle: '5-year risk from simple ECG measures',
  question: 'For a patient with coronary artery disease, what is the 5-year risk of sudden arrhythmic death based on the ECG?',
  inputs: [
    { id: 'qrs', type: 'choice', label: 'QRS duration', ee: 'ddl1', options: [{ label: 'Below 80 ms', points: 0 }, { label: '80 to 110 ms', points: 1 }, { label: 'Above 110 ms', points: 2 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'q', type: 'check', label: 'Contiguous Q waves', points: 1, ee: 'cb1' },
    { id: 'lvh', type: 'check', label: 'Left ventricular hypertrophy', points: 1, ee: 'cb2' },
    { id: 'jtc', type: 'check', label: 'Prolonged JTc (end of QRS to end of T wave)', points: 1, ee: 'cb3' }
  ],
  points: { label: 'Score', max: 5 },
  compute(a) {
    const s = a.qrs + a.q + a.lvh + a.jtc;
    const r = s <= 1 ? [1, 'Low risk', '0.9%'] : s === 2 ? [2, 'Moderate risk', '2.7%'] : [3, 'High risk', '5.2%'];
    return { level: r[0], headline: r[1], lines: [{ label: 'Sudden arrhythmic death within 5 years', value: r[2] }] };
  }
};
