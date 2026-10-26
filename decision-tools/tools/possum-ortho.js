// POSSUM in orthopedic surgery (Copeland 1991; orthopedic validation Mohamed 2002; EE+ 182).
// Each physiological and operative item scores 1, 2, 4 or 8. Standard POSSUM scores "cardiac signs or
// chest x-ray" and "respiratory history or chest x-ray" as one item each, at the worse of the two findings.
const opts = labels => labels.map(label => ({ label }));
const PHYS = [ // id, label, EE+ id, options, points per option
  ['age', 'Age', 'COMBO_Age', ['Under 60', '60 to 70', 'Over 70'], [1, 2, 4]],
  ['cardiac', 'Cardiac signs', 'COMBO_Cardiac', ['Normal', 'On cardiac drugs or steroids', 'Edema or on warfarin', 'Raised JVP'], [1, 2, 4, 8]],
  ['cxr', 'Chest x-ray: heart', 'COMBO_CXR', ['Normal', 'Borderline cardiomegaly', 'Cardiomegaly'], [1, 4, 8]],
  ['resp', 'Respiratory history', 'COMBO_Resp', ['Normal', 'Short of breath on exertion', 'Short of breath on one flight of stairs', 'Short of breath at rest'], [1, 2, 4, 8]],
  ['copd', 'Chest x-ray: lungs', 'COMBO_COPD', ['Normal', 'Mild COPD', 'Moderate COPD', 'Fibrosis, consolidation or other change'], [1, 2, 4, 8]],
  ['sbp', 'Systolic BP', 'COMBO_Systolic', ['110 to 130 mm Hg', '131 to 170 or 100 to 109', '171 or more, or 90 to 99', '89 or less'], [1, 2, 4, 8]],
  ['pulse', 'Pulse', 'COMBO_Pulse', ['50 to 80/min', '81 to 100 or 40 to 49', '101 to 120', '121 or more, or 39 or less'], [1, 2, 4, 8]],
  ['gcs', 'Glasgow Coma Scale', 'COMBO_Glasgow', ['15', '12 to 14', '9 to 11', '8 or less'], [1, 2, 4, 8]],
  ['urea', 'Urea (BUN)', 'COMBO_BUN', ['7.5 mmol/L or less', '7.6 to 10', '10.1 to 15', '15.1 or more'], [1, 2, 4, 8]],
  ['na', 'Sodium', 'COMBO_Na', ['136 mmol/L or more', '131 to 135', '126 to 130', '125 or less'], [1, 2, 4, 8]],
  ['k', 'Potassium', 'COMBO_K', ['3.5 to 5.0 mmol/L', '3.2 to 3.4 or 5.1 to 5.3', '2.9 to 3.1 or 5.4 to 5.9', '2.8 or less, or 6.0 or more'], [1, 2, 4, 8]],
  ['hb', 'Hemoglobin', 'COMBO_Hemoglobin', ['13 to 16 g/dL', '11.5 to 12.9 or 16.1 to 17', '10 to 11.4 or 17.1 to 18', '9.9 or less, or 18.1 or more'], [1, 2, 4, 8]],
  ['wbc', 'White cell count', 'COMBO_WhiteCell', ['4 to 10 × 10⁹/L', '10.1 to 20 or 3.1 to 3.9', '20.1 or more, or 3 or less'], [1, 2, 4]],
  ['ecg', 'ECG', 'COMBO_ECG', ['Normal', 'Atrial fibrillation (rate 60 to 90)', 'Any other abnormal rhythm, Q waves or ST/T changes'], [1, 4, 8]]
];
const OP = [
  ['magnitude', 'Magnitude of surgery', 'COMBO_Mag', ['Minor', 'Intermediate', 'Major', 'Major+'], [1, 2, 4, 8]],
  ['procedures', 'Previous procedures within 30 days', 'COMBO_Proc', ['None', '1', '2', 'More than 2'], [0, 1, 4, 8]],
  ['blood', 'Blood loss per operation', 'COMBO_Blood', ['100 mL or less', '101 to 500 mL', '501 to 999 mL', '1000 mL or more'], [1, 2, 4, 8]],
  ['contamination', 'Peritoneal or wound contamination', 'COMBO_Contamination', ['None', 'Minor (serous fluid)', 'Local pus', 'Free bowel content, pus or blood'], [1, 2, 4, 8]],
  ['malignancy', 'Malignancy', 'COMBO_Malignancy', ['None', 'Primary only', 'Nodal metastases', 'Distant metastases'], [1, 2, 4, 8]],
  ['timing', 'Timing of operation', 'COMBO_Timing', ['Elective', 'Emergency, resuscitation possible, operation within 48 hours', 'Emergency, immediate operation within 6 hours'], [1, 4, 8]]
];
const pts = (list, a) => Object.fromEntries(list.map(([id, , , , p]) => [id, p[a[id]]]));
const physScore = a => {
  const p = pts(PHYS, a);
  return p.age + Math.max(p.cardiac, p.cxr) + Math.max(p.resp, p.copd) + p.sbp + p.pulse + p.gcs + p.urea + p.na + p.k + p.hb + p.wbc + p.ecg;
};
const opScore = a => Object.values(pts(OP, a)).reduce((s, v) => s + v, 0);

module.exports = {
  id: 'possum-ortho',
  eeId: 182,
  title: 'POSSUM (orthopedic surgery)',
  subtitle: '30-day morbidity and mortality after orthopedic surgery',
  question: 'For a patient having orthopedic surgery, what are the risks of a complication and of death within 30 days?',
  inputs: [
    { type: 'text', text: 'If a value is missing, leave it on the normal (first) answer.' },
    ...PHYS.map(([id, label, ee, o]) => ({ id, type: 'choice', label, ee, options: opts(o) })),
    ...OP.map(([id, label, ee, o]) => ({ id, type: 'choice', label, ee, options: opts(o),
      note: id === 'magnitude' ? 'Minor: fasciotomy, ganglion or bursa, tenotomy or tendon repair, arthroscopy, carpal tunnel or nerve release, removal of metal, closed reduction of fracture. Intermediate: excision or osteotomy of a small bone, minor joint replacement, amputation of digits, closed reduction with external fixation. Major: osteotomy of a long bone, ligament reconstruction with prosthesis, arthrodesis of a large joint, major joint replacement, limb amputation, disc surgery, open reduction of a long bone fracture. Major+: radical tumor resection, major spinal reconstruction, revision of a major joint replacement, hindquarter or forequarter amputation.' : undefined }))
  ],
  physScore, opScore,
  compute(a) {
    const ps = physScore(a), os = opScore(a);
    const p = x => `${Math.round(100 / (1 + Math.exp(-x)))}%`;
    return {
      headline: `30-day mortality: ${p(-7.04 + 0.13 * ps + 0.16 * os)}`,
      lines: [`30-day morbidity: ${p(-5.91 + 0.16 * ps + 0.19 * os)}`, `Physiological score: ${ps}`, `Operative score: ${os}`]
    };
  }
};
