// VTE-BLEED score: major bleeding during anticoagulation for VTE (Klok; EE+ 599).
const ITEMS = [['cancer', 'Active cancer (diagnosed within the last 6 months)', 2, 'cb1'], ['htn', 'Male with uncontrolled hypertension (systolic BP above 140 mm Hg)', 1, 'cb2'],
  ['anemia', 'Anemia (hemoglobin below 13 g/dL in men, 12 g/dL in women)', 1.5, 'cb3'], ['bleeding', 'History of clinically relevant bleeding, rectal bleeding, frequent nosebleeds, or hematuria', 1.5, 'cb4'],
  ['age', 'Age 60 or older', 1.5, 'cb5'], ['renal', 'Renal dysfunction (eGFR below 60 mL/min)', 1.5, 'cb6']];

module.exports = {
  id: 'vte-bleed',
  eeId: 599,
  title: 'VTE-BLEED score',
  subtitle: 'Major bleeding during anticoagulation for venous thromboembolism',
  question: 'For a patient anticoagulated for venous thromboembolism, what is the risk of major bleeding?',
  inputs: [{ type: 'heading', label: 'Check all that apply' }, ...ITEMS.map(([id, label, points, ee]) => ({ id, type: 'check', label, points, ee }))],
  points: { label: 'VTE-BLEED score', max: 9 },
  compute(a) {
    const s = ITEMS.reduce((n, [id, , p]) => n + (a[id] ? p : 0), 0);
    return s < 2
      ? { level: 1, headline: 'Low risk of major bleeding', lines: ['0.5% with warfarin or edoxaban.'] }
      : { level: 3, headline: 'Elevated risk of major bleeding', lines: ['2.4% with warfarin; 1.6% with edoxaban.'] };
  }
};
