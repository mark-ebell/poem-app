// Hematoma expansion after intracerebral hemorrhage (Brouwers 2014; EE+ 503).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'ich-expansion',
  eeId: 503,
  title: 'Hematoma expansion after intracerebral hemorrhage',
  subtitle: 'Expansion and mortality in primary intracerebral hemorrhage',
  question: 'For a patient with primary acute intracerebral hemorrhage, what is the risk of hematoma expansion and death?',
  inputs: [
    { id: 'volume', type: 'choice', label: 'Baseline hemorrhage volume', ee: 'VOLUMES', options: [
      { label: 'Under 30 mL', points: 0 }, { label: '30 to 60 mL', points: 1 }, { label: 'Over 60 mL', points: 2 }] },
    { id: 'spot', type: 'choice', label: 'CT angiography spot sign', ee: 'SPOTSIGN', options: [
      { label: 'Absent', points: 0 }, { label: 'Present', points: 3 }, { label: 'CT angiography not available', points: 1 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'warfarin', type: 'check', label: 'Warfarin use', points: 2, ee: 'WARFARIN' },
    { id: 'early', type: 'check', label: 'Time from symptom onset to first CT 6 hours or less', points: 2, ee: 'TIMING' }
  ],
  points: { label: 'Score', max: 9 },
  footnote: 'Hematoma expansion: growth of more than 6 mL or more than 33%.',
  compute(a) {
    const s = pointsOf(tool, a);
    if (s < 1) return { level: 1, headline: 'Low risk', lines: ['Expansion 6% (4/70); in-hospital mortality 3% (2/70); 3-month mortality 6% (4/70).'] };
    if (s < 3) return { level: 2, headline: 'Moderate risk', lines: ['Expansion 12% (62/500); in-hospital mortality 18% (89/500); 3-month mortality 23% (116/500).'] };
    return { level: 4, headline: 'High risk', lines: ['Expansion 36% (90/247); in-hospital mortality 41% (102/247); 3-month mortality 50% (124/247).'] };
  }
};
