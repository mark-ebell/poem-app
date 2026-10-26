// SHA2PE score: hospital intervention for lower GI bleeding (validation: Cerruti 2021; EE+ 635).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'sha2pe',
  eeId: 635,
  title: 'SHA2PE score (lower GI bleeding)',
  subtitle: 'Need for hospital intervention in lower GI bleeding',
  question: 'For a patient with lower GI bleeding, can they be managed as an outpatient?',
  inputs: [
    { id: 'hb', type: 'choice', label: 'Hemoglobin', ee: 'cboHemoglobin', options: [{ label: 'Over 12.0 g/dL', points: 0 }, { label: '10.5 to 12.0', points: 1 }, { label: 'Under 10.5', points: 2 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'sbp', type: 'check', label: 'Systolic BP below 100 mm Hg', points: 1, ee: 'cb1' },
    { id: 'antiplatelet', type: 'check', label: 'Taking antiplatelet therapy', points: 1, ee: 'cb2' },
    { id: 'anticoag', type: 'check', label: 'Taking an anticoagulant', points: 1, ee: 'cb3' },
    { id: 'pulse', type: 'check', label: 'Pulse above 100/min', points: 1, ee: 'cb4' },
    { id: 'ed', type: 'check', label: 'Bleeding seen in the emergency department', points: 1, ee: 'cb5' }
  ],
  points: { label: 'SHA2PE score', max: 7 },
  compute(a) {
    return pointsOf(tool, a) > 1 ? { level: 3, headline: 'High risk: 37 of 66 (56%) needed intervention' } : { level: 1, headline: 'Low risk: 14 of 143 (10%) needed intervention' };
  }
};
