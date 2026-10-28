// Independent walking 1 year after traumatic spinal cord injury (van Middendorp 2011; EE+ 431).
const grades = (n) => Array.from({ length: n + 1 }, (_, k) => ({ label: String(k) }));
module.exports = {
  id: 'spinal-cord-walking',
  eeId: 431,
  title: 'Spinal cord injury prognosis',
  subtitle: 'Independent walking 1 year after traumatic spinal cord injury',
  question: 'For an adult with acute traumatic spinal cord injury, what is the probability of walking independently at 1 year?',
  inputs: [
    { id: 'age65', type: 'check', label: 'Age 65 years or older', ee: 'AGE65' },
    { id: 'motorL3', type: 'choice', label: 'Motor score for quadriceps femoris (L3)', ee: 'MotorL3', options: grades(5) },
    { id: 'motorS1', type: 'choice', label: 'Motor score for gastrocsoleus (S1)', ee: 'MotorS1', options: grades(5) },
    { id: 'touchL3', type: 'choice', label: 'Light touch score at L3', ee: 'TouchL3', options: grades(2) },
    { id: 'touchS1', type: 'choice', label: 'Light touch score at S1', ee: 'TouchS1', options: grades(2) }
  ],
  compute(a) {
    const s = (a.age65 ? -10 : 0) + 2 * a.motorL3 + 2 * a.motorS1 + 5 * a.touchL3 + 5 * a.touchS1;
    const p = 100 / (1 + Math.exp(-(-3.273 + 0.267 * s)));
    return { score: { value: s, label: 'Score' }, level: p >= 70 ? 1 : p >= 40 ? 2 : p >= 10 ? 3 : 4, headline: `Probability of walking independently at 1 year ${Math.round(p * 10) / 10}%` };
  }
};
