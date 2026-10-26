// Manchester Acute Coronary Syndromes (MACS) rule (Body; EE+ 530).
module.exports = {
  id: 'macs',
  eeId: 530,
  title: 'MACS rule',
  subtitle: 'Manchester Acute Coronary Syndromes decision rule',
  question: 'For a patient with suspected cardiac chest pain, what is the probability of a major adverse cardiac event in the next 30 days?',
  inputs: [
    { id: 'tnt', type: 'number', label: 'High-sensitivity troponin T at presentation', unit: 'ng/L', min: 0, max: 199, step: 0.1, ee: 'TNT' },
    { id: 'fabp', type: 'number', label: 'Heart-type fatty acid binding protein at presentation', unit: 'ng/mL', min: 0, max: 199, step: 0.1, ee: 'FABP' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'ischemia', type: 'check', label: 'Evidence of ischemia on ECG', ee: 'ISCHEMIA' },
    { id: 'sweating', type: 'check', label: 'Sweating observed', ee: 'SWEATING' },
    { id: 'vomiting', type: 'check', label: 'Vomiting', ee: 'VOMITING' },
    { id: 'sbp', type: 'check', label: 'Systolic BP below 100 mm Hg', ee: 'SBP' },
    { id: 'angina', type: 'check', label: 'Worsening angina', ee: 'ANGINA' },
    { id: 'right', type: 'check', label: 'Pain radiating to the right arm or shoulder', ee: 'PAINRIGHT' }
  ],
  compute(a) {
    const x = 0.068 * a.tnt + 0.17 * a.fabp + 1.75 * a.ischemia + 1.85 * a.sweating + 1.72 * a.vomiting + 1.46 * a.sbp + 0.92 * a.angina + 0.87 * a.right - 4.83;
    const p = 100 / (1 + Math.exp(-x));
    return { level: p < 2 ? 1 : p < 5 ? 2 : p < 95 ? 3 : 4, headline: `Probability of a major adverse cardiac event within 30 days: ${p.toFixed(1)}%` };
  }
};
