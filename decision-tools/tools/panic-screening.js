// Panic Screening Score for unexplained chest pain (Foldes-Busque; EE+ 449).
const OFTEN = ['Never', 'Rarely', 'About half the time', 'Usually', 'Always'];
const AMOUNT = ['Very little', 'A little', 'Some', 'Much', 'Very much'];

module.exports = {
  id: 'panic-screening',
  eeId: 449,
  title: 'Panic disorder in chest pain (Panic Screening Score)',
  subtitle: 'Panic disorder in low-risk, unexplained chest pain',
  question: 'In a patient with unexplained, low-risk chest pain, how likely is panic disorder?',
  inputs: [
    { id: 'choke', type: 'choice', label: 'How often does the thought "I will choke to death" occur when the patient is nervous?', ee: 'CHOKE',
      options: OFTEN.map((label, k) => ({ label, points: 2 * k })) },
    { id: 'heart', type: 'choice', label: '"When I notice my heart beating rapidly, I worry that I might be having a heart attack":', ee: 'HEART_ATTACK',
      options: AMOUNT.map((label, k) => ({ label, points: k })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'anxiety', type: 'check', label: 'History of anxiety disorders', points: 7, ee: 'HISTORY' },
    { id: 'ambulance', type: 'check', label: 'Arrived in the ED by ambulance', points: 3, ee: 'ED' }
  ],
  points: { label: 'Panic Screening Score', max: 22 },
  compute(a) {
    const s = 7 * a.anxiety + 3 * a.ambulance + 2 * a.choke + a.heart;
    return s >= 6 ? { level: 3, headline: 'Probable panic disorder (72%)' } : { level: 1, headline: 'Panic disorder unlikely (29%)' };
  }
};
