// SCORED: chronic kidney disease in adults (Bang 2007; EE+ 381).
module.exports = {
  id: 'scored',
  eeId: 381,
  title: 'Chronic kidney disease risk score (NHANES)',
  subtitle: 'SCORED: probability of occult chronic kidney disease',
  question: 'For an adult, what is the probability of chronic kidney disease (GFR below 60 mL/min/1.73 m²)?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'CMB_Age', options: [{ label: '20 to 49 years' }, { label: '50 to 59 years' }, { label: '60 to 69 years' }, { label: '70 years or older' }] },
    { id: 'female', type: 'check', label: 'Female', ee: 'CHK_Female' },
    { id: 'anemia', type: 'check', label: 'Anemia', ee: 'CHK_Anemia' },
    { id: 'htn', type: 'check', label: 'Hypertension', ee: 'CHK_Hypertension' },
    { id: 'dm', type: 'check', label: 'Diabetes mellitus', ee: 'CHK_Diabetes' },
    { id: 'cvd', type: 'check', label: 'Cardiovascular disease', ee: 'CHK_Cardio' },
    { id: 'chf', type: 'check', label: 'Congestive heart failure', ee: 'CHK_CHF' },
    { id: 'pvd', type: 'check', label: 'Peripheral vascular disease', ee: 'CHK_PVD' },
    { id: 'protein', type: 'check', label: 'Proteinuria', ee: 'CHK_Proteinuria' }
  ],
  compute(a) {
    const x = -5.4 + [0, 1.55, 2.31, 3.23][a.age] + 0.29 * a.female + 0.93 * a.anemia + 0.45 * a.htn + 0.44 * a.dm
      + 0.59 * a.cvd + 0.45 * a.chf + 0.74 * a.pvd + 0.83 * a.protein;
    const p = 100 / (1 + Math.exp(-x));
    return { level: p < 5 ? 1 : p < 20 ? 2 : 3, headline: `Probability of chronic kidney disease (GFR < 60 mL/min/1.73 m²) ${Math.round(p * 10) / 10}%` };
  }
};
