// Pediatric Appendicitis Score (Samuel 2002; validated by Goldman 2008; EE+ 428).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'pediatric-appendicitis-score',
  eeId: 428,
  title: 'Pediatric appendicitis score',
  subtitle: 'Appendicitis in children with abdominal pain',
  question: 'For a child with abdominal pain, what is the risk of appendicitis?',
  inputs: [
    { id: 'cough', type: 'check', label: 'Cough, percussion or hop tenderness', points: 2, ee: 'CHK_Cough' },
    { id: 'anorexia', type: 'check', label: 'Anorexia', points: 1, ee: 'CHK_Anorexia' },
    { id: 'fever', type: 'check', label: 'Fever (over 38 °C oral or rectal)', points: 1, ee: 'CHK_Fever' },
    { id: 'nausea', type: 'check', label: 'Nausea or emesis', points: 1, ee: 'CHK_Nausea' },
    { id: 'rlq', type: 'check', label: 'Tenderness in the right lower quadrant', points: 2, ee: 'CHK_Tenderness' },
    { id: 'wbc', type: 'check', label: 'Leukocytosis over 10,000', points: 1, ee: 'CHK_Leukocytosis' },
    { id: 'pmn', type: 'check', label: 'Polymorphonuclear neutrophilia over 7500', points: 1, ee: 'CHK_PN' },
    { id: 'migration', type: 'check', label: 'Migration of pain', points: 1, ee: 'CHK_Pain' }
  ],
  points: { label: 'Pediatric appendicitis score', max: 10 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 3 ? { level: 1, headline: 'Low risk (2.4%) of appendicitis' } : s < 7 ? { level: 2, headline: 'Moderate risk of appendicitis', lines: ['Consider admission for monitoring or imaging.'] } : { level: 4, headline: 'High risk (96%) of appendicitis', lines: ['Consider surgery.'] };
  }
};
