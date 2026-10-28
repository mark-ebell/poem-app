// Ottawa COPD Risk Scale (Stiell 2018; EE+ 579). EE+ gave no result for scores of 15 or 16.
const { pointsOf } = require('../lib');
const OUTCOME = 'with a short-term serious outcome (death within 30 days, or admission to telemetry or ICU, MI, cardiac procedure, intubation, or return to the ED within 14 days)';
const tool = module.exports = {
  id: 'ottawa-copd',
  eeId: 579,
  title: 'COPD: risk of bad outcomes in the ED (Ottawa COPD Risk Scale)',
  subtitle: 'Short-term serious outcomes after an ED visit for COPD',
  question: 'For an adult with a COPD exacerbation in the emergency department, what is the risk of a short-term serious outcome?',
  inputs: [
    { id: 'cabg', type: 'check', label: 'History of coronary artery bypass graft', points: 1, ee: 'cb1' },
    { id: 'pvd', type: 'check', label: 'History of intervention for peripheral vascular disease', points: 1, ee: 'cb2' },
    { id: 'intub', type: 'check', label: 'History of intubation for respiratory distress', points: 2, ee: 'cb3' },
    { id: 'hr110', type: 'check', label: 'Heart rate over 110 on ED arrival', points: 2, ee: 'cb4' },
    { id: 'ecg', type: 'check', label: 'ECG has acute ischemic changes', points: 2, ee: 'cb5' },
    { id: 'cxr', type: 'check', label: 'Chest x-ray has any pulmonary congestion', points: 1, ee: 'cb6' },
    { id: 'hb', type: 'check', label: 'Hemoglobin under 100 g/L', points: 3, ee: 'cb7' },
    { id: 'urea', type: 'check', label: 'Urea over 12 mmol/L', points: 1, ee: 'cb8' },
    { id: 'co2', type: 'check', label: 'Serum CO₂ over 35 mmol/L', points: 1, ee: 'cb9' },
    { id: 'sat', type: 'check', label: 'SaO₂ under 90% on room air or usual oxygen, or heart rate over 120 beats/min', points: 2, ee: 'cb10' }
  ],
  points: { label: 'Points', max: 16 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s === 0 ? { level: 1, headline: `Low risk: 28/614 (4.6%) ${OUTCOME}` } : s <= 3 ? { level: 2, headline: `Moderate risk: 61/589 (10.4%) ${OUTCOME}` } : { level: 4, headline: `High risk: 46/212 (21.7%) ${OUTCOME}` };
  }
};
