// Edinburgh Postnatal Depression Scale (Cox 1987; EE+ 362).
const { pointsOf } = require('../lib');
const fwd = (id, label, ee, labels) => ({ id, type: 'choice', label, ee, options: labels.map((l, k) => ({ label: l, points: k })) });
const rev = (id, label, ee, labels) => ({ id, type: 'choice', label, ee, default: 3, options: labels.map((l, k) => ({ label: l, points: 3 - k })) });

const tool = module.exports = {
  id: 'epds',
  eeId: 362,
  title: 'Edinburgh Postnatal Depression Scale (EPDS)',
  subtitle: 'Screening for postpartum depression',
  question: 'Does this woman screen positive for postpartum depression?',
  inputs: [
    { type: 'text', text: 'How have you felt over the last 7 days?' },
    fwd('laugh', '1. I have been able to laugh and see the funny side of things', 'CMB_Laugh', ['As much as I always could', 'Not quite so much now', 'Definitely not so much now', 'Not at all']),
    fwd('enjoy', '2. I have looked forward with enjoyment to things', 'CMB_LookForward', ['As much as I ever did', 'Rather less than I used to', 'Definitely less than I used to', 'Hardly at all']),
    rev('blame', '3. I have blamed myself unnecessarily when things went wrong', 'CMB_Blame', ['Yes, most of the time', 'Yes, some of the time', 'Not very often', 'No, never']),
    fwd('anxious', '4. I have been anxious or worried for no good reason', 'CMB_Anxious', ['No, not at all', 'Hardly ever', 'Yes, sometimes', 'Yes, very often']),
    rev('scared', '5. I have felt scared or panicky for no very good reason', 'CMB_Scared', ['Yes, quite a lot', 'Yes, sometimes', 'No, not much', 'No, not at all']),
    rev('top', '6. Things have been getting on top of me', 'CMB_OnTop', ["Yes, most of the time I haven't been able to cope", "Yes, sometimes I haven't been coping as well as usual", 'No, most of the time I have coped quite well', 'No, I have been coping as well as ever']),
    rev('sleep', '7. I have been so unhappy that I have had difficulty sleeping', 'CMB_Sleeping', ['Yes, most of the time', 'Yes, sometimes', 'Not very often', 'No, not at all']),
    rev('sad', '8. I have felt sad or miserable', 'CMB_Sad', ['Yes, most of the time', 'Yes, quite often', 'Not very often', 'No, not at all']),
    rev('crying', '9. I have been so unhappy that I have been crying', 'CMB_Crying', ['Yes, most of the time', 'Yes, quite often', 'Only occasionally', 'No, never']),
    rev('harm', '10. The thought of harming myself has occurred to me', 'CMB_Harm', ['Yes, quite often', 'Sometimes', 'Hardly ever', 'Never'])
  ],
  points: { label: 'EPDS score', max: 30 },
  compute(a) {
    const s = pointsOf(tool, a);
    const out = s >= 12 ? { level: 3, headline: 'Positive screen for postpartum depression', lines: ['64% with a score of 12 or more had depression.'] }
      : { level: 1, headline: 'Negative screen for postpartum depression', lines: ['4% with a score below 12 had depression.'] };
    if (a.harm !== 3) out.lines.push('Any answer other than "Never" to question 10 (thoughts of self-harm) needs prompt assessment.');
    return out;
  },
  evidence: { reference: 'Cox JL, Holden JM, Sagovsky R. Detection of postnatal depression: development of the 10-item Edinburgh Postnatal Depression Scale. Br J Psychiatry. 1987;150:782-786.' }
};
