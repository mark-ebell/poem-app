// Calculated serum osmolality (EE+ 101).
module.exports = {
  id: 'serum-osmolality',
  eeId: 101,
  title: 'Serum osmolality (calculated)',
  subtitle: 'Calculated serum osmolality, including ethanol',
  question: 'What is the calculated serum osmolality?',
  inputs: [
    { id: 'na', type: 'number', label: 'Sodium', unit: 'mmol/L', min: 90, max: 200, step: 1, ee: 'IDC_EDIT_1' },
    { id: 'bun', type: 'number', label: 'BUN', unit: 'mg/dL', min: 1, max: 300, step: 1, ee: 'IDC_EDIT_2' },
    { id: 'glucose', type: 'number', label: 'Glucose', unit: 'mg/dL', min: 10, max: 3000, step: 1, ee: 'IDC_EDIT_3' },
    { id: 'etoh', type: 'number', label: 'Ethanol', unit: 'mg/dL', min: 0, max: 1000, step: 1, default: 0, ee: 'IDC_EDIT_4', note: 'Leave at 0 if not measured.' }
  ],
  footnote: 'Osmolality = 2 × Na + BUN / 2.8 + glucose / 18 + ethanol / 4.6. Normal range 275 to 290 mOsm/kg.',
  compute(a) {
    const osm = 2 * a.na + a.bun / 2.8 + a.glucose / 18 + a.etoh / 4.6;
    return { headline: `Calculated serum osmolality: ${osm.toFixed(1)} mOsm/kg`, lines: ['Normal range 275 to 290 mOsm/kg.'] };
  }
};
