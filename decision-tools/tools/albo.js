// ALBO score: new-onset atrial fibrillation in STEMI treated with PCI (Mazzone; EE+ 569).
module.exports = {
  id: 'albo',
  eeId: 569,
  title: 'ALBO score',
  subtitle: 'New-onset atrial fibrillation after PCI for STEMI',
  question: 'In a patient with STEMI undergoing PCI, what is the risk of new-onset atrial fibrillation?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'ddl1', options: [{ label: 'Under 70', points: 0 }, { label: '70 to 79', points: 2 }, { label: '80 or older', points: 3 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'wbc', type: 'check', label: 'Leukocytes above 9680 cells/µL', points: 1, ee: 'cb1' },
    { id: 'bnp', type: 'check', label: 'B-type natriuretic peptide above 80 ng/L', points: 1, ee: 'cb2' },
    { id: 'obesity', type: 'check', label: 'Obesity (BMI 30 or more)', points: 1, ee: 'cb3' }
  ],
  points: { label: 'ALBO score', max: 6 },
  compute(a) {
    const s = [0, 2, 3][a.age] + a.wbc + a.bnp + a.obesity;
    return s <= 2 ? { level: 1, headline: 'Low risk', lines: ['2.7% risk of new-onset AF.'] }
      : s <= 4 ? { level: 2, headline: 'Moderate risk', lines: ['9.7% risk of new-onset AF.'] }
      : { level: 4, headline: 'High risk', lines: ['27.4% risk of new-onset AF.'] };
  }
};
