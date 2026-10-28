// SMART-COP (Charles 2008; EE+ 622). Respiratory rate and oxygenation thresholds depend on age.
// EE+ gave a PaO2/FiO2 cut-off of 300 for age 50 or under; the published cut-off is 333.
const OUT = [['0', '1.2'], ['1.7', '1.7'], ['2.6', '2'], ['7.6', '5.2'], ['21.4', '13.3'], ['30.9', '10.9'], ['48.5', '16.2'], ['70.8', '33.3']];
const { pointsOf } = require('../lib');
const old = a => a.age50, young = a => !a.age50;
const tool = module.exports = {
  id: 'smart-cop',
  eeId: 622,
  title: 'Pneumonia: need for intensive respiratory or vasopressor support (SMART-COP)',
  subtitle: 'Intensive respiratory or vasopressor support in community-acquired pneumonia',
  question: 'For a patient hospitalized with community-acquired pneumonia, what is the chance of needing intensive respiratory or vasopressor support?',
  inputs: [
    { id: 'age50', type: 'check', label: 'Age over 50 years', ee: 'cb9' },
    { id: 'onO2', type: 'check', label: 'On supplemental oxygen when respiratory rate and oxygenation were measured', ee: 'cb10' },
    { id: 'sbp', type: 'check', label: 'Systolic BP under 90 mm Hg', points: 2, ee: 'cb1' },
    { id: 'multilobar', type: 'check', label: 'Multilobar chest x-ray involvement', points: 1, ee: 'cb8' },
    { id: 'albumin', type: 'check', label: 'Albumin under 3.5 g/dL', points: 1, ee: 'cb2' },
    { id: 'rrYoung', type: 'check', label: 'Respiratory rate 25 breaths/min or more', points: 1, ee: 'cb3', when: young },
    { id: 'rrOld', type: 'check', label: 'Respiratory rate 30 breaths/min or more', points: 1, ee: 'cb3', when: old },
    { id: 'hr', type: 'check', label: 'Heart rate 125 beats/min or more', points: 1, ee: 'cb4' },
    { id: 'confusion', type: 'check', label: 'Confusion (new onset)', points: 1, ee: 'cb5' },
    { id: 'oxYoung', type: 'check', label: 'Low oxygenation: PaO₂ under 70 mm Hg or O₂ saturation 93% or less', points: 2, ee: 'cb6', when: a => young(a) && !a.onO2 },
    { id: 'oxYoungO2', type: 'check', label: 'Low oxygenation: PaO₂/FiO₂ under 333', points: 2, ee: 'cb6', when: a => young(a) && a.onO2 },
    { id: 'oxOld', type: 'check', label: 'Low oxygenation: PaO₂ under 60 mm Hg or O₂ saturation 90% or less', points: 2, ee: 'cb6', when: a => old(a) && !a.onO2 },
    { id: 'oxOldO2', type: 'check', label: 'Low oxygenation: PaO₂/FiO₂ under 250', points: 2, ee: 'cb6', when: a => old(a) && a.onO2 },
    { id: 'ph', type: 'check', label: 'Arterial pH under 7.35', points: 2, ee: 'cb7' }
  ],
  points: { label: 'SMART-COP', max: 11 },
  compute(a) {
    const s = pointsOf(tool, a), [need, m] = OUT[Math.min(s, 7)];
    return { level: s <= 2 ? 1 : s <= 4 ? 2 : s <= 6 ? 3 : 4, headline: `${need}% chance of needing intensive respiratory or vasopressor support; ${m}% mortality` };
  }
};
