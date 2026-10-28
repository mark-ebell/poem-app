// Ask Suicide-Screening Questions (ASQ; Horowitz 2012; EE+ 634).
module.exports = {
  id: 'asq',
  eeId: 634,
  title: 'Suicide risk screen (ASQ)',
  subtitle: 'Ask Suicide-Screening Questions',
  question: 'For a young person in the ED, does the ASQ suggest suicide risk?',
  inputs: [
    { type: 'heading', label: 'Check each yes answer' },
    { id: 'dead', type: 'check', label: 'In the past few weeks, have you wished you were dead?', ee: 'cb1' },
    { id: 'better', type: 'check', label: 'In the past few weeks, have you felt that you or your family would be better off if you were dead?', ee: 'cb2' },
    { id: 'thoughts', type: 'check', label: 'In the past week, have you been having thoughts about killing yourself?', ee: 'cb3' },
    { id: 'attempt', type: 'check', label: 'Have you ever tried to kill yourself?', ee: 'cb4' }
  ],
  footnote: 'Validated in young people in the ED, 40% of whom had a psychiatric chief complaint.',
  compute(a) {
    return a.dead || a.better || a.thoughts || a.attempt ? { level: 4, headline: 'Positive screen for suicide risk' } : { level: 1, headline: 'Negative screen for suicide risk' };
  }
};
