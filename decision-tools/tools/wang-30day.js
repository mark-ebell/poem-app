// 30-day mortality after stroke (Wang 2001; EE+ 154).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'wang-30day',
  eeId: 154,
  title: 'Stroke 30-day mortality (Wang)',
  subtitle: 'Death within 30 days of admission for acute stroke',
  question: 'For a patient admitted with acute stroke (assessed within 24 hours), what is the risk of death within 30 days?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'consciousness', type: 'check', label: 'Impaired consciousness', points: 5, ee: 'IMPARIED' },
    { id: 'incontinence', type: 'check', label: 'Urinary incontinence', points: 4, ee: 'URINARY' },
    { id: 'dysphagia', type: 'check', label: 'Dysphagia', points: 3, ee: 'DYSPHAGIA' },
    { id: 'temp', type: 'check', label: 'Temperature on admission above 36.5°C (97.7°F)', points: 2, ee: 'TEMP' },
    { id: 'glucose', type: 'check', label: 'Hyperglycemia without known diabetes', points: 2, ee: 'HYPER' }
  ],
  points: { label: 'Score', max: 16 },
  compute(a) {
    return pointsOf(tool, a) >= 11 ? { level: 4, headline: 'High risk: 75% 30-day mortality' } : { level: 1, headline: 'Low risk: 3% 30-day mortality' };
  }
};
