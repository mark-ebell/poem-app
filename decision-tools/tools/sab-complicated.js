// Complicated Staphylococcus aureus bacteremia (Lambregts 2020; EE+ 627).
module.exports = {
  id: 'sab-complicated',
  eeId: 627,
  title: 'Complicated S. aureus bacteremia (Lambregts)',
  subtitle: 'Complicated disease in Staphylococcus aureus bacteremia',
  question: 'For a patient with Staphylococcus aureus bacteremia, how likely is complicated disease (endocarditis or metastatic infection)?',
  inputs: [
    { id: 'ttp', type: 'choice', label: 'Time to positive blood culture', ee: 'ddl1', options: [{ label: '16 hours or less' }, { label: 'Over 16 to 24 hours' }, { label: 'Over 24 hours' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'mets', type: 'check', label: 'Signs of metastatic infection (new diastolic murmur, stigmata of endocarditis, or metastatic infection on exam)', ee: 'cb1' },
    { id: 'map', type: 'check', label: 'Mean arterial pressure below 90 mm Hg', ee: 'cb2' },
    { id: 'wbc', type: 'check', label: 'White cell count above 15,000/µL', ee: 'cb3' },
    { id: 'neutropenia', type: 'check', label: 'Neutropenia (below 500/µL)', ee: 'cb4' },
    { id: 'urea', type: 'check', label: 'Urea above 13 mmol/L', ee: 'cb5' }
  ],
  compute(a) {
    const s = 1.5 * a.mets + a.map + a.wbc + 3 * a.neutropenia + a.urea + [2.5, 1, 0][a.ttp];
    return s <= 2 ? { score: { value: s, max: 10, label: 'Score' }, level: 1, headline: '6 of 35 (17%) had complicated disease', lines: ['Including 3 with endocarditis and 2 with metastatic infection.'] }
      : s <= 4.5 ? { score: { value: s, max: 10, label: 'Score' }, level: 3, headline: '67 of 103 (65%) had complicated disease', lines: ['Including 15 with endocarditis and 29 with metastatic infection.'] }
      : { score: { value: s, max: 10, label: 'Score' }, level: 4, headline: '37 of 45 (82%) had complicated disease', lines: ['Including 10 with endocarditis and 22 with metastatic infection.'] };
  },
  evidence: { reference: 'Lambregts MMC, Molendijk EBD, Meziyerh S, et al. Early differentiation between uncomplicated and complicated Staphylococcus aureus bacteraemia: potential value and limitations of a clinical risk score. Int J Clin Pract. 2020;74(11):e13601.' }
};
