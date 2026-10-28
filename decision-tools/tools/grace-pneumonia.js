// Pneumonia in adults with acute cough in primary care (van Vugt 2013, GRACE; EE+ 550).
const { count } = require('../lib');
module.exports = {
  id: 'grace-pneumonia',
  eeId: 550,
  title: 'Pneumonia in outpatients with cough (GRACE rule)',
  subtitle: 'Radiographic pneumonia in adults with acute cough',
  question: 'For an adult in primary care with an acute cough, what is the probability of pneumonia?',
  inputs: [
    { id: 'noRunny', type: 'check', label: 'Absence of runny nose', ee: 'cb1' },
    { id: 'breathless', type: 'check', label: 'Breathlessness', ee: 'cb2' },
    { id: 'crackles', type: 'check', label: 'Crackles on lung examination', ee: 'cb3' },
    { id: 'diminished', type: 'check', label: 'Diminished vesicular breathing', ee: 'cb4' },
    { id: 'tachy', type: 'check', label: 'Tachycardia (over 100 beats/min)', ee: 'cb5' },
    { id: 'fever', type: 'check', label: 'Fever (temperature over 37.8 °C)', ee: 'cb6' },
    { id: 'crp', type: 'check', label: 'C-reactive protein over 30 mg/L', ee: 'cb7' }
  ],
  compute(a) {
    const n = count(a, ['noRunny', 'breathless', 'crackles', 'diminished', 'tachy', 'fever', 'crp']);
    const score = { value: n, max: 7, label: 'Score' };
    return n === 0 ? { score, level: 1, headline: 'Low risk: 4/572 (0.7%) with radiographically confirmed pneumonia' }
      : n <= 2 ? { score, level: 2, headline: 'Intermediate risk: 73/1902 (3.8%) with radiographically confirmed pneumonia' }
      : { score, level: 4, headline: 'High risk: 63/346 (18.2%) with radiographically confirmed pneumonia' };
  }
};
