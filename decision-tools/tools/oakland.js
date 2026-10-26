// Oakland score: safe discharge after lower GI bleeding (Oakland 2017; EE+ 641). EE+ showed 97% for every
// score of 5 or more (its checks were in the wrong order); here each score gets its own row.
const { pointsOf } = require('../lib');
const SAFE = [[2, '99%'], [4, '98%'], [5, '97%'], [7, '96%'], [8, '95%'], [9, '93%'], [10, '91%'], [11, '89%'], [13, '87% to 89%'],
  [15, '77% to 81%'], [17, '67% to 72%'], [20, '50% to 62%'], [23, '33% to 45%'], [26, '20% to 28%'], [29, '11% to 16%'], [Infinity, 'under 10%']];

const tool = module.exports = {
  id: 'oakland',
  eeId: 641,
  title: 'Oakland score (lower GI bleeding)',
  subtitle: 'Safe discharge after acute lower GI bleeding',
  question: 'For a patient with acute lower GI bleeding, how likely is safe discharge?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'cboAge', options: [{ label: 'Under 40', points: 0 }, { label: '40 to 69', points: 1 }, { label: '70 or older', points: 2 }] },
    { id: 'hr', type: 'choice', label: 'Heart rate', ee: 'cboHR', options: [{ label: 'Under 70/min', points: 0 }, { label: '70 to 89', points: 1 }, { label: '90 to 109', points: 2 }, { label: '110 or more', points: 3 }] },
    { id: 'sbp', type: 'choice', label: 'Systolic BP', ee: 'cboSBP', default: 4, options: [
      { label: '50 to 89 mm Hg', points: 5 }, { label: '90 to 119', points: 4 }, { label: '120 to 129', points: 3 }, { label: '130 to 159', points: 2 }, { label: '160 or more', points: 0 }] },
    { id: 'hb', type: 'choice', label: 'Hemoglobin', ee: 'cboHemoglobin', default: 5, options: [
      { label: '3.6 to 6.9 g/dL', points: 22 }, { label: '7.0 to 8.9', points: 17 }, { label: '9.0 to 10.9', points: 13 }, { label: '11.0 to 12.9', points: 8 }, { label: '13.0 to 15.9', points: 4 }, { label: '16.0 or more', points: 0 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', points: 1, ee: 'chkMale' },
    { id: 'previous', type: 'check', label: 'Previous admission for lower GI bleeding', points: 1, ee: 'chkPreviousBleed' },
    { id: 'dre', type: 'check', label: 'Blood on digital rectal exam', points: 1, ee: 'chkDRE' }
  ],
  points: { label: 'Oakland score', max: 35 },
  footnote: 'Safe discharge: no rebleeding, transfusion, intervention to control bleeding, in-hospital death, or readmission for bleeding within 28 days.',
  compute(a) {
    const s = pointsOf(tool, a);
    return { level: s <= 8 ? 1 : 3, headline: `Probability of safe discharge: ${SAFE.find(([max]) => s <= max)[1]}` };
  },
  evidence: { reference: 'Oakland K, Jairath V, Uberoi R, et al. Derivation and validation of a novel risk score for safe discharge after acute lower gastrointestinal bleeding: a modelling study. Lancet Gastroenterol Hepatol. 2017;2(9):635-643.' }
};
