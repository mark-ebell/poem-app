// Disappearance of left atrial thrombi before mitral commissurotomy (Silaruks; EE+ 173).
module.exports = {
  id: 'la-thrombus',
  eeId: 173,
  title: 'Left atrial thrombus resolution before commissurotomy',
  subtitle: 'Likelihood that left atrial thrombi will disappear on anticoagulation',
  question: 'For a candidate for percutaneous transvenous mitral commissurotomy with a left atrial thrombus, how likely is the thrombus to disappear?',
  inputs: [
    { id: 'nyha', type: 'choice', label: 'NYHA class', ee: 'CLASS', options: [{ label: 'I' }, { label: 'II' }, { label: 'III' }, { label: 'IV' }] },
    { id: 'area', type: 'number', label: 'Left atrial thrombus size', unit: 'cm²', min: 0.1, max: 30, step: 0.1, ee: 'LEFT' }
  ],
  compute(a) {
    const p = 100 / (1 + Math.exp(-8.1 + 1.8 * (a.nyha + 1) + 0.7 * a.area));
    return { level: p >= 60 ? 1 : p >= 30 ? 2 : 3, headline: `Chance that left atrial thrombi will disappear: ${Math.round(p)}%` };
  }
};
