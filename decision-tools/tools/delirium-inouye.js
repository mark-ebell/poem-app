// Delirium in hospitalized older adults (Inouye 1993; EE+ 222).
module.exports = {
  id: 'delirium-inouye',
  eeId: 222,
  title: 'Delirium risk in older inpatients (Inouye)',
  subtitle: 'Delirium in hospitalized older adults',
  question: 'For an older adult admitted to hospital, what is the risk of delirium?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'vision', type: 'check', label: 'Vision impairment (worse than 20/70 on both near and distant binocular tests)', ee: 'IDC_CHECKBOX_VISION_IMPAIRMENT' },
    { id: 'severe', type: 'check', label: "Severe illness (nurse rating of 'severe' or APACHE II over 16)", ee: 'IDC_CHECKBOX_SEVERE_ILLNESS' },
    { id: 'cognitive', type: 'check', label: 'Cognitive impairment (Mini-Mental State Exam under 24)', ee: 'IDC_CHECKBOX_COGNITIVE_IMPAIRMENT' },
    { id: 'bun', type: 'check', label: 'BUN/creatinine ratio 18 or more', ee: 'IDC_CHECKBOX_BUN_CREAT_RATIO' }
  ],
  compute(a) {
    const n = a.vision + a.severe + a.cognitive + a.bun;
    return n === 0 ? { level: 1, headline: 'Low risk: 6% (4 of 63) developed delirium' } : n < 3 ? { level: 2, headline: 'Moderate risk: 18% (30 of 164) developed delirium' }
      : { level: 4, headline: 'High risk: 44% (22 of 50) developed delirium' };
  }
};
