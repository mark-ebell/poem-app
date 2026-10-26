// Khorana score, original derivation and validation (Khorana 2008; EE+ 633).
module.exports = {
  id: 'khorana-original',
  eeId: 633,
  title: 'Khorana score (original study)',
  subtitle: 'Venous thromboembolism with chemotherapy',
  question: 'For a patient with cancer starting chemotherapy, what is the risk of venous thromboembolism?',
  inputs: [
    { id: 'site', type: 'choice', label: 'Site of cancer', ee: 'cboSite', eeIndex: [1, 2, 3], default: 2, options: [
      { label: 'Stomach or pancreas', points: 2 }, { label: 'Lung, lymphoma, gynecologic, bladder or testicular', points: 1 }, { label: 'Other site', points: 0 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'platelets', type: 'check', label: 'Pre-chemotherapy platelet count 350,000/µL or higher', points: 1, ee: 'chkPlatelet' },
    { id: 'hgb', type: 'check', label: 'Hemoglobin below 10 g/dL, or use of red cell growth factors', points: 1, ee: 'chkHemoglobin' },
    { id: 'wbc', type: 'check', label: 'Pre-chemotherapy leukocyte count above 11,000/µL', points: 1, ee: 'chkPrechemotherapy' },
    { id: 'bmi', type: 'check', label: 'Body mass index 35 kg/m² or higher', points: 1, ee: 'chkBodyMass' }
  ],
  points: { label: 'Khorana score', max: 6 },
  compute(a) {
    const s = [2, 1, 0][a.site] + a.platelets + a.hgb + a.wbc + a.bmi;
    return s === 0 ? { level: 1, headline: 'Low risk', lines: ['0.3% had VTE.'] } : s <= 2 ? { level: 2, headline: 'Moderate risk', lines: ['2.0% had VTE.'] } : { level: 3, headline: 'High risk', lines: ['6.7% had VTE.'] };
  }
};
