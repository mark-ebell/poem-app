// ERNIE decision tree: serious infection in children (Van den Bruel 2007; EE+ 544).
const yesNo = [{ label: 'Yes' }, { label: 'No' }];

module.exports = {
  id: 'ernie',
  eeId: 544,
  title: 'Serious infection in children (ERNIE decision tree)',
  subtitle: 'Serious infection in children 0 to 16 with acute illness',
  question: 'For a child with an acute illness (under 5 days) in primary care or the ED, can serious infection (pneumonia, meningitis, pyelonephritis, osteomyelitis, bacterial gastroenteritis) be ruled out?',
  inputs: [
    { id: 'gut', type: 'choice', label: '1. Does the clinician feel that something is wrong?', required: true, options: yesNo },
    { id: 'dyspnea', type: 'choice', label: '2. Is dyspnea (difficult or labored breathing) present?', required: true, options: yesNo, when: a => a.gut === 1 },
    { id: 'temp', type: 'choice', label: '3. Temperature above 39.9°C?', required: true, options: yesNo, when: a => a.gut === 1 && a.dyspnea === 1 },
    { id: 'diarrhea', type: 'choice', label: '4. Diarrhea, and age 14 to 29 months?', required: true, options: yesNo, when: a => a.gut === 1 && a.dyspnea === 1 && a.temp === 1 }
  ],
  footnote: 'Developed and internally validated in Flanders, Belgium; not externally validated.',
  compute(a) {
    if (a.gut === 0) return { level: 3, headline: 'Positive screen: 20 of 137 had a serious infection' };
    if (a.dyspnea === 0) return { level: 3, headline: 'Positive screen: 5 of 146 had a serious infection' };
    if (a.temp === 0) return { level: 3, headline: 'Positive screen: 2 of 101 had a serious infection' };
    if (a.diarrhea === 0) return { level: 3, headline: 'Positive screen: 3 of 100 had a serious infection' };
    return { level: 1, headline: 'Negative screen: 1 of 3497 had a serious infection' };
  }
};
