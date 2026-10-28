// BODE index in COPD (Celli 2004; EE+ 266). Results as on EE+.
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'bode',
  eeId: 266,
  title: 'COPD prognosis (BODE index)',
  subtitle: 'Body-mass index, airflow obstruction, dyspnea and exercise capacity',
  question: 'For a patient with COPD, what is the BODE index and risk of death?',
  inputs: [
    { id: 'fev1', type: 'choice', label: 'FEV1 (% of predicted)', ee: 'IDC_COMBOBOX_1', options: ['65 or more', '50 to 64', '36 to 49', '35 or less'].map((label, points) => ({ label, points })) },
    { id: 'walk', type: 'choice', label: '6-minute walk distance', ee: 'IDC_COMBOBOX_2', options: ['385 yards (350 m) or more', '275 to 384 yards (250 to 349 m)', '165 to 274 yards (150 to 249 m)', 'Under 165 yards (150 m)'].map((label, points) => ({ label, points })) },
    { id: 'mmrc', type: 'choice', label: 'MMRC dyspnea scale', ee: 'IDC_COMBOBOX_3', note: '0: breathless only with strenuous exercise; 1: short of breath hurrying on the level or walking up a slight hill; 2: has to stop for breath walking at own pace on the level; 3: breathless after 100 yards or a few minutes on the level; 4: breathless when dressing or undressing.',
      options: ['0 to 1', '2', '3', '4'].map((label, points) => ({ label, points })) },
    { id: 'units', type: 'choice', label: 'Units', ee: 'UNITS', options: [{ label: 'English (in, lb)' }, { label: 'Metric (cm, kg)' }] },
    { id: 'heightIn', type: 'number', label: 'Height', unit: 'inches', min: 40, max: 90, step: 0.1, ee: 'IDC_EDIT_1', when: a => a.units === 0 },
    { id: 'weightLb', type: 'number', label: 'Weight', unit: 'lb', min: 50, max: 600, step: 0.1, ee: 'IDC_EDIT_2', when: a => a.units === 0 },
    { id: 'heightCm', type: 'number', label: 'Height', unit: 'cm', min: 100, max: 230, step: 0.1, ee: 'IDC_EDIT_1', when: a => a.units === 1 },
    { id: 'weightKg', type: 'number', label: 'Weight', unit: 'kg', min: 20, max: 300, step: 0.1, ee: 'IDC_EDIT_2', when: a => a.units === 1 }
  ],
  points: { label: 'BODE index', max: 10 },
  bmiOf: a => (a.units === 1 ? a.weightKg / Math.pow(a.heightCm / 100, 2) : (a.weightLb / 2.2) / Math.pow(a.heightIn * 0.0254, 2)),
  compute(a) {
    const bmi = tool.bmiOf(a), s = pointsOf(tool, a) + (bmi <= 21 ? 1 : 0);
    const [level, risk, m] = s <= 2 ? [1, 'Low risk', 20] : s <= 4 ? [2, 'Moderate risk', 58] : s <= 6 ? [3, 'High risk', 70] : [4, 'Very high risk', 80];
    return { score: { value: s, max: 10, label: 'BODE index' }, level, headline: `${risk}: ${m}% mortality at 52 weeks`, lines: [{ label: 'BMI', value: `${Math.round(bmi * 10) / 10} kg/m² (${bmi <= 21 ? '1 point' : '0 points'})` }] };
  }
};
