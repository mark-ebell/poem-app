// GO-FAR score: neurologically intact survival after in-hospital CPR (Ebell 2013; EE+ 497).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'go-far',
  eeId: 497,
  title: 'GO-FAR score',
  subtitle: 'Neurologically intact survival after in-hospital CPR',
  question: 'For a hospitalized adult, how likely is neurologically intact survival to discharge if CPR is attempted?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [
      { label: 'Under 70', points: 0 }, { label: '70 to 74', points: 2 }, { label: '75 to 79', points: 5 }, { label: '80 to 84', points: 6 }, { label: '85 or older', points: 11 }] },
    { type: 'heading', label: 'On admission: check all that apply' },
    { id: 'intact', type: 'check', label: 'Neurologically intact or minimal deficits', points: -15, ee: 'DEFICITS' },
    { id: 'trauma', type: 'check', label: 'Major trauma', points: 10, ee: 'TRAUMA' },
    { id: 'stroke', type: 'check', label: 'Acute stroke', points: 8, ee: 'STROKE' },
    { id: 'cancer', type: 'check', label: 'Metastatic or hematologic cancer', points: 7, ee: 'CANCER' },
    { id: 'sepsis', type: 'check', label: 'Septicemia', points: 7, ee: 'SEPTICEMIA' },
    { id: 'noncardiac', type: 'check', label: 'Medical non-cardiac admitting diagnosis', points: 7, ee: 'NONCARDIAC' },
    { id: 'hepatic', type: 'check', label: 'Hepatic insufficiency', points: 6, ee: 'HEPATIC' },
    { id: 'snf', type: 'check', label: 'Admitted from a skilled nursing facility', points: 6, ee: 'NURSING' },
    { id: 'hypotension', type: 'check', label: 'Hypotension or hypoperfusion', points: 5, ee: 'HYPOTENSION' },
    { id: 'renal', type: 'check', label: 'Renal insufficiency or dialysis', points: 4, ee: 'RENAL' },
    { id: 'resp', type: 'check', label: 'Respiratory insufficiency', points: 4, ee: 'RESPIRATORY' },
    { id: 'pneumonia', type: 'check', label: 'Pneumonia', points: 1, ee: 'PNEUMONIA' }
  ],
  points: { label: 'GO-FAR score' },
  compute(a) {
    const s = pointsOf(tool, a);
    const b = s < -5 ? [1, 'Above average', '27.8%'] : s < 14 ? [2, 'Average', '9.2%'] : s < 24 ? [3, 'Low', '2.0%'] : [4, 'Very low', '0.8%'];
    return { level: b[0], headline: `${b[1]} likelihood of neurologically intact survival: ${b[2]}` };
  }
};
