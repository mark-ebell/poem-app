// Postoperative respiratory failure index in men (Arozullah 2000; EE+ 404).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'postop-resp-failure',
  eeId: 404,
  title: 'Post-op need for mechanical ventilation',
  subtitle: 'Respiratory failure after major noncardiac surgery in men',
  question: 'For a man undergoing noncardiac surgery, what is the probability of postoperative respiratory failure?',
  inputs: [
    { id: 'surgery', type: 'choice', label: 'Type of surgery', ee: 'CMB_TypeSurgery', default: 3, options: [['Abdominal aortic aneurysm', 27], ['Thoracic', 21], ['Neurosurgery', 14], ['Upper abdominal or peripheral vascular', 14], ['Neck', 11], ['Other', 0]].map(([label, points]) => ({ label, points })) },
    { id: 'age', type: 'choice', label: 'Age', ee: 'CMB_Age', options: [{ label: 'Under 60 years', points: 0 }, { label: '60 to 69 years', points: 4 }, { label: '70 years or older', points: 6 }] },
    { id: 'emergency', type: 'check', label: 'Emergency surgery', points: 11, ee: 'CHK_Surgery' },
    { id: 'albumin', type: 'check', label: 'Albumin under 30 g/L', points: 9, ee: 'CHK_Albumin' },
    { id: 'bun', type: 'check', label: 'BUN over 30 mg/dL (10.7 mmol/L)', points: 8, ee: 'CHK_BUN' },
    { id: 'dependent', type: 'check', label: 'Partially or fully dependent functional status', points: 7, ee: 'CHK_Dependent' },
    { id: 'copd', type: 'check', label: 'History of COPD', points: 6, ee: 'CHK_COPD' }
  ],
  points: { label: 'Points' },
  compute(a) {
    const s = pointsOf(tool, a);
    const [p, level] = s < 11 ? ['0.5', 1] : s < 20 ? ['1.8', 1] : s < 28 ? ['4.2', 2] : s < 41 ? ['10.1', 3] : ['26.6', 4];
    return { level, headline: `${p}% probability of postoperative respiratory failure (ventilation over 48 hours)` };
  }
};
