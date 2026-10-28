// Mood Disorder Questionnaire for bipolar disorder (Hirschfeld 2000; EE+ 327).
const Q = [['hyper', "You felt so good or so hyper that other people thought you were not your normal self, or you were so hyper that you got into trouble?", 'CHK_Hyper'],
  ['irritable', 'You were so irritable that you shouted at people or started fights or arguments?', 'CHK_Irritable'], ['confident', 'You felt much more self-confident than usual?', 'CHK_MoreConfident'],
  ['sleep', "You got much less sleep than usual and found you didn't really miss it?", 'CHK_LessSleep'], ['talk', 'You were much more talkative or spoke much faster than usual?', 'CHK_Talk'],
  ['racing', "Thoughts raced through your head or you couldn't slow your mind down?", 'CHK_Mind'], ['distracted', 'You were so easily distracted that you had trouble concentrating or staying on track?', 'CHK_Distracted'],
  ['energy', 'You had much more energy than usual?', 'CHK_Energy'], ['active', 'You were much more active or did many more things than usual?', 'CHK_Active'],
  ['social', 'You were much more social or outgoing than usual (for example, telephoning friends in the middle of the night)?', 'CHK_Social'], ['sex', 'You were much more interested in sex than usual?', 'CHK_Sex'],
  ['unusual', 'You did things that were unusual for you, or that other people might have thought excessive, foolish or risky?', 'CHK_Unusual'], ['money', 'Spending money got you or your family into trouble?', 'CHK_Money']];

module.exports = {
  id: 'mdq',
  eeId: 327,
  title: 'Bipolar disorder (Mood Disorder Questionnaire)',
  subtitle: 'Screen for bipolar spectrum disorder',
  question: 'For an adult, does the Mood Disorder Questionnaire suggest bipolar disorder?',
  inputs: [
    { type: 'heading', label: 'Has there ever been a period when you were not your usual self and (check each yes):' },
    ...Q.map(([id, label, ee]) => ({ id, type: 'check', label, ee })),
    { type: 'heading', label: 'If more than one is checked' },
    { id: 'together', type: 'check', label: 'Have several of these ever happened during the same period?', ee: 'CHK_Several' },
    { id: 'problem', type: 'choice', label: 'How much of a problem did any of these cause you (work, family, money or legal trouble, arguments or fights)?', ee: 'COMBO_Severity',
      options: [{ label: 'No problem' }, { label: 'Minor problem' }, { label: 'Moderate problem' }, { label: 'Serious problem' }] }
  ],
  footnote: 'Positive with 7 or more yes answers, several at the same time, and a moderate or serious problem.',
  compute(a) {
    const n = Q.reduce((t, [id]) => t + a[id], 0);
    return n >= 7 && a.together && a.problem >= 2 ? { score: { value: n, max: 13, label: 'Yes answers' }, level: 3, headline: 'Positive screen for bipolar disorder' }
      : { score: { value: n, max: 13, label: 'Yes answers' }, level: 1, headline: 'Negative screen for bipolar disorder' };
  }
};
