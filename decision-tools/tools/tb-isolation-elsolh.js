// Respiratory isolation for suspected tuberculosis (El-Solh 1997; EE+ 344).
module.exports = {
  id: 'tb-isolation-elsolh',
  eeId: 344,
  title: 'TB isolation decision-making (El-Solh)',
  subtitle: 'Decision tree for active pulmonary tuberculosis',
  question: 'For a patient admitted with suspected active TB, is isolation recommended?',
  inputs: [
    { id: 'upper', type: 'check', label: 'Upper lung zone disease', ee: 'chk1' },
    { id: 'fever', type: 'check', label: 'Fever', ee: 'chk2' },
    { id: 'weight', type: 'check', label: 'Weight loss', ee: 'chk3' },
    { id: 'cd4', type: 'check', label: 'CD4 under 200 cells/mm³', ee: 'chk4' }
  ],
  compute(a) {
    return a.upper || (a.fever && (a.weight || a.cd4)) ? { level: 3, headline: 'Isolation recommended' } : { level: 1, headline: 'Isolation not recommended' };
  }
};
