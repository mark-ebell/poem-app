// Glasgow Alcoholic Hepatitis Score (Forrest 2005; EE+ 340).
const DAY1 = [['93', '86'], ['90', '79'], ['87', '81'], ['82', '73'], ['63', '56'], ['33', '31'], ['31', '19'], ['17', '17']];
const DAY6 = [['100', '100'], ['92', '86'], ['94', '87'], ['88', '76'], ['70', '58'], ['29', '20'], ['39', '28'], ['0', '0']];

module.exports = {
  id: 'glasgow-ah',
  eeId: 340,
  title: 'Alcoholic hepatitis prognosis (Glasgow score)',
  subtitle: 'Glasgow Alcoholic Hepatitis Score',
  question: 'For a patient with alcoholic hepatitis, what is the chance of surviving 28 and 84 days?',
  inputs: [
    { id: 'day', type: 'choice', label: 'Day of hospitalization', ee: 'dayScore', options: [{ label: 'Day 1' }, { label: 'Day 6 to 9' }] },
    { id: 'inr', type: 'choice', label: 'PT ratio (INR)', ee: 'combo1', options: [{ label: 'Under 1.5' }, { label: '1.5 to 2.0' }, { label: 'Over 2.0' }] },
    { id: 'bili', type: 'choice', label: 'Bilirubin', ee: 'combo2', options: [{ label: 'Under 125 µmol/L (7.3 mg/dL)' }, { label: '125 to 250 µmol/L (7.3 to 14.6 mg/dL)' }, { label: 'Over 250 µmol/L (14.6 mg/dL)' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age over 50', ee: 'chk1' },
    { id: 'wbc', type: 'check', label: 'White cell count 15,000/µL or more', ee: 'chk2' },
    { id: 'urea', type: 'check', label: 'Urea 5 mmol/L (BUN 14 mg/dL) or more', ee: 'chk3' }
  ],
  footnote: 'A score of 9 or more is high risk.',
  compute(a) {
    const s = 5 + a.age + a.wbc + a.urea + a.inr + a.bili, [d28, d84] = (a.day === 0 ? DAY1 : DAY6)[s - 5];
    return { score: { value: s, max: 12, label: 'Glasgow score' }, level: s >= 9 ? 4 : 1, headline: `28-day survival ${d28}%`, lines: [`84-day survival ${d84}%`] };
  }
};
