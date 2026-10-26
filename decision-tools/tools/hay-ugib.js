// Low-risk upper GI bleeding (Hay 1997; EE+ 119). Wording as in EE+.
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'hay-ugib',
  eeId: 119,
  title: 'Low-risk upper GI bleeding (Hay)',
  subtitle: 'Complications and early discharge after upper GI bleeding',
  question: 'For a patient admitted with upper GI bleeding, is the risk of complications low enough to consider early discharge?',
  inputs: [
    { id: 'endoscopy', type: 'choice', label: 'Endoscopy finding', ee: 'RADIO_GRP', options: [
      { label: 'Ulcer without stigmata of recent hemorrhage, non-bleeding Mallory-Weiss tear, erosive disease, or normal', points: 0 },
      { label: 'Ulcer with a spot or clot, angiodysplasia, or erosive disease with stigmata of recent hemorrhage', points: 1 },
      { label: 'Ulcer with a visible vessel, or non-bleeding ulcer with stigmata of recent hemorrhage', points: 2 },
      { label: 'Persistent bleeding, varices, or GI cancer', points: 3 }] },
    { id: 'onset', type: 'choice', label: 'Time from symptom onset', ee: 'Combo1_ID', options: [{ label: 'More than 48 hours', points: 0 }, { label: 'Less than 48 hours', points: 1 }, { label: 'Already in hospital', points: 2 }] },
    { id: 'hemodynamics', type: 'choice', label: 'Hemodynamics', ee: 'Combo2_ID', options: [{ label: 'Stable', points: 0 }, { label: 'Intermediate', points: 1 }, { label: 'Unstable', points: 2 }],
      note: 'Based on vital signs, hematocrit, type of symptoms and nasogastric aspirate.' },
    { id: 'comorbid', type: 'choice', label: 'Number of comorbidities', ee: 'Combo3_ID', options: [{ label: '0 or 1', points: 0 }, { label: '2', points: 1 }, { label: '3', points: 2 }, { label: '4 or more', points: 3 }],
      note: 'Cardiac, hepatic, pulmonary, renal or neurologic disease; cancer; sepsis; major surgery within 30 days; age over 60; or instability needing continued in-hospital treatment.' }
  ],
  points: { label: 'Score' },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 2 ? { level: 1, headline: 'Low risk (0.6% risk of complications). Consider discharge.' } : s <= 4 ? { level: 2, headline: 'Intermediate risk' } : { level: 4, headline: 'High risk' };
  }
};
