// HOSPITAL score: potentially avoidable 30-day readmission (Donzé 2013; EE+ 535).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'hospital-score',
  eeId: 535,
  title: 'HOSPITAL score (avoidable readmission)',
  subtitle: 'Potentially avoidable readmission within 30 days',
  question: 'For a medical patient being discharged, what is the risk of a potentially avoidable readmission within 30 days?',
  inputs: [
    { id: 'admissions', type: 'choice', label: 'Hospital admissions in the previous year', ee: 'admissions', options: [{ label: '0 to 1', points: 0 }, { label: '2 to 5', points: 2 }, { label: 'More than 5', points: 5 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'hb', type: 'check', label: 'Hemoglobin at discharge under 12 g/dL', points: 1, ee: 'hemoglobin' },
    { id: 'onc', type: 'check', label: 'Discharged from an oncology service', points: 2, ee: 'Oncology' },
    { id: 'na', type: 'check', label: 'Sodium at discharge under 135 mEq/L', points: 1, ee: 'sodium' },
    { id: 'procedure', type: 'check', label: 'Procedure during the stay (any coded procedure)', points: 1, ee: 'hospital' },
    { id: 'urgent', type: 'check', label: 'Urgent or emergent (non-elective) admission', points: 1, ee: 'emergent' },
    { id: 'los', type: 'check', label: 'Length of stay 5 days or more', points: 2, ee: 'Length' }
  ],
  points: { label: 'HOSPITAL score', max: 13 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 4 ? { level: 1, headline: 'Low risk: 5.8% potentially avoidable readmission' } : s <= 6 ? { level: 2, headline: 'Intermediate risk: 11.9% potentially avoidable readmission' }
      : { level: 3, headline: 'High risk: 22.8% potentially avoidable readmission' };
  }
};
