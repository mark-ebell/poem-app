// Avian influenza A(H7N9) in the ED (Liao 2014; EE+ 537). Two steps: clinical findings, then tests.
const step1 = a => 10 * a.male + 52 * a.poultry + 19 * a.hemoptysis + 24 * a.dyspnea + 32 * a.fever;

module.exports = {
  id: 'h7n9-liao',
  eeId: 537,
  title: 'Avian influenza A(H7N9) diagnosis (Liao)',
  subtitle: 'H7N9 in patients with acute respiratory symptoms (China)',
  question: 'For a patient in the ED with acute respiratory symptoms during H7N9 circulation, how likely is avian influenza A(H7N9)?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', ee: 'MALE' },
    { id: 'poultry', type: 'check', label: 'Poultry exposure', ee: 'POULTRY' },
    { id: 'hemoptysis', type: 'check', label: 'Hemoptysis', ee: 'HEMO' },
    { id: 'dyspnea', type: 'check', label: 'Shortness of breath', ee: 'BREATH' },
    { id: 'fever', type: 'check', label: 'Fever', ee: 'FEVER' },
    { id: 'testsHeading', type: 'heading', label: 'Not low risk: add the test results', when: a => step1(a) >= 43 },
    { id: 'cxr', type: 'check', label: 'Pneumonia or consolidation on chest x-ray', ee: 'RADIOGRAPH', when: a => step1(a) >= 43 },
    { id: 'wbc', type: 'choice', label: 'White cell count', ee: 'LEUKOCYTE', when: a => step1(a) >= 43, options: [{ label: 'Under 4000/µL' }, { label: '4000 to 11,000' }, { label: 'Over 11,000' }] },
    { id: 'hb', type: 'choice', label: 'Hemoglobin', ee: 'HEMOGLOBIN', default: 1, when: a => step1(a) >= 43, options: [{ label: 'Under 12 g/dL' }, { label: '12 to 15.9' }, { label: '16 or more' }] }
  ],
  footnote: 'Developed and internally validated in China; no external validation.',
  compute(a) {
    if (step1(a) < 43) return { level: 1, headline: 'Low risk: 0.3% likelihood of H7N9' };
    const s = [22, 0, -21][a.wbc] + [-12, 0, -1][a.hb] + 11 * a.male + 54 * a.poultry + 15 * a.hemoptysis + 30 * a.dyspnea + 37 * a.fever + 23 * a.cxr;
    return s < 68 ? { level: 1, headline: 'Low risk: 0.3% likelihood of H7N9' } : s <= 70 ? { level: 2, headline: 'Moderate risk: 2.5% likelihood of H7N9' }
      : s <= 90 ? { level: 3, headline: 'High risk: 4.3% likelihood of H7N9' } : { level: 4, headline: 'Very high risk: 44.0% likelihood of H7N9' };
  },
  evidence: { reference: 'Liao Q, Ip DKM, Tsang TK, et al. A clinical prediction rule for diagnosing human infections with avian influenza A(H7N9) in a hospital emergency department setting. BMC Med. 2014;12:127.' }
};
