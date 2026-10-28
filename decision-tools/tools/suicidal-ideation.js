// Suicidal ideation from four symptoms in the past year (EE+ 136).
const OUT = [['24 of 4441 (0.5%)', '0.2'], ['30 of 998 (3.0%)', '1.2'], ['26 of 349 (7.4%)', '3.1'], ['44 of 188 (23%)', '12'], ['30 of 65 (46%)', '33']];

module.exports = {
  id: 'suicidal-ideation',
  eeId: 136,
  title: 'Suicidal ideation risk',
  subtitle: 'Suicidal ideation from depressive symptoms in the past year',
  question: 'For an adult, how likely is suicidal ideation in the past year?',
  inputs: [
    { type: 'heading', label: 'In the past year (check all that apply)' },
    { id: 'sleep', type: 'check', label: 'Sleep disturbance', ee: 'IDC_CHECKBOX_1', note: 'A period of 2 weeks or more with trouble falling asleep, staying asleep, waking too early, or sleeping too much.' },
    { id: 'mood', type: 'check', label: 'Mood disturbance', ee: 'IDC_CHECKBOX_2', note: '2 weeks or more of feeling sad, blue or depressed, or losing interest and pleasure in things usually enjoyed.' },
    { id: 'guilt', type: 'check', label: 'Guilt: 2 weeks or more of feeling worthless, sinful or guilty', ee: 'IDC_CHECKBOX_3' },
    { id: 'hopeless', type: 'check', label: 'Hopelessness: a time when life felt hopeless', ee: 'IDC_CHECKBOX_4' }
  ],
  compute(a) {
    const n = a.sleep + a.mood + a.guilt + a.hopeless, [p, lr] = OUT[n];
    return { score: { value: n, max: 4, label: 'Symptoms' }, level: [1, 2, 3, 4, 4][n], headline: `${p} with this score had suicidal ideation (LR ${lr})` };
  }
};
