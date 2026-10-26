// Clinical (pre-endoscopy) Rockall score: mortality in upper GI bleeding (Rockall 1996; EE+ 16).
const { pointsOf } = require('../lib');
const OUT = [['0%', 246], ['3%', 201], ['6.1%', 249], ['12.1%', 311], ['21%', 364], ['35.1%', 134], ['61.8%', 68], ['75%', 8]];

const tool = module.exports = {
  id: 'rockall-clinical',
  eeId: 16,
  title: 'Rockall score (clinical, before endoscopy)',
  subtitle: 'In-hospital mortality after acute upper GI bleeding',
  question: 'For a patient admitted with acute upper GI bleeding, what is the risk of death in hospital?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'Age_ID', options: [{ label: 'Under 60', points: 0 }, { label: '60 to 79', points: 1 }, { label: '80 or older', points: 2 }] },
    { id: 'comorbidity', type: 'choice', label: 'Comorbidity', ee: 'Comorbidity_ID', options: [
      { label: 'No major comorbidity', points: 0 }, { label: 'Heart failure, coronary disease, or another major comorbidity', points: 2 }, { label: 'Renal or liver failure, or disseminated cancer', points: 3 }] },
    { id: 'shock', type: 'choice', label: 'Shock', ee: 'Shock_ID', options: [
      { label: 'Systolic BP 100 mm Hg or more and pulse under 100', points: 0 }, { label: 'Systolic BP 100 or more and pulse 100 or more', points: 1 }, { label: 'Systolic BP under 100', points: 2 }] }
  ],
  points: { label: 'Rockall score', max: 7 },
  compute(a) {
    const s = pointsOf(tool, a), [mort, n] = OUT[s];
    return { headline: `In-hospital mortality: ${mort}`, lines: [`${n} patients had this score.`] };
  }
};
