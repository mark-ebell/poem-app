// 1-year mortality after acute ischemic stroke (Wang 2003; EE+ 332).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'wang-1yr',
  eeId: 332,
  title: 'Stroke 1-year mortality (Wang)',
  subtitle: 'Death within 1 year of acute stroke',
  question: 'For a patient admitted with acute stroke, what is the risk of death within 1 year?',
  inputs: [
    { type: 'text', text: 'Use admission or earliest values.' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'incontinence', type: 'check', label: 'Urinary incontinence', points: 9, ee: 'CHK_Incontinence' },
    { id: 'dysphagia', type: 'check', label: 'Moderate or severe dysphagia', points: 7, ee: 'CHK_Dysphagia' },
    { id: 'bilateral', type: 'check', label: 'Both sides affected', points: 4, ee: 'CHK_BothSides' },
    { id: 'temp', type: 'check', label: 'Temperature above 37.5°C (99.5°F)', points: 4, ee: 'CHK_Temp' },
    { id: 'unconscious', type: 'check', label: 'Unconscious (no eye opening to voice)', points: 3, ee: 'CHK_Unconscious' },
    { id: 'ihd', type: 'check', label: 'History of ischemic heart disease', points: 3, ee: 'CHK_HD' },
    { id: 'pvd', type: 'check', label: 'History of peripheral vascular disease', points: 3, ee: 'CHK_VD' },
    { id: 'dm', type: 'check', label: 'Diabetes', points: 2, ee: 'CHK_Diabetes' }
  ],
  points: { label: 'Score', max: 35 },
  compute(a) {
    return pointsOf(tool, a) >= 10 ? { level: 4, headline: 'High risk: 60% 1-year mortality' } : { level: 1, headline: 'Low risk: 11% 1-year mortality' };
  }
};
