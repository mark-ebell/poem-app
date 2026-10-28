// Three-question screen for panic disorder (EE+ 274).
module.exports = {
  id: 'panic-three-question',
  eeId: 274,
  title: 'Panic disorder (three questions)',
  subtitle: 'Three-question screen for panic disorder',
  question: 'For an adult, does a three-question screen suggest panic disorder?',
  inputs: [
    { type: 'heading', label: 'In the past 6 months, did you ever have a spell or an attack when (check each yes):' },
    { id: 'frightened', type: 'check', label: 'All of a sudden you felt frightened, anxious or very uneasy?', ee: 'IDC_CHECKBOX_1' },
    { id: 'heart', type: 'check', label: 'For no reason your heart suddenly began to race, you felt faint, or you could not catch your breath?', ee: 'IDC_CHECKBOX_2' },
    { id: 'notDanger', type: 'check', label: 'Did any of these spells or attacks ever happen when you were not in danger or not the center of attention?', ee: 'IDC_CHECKBOX_3', when: a => a.frightened || a.heart }
  ],
  footnote: 'Probabilities assume a 5% pretest likelihood of panic disorder.',
  compute(a) {
    return (a.frightened || a.heart) && a.notDanger ? { level: 3, headline: 'Positive screen: 10% probability of panic disorder' } : { level: 1, headline: 'Negative screen: under 1% probability of panic disorder' };
  }
};
