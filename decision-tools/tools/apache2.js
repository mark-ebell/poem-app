// APACHE II score and predicted hospital mortality (Knaus 1985; EE+ 234). EE+ read the pO2 box as pCO2 and
// the pCO2 box as pO2 in the A-a gradient; here each value is used as labeled. The mortality equation is as
// on EE+, including its use of the chronic-health answer for the emergency-surgery term.
const opt = (labels, pts) => labels.map((label, k) => ({ label, points: pts[k] }));
const CATEGORY = ['No clinical category', 'Non-operative: metabolic or renal', 'Non-operative: respiratory', 'Non-operative: neurologic', 'Non-operative: cardiovascular', 'Non-operative: gastrointestinal',
  'Non-operative: multiple trauma', 'Post-operative: neurologic', 'Post-operative: cardiovascular', 'Post-operative: respiratory', 'Post-operative: gastrointestinal', 'Post-operative: metabolic or renal', 'Post-operative: multiple trauma'];
const CAT_WEIGHT = [0, -0.885, -0.89, -0.759, -0.47, -0.501, -1.228, -1.15, -0.797, -0.61, -0.613, -0.196, -0.1684];

module.exports = {
  id: 'apache2',
  eeId: 234,
  title: 'APACHE II score',
  subtitle: 'Severity of illness and hospital mortality in the ICU',
  question: 'For an ICU patient, what is the APACHE II score and the predicted hospital mortality?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'CMB_1', options: opt(['Under 45', '45 to 54', '55 to 64', '65 to 74', '75 or older'], [0, 2, 3, 5, 6]) },
    { id: 'temp', type: 'choice', label: 'Rectal temperature', ee: 'CMB_2', default: 3, options: opt(['Over 105.6°F (over 40.9°C)', '102.2 to 105.6°F (39 to 40.9°C)', '101.3 to 102.1°F (38.5 to 38.9°C)', '96.8 to 101.2°F (36 to 38.4°C)',
      '93.2 to 96.7°F (34 to 35.9°C)', '89.6 to 93.1°F (32 to 33.9°C)', '86.0 to 89.5°F (30 to 31.9°C)', 'Under 86.0°F (under 30°C)'], [4, 3, 1, 0, 1, 2, 3, 4]) },
    { id: 'map', type: 'choice', label: 'Mean arterial pressure (mm Hg)', ee: 'CMB_3', default: 3, options: opt(['Over 159', '130 to 159', '110 to 129', '70 to 109', '50 to 69', 'Under 50'], [4, 3, 2, 0, 2, 4]) },
    { id: 'hr', type: 'choice', label: 'Heart rate (ventricular response)', ee: 'CMB_4', default: 3, options: opt(['Over 179', '140 to 179', '110 to 139', '70 to 109', '55 to 69', '40 to 54', 'Under 40'], [4, 3, 2, 0, 2, 3, 4]) },
    { id: 'rr', type: 'choice', label: 'Respiratory rate (ventilated or not)', ee: 'CMB_5', default: 3, options: opt(['Over 49', '35 to 49', '25 to 34', '12 to 24', '10 to 11', '6 to 9', 'Under 6'], [4, 3, 1, 0, 1, 2, 4]) },
    { id: 'fio2High', type: 'choice', label: 'FiO2', ee: 'IDC_RADIO_3', options: [{ label: 'Under 50%' }, { label: '50% or more' }] },
    { id: 'pao2', type: 'choice', label: 'PaO2 (mm Hg)', ee: 'CMB_6', when: a => a.fio2High === 0, options: opt(['Over 70', '61 to 70', '55 to 60', 'Under 55'], [0, 1, 3, 4]) },
    { id: 'fio2', type: 'number', label: 'FiO2', unit: '%', min: 50, max: 100, step: 1, ee: 'EDIT_3', when: a => a.fio2High === 1 },
    { id: 'po2', type: 'number', label: 'PaO2', unit: 'mm Hg', min: 20, max: 700, step: 1, ee: 'EDIT_4', when: a => a.fio2High === 1 },
    { id: 'pco2', type: 'number', label: 'PaCO2', unit: 'mm Hg', min: 10, max: 150, step: 1, ee: 'EDIT_5', when: a => a.fio2High === 1 },
    { id: 'ph', type: 'choice', label: 'Arterial pH', ee: 'CMB_7', default: 3, options: opt(['Over 7.69', '7.60 to 7.69', '7.50 to 7.59', '7.33 to 7.49', '7.25 to 7.32', '7.15 to 7.24', 'Under 7.15'], [4, 3, 1, 0, 2, 3, 4]) },
    { id: 'na', type: 'choice', label: 'Sodium (mmol/L)', ee: 'CMB_8', default: 4, options: opt(['Over 179', '160 to 179', '155 to 159', '150 to 154', '130 to 149', '120 to 129', '111 to 119', 'Under 111'], [4, 3, 2, 1, 0, 2, 3, 4]) },
    { id: 'k', type: 'choice', label: 'Potassium (mmol/L)', ee: 'CMB_9', default: 3, options: opt(['Over 6.9', '6.0 to 6.9', '5.5 to 5.9', '3.5 to 5.4', '3.0 to 3.4', '2.5 to 2.9', 'Under 2.5'], [4, 3, 1, 0, 1, 2, 4]) },
    { id: 'creat', type: 'choice', label: 'Creatinine (mg/dL)', ee: 'CMB_10', default: 6, options: opt(['Over 3.4, acute renal failure', 'Over 3.4, chronic', '2.0 to 3.4, acute renal failure', '2.0 to 3.4, chronic',
      '1.5 to 1.9, acute renal failure', '1.5 to 1.9, chronic', '0.6 to 1.4', 'Under 0.6'], [8, 4, 6, 3, 4, 2, 0, 2]) },
    { id: 'hct', type: 'choice', label: 'Hematocrit (%)', ee: 'CMB_11', default: 3, options: opt(['Over 59.9', '50 to 59.9', '46 to 49.9', '30 to 45.9', '20 to 29.9', 'Under 20'], [4, 2, 1, 0, 2, 4]) },
    { id: 'wbc', type: 'choice', label: 'White cell count (× 1000/µL)', ee: 'CMB_12', default: 3, options: opt(['Over 39.9', '20 to 39.9', '15 to 19.9', '3.0 to 14.9', '1.0 to 2.9', 'Under 1.0'], [4, 2, 1, 0, 2, 4]) },
    { id: 'eyes', type: 'choice', label: 'GCS: eye opening', ee: 'CMB_13', options: opt(['Spontaneously (4)', 'To speech (3)', 'To pain (2)', 'Never (1)'], [0, 1, 2, 3]) },
    { id: 'verbal', type: 'choice', label: 'GCS: best verbal response', ee: 'CMB_14', options: opt(['Oriented (5)', 'Confused (4)', 'Inappropriate words (3)', 'Incomprehensible sounds (2)', 'None (1)'], [0, 1, 2, 3, 4]) },
    { id: 'motor', type: 'choice', label: 'GCS: best motor response', ee: 'CMB_15', options: opt(['Obeys commands (6)', 'Localizes pain (5)', 'Withdraws from pain (4)', 'Abnormal flexion (3)', 'Extension (2)', 'None (1)'], [0, 1, 2, 3, 4, 5]) },
    { id: 'chronic', type: 'choice', label: 'Severe organ insufficiency or immunocompromise', ee: 'CMB_16', default: 2, options: opt(['Yes, non-operative or emergency post-operative', 'Yes, elective post-operative', 'No'], [5, 2, 0]) },
    { id: 'category', type: 'choice', label: 'Clinical category leading to ICU admission', ee: 'CMB_17', options: CATEGORY.map(label => ({ label })) }
  ],
  footnote: 'Points for the Glasgow Coma Scale are 15 minus the GCS. With FiO2 50% or more, oxygenation is scored from the A-a gradient: (FiO2 × 713) − PaCO2/0.8 − PaO2.',
  compute(a) {
    const p = (id, k) => module.exports.inputs.find(i => i.id === id).options[k].points;
    let s = ['age', 'temp', 'map', 'hr', 'rr', 'ph', 'na', 'k', 'creat', 'hct', 'wbc', 'chronic'].reduce((t, id) => t + p(id, a[id]), 0);
    s += p('eyes', a.eyes) + p('verbal', a.verbal) + p('motor', a.motor);
    if (a.fio2High === 0) s += p('pao2', a.pao2);
    else { const aa = a.fio2 / 100 * 713 - a.pco2 / 0.8 - a.po2; s += aa > 499 ? 4 : aa > 349 ? 3 : aa > 199 ? 2 : 0; }
    let mort;
    if (a.category === 0) mort = `about ${s < 5 ? 2 : s < 10 ? 4 : s < 15 ? 9 : s < 20 ? 18 : s < 25 ? 37 : s < 30 ? 51 : s < 35 ? 73 : 84}%`;
    else { const x = -3.517 + 0.146 * s + CAT_WEIGHT[a.category] + (a.chronic === 0 ? 0.603 : 0); mort = `about ${Math.trunc(100 / (1 + Math.exp(-x)))}%`; }
    return { score: { value: s, max: 71, label: 'APACHE II score' }, headline: `Predicted hospital mortality: ${mort}`, lines: [`Glasgow Coma Scale ${15 - p('eyes', a.eyes) - p('verbal', a.verbal) - p('motor', a.motor)}`] };
  }
};
