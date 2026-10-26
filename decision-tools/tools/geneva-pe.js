// Geneva score for pulmonary embolism (Wicki; Chagnon validation; EE+ 209).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'geneva-pe',
  eeId: 209,
  title: 'Geneva score for PE (original)',
  subtitle: 'Probability of pulmonary embolism in the ED, with arterial blood gases',
  question: 'For a patient in the emergency department with suspected pulmonary embolism, how likely is PE?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'IDC_COMBOBOX_1', options: [{ label: 'Under 60', points: 0 }, { label: '60 to 79', points: 1 }, { label: '80 or older', points: 2 }] },
    { id: 'paco2', type: 'choice', label: 'PaCO2 (mm Hg)', ee: 'IDC_COMBOBOX_2', default: 2, options: [{ label: 'Below 36', points: 2 }, { label: '36 to 38.9', points: 1 }, { label: '39 or more', points: 0 }] },
    { id: 'pao2', type: 'choice', label: 'PaO2 (mm Hg)', ee: 'IDC_COMBOBOX_3', default: 4, options: [{ label: 'Below 48.7', points: 4 }, { label: '48.7 to 59.9', points: 3 }, { label: '60 to 71.2', points: 2 }, { label: '71.3 to 82.4', points: 1 }, { label: 'Above 82.4', points: 0 }] },
    { id: 'cxr', type: 'choice', label: 'Chest x-ray', ee: 'IDC_COMBOBOX_4', default: 2, options: [{ label: 'Plate-like atelectasis', points: 1 }, { label: 'Elevated hemidiaphragm', points: 1 }, { label: 'Other findings', points: 0 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'previous', type: 'check', label: 'Previous PE or DVT', points: 2, ee: 'IDC_CHECKBOX_1' },
    { id: 'hr', type: 'check', label: 'Heart rate above 100 beats/min', points: 1, ee: 'IDC_CHECKBOX_2' },
    { id: 'surgery', type: 'check', label: 'Recent surgery', points: 3, ee: 'IDC_CHECKBOX_3' }
  ],
  points: { label: 'Geneva score', max: 16 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 4 ? { level: 1, headline: 'Low risk of PE: 10% (95% CI 8% to 13%)' }
      : s <= 8 ? { level: 2, headline: 'Moderate risk of PE: 38% (95% CI 34% to 43%)' }
      : { level: 4, headline: 'High risk of PE: 81% (95% CI 69% to 90%)' };
  }
};
