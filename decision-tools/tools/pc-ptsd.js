// Primary Care PTSD screen (PC-PTSD, 4 items; Prins 2003; EE+ 382).
module.exports = {
  id: 'pc-ptsd',
  eeId: 382,
  title: 'Posttraumatic stress screening (PC-PTSD)',
  subtitle: 'Four-question PTSD screen in primary care',
  question: 'For an adult, does the PC-PTSD screen suggest posttraumatic stress disorder?',
  inputs: [
    { type: 'heading', label: 'In your life, have you ever had an experience so frightening, horrible or upsetting that, in the past month, you (check each yes):' },
    { id: 'nightmares', type: 'check', label: 'Have had nightmares about it or thought about it when you did not want to?', ee: 'CHK_Nightmares' },
    { id: 'avoid', type: 'check', label: 'Tried hard not to think about it, or went out of your way to avoid situations that reminded you of it?', ee: 'CHK_NoThink' },
    { id: 'guard', type: 'check', label: 'Were constantly on guard, watchful or easily startled?', ee: 'CHK_OnGuard' },
    { id: 'numb', type: 'check', label: 'Felt numb or detached from others, activities or your surroundings?', ee: 'CHK_Numb' }
  ],
  compute(a) {
    const n = a.nightmares + a.avoid + a.guard + a.numb;
    return n >= 3 ? { score: { value: n, max: 4, label: 'Yes answers' }, level: 3, headline: 'Positive screening test for PTSD' } : { score: { value: n, max: 4, label: 'Yes answers' }, level: 1, headline: 'Negative screening test for PTSD' };
  }
};
