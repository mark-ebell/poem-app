// 2018 Lake Louise Acute Mountain Sickness Score (Roach 2018; replaces the older 6-item version on EE+ 596
// at Mark Ebell's request, 2026-10-28).
const opts = labels => labels.map((label, points) => ({ label: `${points}: ${label}`, points }));
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'lake-louise',
  eeId: 596,
  title: 'Acute mountain sickness: Lake Louise Score (2018)',
  subtitle: '2018 Lake Louise acute mountain sickness score',
  question: 'After a recent gain in altitude, does the patient have acute mountain sickness, and how severe is it?',
  inputs: [
    { id: 'headache', type: 'choice', label: 'Headache', options: opts(['None at all', 'A mild headache', 'Moderate headache', 'Severe headache, incapacitating']) },
    { id: 'gi', type: 'choice', label: 'Gastrointestinal symptoms', options: opts(['Good appetite', 'Poor appetite or nausea', 'Moderate nausea or vomiting', 'Severe nausea and vomiting, incapacitating']) },
    { id: 'fatigue', type: 'choice', label: 'Fatigue and/or weakness', options: opts(['Not tired or weak', 'Mild fatigue or weakness', 'Moderate fatigue or weakness', 'Severe fatigue or weakness, incapacitating']) },
    { id: 'dizzy', type: 'choice', label: 'Dizziness or light-headedness', options: opts(['No dizziness or light-headedness', 'Mild dizziness or light-headedness', 'Moderate dizziness or light-headedness', 'Severe dizziness or light-headedness, incapacitating']) }
  ],
  points: { label: 'Lake Louise score', max: 12 },
  footnote: 'Acute mountain sickness: a recent gain in altitude, a headache, and a total of 3 or more. Mild 3 to 5, moderate 6 to 9, severe 10 to 12. Difficulty sleeping is no longer scored.',
  compute(a) {
    const s = pointsOf(tool, a);
    if (a.headache === 0 || s < 3) return { level: 1, headline: a.headache === 0 ? 'Does not meet the definition of acute mountain sickness (no headache)' : 'Does not meet the definition of acute mountain sickness (score under 3)' };
    return s <= 5 ? { level: 2, headline: 'Mild acute mountain sickness' } : s <= 9 ? { level: 3, headline: 'Moderate acute mountain sickness' } : { level: 4, headline: 'Severe acute mountain sickness' };
  },
  evidence: {
    reference: 'Roach RC, Hackett PH, Oelz O, et al. The 2018 Lake Louise Acute Mountain Sickness Score. High Alt Med Biol. 2018;19(1):4-6.',
    pmid: '29583031',
    population: 'Consensus revision of the 1993 Lake Louise score for research and clinical use.',
    validation: 'Consensus statement; difficulty sleeping was removed from the score.',
    prevalence: null, developed: null, validated: null,
    comment: 'Replaces the older version on EE+ (6 symptoms, with 5 or more as moderate to severe).'
  }
};
