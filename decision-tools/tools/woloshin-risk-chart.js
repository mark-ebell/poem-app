// Risk charts: chance in 1000 of dying of common causes in the next 10 years (Woloshin 2002; EE+ 164).
const AGES = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90];
const T = {
  maleSmoker: { 'Heart attack': [0, 1, 2, 4, 9, 17, 32, 51, 84, 91, 140, 213, 295, 361, 335], Stroke: [0, 0, 1, 1, 2, 3, 5, 8, 14, 18, 31, 54, 80, 100, 109], 'Lung cancer': [0, 0, 1, 2, 6, 13, 33, 55, 98, 152, 249, 330, 275, 211, 133],
    'Colon cancer': [0, 0, 0, 0, 1, 1, 2, 4, 6, 9, 11, 14, 16, 16, 14], 'Prostate cancer': [0, 0, 0, 0, 0, 0, 1, 2, 4, 8, 14, 23, 32, 37, 36], Pneumonia: [0, 0, 0, 1, 1, 1, 2, 3, 6, 11, 23, 44, 76, 113, 147],
    AIDS: [0, 1, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], Accidents: [5, 5, 4, 5, 5, 5, 4, 4, 5, 6, 7, 11, 15, 19, 21], 'All causes': [23, 26, 30, 43, 64, 91, 145, 217, 341, 516, 786, 950, 950, 950, 950] },
  male: { 'Heart attack': [0, 0, 1, 2, 4, 7, 12, 20, 32, 61, 93, 142, 196, 241, 223], Stroke: [0, 0, 0, 0, 1, 1, 2, 4, 6, 12, 21, 36, 53, 67, 73], 'Lung cancer': [0, 0, 0, 0, 0, 1, 2, 3, 5, 7, 12, 15, 13, 10, 6],
    'Colon cancer': [0, 0, 0, 0, 1, 1, 2, 4, 6, 9, 11, 14, 16, 16, 14], 'Prostate cancer': [0, 0, 0, 0, 0, 0, 1, 2, 4, 8, 14, 23, 32, 37, 36], Pneumonia: [0, 0, 0, 0, 0, 1, 1, 2, 3, 6, 11, 22, 38, 56, 74],
    AIDS: [0, 1, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], Accidents: [5, 5, 4, 5, 5, 5, 4, 4, 5, 6, 7, 11, 15, 19, 21], 'All causes': [10, 11, 13, 18, 27, 39, 62, 93, 146, 221, 336, 494, 652, 770, 828] },
  femaleSmoker: { 'Heart attack': [0, 0, 1, 1, 3, 6, 13, 24, 45, 50, 88, 153, 261, 375, 462], Stroke: [0, 0, 1, 1, 2, 4, 6, 9, 16, 16, 30, 58, 99, 137, 154], 'Lung cancer': [0, 0, 1, 2, 4, 10, 21, 36, 65, 85, 124, 137, 136, 103, 64],
    'Colon cancer': [0, 0, 0, 0, 1, 1, 2, 2, 4, 6, 8, 11, 14, 15, 14], 'Breast cancer': [0, 0, 1, 1, 2, 4, 5, 6, 7, 9, 10, 11, 12, 12, 10], 'Ovarian cancer': [0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 4, 4, 4, 3, 2],
    'Cervical cancer': [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], Pneumonia: [0, 0, 0, 0, 0, 1, 1, 2, 4, 8, 16, 33, 66, 105, 140], AIDS: [0, 1, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    Accidents: [2, 1, 2, 2, 2, 2, 2, 2, 2, 3, 5, 7, 11, 14, 15], 'All causes': [8, 10, 14, 22, 32, 50, 80, 125, 199, 301, 470, 725, 950, 950, 950] },
  female: { 'Heart attack': [0, 0, 0, 0, 1, 2, 4, 7, 14, 30, 52, 90, 153, 221, 272], Stroke: [0, 0, 0, 0, 1, 1, 2, 2, 4, 10, 19, 36, 62, 86, 96], 'Lung cancer': [0, 0, 0, 0, 0, 1, 2, 3, 5, 7, 10, 11, 11, 8, 5],
    'Colon cancer': [0, 0, 0, 0, 1, 1, 2, 3, 4, 6, 8, 11, 14, 15, 14], 'Breast cancer': [0, 0, 0, 1, 2, 4, 5, 6, 7, 9, 10, 11, 12, 12, 10], 'Ovarian cancer': [0, 0, 0, 0, 0, 1, 1, 2, 3, 3, 4, 4, 4, 3, 2],
    'Cervical cancer': [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], Pneumonia: [0, 0, 0, 0, 0, 0, 1, 1, 2, 4, 7, 15, 30, 48, 64], AIDS: [0, 1, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    Accidents: [2, 1, 2, 2, 2, 2, 2, 2, 2, 3, 5, 7, 11, 14, 15], 'All causes': [4, 5, 7, 11, 17, 26, 42, 66, 105, 158, 247, 381, 581, 771, 879] }
};

module.exports = {
  id: 'woloshin-risk-chart',
  eeId: 164,
  title: '10-year mortality from common causes (risk charts)',
  subtitle: 'Chance in 1000 of dying of common causes in the next 10 years',
  question: 'For a person of a given age, sex and smoking status, what is the chance of dying of common causes in the next 10 years?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age (closest)', ee: 'Age', options: AGES.map(v => ({ label: String(v) })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', ee: 'Male' },
    { id: 'smoker', type: 'check', label: 'Smoker', ee: 'Smoker' }
  ],
  footnote: 'From US mortality data (Woloshin, Schwartz and Welch 2002).',
  compute(a) {
    const t = T[(a.male ? 'male' : 'female') + (a.smoker ? 'Smoker' : '')];
    const rows = Object.entries(t).filter(([k]) => k !== 'All causes').map(([k, v]) => [k, String(v[a.age])]);
    return { headline: `Chance of dying of any cause in the next 10 years: ${t['All causes'][a.age]} in 1000`, table: { head: ['Cause', 'Deaths per 1000'], rows } };
  }
};
