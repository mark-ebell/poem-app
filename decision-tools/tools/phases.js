// PHASES score: 5-year rupture risk of an unruptured intracranial aneurysm (Greving 2014). Not an EE+
// tool; added at Mark Ebell's request (2026-10-26) beside the ISUIA tool (EE+ 239).
const { pointsOf } = require('../lib');
const RISK = ['0.4', '0.4', '0.4', '0.7', '0.9', '1.3', '1.7', '2.4', '3.2', '4.3', '5.3', '7.2', '17.8']; // scores 0 to 12+

const tool = module.exports = {
  id: 'phases',
  title: 'PHASES score (intracranial aneurysm rupture)',
  subtitle: '5-year risk of rupture of an unruptured intracranial aneurysm',
  question: 'For an adult with an unruptured intracranial aneurysm, what is the 5-year risk of rupture?',
  categories: ['Cardiovascular: Stroke, aneurysm, AVM'],
  inputs: [
    { id: 'population', type: 'choice', label: 'Population', options: [
      { label: 'North American or European (other than Finnish)', points: 0 }, { label: 'Japanese', points: 3 }, { label: 'Finnish', points: 5 }] },
    { id: 'size', type: 'choice', label: 'Aneurysm size', options: [
      { label: 'Under 7.0 mm', points: 0 }, { label: '7.0 to 9.9 mm', points: 3 }, { label: '10.0 to 19.9 mm', points: 6 }, { label: '20 mm or more', points: 10 }] },
    { id: 'site', type: 'choice', label: 'Aneurysm site', options: [
      { label: 'Internal carotid artery', points: 0 }, { label: 'Middle cerebral artery', points: 2 },
      { label: 'Anterior cerebral, posterior communicating, or posterior circulation arteries', points: 4 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'htn', type: 'check', label: 'Hypertension', points: 1 },
    { id: 'age', type: 'check', label: 'Age 70 or older', points: 1 },
    { id: 'sah', type: 'check', label: 'Earlier subarachnoid hemorrhage from another aneurysm', points: 1 }
  ],
  points: { label: 'PHASES score', max: 22 },
  compute(a) {
    return { headline: `5-year risk of rupture: ${RISK[Math.min(12, pointsOf(tool, a))]}%` };
  },
  evidence: {
    reference: 'Greving JP, Wermer MJ, Brown RD Jr, et al. Development of the PHASES score for prediction of risk of rupture of intracranial aneurysms: a pooled analysis of six prospective cohort studies. Lancet Neurol. 2014;13(1):59-66.',
    pmid: '24290159',
    population: 'Pooled individual data from 8382 participants with unruptured intracranial aneurysms in six prospective cohort studies (North America, Europe, Japan).',
    validation: null, prevalence: null, developed: 8382, validated: null,
    comment: 'Aneurysm shape (irregularity) is not part of the score.'
  }
};
