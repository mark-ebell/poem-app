// Dutch primary care rule for DVT (Oudega; van der Velde validation; EE+ 440).
module.exports = {
  id: 'dutch-dvt',
  eeId: 440,
  title: 'DVT in primary care (Dutch rule)',
  subtitle: 'Ruling out deep vein thrombosis in primary care',
  question: 'For a primary care patient with suspected DVT, can DVT be ruled out?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male sex', points: 1, ee: 'MALE' },
    { id: 'ocp', type: 'check', label: 'Oral contraceptive use', points: 1, ee: 'CONTRACEPTIVE' },
    { id: 'cancer', type: 'check', label: 'Active malignancy (in the last 6 months)', points: 1, ee: 'MALIGNANCY' },
    { id: 'surgery', type: 'check', label: 'Major surgery (in the last 3 months)', points: 1, ee: 'SURGERY' },
    { id: 'noTrauma', type: 'check', label: 'No leg trauma', points: 1, ee: 'LEG' },
    { id: 'veins', type: 'check', label: 'Dilated collateral veins (not varicose)', points: 1, ee: 'VEINS' },
    { id: 'calf', type: 'check', label: 'Calf swelling of 3 cm or more', points: 2, ee: 'CALF' },
    { id: 'ddimer', type: 'check', label: 'Positive D-dimer', points: 6, ee: 'DDIMER' }
  ],
  points: { label: 'Score', max: 14 },
  compute(a) {
    const s = a.male + a.ocp + a.cancer + a.surgery + a.noTrauma + a.veins + 2 * a.calf + 6 * a.ddimer;
    return s <= 3
      ? { level: 1, headline: 'Low risk of VTE', lines: ['7 of 495 (1.4%, 95% CI 0.6% to 3.0%) had VTE at 3 months.'] }
      : { level: 3, headline: 'High risk of VTE', lines: ['129 of 507 (25.4%) had VTE at 3 months.'] };
  }
};
