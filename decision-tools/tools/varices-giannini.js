// Platelet count / spleen diameter ratio for esophageal varices in cirrhosis (Giannini 2003; EE+ 242).
module.exports = {
  id: 'varices-giannini',
  eeId: 242,
  title: 'Esophageal varices in cirrhosis (platelet/spleen ratio)',
  subtitle: 'Platelet count to spleen diameter ratio',
  question: 'For a patient with cirrhosis, how likely are esophageal varices?',
  inputs: [
    { id: 'platelets', type: 'number', label: 'Platelet count', unit: '/µL', min: 1000, max: 1500000, step: 1000, ee: 'TXT_ID1' },
    { id: 'spleen', type: 'number', label: 'Maximum spleen diameter (ultrasound)', unit: 'mm', min: 50, max: 300, step: 1, ee: 'TXT_ID2' }
  ],
  compute(a) {
    const r = a.platelets / a.spleen;
    return r > 909
      ? { score: { value: Math.round(r), label: 'Ratio' }, level: 1, headline: '0 of 73 (0%) had esophageal varices' }
      : { score: { value: Math.round(r), label: 'Ratio' }, level: 4, headline: '160 of 193 (83%) had esophageal varices' };
  }
};
