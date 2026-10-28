// GAD-2 (Kroenke 2007; EE+ 360).
const FREQ = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'].map((label, points) => ({ label, points }));
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'gad2',
  eeId: 360,
  title: 'Generalized anxiety disorder (GAD-2)',
  subtitle: 'Two-question anxiety screen',
  question: 'Over the last 2 weeks, how often has the patient been bothered by these problems?',
  inputs: [
    { id: 'nervous', type: 'choice', label: 'Feeling nervous, anxious or on edge', ee: 'CMB_Nervous', options: FREQ },
    { id: 'worry', type: 'choice', label: 'Not being able to stop or control worrying', ee: 'CMB_Worry', options: FREQ }
  ],
  points: { label: 'GAD-2', max: 6 },
  footnote: 'A score of 3 or more is 86% sensitive and 83% specific for generalized anxiety disorder.',
  compute(a) {
    return pointsOf(tool, a) >= 3 ? { level: 3, headline: 'Positive screen for generalized anxiety disorder' } : { level: 1, headline: 'Negative screen for generalized anxiety disorder' };
  }
};
