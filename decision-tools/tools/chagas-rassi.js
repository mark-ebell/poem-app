// Rassi score: death in Chagas heart disease (Rassi 2006; EE+ 414).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'chagas-rassi',
  eeId: 414,
  title: 'Chagas heart disease prognosis (Rassi)',
  subtitle: '5- and 10-year mortality in Chagas heart disease',
  question: 'For a patient with Chagas heart disease, what are the risks of death at 5 and 10 years?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'nyha', type: 'check', label: 'NYHA class III or IV heart failure', points: 5, ee: 'CHK_NYHA' },
    { id: 'cardiomegaly', type: 'check', label: 'Cardiomegaly on chest x-ray', points: 5, ee: 'CHK_Cardio' },
    { id: 'wall', type: 'check', label: 'Segmental or global wall motion abnormality on echo', points: 3, ee: 'CHK_Wall' },
    { id: 'nsvt', type: 'check', label: 'Nonsustained ventricular tachycardia', points: 3, ee: 'CHK_Tach' },
    { id: 'qrs', type: 'check', label: 'Low QRS voltage', points: 2, ee: 'CHK_QRS' },
    { id: 'male', type: 'check', label: 'Male', points: 2, ee: 'CHK_Male' }
  ],
  points: { label: 'Rassi score', max: 20 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 7 ? { level: 1, headline: 'Low risk: 0% 5-year and 9% 10-year mortality (100 patients)' }
      : s < 12 ? { level: 2, headline: 'Moderate risk: 15% 5-year and 37% 10-year mortality (30 patients)' }
      : { level: 4, headline: 'High risk: 53% 5-year and 85% 10-year mortality (23 patients)' };
  }
};
