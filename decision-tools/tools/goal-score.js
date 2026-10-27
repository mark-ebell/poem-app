// GOAL score: screen for an abnormal Mini-Mental State Exam (EE+ 353).
const Q = ['Can you tell me your birth date?', 'And how old does that make you?', "Can you tell me today's date?", 'Do you know what day of the week it is?', "Can you tell me what month we're in?",
  'Can you give me the current year?', 'Do you know where you are (names the hospital if hospitalized)?', 'Please tell me your address, or where you live.', 'Who is the current president (or prime minister or chancellor)?', 'Who is the vice president (or reigning monarch)?'];

module.exports = {
  id: 'goal-score',
  eeId: 353,
  title: 'Mental status screen (GOAL score)',
  subtitle: 'Brief screen for an abnormal Mini-Mental State Exam',
  question: 'For an older patient, does a brief orientation screen suggest an abnormal Mini-Mental State Exam?',
  inputs: [
    { type: 'heading', label: 'Check each correct response' },
    ...Q.map((label, k) => ({ id: `q${k + 1}`, type: 'check', label, ee: `chk${k + 1}` }))
  ],
  compute(a) {
    const n = Q.reduce((t, _, k) => t + a[`q${k + 1}`], 0);
    return { score: { value: n, max: 10, label: 'GOAL score' }, level: n <= 7 ? 3 : n === 8 ? 2 : 1,
      headline: n <= 7 ? 'High risk for an abnormal Mini-Mental State' : n === 8 ? 'Unclear risk for an abnormal Mini-Mental State' : 'Low risk for an abnormal Mini-Mental State' };
  }
};
