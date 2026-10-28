// Eating disorder in women who diet (EE+ 321).
const P = ['1.5% (22 of 1479)', '2.6% (18 of 686)', '5.3% (19 of 357)', '10.1% (22 of 217)', '12.1% (15 of 123)', '14.5% (8 of 55)'];

module.exports = {
  id: 'eating-disorder',
  eeId: 321,
  title: 'Eating disorder likelihood',
  subtitle: 'Eating disorder in women who diet',
  question: 'For a woman who diets (whether or not she succeeds), how likely is an eating disorder?',
  inputs: [
    { type: 'heading', label: 'To influence your shape or weight, have you (check each yes):' },
    { id: 'limit', type: 'check', label: 'Deliberately tried to limit the amount of food you eat?', ee: 'CHK_Limit' },
    { id: 'fasting', type: 'check', label: 'Gone for long periods (8 waking hours or more) without eating anything at all?', ee: 'CHK_LongPeriods' },
    { id: 'exclude', type: 'check', label: 'Tried to exclude foods that you like from your diet?', ee: 'CHK_Exclude' },
    { id: 'rules', type: 'check', label: 'Tried to follow definite rules about your eating (for example, a calorie limit)?', ee: 'CHK_Rules' },
    { id: 'empty', type: 'check', label: 'Had a definite desire to have an empty stomach?', ee: 'CHK_Empty' }
  ],
  compute(a) {
    const n = a.limit + a.fasting + a.exclude + a.rules + a.empty;
    return { score: { value: n, max: 5, label: 'Yes answers' }, level: [1, 1, 2, 3, 3, 3][n], headline: `${P[n]} had an eating disorder` };
  }
};
