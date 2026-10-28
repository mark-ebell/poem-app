// Mannheim peritonitis index (validated by Billing 1994; EE+ 248).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'mannheim-peritonitis',
  eeId: 248,
  title: 'Peritonitis prognosis (Mannheim)',
  subtitle: 'Mannheim peritonitis index',
  question: 'For a patient with peritonitis, what is the risk of death?',
  inputs: [
    { id: 'exudate', type: 'choice', label: 'Exudate', ee: 'IDC_COMBOBOX_1', options: [{ label: 'Clear', points: 0 }, { label: 'Cloudy, purulent', points: 6 }, { label: 'Fecal', points: 12 }] },
    { id: 'age', type: 'check', label: 'Age over 50 years', points: 5, ee: 'IDC_CHECKBOX_1' },
    { id: 'female', type: 'check', label: 'Female', points: 5, ee: 'IDC_CHECKBOX_2' },
    { id: 'notColon', type: 'check', label: 'Origin of sepsis not colonic', points: 4, ee: 'IDC_CHECKBOX_3' },
    { id: 'duration', type: 'check', label: 'Preoperative duration of peritonitis over 24 hours', points: 4, ee: 'IDC_CHECKBOX_4' },
    { id: 'diffuse', type: 'check', label: 'Diffuse generalized peritonitis', points: 6, ee: 'IDC_CHECKBOX_5' },
    { id: 'cancer', type: 'check', label: 'Malignancy', points: 4, ee: 'IDC_CHECKBOX_6' },
    { id: 'organ', type: 'check', label: 'Organ failure', points: 7, ee: 'IDC_CHECKBOX_7', note: 'Creatinine over 1.5 mg/dL, urine output under 20 mL/h, PO₂ under 50 mm Hg, PCO₂ over 50 mm Hg, hypodynamic or hyperdynamic shock, or complete mechanical ileus.' }
  ],
  points: { label: 'Mannheim index', max: 47 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 21 ? { level: 1, headline: 'Low risk: 2.3% mortality (22/966)' } : s <= 29 ? { level: 3, headline: 'Moderate risk: 22.5% mortality (149/664)' } : { level: 4, headline: 'High risk: 59.1% mortality (220/373)' };
  }
};
