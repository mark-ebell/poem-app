// Wells score for pulmonary embolism, with the diagnostic pathway (Ebell, Am Fam Physician 2004; EE+ 175).
// Each test is asked once it is the next step; it starts on "Not done yet".
const IMAGING = ['Not done yet', 'CT positive', 'CT negative', 'V/Q scan: high probability', 'V/Q scan: normal', 'V/Q scan: other result'];
const riskClass = s => (s < 2 ? 1 : s <= 6 ? 2 : 3);
const scoreOf = a => 3 * a.dvt + 1.5 * (a.hr + a.immobile + a.previous) + a.hemoptysis + a.cancer + 3 * a.likely;
const needsImaging = a => a.ddimer === 1 || (a.ddimer === 2 && riskClass(scoreOf(a)) > 1);

module.exports = {
  id: 'wells-pe',
  eeId: 175,
  title: 'Wells score for PE, with diagnostic pathway',
  subtitle: 'Probability of pulmonary embolism and next tests',
  question: 'For a patient with suspected pulmonary embolism, how likely is PE, and what is the next step?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'dvt', type: 'check', label: 'Clinical signs of DVT (objectively measured leg swelling and pain with palpation of the deep veins)', points: 3, ee: 'IDC_CHECKBOX_1' },
    { id: 'hr', type: 'check', label: 'Heart rate above 100 beats/min', points: 1.5, ee: 'IDC_CHECKBOX_2' },
    { id: 'immobile', type: 'check', label: 'Immobilization (bed rest, except to use the bathroom, for 3 or more days) or surgery in the past 4 weeks', points: 1.5, ee: 'IDC_CHECKBOX_3' },
    { id: 'previous', type: 'check', label: 'Previous PE or DVT', points: 1.5, ee: 'IDC_CHECKBOX_4' },
    { id: 'hemoptysis', type: 'check', label: 'Hemoptysis', points: 1, ee: 'IDC_CHECKBOX_5' },
    { id: 'cancer', type: 'check', label: 'Malignancy (active treatment, treatment in the last 6 months, or palliative)', points: 1, ee: 'IDC_CHECKBOX_6' },
    { id: 'likely', type: 'check', label: 'PE as likely as or more likely than an alternative diagnosis', points: 3, ee: 'IDC_CHECKBOX_7' },
    { id: 'ddimer', type: 'choice', label: 'D-dimer', options: [{ label: 'Not done yet' }, { label: 'Positive' }, { label: 'Negative' }] },
    { id: 'imaging', type: 'choice', label: 'Imaging', when: needsImaging, options: IMAGING.map(label => ({ label })),
      note: 'A positive helical CT shows intraluminal filling defects in segmental or larger pulmonary arteries.' },
    { id: 'us', type: 'choice', label: 'Bilateral leg ultrasound', when: a => needsImaging(a) && (a.imaging === 2 || a.imaging === 5),
      options: [{ label: 'Not done yet' }, { label: 'Normal' }, { label: 'Abnormal' }] }
  ],
  points: { label: 'Wells score', max: 12.5 },
  compute(a) {
    const rc = riskClass(scoreOf(a));
    const risk = [null, [1, 'Low probability of PE: 1.3%'], [2, 'Moderate probability of PE: 16.2%'], [4, 'High probability of PE: 37.5%']][rc];
    const r = { level: risk[0], headline: risk[1], lines: [] };
    const next = t => { r.lines.push(t); return r; };
    if (a.ddimer === 0) return next('Next: D-dimer.');
    if (a.ddimer === 2 && rc === 1) return next('D-dimer negative: PE ruled out.');
    if (a.imaging === 0) return next(`D-dimer ${a.ddimer === 1 ? 'positive' : 'negative'}: order a V/Q scan or helical CT.`);
    if (a.imaging === 1 || a.imaging === 3) return next('PE diagnosed.');
    if (a.imaging === 4) return next('PE ruled out.');
    if (a.us === 0) return next('Order bilateral leg ultrasound.');
    if (a.us === 2) return next('Leg ultrasound abnormal: PE diagnosed.');
    const options = 'Options: 1) serial ultrasound at 1 and 2 weeks; 2) helical CT or V/Q if not already done; 3) angiogram.';
    if (rc === 1) return next('PE ruled out.');
    if (rc === 2) return next(a.ddimer === 1 ? options : 'PE ruled out.');
    return next(a.ddimer === 1 ? 'PE very likely; consider angiography to confirm.' : options);
  }
};
