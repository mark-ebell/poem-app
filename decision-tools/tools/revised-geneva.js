// Revised Geneva score for pulmonary embolism (Le Gal; EE+ 333).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'revised-geneva',
  eeId: 333,
  title: 'Revised Geneva score for PE',
  subtitle: 'Probability of pulmonary embolism in the emergency department',
  question: 'For a patient with suspected pulmonary embolism, how likely is PE?',
  inputs: [
    { id: 'hr', type: 'choice', label: 'Heart rate (beats/min)', ee: 'COMBO_HeartRate', options: [{ label: 'Below 75', points: 0 }, { label: '75 to 94', points: 3 }, { label: '95 or higher', points: 5 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age over 65', points: 1, ee: 'CHK_Age' },
    { id: 'previous', type: 'check', label: 'Previous DVT or PE', points: 3, ee: 'CHK_Previous' },
    { id: 'surgery', type: 'check', label: 'Surgery (under general anesthesia) or lower-limb fracture in the past month', points: 2, ee: 'CHK_Surgery' },
    { id: 'cancer', type: 'check', label: 'Active malignant condition (solid or hematologic, active or considered cured less than 1 year)', points: 2, ee: 'CHK_Acute' },
    { id: 'legPain', type: 'check', label: 'Unilateral lower-limb pain', points: 3, ee: 'CHK_LowerLimb' },
    { id: 'hemoptysis', type: 'check', label: 'Hemoptysis', points: 2, ee: 'CHK_Hemoptysis' },
    { id: 'palpation', type: 'check', label: 'Pain on lower-limb deep vein palpation and unilateral edema', points: 4, ee: 'CHK_Pain' }
  ],
  points: { label: 'Revised Geneva score', max: 22 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 4 ? { level: 1, headline: 'Low risk of PE', lines: ['18 of 229 (8%, 95% CI 5% to 12%) had PE.'] }
      : s < 11 ? { level: 2, headline: 'Moderate risk of PE', lines: ['132 of 463 (28%, 95% CI 25% to 33%) had PE.'] }
      : { level: 4, headline: 'High risk of PE', lines: ['42 of 57 (74%, 95% CI 61% to 83%) had PE.'] };
  }
};
