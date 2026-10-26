// EDACS: 30-day major adverse cardiac events (Boyle meta-analysis 2021; EE+ 612).
const AGES = ['18 to 45', '46 to 50', '51 to 55', '56 to 60', '61 to 65', '66 to 70', '71 to 75', '76 to 80', '81 to 85', '86 or older'];
const MACE = '(MI, revascularization, cardiovascular death, ventricular arrhythmia, cardiac arrest, cardiogenic shock, or high-grade AV block)';

module.exports = {
  id: 'edacs-meta',
  eeId: 612,
  title: 'EDACS: 30-day cardiac events',
  subtitle: 'Likelihood of a major adverse cardiac event, from a 2021 meta-analysis',
  question: 'For a patient in the ED with possible acute coronary syndrome, how likely is a major adverse cardiac event in the next 30 days?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age (years)', ee: 'ddl1', options: AGES.map((label, k) => ({ label, points: 2 * (k + 1) })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male sex', points: 6, ee: 'cb1' },
    { id: 'risk', type: 'check', label: 'Known CAD, or 3 or more of: dyslipidemia, diabetes, hypertension, current smoker, family history of premature heart disease', ee: 'cb2' },
    { id: 'diaphoresis', type: 'check', label: 'Diaphoresis', points: 3, ee: 'cb3' },
    { id: 'radiates', type: 'check', label: 'Pain radiates to the arm or shoulder', points: 5, ee: 'cb4' },
    { id: 'inspiration', type: 'check', label: 'Pain occurred or worsened with inspiration', points: -4, ee: 'cb5' },
    { id: 'palpation', type: 'check', label: 'Pain is reproduced by palpation', points: -6, ee: 'cb6' },
    { id: 'ecg', type: 'check', label: 'New ischemia on ECG', ee: 'cb7' },
    { id: 'troponin', type: 'check', label: '0- or 2-hour troponin above the 99th percentile upper reference limit', ee: 'cb8' }
  ],
  footnote: 'Known CAD or 3 or more risk factors adds 4 points for patients aged 18 to 50 only.',
  compute(a) {
    const s = 2 * (a.age + 1) + 6 * a.male + (a.age < 2 && a.risk ? 4 : 0) + 3 * a.diaphoresis + 5 * a.radiates - 4 * a.inspiration - 6 * a.palpation;
    const low = s < 16 && !a.ecg && !a.troponin;
    return { score: { value: s, label: 'EDACS score' }, level: low ? 1 : 3, headline: low ? 'Low risk' : 'Not low risk',
      lines: [`Given an 11% prior probability, this patient has a ${low ? '1%' : '24%'} likelihood of a major adverse cardiac event in the next 30 days ${MACE}.`],
      note: 'Low risk: EDACS score below 16, with no new ischemia on ECG and normal 0- and 2-hour troponins.' };
  }
};
