// Michigan Neuropathy Screening Instrument, examination (validation: Moghtaderi 2006; EE+ 394).
module.exports = {
  id: 'mnsi',
  eeId: 394,
  title: 'Michigan Neuropathy Screening Instrument',
  subtitle: 'Screening examination for diabetic peripheral neuropathy',
  question: 'For a patient with diabetes, does the foot examination suggest peripheral neuropathy?',
  inputs: [
    { id: 'reflexes', type: 'choice', label: 'Ankle reflexes', ee: 'CMB_Reflexes', options: [{ label: 'Present' }, { label: 'Present with reinforcement' }, { label: 'Absent' }] },
    { id: 'vibration', type: 'choice', label: 'Vibration perception at the great toe', ee: 'CMB_Vibration', options: [{ label: 'Present' }, { label: 'Reduced' }, { label: 'Absent' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'appearance', type: 'check', label: 'Abnormal appearance of the feet (deformity, dry skin, callus, infection or fissures)', ee: 'CHK_Appearance' },
    { id: 'ulcer', type: 'check', label: 'Ulceration', ee: 'CHK_Ulceration' }
  ],
  compute(a) {
    const s = a.appearance + a.ulcer + a.reflexes / 2 + a.vibration / 2;
    return s >= 2
      ? { score: { value: s, max: 4, label: 'MNSI exam score' }, level: 3, headline: 'Abnormal screening test for diabetic neuropathy', lines: ['A score of 2 or more is abnormal (LR+ 3.8; LR− 0.4 for a normal test).'] }
      : { score: { value: s, max: 4, label: 'MNSI exam score' }, level: 1, headline: 'Normal screening test for diabetic neuropathy', lines: ['A score of 2 or more is abnormal (LR+ 3.8; LR− 0.4 for a normal test).'] };
  }
};
