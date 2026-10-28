// Survival in idiopathic pulmonary fibrosis (King 2001; EE+ 156).
const pts = (labels, w) => labels.map((label, k) => ({ label, points: w[k] }));
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'ipf-king',
  eeId: 156,
  title: 'Pulmonary fibrosis survival',
  subtitle: 'Survival in idiopathic pulmonary fibrosis',
  question: 'For a patient with idiopathic pulmonary fibrosis, what is the 5-year survival?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'IDC_COMBOBOX_1', options: pts(['Under 40', '40 to 44', '45 to 49', '50 to 54', '55 to 59', '60 to 64', '65 to 69', '70 to 74', '75 or older'].map(l => `${l} years`), [0, 3.2, 6.4, 9.6, 12.8, 16, 19.2, 22.4, 25.6]) },
    { id: 'smoking', type: 'choice', label: 'Smoking', ee: 'IDC_COMBOBOX_2', options: pts(['Current', 'Former', 'Never'], [0, 10.2, 13.6]) },
    { id: 'profusion', type: 'choice', label: 'Radiographic profusion category', ee: 'IDC_COMBOBOX_3', options: pts(['Under 15', '15 to 17.49', '17.5 or more'], [0, 9.15, 18.3]) },
    { id: 'tlc', type: 'choice', label: 'Total lung capacity (% of predicted)', ee: 'IDC_COMBOBOX_4', options: pts(['80 or more', '70 to 79.9', '60 to 69.9', '50 to 59.9', 'Under 50'], [0, 2.75, 5.5, 8.25, 11]) },
    { id: 'pao2', type: 'choice', label: 'PaO₂ at maximal exercise (mm Hg)', ee: 'IDC_COMBOBOX_5', options: pts(['65 or more', '60 to 64.9', '55 to 59.9', '50 to 54.9', '45 to 49.9', '40 to 44.9', '35 to 39.9'], [0, 1.5, 3, 4.5, 6, 7.5, 9]) },
    { id: 'clubbing', type: 'check', label: 'Clubbing', points: 10.7, ee: 'IDC_CHECKBOX_1' },
    { id: 'ph', type: 'check', label: 'Pulmonary hypertension by chest x-ray', points: 10.3, ee: 'IDC_CHECKBOX_2' }
  ],
  compute(a) {
    const s = pointsOf(tool, a);
    const h = s < 15 ? '5-year survival 95% (at a score of 10)' : s < 25 ? '5-year survival 85% (at a score of 20)' : s < 35 ? '5-year survival 67% (at a score of 30)'
      : s < 45 ? '5-year survival 41% (at a score of 40)' : s < 55 ? '5-year survival 13% (at a score of 50)' : s < 65 ? '5-year survival under 2%; 2-year survival 10% (at a score of 60)' : '2-year survival under 2% (at a score of 70 or more)';
    return { score: { value: Math.round(s * 100) / 100, label: 'Score' }, level: s < 25 ? 1 : s < 35 ? 2 : s < 55 ? 3 : 4, headline: h };
  }
};
