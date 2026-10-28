// Primary Care PTSD Screen for DSM-5 (PC-PTSD-5; Prins 2016). Replaces the 4-item PC-PTSD
// (Prins 2003; EE+ 382) at Mark Ebell's request (2026-10-27).
module.exports = {
  id: 'pc-ptsd5',
  eeId: 382,
  title: 'Posttraumatic stress screening (PC-PTSD-5)',
  subtitle: 'Five-question PTSD screen in primary care (DSM-5)',
  question: 'For an adult, does the PC-PTSD-5 screen suggest posttraumatic stress disorder?',
  inputs: [
    { id: 'event', type: 'choice', label: 'Sometimes things happen to people that are unusually or especially frightening, horrible or traumatic (for example a serious accident or fire, a physical or sexual assault or abuse, an earthquake or flood, a war, seeing someone be killed or seriously injured, or having a loved one die through homicide or suicide). Have you ever experienced this kind of event?',
      options: [{ label: 'No' }, { label: 'Yes' }] },
    { type: 'heading', id: 'itemsHead', label: 'In the past month, have you (check each yes):', when: a => a.event === 1 },
    { id: 'nightmares', type: 'check', label: 'Had nightmares about the event(s) or thought about the event(s) when you did not want to?', when: a => a.event === 1 },
    { id: 'avoid', type: 'check', label: 'Tried hard not to think about the event(s) or went out of your way to avoid situations that reminded you of the event(s)?', when: a => a.event === 1 },
    { id: 'guard', type: 'check', label: 'Been constantly on guard, watchful or easily startled?', when: a => a.event === 1 },
    { id: 'numb', type: 'check', label: 'Felt numb or detached from people, activities or your surroundings?', when: a => a.event === 1 },
    { id: 'guilt', type: 'check', label: 'Felt guilty or unable to stop blaming yourself or others for the event(s) or any problems the event(s) may have caused?', when: a => a.event === 1 }
  ],
  compute(a) {
    const n = a.event === 1 ? a.nightmares + a.avoid + a.guard + a.numb + a.guilt : 0;
    const score = { value: n, max: 5, label: 'Yes answers' };
    if (a.event !== 1) return { score, level: 1, headline: 'Negative screening test for PTSD (no traumatic event)' };
    return n >= 3 ? { score, level: 3, headline: 'Positive screening test for PTSD' }
      : { score, level: 1, headline: 'Negative screening test for PTSD' };
  },
  footnote: 'A score of 3 or more is positive (the cut-off that was optimally sensitive in the development study).',
  evidence: {
    reference: 'Prins A, Bovin MJ, Smolenski DJ, et al. The Primary Care PTSD Screen for DSM-5 (PC-PTSD-5): development and evaluation within a veteran primary care sample. J Gen Intern Med. 2016;31(10):1206-1211.',
    pmid: '27170304',
    population: '398 US veterans in VA primary care (41% response rate).',
    validation: 'Compared with a structured diagnostic interview; area under the ROC curve 0.94. A cut-off of 3 maximized sensitivity, 4 overall efficiency and 5 specificity.',
    prevalence: null, developed: null, validated: null,
    comment: 'Replaces the 4-item PC-PTSD (2003) used on EE+, which predates DSM-5.'
  }
};
