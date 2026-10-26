// Readmission risk score after major hepatectomy (Egger 2015; EE+ 522). EE+ gave the 12 transfusion points
// to patients who were not transfused; here they go to patients who were.
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'hepatectomy-readmission',
  eeId: 522,
  title: 'Readmission after hepatectomy (RRS)',
  subtitle: 'Readmission after major hepatectomy (3 or more segments)',
  question: 'For a patient after major hepatectomy, what is the risk of readmission?',
  inputs: [
    { id: 'ebl', type: 'choice', label: 'Estimated blood loss', ee: 'BLOODLOSS', options: [{ label: 'Under 500 mL', points: 0 }, { label: '500 to 1000 mL', points: 3 }, { label: 'Over 1000 mL', points: 6 }] },
    { id: 'complications', type: 'choice', label: 'Complications', ee: 'COMPLICATIONS', options: [{ label: 'None', points: 0 }, { label: 'Minor (Clavien-Dindo I or II)', points: 15 }, { label: 'Major (Clavien-Dindo III or higher)', points: 33 }],
      note: 'Minor: any deviation from the normal course, including transfusion or drug treatment. Major: needing surgical or endoscopic intervention, or life-threatening.' },
    { id: 'bili', type: 'choice', label: 'Peak postoperative bilirubin', ee: 'BILI', options: ['Under 2.0 mg/dL', '2.0 to 2.9', '3.0 to 3.9', '4.0 to 4.9', '5.0 to 5.9', '6.0 or more'].map((label, k) => ({ label, points: [0, 2, 3, 5, 6, 7][k] })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'pe', type: 'check', label: 'Postoperative pulmonary embolism', points: 26, ee: 'PE' },
    { id: 'ssi', type: 'check', label: 'Surgical infection (wound or intra-abdominal)', points: 17, ee: 'INFECTION' },
    { id: 'transfusion', type: 'check', label: 'Postoperative red cell transfusion', points: 12 }
  ],
  points: { label: 'Score' },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 21 ? { level: 1, headline: 'Low risk of readmission (4.4%)' } : s < 51 ? { level: 2, headline: 'Moderate risk of readmission (24.0%)' } : { level: 4, headline: 'High risk of readmission (50.9%)' };
  }
};
