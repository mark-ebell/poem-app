// Need for surgery in adhesive small bowel obstruction (Komatsu 2010; EE+ 441).
const OUT = [[1, 'Very low risk', '3 of 58 (5%)'], [1, 'Low risk', '10 of 115 (9%)'], [3, 'Moderate risk', '18 of 57 (32%)'], [4, 'High risk', '13 of 18 (72%)']];

module.exports = {
  id: 'sbo-surgery',
  eeId: 441,
  title: 'Small bowel obstruction: need for surgery (Komatsu)',
  subtitle: 'Failure of conservative treatment in adhesive small bowel obstruction',
  question: 'For an adult with adhesive small bowel obstruction after at least 2 days of tube decompression, how likely is surgery?',
  inputs: [
    { type: 'text', text: 'For adults with a previous laparotomy and an ileus tube for at least 2 days; excludes recurrence within 30 days of surgery or another known cause.' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age 65 or older', ee: 'AGE65' },
    { id: 'ascites', type: 'check', label: 'Ascites on CT', ee: 'ASCITES' },
    { id: 'drainage', type: 'check', label: 'Tube drainage of 500 mL or more on day 3', ee: 'DRAINAGE' }
  ],
  compute(a) {
    const [level, label, p] = OUT[a.age + a.ascites + a.drainage];
    return { level, headline: `${label}: ${p} needed surgery` };
  }
};
