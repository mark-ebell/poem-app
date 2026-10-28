// Traumatic wound infection (Lammers 2003, neural network-derived model; EE+ 240).
const LOC = ['Inguinal or perineal', 'Scalp', 'Ear or nose', 'Face', 'Hand or finger', 'Back', 'Chest or abdomen', 'Foot or toe', 'Arm or forearm', 'Leg or thigh'];
module.exports = {
  id: 'wound-infection-lammers',
  eeId: 240,
  title: 'Traumatic wound infection risk',
  subtitle: 'Infection of lacerations closed in the ED',
  question: 'For a wound under 24 hours old (under 8 hours on the hand or foot; not an avulsion or gunshot wound), what is the risk of infection?',
  inputs: [
    { id: 'loc', type: 'choice', label: 'Location', ee: 'IDC_COMBOBOX_1', default: 9, options: LOC.map(label => ({ label })) },
    { id: 'sharp', type: 'check', label: 'Wound configuration: sharp edges', ee: 'IDC_CHECKBOX_1' },
    { id: 'crushed', type: 'check', label: 'Wound configuration: crushed or devitalized edges', ee: 'IDC_CHECKBOX_2' },
    { id: 'contam', type: 'choice', label: 'Contamination', ee: 'IDC_COMBOBOX_2', options: [{ label: 'None' }, { label: 'Organic' }, { label: 'Inorganic' }] },
    { id: 'age', type: 'number', label: 'Patient age', unit: 'years', min: 1, max: 110, ee: 'IDC_EDIT_1' },
    { id: 'hours', type: 'number', label: 'Wound age', unit: 'hours', min: 0.5, max: 24, step: 0.5, ee: 'IDC_EDIT_2' },
    { id: 'muscle', type: 'check', label: 'Muscle involvement', ee: 'IDC_CHECKBOX_3' }
  ],
  compute(a) {
    if ((a.loc === 4 || a.loc === 7) && a.hours > 8) return { headline: 'This rule applies only to wounds under 24 hours old (under 8 hours on the hand or foot).' };
    const X1 = a.loc + 1, X2 = a.sharp ? 2 : 1, X3 = a.crushed ? 2 : 1, X4 = a.contam + 1, X5 = a.age, X6 = a.hours, X7 = a.muscle ? 2 : 1;
    const s = 22 + 2.7 * X1 + 4.2 * X2 + 7 * X3 + 3.6 * X4 + 27 * X5 + 2.6 * X6 - 0.7 * X7
      + 0.2 * X1 * X2 + 0.4 * X1 * X3 + 0.2 * X1 * X4 - 5.1 * X1 * X5 - 0.9 * X1 * X6 - 2.1 * X1 * X7
      + 0.5 * X2 * X3 + 0.2 * X2 * X4 + 2.3 * X2 * X5 - 1.1 * X2 * X6 - 0.05 * X2 * X7
      + 0.4 * X3 * X4 + 3.2 * X3 * X5 + 0.3 * X3 * X6 - 0.05 * X3 * X7 - 1.9 * X4 * X5 + 0.3 * X4 * X6 - 0.02 * X4 * X7
      + 0.4 * X5 * X6 - 1.8 * X5 * X7 + 0.5 * X6 * X7;
    return s > 0 ? { level: 3, headline: 'High risk: 18% with wound infection' } : { level: 1, headline: 'Low risk: 3% with wound infection' };
  }
};
