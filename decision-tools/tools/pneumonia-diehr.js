// Pneumonia in outpatients with acute cough (Diehr 1984; EE+ 32).
const P = ['0%', '0.7%', '1.6%', '2.2%', '8.8%', '10.3%', '27.0%', '27.0%', '27.0%', '27.0%', '27.0%'];
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'pneumonia-diehr',
  eeId: 32,
  title: 'Diagnosis of pneumonia (Diehr)',
  subtitle: 'Pneumonia in outpatients with acute cough',
  question: 'For a patient with cough, what is the probability of pneumonia?',
  inputs: [
    { id: 'throat', type: 'check', label: 'Sore throat', points: -1, ee: 'IDC_CHECKBOX_1' },
    { id: 'rr', type: 'check', label: 'Respiratory rate over 25', points: 2, ee: 'IDC_CHECKBOX_4' },
    { id: 'myalgia', type: 'check', label: 'Myalgias', points: 1, ee: 'IDC_CHECKBOX_3' },
    { id: 'sweats', type: 'check', label: 'Night sweats', points: 1, ee: 'IDC_CHECKBOX_2' },
    { id: 'rhinorrhea', type: 'check', label: 'Rhinorrhea', points: -2, ee: 'IDC_CHECKBOX_5' },
    { id: 'temp', type: 'check', label: 'Temperature 100 °F (37.8 °C) or more', points: 2, ee: 'IDC_CHECKBOX_6' },
    { id: 'sputum', type: 'check', label: 'Sputum all day', points: 1, ee: 'IDC_CHECKBOX_7' }
  ],
  points: { label: 'Points' },
  compute(a) {
    const s = pointsOf(tool, a), p = P[s + 3];
    return { level: s + 3 <= 3 ? 1 : s + 3 <= 5 ? 2 : 3, headline: `Probability of pneumonia ${p}` };
  }
};
