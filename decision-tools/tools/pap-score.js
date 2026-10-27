// Palliative Prognostic (PaP) Score (Pirovano 1999; EE+ 311).
const { pointsOf } = require('../lib');
const opts = list => list.map(([label, points]) => ({ label, points }));

const tool = module.exports = {
  id: 'pap-score',
  eeId: 311,
  title: 'Palliative Prognostic Score (PaP)',
  subtitle: '30-day survival in advanced cancer',
  question: 'For a patient with advanced cancer, what is the chance of surviving 30 days?',
  inputs: [
    { id: 'cps', type: 'choice', label: "Physician's estimate of survival (weeks)", ee: 'CPS', options: opts([['Over 12', 2], ['11 to 12', 2.5], ['7 to 10', 2.5], ['5 to 6', 4.5], ['3 to 4', 6], ['1 to 2', 8.5]]) },
    { id: 'wbc', type: 'choice', label: 'Total white cell count (/µL)', ee: 'WBC', options: opts([['8500 or less', 0], ['8501 to 11,000', 0.5], ['Over 11,000', 1.5]]) },
    { id: 'lymph', type: 'choice', label: 'Lymphocytes', ee: 'Lymph', options: opts([['20% or more', 0], ['12% to 19.9%', 1], ['Under 12%', 2.5]]) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'dyspnea', type: 'check', label: 'Dyspnea', points: 1, ee: 'dyspnea' },
    { id: 'anorexia', type: 'check', label: 'Anorexia', points: 1.5, ee: 'anorexia' },
    { id: 'kps', type: 'check', label: 'Karnofsky Performance Status 20% or less', points: 2.5, ee: 'KPS', note: 'Very sick: hospitalization or active supportive treatment needed, or moribund.' }
  ],
  points: { label: 'PaP score', max: 17.5 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 5.5 ? { level: 1, headline: 'Low risk: median survival 76 days (95% CI 67 to 87); 87% 30-day survival' }
      : s <= 11 ? { level: 3, headline: 'Moderate risk: median survival 32 days (95% CI 28 to 39); 52% 30-day survival' }
      : { level: 4, headline: 'High risk: median survival 14 days (95% CI 11 to 18); 17% 30-day survival' };
  }
};
