// CHA2DS2-VASc: stroke risk in atrial fibrillation (Lip; EE+ 423).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'cha2ds2-vasc',
  eeId: 423,
  title: 'CHA2DS2-VASc score',
  subtitle: 'Stroke risk in atrial fibrillation',
  question: 'For an adult with atrial fibrillation, what is the risk of stroke?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: ['CHK_Age2', 'CHK_Age'], options: [{ label: 'Under 65', points: 0 }, { label: '65 to 74', points: 1 }, { label: '75 or older', points: 2 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'chf', type: 'check', label: 'Heart failure or LV dysfunction', points: 1, ee: 'CHK_CHF' },
    { id: 'htn', type: 'check', label: 'Hypertension', points: 1, ee: 'CHK_Hypertension' },
    { id: 'dm', type: 'check', label: 'Diabetes mellitus', points: 1, ee: 'CHK_DM' },
    { id: 'stroke', type: 'check', label: 'Prior stroke, TIA or thromboembolism', points: 2, ee: 'CHK_Stroke' },
    { id: 'vascular', type: 'check', label: 'Vascular disease (prior MI, peripheral artery disease, or aortic plaque)', points: 1, ee: 'CHK_Vascular' },
    { id: 'female', type: 'check', label: 'Female', points: 1, ee: 'CHK_Female' }
  ],
  points: { label: 'CHA2DS2-VASc', max: 9 },
  compute(a) {
    return pointsOf(tool, a) < 2
      ? { level: 1, headline: 'Low risk', lines: ['Consider no treatment or aspirin.'] }
      : { level: 3, headline: 'High risk', lines: ['Recommend anticoagulation.'] };
  }
};
