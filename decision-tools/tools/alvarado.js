// Alvarado score for appendicitis (validation: Owen 1992; EE+ 364).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'alvarado',
  eeId: 364,
  title: 'Alvarado score (appendicitis)',
  subtitle: 'Appendicitis in patients with suspected appendicitis',
  question: 'For a patient with suspected appendicitis, how likely is appendicitis?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'tender', type: 'check', label: 'Right lower quadrant tenderness', points: 2, ee: 'CHK_Tender' },
    { id: 'wbc', type: 'check', label: 'Leukocytosis', points: 2, ee: 'CHK_Leukocytosis' },
    { id: 'migratory', type: 'check', label: 'Migration of pain to the right lower quadrant', points: 1, ee: 'CHK_Migratory' },
    { id: 'anorexia', type: 'check', label: 'Anorexia', points: 1, ee: 'CHK_Anorexia' },
    { id: 'nausea', type: 'check', label: 'Nausea or vomiting', points: 1, ee: 'CHK_Nausea' },
    { id: 'rebound', type: 'check', label: 'Rebound pain', points: 1, ee: 'CHK_Rebound' },
    { id: 'temp', type: 'check', label: 'Temperature above 37.3°C', points: 1, ee: 'CHK_Temp' },
    { id: 'shift', type: 'check', label: 'Left shift of neutrophils', points: 1, ee: 'CHK_Shift' }
  ],
  points: { label: 'Alvarado score', max: 10 },
  compute(a) {
    return pointsOf(tool, a) < 7 ? { level: 1, headline: 'Low risk: 9% appendicitis' } : { level: 4, headline: 'High risk: 87% appendicitis' };
  }
};
