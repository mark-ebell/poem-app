// Hyperbilirubinemia (20 mg/dL or more) predicted from risk factors and the first bilirubin (Newman 2005; EE+ 313).
// [history risk group][bilirubin percentile group] -> chance of a later bilirubin of 20 mg/dL or more
const T = [['under 1%', 'under 1%', 'under 1%', '6.5%'], ['under 1%', '1.5%', '3.5%', '14%'], ['1.5%', '1%', '6.5%', '22.5%'], ['2.5%', '1.5%', '14%', '36%']];
const GROUPS = ['Low', 'Moderate', 'High', 'Very high'];
const PCT = ['under the 40th percentile', 'the 40th to 75th percentile', 'the 75th to 95th percentile', 'over the 95th percentile'];

module.exports = {
  id: 'newman-bilirubin',
  eeId: 313,
  title: 'Hyperbilirubinemia prediction from the first bilirubin',
  subtitle: 'Bilirubin of 20 mg/dL or more in newborns',
  question: 'For a newborn of 36 weeks or more with a bilirubin in the first 48 hours, what is the chance of a later bilirubin of 20 mg/dL (342 µmol/L) or more?',
  inputs: [
    { id: 'bili', type: 'number', label: 'Total serum bilirubin', unit: 'mg/dL', min: 0.1, max: 19.9, step: 0.1, ee: 'IDC_EDIT_1' },
    { id: 'hours', type: 'number', label: 'Hours after birth when drawn', unit: 'hours', min: 1, max: 48, step: 1, ee: 'IDC_EDIT_2' },
    { id: 'ga', type: 'number', label: 'Gestational age', unit: 'weeks', min: 36, max: 43, step: 1, ee: 'IDC_EDIT_3' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'breast', type: 'check', label: 'Exclusive breastfeeding at discharge', ee: 'IDC_CHECKBOX_1' },
    { id: 'bruising', type: 'check', label: 'Bruising', ee: 'IDC_CHECKBOX_2' },
    { id: 'asian', type: 'check', label: 'Asian race', ee: 'IDC_CHECKBOX_3' },
    { id: 'cephal', type: 'check', label: 'Cephalhematoma', ee: 'IDC_CHECKBOX_4' },
    { id: 'mother25', type: 'check', label: 'Mother 25 or older', ee: 'IDC_CHECKBOX_5' },
    { id: 'male', type: 'check', label: 'Male', ee: 'IDC_CHECKBOX_6' },
    { id: 'black', type: 'check', label: 'Black race', ee: 'IDC_CHECKBOX_7' }
  ],
  compute(a) {
    const s = 6 * a.breast + 4 * a.bruising + 4 * a.asian + 3 * a.cephal + 3 * a.mother25 + a.male - 2 * a.black + 2 * (40 - a.ga);
    const g = s < 4 ? 0 : s <= 6 ? 1 : s <= 10 ? 2 : 3;
    const b = a.bili, h = a.hours, p = b < 2 + 0.14 * h ? 0 : b <= 2.5 + 0.17 * h ? 1 : b <= 3.1 + 0.21 * h ? 2 : 3;
    return { level: [1, 2, 3, 4][g], headline: `${T[g][p]} had a later bilirubin of 20 mg/dL (342 µmol/L) or more`,
      lines: [`${GROUPS[g]} risk by history (score ${s}); first bilirubin ${PCT[p]}.`] };
  }
};
