// TWIST score for testicular torsion (Barbosa 2013; EE+ 482).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'twist',
  eeId: 482,
  title: 'Testicular torsion diagnosis (TWIST score)',
  subtitle: 'Testicular torsion in children with acute scrotum',
  question: 'For a boy aged 3 months to 18 years with an acute scrotum, what is the risk of testicular torsion?',
  inputs: [
    { id: 'swelling', type: 'check', label: 'Testicular swelling', points: 2, ee: 'SWELLING' },
    { id: 'hard', type: 'check', label: 'Hard testis on palpation', points: 2, ee: 'HARD' },
    { id: 'nausea', type: 'check', label: 'Nausea or vomiting', points: 1, ee: 'NAUSEA' },
    { id: 'high', type: 'check', label: 'High-riding testis', points: 1, ee: 'HIGH' },
    { id: 'cremasteric', type: 'check', label: 'Absent cremasteric reflex', points: 1, ee: 'ABSENT' }
  ],
  points: { label: 'TWIST score', max: 7 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 3 ? { level: 1, headline: 'Low risk: 0/234 patients had torsion' } : s < 6 ? { level: 2, headline: 'Moderate risk: 12/65 patients had torsion' } : { level: 4, headline: 'High risk: 39/39 patients had torsion' };
  }
};
