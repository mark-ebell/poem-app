// 30-day mortality after colorectal cancer surgery in patients over 80 (EE+ 418).
const BANDS = [[2, '5.9'], [5, '7.8'], [8, '10.3'], [11, '13.4'], [14, '17.2'], [17, '21.9'], [20, '27.5'], [23, '33.9'], [26, '40.9'], [29, '48.3'], [32, '55.7'], [35, '63.0'], [38, '69.7'], [41, '75.6'], [44, '80.7'], [Infinity, '85.0']];
const { pointsOf } = require('../lib');
const opts = list => list.map(([label, points]) => ({ label, points }));

const tool = module.exports = {
  id: 'crc-surgery-elderly',
  eeId: 418,
  title: 'Colorectal cancer surgery after age 80: 30-day mortality',
  subtitle: 'Postoperative mortality in patients over 80',
  question: 'For a patient over 80 having surgery for colorectal cancer, what is the 30-day mortality?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'CMB_Age', options: opts([['80 to 84', 0], ['85 to 89', 1], ['90 to 94', 6], ['95 or older', 11]]) },
    { id: 'asa', type: 'choice', label: 'ASA grade', ee: 'CMB_ASAGrade', options: opts([['I to II', 0], ['III', 10], ['IV to V', 18]]) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'mets', type: 'check', label: 'Metastases', points: 6, ee: 'CHK_Meta' },
    { id: 'emergency', type: 'check', label: 'Emergency surgery', points: 7, ee: 'CHK_Surg' },
    { id: 'noResection', type: 'check', label: 'No tumor resection', points: 1, ee: 'CHK_Tumor' },
    { id: 'obstruction', type: 'check', label: 'Large bowel obstruction', points: 1, ee: 'CHK_Bowel' }
  ],
  points: { label: 'Risk score' },
  compute(a) {
    const s = pointsOf(tool, a);
    return { headline: `30-day postoperative mortality: ${BANDS.find(([max]) => s < max)[1]}%` };
  }
};
