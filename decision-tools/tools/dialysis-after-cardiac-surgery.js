// Dialysis after cardiac surgery (Mehta 2006, STS; EE+ 399).
const PROB = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.2, 0.2, 0.2, 0.2, 0.3, 0.3, 0.4, 0.4, 0.5, 0.6, 0.7, 0.9, 1.1, 1.3, 1.5, 1.8, 2.1, 2.5, 3.0, 3.4, 4.0, 4.7, 5.4, 6.2, 7.1, 8.1, 9.2, 10, 11, 13, 14, 15, 16, 18, 19, 19, 20, 20, 21, 22, 24, 25, 28, 31, 31, 33, 35, 40, 42, 44, 48, 55, 56, 59, 59, 59, 59, 70, 70, 80];
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'dialysis-after-cardiac-surgery',
  eeId: 399,
  title: 'Probability of dialysis post-operatively',
  subtitle: 'Dialysis after coronary bypass or valve surgery',
  question: 'For a patient having coronary bypass or valve surgery, what is the probability of needing dialysis afterwards?',
  inputs: [
    { id: 'creat', type: 'choice', label: 'Last serum creatinine', ee: 'CMB_Creat', options: ['0.5', '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0 or more'].map((label, k) => ({ label: `${label} mg/dL`, points: 5 * (k + 1) })) },
    { id: 'age', type: 'choice', label: 'Age', ee: 'CMB_Age', options: ['Under 55', '55 to 59', '60 to 64', '65 to 69', '70 to 74', '75 to 79', '80 to 84', '85 to 89', '90 to 94', '95 to 99', '100 or older'].map((label, points) => ({ label: `${label} years`, points })) },
    { id: 'surgery', type: 'choice', label: 'Type of surgery', ee: 'CMB_Surgery', options: [{ label: 'CABG only', points: 0 }, { label: 'Aortic valve only', points: 2 }, { label: 'Aortic valve + CABG', points: 5 }, { label: 'Mitral valve only', points: 4 }, { label: 'Mitral valve + CABG', points: 7 }] },
    { id: 'dm', type: 'choice', label: 'Diabetes mellitus', ee: 'CMB_Diabetes', options: [{ label: 'No diabetes', points: 0 }, { label: 'Diabetes controlled with oral drugs', points: 2 }, { label: 'Insulin-dependent diabetes', points: 5 }] },
    { id: 'mi', type: 'check', label: 'Acute MI in the last 3 weeks', points: 3, ee: 'CHK_AcuteMI' },
    { id: 'nonWhite', type: 'check', label: 'Non-white race', points: 2, ee: 'CHK_NonWhite' },
    { id: 'lung', type: 'check', label: 'Chronic lung disease', points: 3, ee: 'CHK_Lung' },
    { id: 'nyha', type: 'check', label: 'NYHA class IV heart failure (symptoms at rest)', points: 3, ee: 'CHK_NYHA' },
    { id: 'shock', type: 'check', label: 'Cardiogenic shock', points: 7, ee: 'CHK_Shock' },
    { id: 'prior', type: 'check', label: 'Prior CABG or other cardiovascular surgery', points: 3, ee: 'CHK_Surgery' }
  ],
  points: { label: 'Risk score' },
  compute(a) {
    const s = pointsOf(tool, a), p = s < PROB.length ? PROB[s] : 85;
    return { level: p < 2 ? 1 : p < 10 ? 2 : p < 30 ? 3 : 4, headline: `Probability of dialysis ${p}%` };
  }
};
