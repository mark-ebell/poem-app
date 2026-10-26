// Framingham risk of stroke, and of stroke or death, with new-onset atrial fibrillation (Wang 2003; EE+ 247).
const STROKE = [5, 5, 6, 6, 7, 8, 9, 9, 11, 12, 13, 14, 16, 18, 19, 21, 24, 26, 28, 31, 34, 37, 41, 44, 48, 51, 55, 59, 63, 67, 71, 75];
const DEATH = [8, 9, 10, 10, 11, 12, 13, 15, 16, 17, 19, 20, 22, 24, 26, 28, 30, 32, 35, 37, 40, 43, 46, 49, 52, 55, 58, 61, 65, 68, 71, 75, 78];
const STROKE_AGE = [[59, 0], [62, 1], [66, 2], [71, 3], [74, 4], [77, 5], [81, 6], [85, 7], [90, 8], [93, 9], [Infinity, 10]];
const DEATH_AGE = [0, 1, 2, 3, 3, 4, 5, 6, 7, 8, 8, 9, 10, 11, 12, 13, 13, 14, 15, 16, 17, 18, 18, 19, 20, 21, 22, 23, 23, 24, 25, 26, 27, 28, 29, 30, 30, 31, 32]; // ages 55 to 93

module.exports = {
  id: 'framingham-af-stroke',
  eeId: 247,
  title: 'Stroke risk in new atrial fibrillation (Framingham)',
  subtitle: '5-year risk of stroke, and of stroke or death',
  question: 'For a patient with new-onset atrial fibrillation not taking warfarin, what is the 5-year risk of stroke, and of stroke or death?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 20, max: 110, step: 1, ee: 'AGE' },
    { id: 'sbp', type: 'choice', label: 'Systolic BP', ee: 'IDC_COMBOBOX_1', options: ['Under 120 mm Hg', '120 to 139', '140 to 159', '160 to 179', '180 or more'].map(label => ({ label })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'female', type: 'check', label: 'Female', ee: 'IDC_CHECKBOX_3' },
    { id: 'dm', type: 'check', label: 'Diabetes', ee: 'IDC_CHECKBOX_1' },
    { id: 'stroke', type: 'check', label: 'Prior stroke or TIA', ee: 'IDC_CHECKBOX_2' },
    { id: 'mi', type: 'check', label: 'Prior MI or heart failure', ee: 'IDC_CHECKBOX_5' },
    { id: 'smoker', type: 'check', label: 'Smoker', ee: 'IDC_CHECKBOX_4' },
    { id: 'murmur', type: 'check', label: 'Significant murmur', ee: 'IDC_CHECKBOX_6' },
    { id: 'lvh', type: 'check', label: 'Left ventricular hypertrophy on ECG', ee: 'IDC_CHECKBOX_7' }
  ],
  footnote: 'The stroke score uses age, systolic BP, sex, diabetes and prior stroke or TIA; the stroke-or-death score uses age, systolic BP, diabetes, smoking, prior MI or heart failure, murmur and LVH.',
  compute(a) {
    const age = Math.trunc(a.age);
    const stroke = STROKE_AGE.find(([max]) => age <= max)[1] + a.sbp + 5 * a.dm + 6 * a.stroke + 6 * a.female;
    const death = (age < 55 ? 0 : age > 93 ? 33 : DEATH_AGE[age - 55]) + a.sbp + (a.sbp === 4 ? 1 : 0) + 4 * a.dm + 5 * a.smoker + 6 * a.mi + 4 * a.murmur + 2 * a.lvh;
    return {
      headline: `5-year stroke risk: ${STROKE[stroke]}%`,
      lines: [`5-year risk of stroke or death: ${death < DEATH.length ? `${DEATH[death]}%` : 'more than 80%'}`, `Points: ${stroke} (stroke), ${death} (stroke or death)`]
    };
  }
};
