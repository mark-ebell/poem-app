// Severe Clostridioides difficile infection (Na 2015; EE+ 524).
module.exports = {
  id: 'cdi-severity',
  eeId: 524,
  title: 'Severe C. difficile infection (Na)',
  subtitle: 'Complicated C. difficile infection in hospitalized patients',
  question: 'For a hospitalized patient with C. difficile infection, what is the risk of death, ICU admission, toxic megacolon or colectomy?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age 65 or older', ee: 'AGE' },
    { id: 'wbc', type: 'check', label: 'White cell count 20,000/µL or more', ee: 'WHITE' },
    { id: 'creat', type: 'check', label: 'Creatinine 2 mg/dL (177 µmol/L) or more', ee: 'SERUM' }
  ],
  compute(a) {
    const s = a.age + a.wbc + a.creat;
    return s === 0 ? { level: 1, headline: 'Low risk: 4.7% risk of a severe outcome' } : s === 1 ? { level: 2, headline: 'Moderate risk: 13.8% risk of a severe outcome' } : { level: 4, headline: 'High risk: 34.3% risk of a severe outcome' };
  }
};
