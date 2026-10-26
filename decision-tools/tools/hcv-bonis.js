// Hepatitis C prognosis (Bonis 1999; EE+ 188).
module.exports = {
  id: 'hcv-bonis',
  eeId: 188,
  title: 'Hepatitis C prognosis (Bonis)',
  subtitle: '5-year risk of hepatocellular cancer, liver failure or transplant in hepatitis C',
  question: 'For a patient with chronic hepatitis C, what is the 5-year risk of hepatocellular cancer, death from liver failure, or liver transplant?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'albumin', type: 'check', label: 'Initial albumin below 4.1 g/dL', ee: 'IDC_CHECKBOX_1' },
    { id: 'decomp', type: 'check', label: 'History of decompensation', ee: 'IDC_CHECKBOX_2', note: 'At least one episode of ascites, jaundice, hepatic encephalopathy or variceal bleeding.' }
  ],
  footnote: 'Developed in a tertiary setting, so it may not apply to primary care and may overestimate risk. Not prospectively validated.',
  compute(a) {
    const p = a.albumin ? (a.decomp ? '40.0%' : '7.0%') : (a.decomp ? '5.0%' : '3.2%');
    return { headline: `5-year risk: ${p}` };
  }
};
