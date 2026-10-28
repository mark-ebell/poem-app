// PHQ-2 depression screen (Kroenke 2003; EE+ 244).
const OUT = [['0.3%', '3%'], ['2.5%', '11%'], ['4.3%', '23%'], ['18%', '54%'], ['30%', '78%'], ['44%', '80%'], ['79%', '93%']];
const FREQ = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'].map((label, points) => ({ label, points }));
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'phq2',
  eeId: 244,
  title: 'Depression screening (PHQ-2)',
  subtitle: 'Two-question depression screen',
  question: 'Over the last 2 weeks, how often has the patient been bothered by these problems?',
  inputs: [
    { id: 'interest', type: 'choice', label: 'Little interest or pleasure in doing things', ee: 'IDC_COMBOBOX_1', options: FREQ },
    { id: 'down', type: 'choice', label: 'Feeling down, depressed or hopeless', ee: 'IDC_COMBOBOX_2', options: FREQ }
  ],
  points: { label: 'PHQ-2', max: 6 },
  footnote: 'Risks assume an overall prevalence of 7% for major depression and 18.3% for any depressive disorder.',
  compute(a) {
    const s = pointsOf(tool, a), [maj, any] = OUT[s];
    return { level: s <= 2 ? 1 : s <= 4 ? 3 : 4, headline: `Risk of major depression ${maj}; any depressive disorder ${any}` };
  }
};
