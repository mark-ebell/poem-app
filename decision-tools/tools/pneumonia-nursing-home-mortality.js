// 30-day mortality in nursing home residents with lower respiratory infection (Missouri LRI study, Mehr 2001; EE+ 157).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'pneumonia-nursing-home-mortality',
  eeId: 157,
  title: 'Pneumonia prognosis: nursing home',
  subtitle: '30-day mortality in nursing home residents with lower respiratory infection',
  question: 'For a nursing home resident with lower respiratory tract infection, what is the 30-day mortality?',
  inputs: [
    { id: 'units', type: 'choice', label: 'Units', ee: 'UNITS', options: [{ label: 'English (in, lb)' }, { label: 'Metric (cm, kg)' }] },
    { id: 'heightIn', type: 'number', label: 'Height', unit: 'inches', min: 40, max: 90, step: 0.1, ee: 'IDC_EDIT_1', when: a => a.units === 0 },
    { id: 'weightLb', type: 'number', label: 'Weight', unit: 'lb', min: 40, max: 500, step: 0.1, ee: 'IDC_EDIT_2', when: a => a.units === 0 },
    { id: 'heightCm', type: 'number', label: 'Height', unit: 'cm', min: 100, max: 230, step: 0.1, ee: 'IDC_EDIT_1', when: a => a.units === 1 },
    { id: 'weightKg', type: 'number', label: 'Weight', unit: 'kg', min: 20, max: 230, step: 0.1, ee: 'IDC_EDIT_2', when: a => a.units === 1 },
    { id: 'bun', type: 'choice', label: 'BUN (mg/dL)', ee: 'IDC_COMBOBOX_1', options: ['16 or less', '16.1 to 27', '27.1 to 38', '38.1 to 49', '49.1 to 60', '60.1 to 71', 'Over 71'].map((label, points) => ({ label, points })) },
    { id: 'wbc', type: 'choice', label: 'WBC (× 1000/mm³)', ee: 'IDC_COMBOBOX_2', options: ['14 or less', '14.1 to 24', 'Over 24'].map((label, points) => ({ label, points })) },
    { id: 'pulse', type: 'choice', label: 'Pulse (beats/min)', ee: 'IDC_COMBOBOX_3', options: ['72 or less', '73 to 102', '103 to 132', 'Over 132'].map((label, points) => ({ label, points })) },
    { id: 'male', type: 'check', label: 'Male', points: 1, ee: 'IDC_CHECKBOX_1' },
    { id: 'lymph', type: 'check', label: 'Absolute lymphocyte count 800 or less', points: 1, ee: 'IDC_CHECKBOX_2' },
    { id: 'mood', type: 'check', label: 'Mood deterioration over the last 90 days', points: 1, ee: 'IDC_CHECKBOX_3' },
    { type: 'heading', label: 'Needs extensive assistance or is dependent for:' },
    { id: 'grooming', type: 'check', label: 'Grooming', points: 1, ee: 'IDC_CHECKBOX_4' },
    { id: 'toilet', type: 'check', label: 'Using the toilet', points: 1, ee: 'IDC_CHECKBOX_5' },
    { id: 'locomotion', type: 'check', label: 'Locomotion', points: 1, ee: 'IDC_CHECKBOX_6' },
    { id: 'eating', type: 'check', label: 'Eating', points: 1, ee: 'IDC_CHECKBOX_7' }
  ],
  bmiOf: a => (a.units === 1 ? a.weightKg / Math.pow(a.heightCm / 100, 2) : (a.weightLb / 2.2) / Math.pow(a.heightIn * 0.0254, 2)),
  compute(a) {
    const bmi = tool.bmiOf(a), bp = bmi <= 13 ? 4 : bmi <= 19 ? 3 : bmi <= 25 ? 2 : bmi <= 31 ? 1 : 0;
    const s = pointsOf(tool, a) + bp;
    const [level, h] = s <= 4 ? [1, 'Low (2.2%)'] : s <= 6 ? [1, 'Relatively low (6.2%)'] : s <= 8 ? [2, 'Moderate (15.8%)'] : s <= 10 ? [3, 'High (35.9%)'] : [4, 'Very high (60%)'];
    return { score: { value: s, label: 'Points' }, level, headline: `30-day mortality: ${h}`, lines: [{ label: 'BMI', value: `${Math.round(bmi * 10) / 10} kg/m² (${bp} points)` }] };
  }
};
