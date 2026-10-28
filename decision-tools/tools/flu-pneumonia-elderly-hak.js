// Hospitalization or death from pneumonia or influenza in community-dwelling older adults (Hak 2004; EE+ 443).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'flu-pneumonia-elderly-hak',
  eeId: 443,
  title: 'Hospitalization or death due to flu or pneumonia',
  subtitle: 'Older adults during influenza epidemics',
  question: 'For a community-dwelling adult 65 or older, what is the risk of hospitalization or death from pneumonia or influenza over 12 months?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: ['Under 70', '70 to 74', '75 to 79', '80 to 89', '90 or older'].map((label, k) => ({ label: `${label} years`, points: 14 * k })) },
    { id: 'male', type: 'check', label: 'Male sex', points: 9, ee: 'MALE' },
    { id: 'visits', type: 'choice', label: 'Outpatient visits during the previous year', ee: 'VISITS', options: ['None', '1 to 6', '7 to 12', '13 or more'].map((label, k) => ({ label, points: 11 * k })) },
    { id: 'hosp', type: 'check', label: 'Previous hospitalization for pneumonia or influenza', points: 63, ee: 'HOSPITALIZATION' },
    { type: 'heading', label: 'Comorbidities' },
    { id: 'pulm', type: 'check', label: 'Pulmonary disease', points: 18, ee: 'PULMONARY' },
    { id: 'heart', type: 'check', label: 'Heart disease', points: 6, ee: 'HEART' },
    { id: 'renal', type: 'check', label: 'Renal disease or transplant', points: 12, ee: 'RENAL' },
    { id: 'dementia', type: 'check', label: 'Dementia or stroke', points: 22, ee: 'DEMENTIA_STROKE' },
    { id: 'cancer', type: 'check', label: 'Nonhematological or hematological cancer', points: 48, ee: 'CANCER' }
  ],
  points: { label: 'Points' },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 40 ? { level: 1, headline: 'Low risk: 23/6595 (0.3%) hospitalized or died from influenza or pneumonia' }
      : s < 60 ? { level: 2, headline: 'Moderate risk: 43/3707 (1.1%) hospitalized or died from influenza or pneumonia' }
      : s < 100 ? { level: 3, headline: 'High risk: 144/4754 (3.0%) hospitalized or died from influenza or pneumonia' }
      : { level: 4, headline: 'Very high risk: 188/1224 (15.1%) hospitalized or died from influenza or pneumonia' };
  }
};
