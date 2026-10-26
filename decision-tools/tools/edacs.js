// EDACS score and 2-hour accelerated diagnostic protocol (Than 2014; EE+ 538).
const AGES = ['18 to 45', '46 to 50', '51 to 55', '56 to 60', '61 to 65', '66 to 70', '71 to 75', '76 to 80', '81 to 85', '86 or older'];

module.exports = {
  id: 'edacs',
  eeId: 538,
  title: 'EDACS score and 2-hour protocol',
  subtitle: 'Emergency Department Assessment of Chest Pain Score',
  question: 'For a patient in the ED with at least 5 minutes of symptoms possibly due to acute coronary syndrome, is the patient at low risk?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age (years)', ee: 'AGE', options: AGES.map((label, k) => ({ label, points: 2 * (k + 1) })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male sex', points: 6, ee: 'MALE' },
    { id: 'cad', type: 'check', label: 'Known coronary artery disease', ee: 'ARTERY' },
    { id: 'rf', type: 'check', label: '3 or more coronary risk factors (family history of premature CAD, dyslipidemia, diabetes, hypertension, current smoker)', ee: 'CORONARY' },
    { type: 'heading', label: 'Signs and symptoms' },
    { id: 'diaphoresis', type: 'check', label: 'Diaphoresis', points: 3, ee: 'DIAP' },
    { id: 'radiates', type: 'check', label: 'Pain radiates to the arm or shoulder', points: 5, ee: 'PAIN' },
    { id: 'inspiration', type: 'check', label: 'Pain occurred or worsened with inspiration', points: -4, ee: 'INSPIRATION' },
    { id: 'palpation', type: 'check', label: 'Pain is reproduced by palpation', points: -6, ee: 'PALPATION' },
    { type: 'heading', label: 'Tests' },
    { id: 'ecg', type: 'check', label: 'New ischemia on ECG', ee: 'ECG' },
    { id: 'troponin', type: 'check', label: 'Elevated 0- or 2-hour troponin', ee: 'TROPONIN' }
  ],
  footnote: 'Known CAD or 3 or more risk factors adds 4 points (once) for patients aged 18 to 50 only.',
  compute(a) {
    const s = 2 * (a.age + 1) + 6 * a.male + (a.age < 2 && (a.cad || a.rf) ? 4 : 0) + 3 * a.diaphoresis + 5 * a.radiates - 4 * a.inspiration - 6 * a.palpation;
    const low = s < 16 && !a.ecg && !a.troponin;
    return { score: { value: s, label: 'EDACS score' }, level: low ? 1 : 3,
      headline: low ? 'Low risk' : 'High risk',
      lines: [low ? 'Patient safe for discharge to early outpatient follow-up investigation (or proceed to earlier inpatient testing).'
        : 'Proceed with usual care with further observation and delayed troponin.'],
      note: 'Low risk: EDACS score below 16, with no new ischemia on ECG and normal 0- and 2-hour troponins.' };
  }
};
