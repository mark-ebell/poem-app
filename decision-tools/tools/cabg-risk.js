// CABG risk: in-hospital mortality, stroke and mediastinitis (Northern New England scores in the
// ACC/AHA 2004 CABG guideline; EE+ 290). EE+ scored the left main answer twice and never used the
// urgency of surgery: here urgency takes the first set of points and left main the second.
const MORT = ['0.2', '0.2', '0.3', '0.3', '0.5', '0.7', '1.0', '1.3', '1.8', '2.3', '3.0', '4.0', '5.3', '6.9', '8.8', '11.5', '14.1', '18.7'];
const CVA = ['0.4', '0.4', '0.6', '0.9', '1.3', '1.4', '2.0', '2.7', '3.4', '4.2', '5.9', '7.6'];
const MED = ['0.3', '0.3', '0.4', '0.5', '0.7', '0.9', '1.3', '1.7', '2.5', '3.2', '4.2', '5.6'];
const bmiOf = a => (a.units === 0 ? (a.weightLb / 2.2) / Math.pow(a.heightIn * 0.0254, 2) : a.weightKg / Math.pow(a.heightCm / 100, 2));

module.exports = {
  id: 'cabg-risk',
  eeId: 290,
  title: 'CABG risk score (Northern New England)',
  subtitle: 'In-hospital death, stroke and mediastinitis after coronary bypass surgery',
  question: 'For a patient having isolated coronary bypass surgery, what are the risks of death, stroke and mediastinitis?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'IDC_COMBOBOX_1', options: [{ label: 'Under 60' }, { label: '60 to 69' }, { label: '70 to 79' }, { label: '80 or older' }] },
    { id: 'priority', type: 'choice', label: 'Priority of surgery', ee: 'IDC_COMBOBOX_2', options: [{ label: 'Routine' }, { label: 'Urgent' }, { label: 'Emergent' }] },
    { id: 'leftMain', type: 'choice', label: 'Left main obstruction', ee: 'IDC_COMBOBOX_3', options: [{ label: 'Under 50%' }, { label: '50% to 89%' }, { label: '90% or more' }] },
    { id: 'units', type: 'choice', label: 'Units for height and weight', ee: 'RADIO_1', options: [{ label: 'Inches and pounds' }, { label: 'Centimeters and kilograms' }] },
    { id: 'heightIn', type: 'number', label: 'Height', unit: 'in', min: 48, max: 90, step: 0.1, ee: 'HEIGHT', when: a => a.units === 0 },
    { id: 'weightLb', type: 'number', label: 'Weight', unit: 'lb', min: 70, max: 600, step: 0.1, ee: 'WEIGHT', when: a => a.units === 0 },
    { id: 'heightCm', type: 'number', label: 'Height', unit: 'cm', min: 120, max: 230, step: 0.1, ee: 'HEIGHT', when: a => a.units === 1 },
    { id: 'weightKg', type: 'number', label: 'Weight', unit: 'kg', min: 30, max: 270, step: 0.1, ee: 'WEIGHT', when: a => a.units === 1 },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'female', type: 'check', label: 'Female', ee: 'IDC_CHECKBOX_1' },
    { id: 'dm', type: 'check', label: 'Diabetes', ee: 'IDC_CHECKBOX_3' },
    { id: 'copd', type: 'check', label: 'COPD', ee: 'IDC_CHECKBOX_5' },
    { id: 'mi', type: 'check', label: 'MI within 7 days', ee: 'IDC_CHECKBOX_2', note: 'New Q waves, or new ST-T changes with a significant enzyme rise.' },
    { id: 'redo', type: 'check', label: 'Prior CABG', ee: 'IDC_CHECKBOX_4' },
    { id: 'creat', type: 'check', label: 'Creatinine 2 mg/dL (177 µmol/L) or more', ee: 'IDC_CHECKBOX_9' },
    { id: 'ef', type: 'check', label: 'Ejection fraction below 40%', ee: 'IDC_CHECKBOX_6' },
    { id: 'wbc', type: 'check', label: 'White cell count above 12,000/µL', ee: 'IDC_CHECKBOX_10' },
    { id: 'dialysis', type: 'check', label: 'Dialysis', ee: 'IDC_CHECKBOX_7' },
    { id: 'threeVessel', type: 'check', label: '3-vessel disease', ee: 'IDC_CHECKBOX_8' },
    { id: 'vascular', type: 'check', label: 'Peripheral vascular or cerebrovascular disease', ee: 'IDC_CHECKBOX_11',
      note: 'Cerebrovascular disease, prior stroke or TIA, prior carotid surgery, carotid stenosis or bruit, claudication, amputation, prior lower-extremity bypass, absent pedal pulses or leg ulcers.' }
  ],
  bmiOf,
  compute(a) {
    const bmi = bmiOf(a);
    let mort = [0, 1.5, 2.5, 6.5][a.age] + [0, 2, 5][a.priority] + [0, 1.5, 2][a.leftMain];
    let cva = [0, 1.5, 2.5, 3][a.age] + [0, 1.5, 3.5][a.priority];
    let med = [0, 1, 1.5, 2][a.age] + [0, 2, 2][a.priority];
    mort += 2 * a.female + a.dm + 2 * a.copd + 1.5 * a.vascular + 4 * a.dialysis + 2 * a.creat + 1.5 * a.mi + 2.5 * a.redo + 2 * a.ef + 1.5 * a.threeVessel;
    cva += 1.5 * a.female + 1.5 * a.dm + 1.5 * a.vascular + 4 * a.dialysis + 2 * a.creat + 1.5 * a.ef;
    med += 2 * a.female + (bmi >= 37 ? 4.5 : bmi >= 31 ? 2 : 0) + 1.5 * a.dm + 2 * a.copd + 4 * a.dialysis + 1.5 * a.ef;
    [mort, cva, med] = [mort, cva, med].map(Math.ceil); // the scores round up
    const m = mort < MORT.length ? `${MORT[mort]}%` : 'more than 23%';
    return {
      headline: `In-hospital mortality: ${m}`,
      lines: [`Stroke: ${cva < CVA.length ? `${CVA[cva]}%` : '10% or more'}`, `Mediastinitis: ${med < MED.length ? `${MED[med]}%` : '7.3% or more'}`, `Body mass index: ${bmi.toFixed(1)} kg/m²`]
    };
  },
  evidence: { reference: 'Eagle KA, Guyton RA, Davidoff R, et al. ACC/AHA 2004 guideline update for coronary artery bypass graft surgery. Circulation. 2004;110(14):e340-e437.' }
};
