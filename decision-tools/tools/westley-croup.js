// Westley croup score (Westley 1978). Not an EE+ tool: added beside the Syracuse score (EE+ 261) at Mark
// Ebell's request (2026-10-28), flagged for his review. Severity groups as commonly used.
const opts = list => list.map(([label, points]) => ({ label, points }));
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'westley-croup',
  categories: ['Respiratory disease: Bronchiolitis and croup'],
  title: 'Croup severity (Westley score)',
  subtitle: 'Westley clinical croup score',
  question: 'For a child with croup, how severe is it?',
  inputs: [
    { id: 'loc', type: 'choice', label: 'Level of consciousness', options: opts([['Normal, including asleep', 0], ['Disoriented', 5]]) },
    { id: 'cyanosis', type: 'choice', label: 'Cyanosis', options: opts([['None', 0], ['With agitation', 4], ['At rest', 5]]) },
    { id: 'stridor', type: 'choice', label: 'Stridor', options: opts([['None', 0], ['With agitation', 1], ['At rest', 2]]) },
    { id: 'air', type: 'choice', label: 'Air entry', options: opts([['Normal', 0], ['Decreased', 1], ['Markedly decreased', 2]]) },
    { id: 'retractions', type: 'choice', label: 'Retractions', options: opts([['None', 0], ['Mild', 1], ['Moderate', 2], ['Severe', 3]]) }
  ],
  points: { label: 'Westley score', max: 17 },
  footnote: 'Mild 2 or less; moderate 3 to 7; severe 8 to 11; impending respiratory failure 12 or more.',
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 2 ? { level: 1, headline: 'Mild croup' } : s <= 7 ? { level: 2, headline: 'Moderate croup' } : s <= 11 ? { level: 3, headline: 'Severe croup' } : { level: 4, headline: 'Impending respiratory failure' };
  },
  evidence: {
    reference: 'Westley CR, Cotton EK, Brooks JG. Nebulized racemic epinephrine by IPPB for the treatment of croup: a double-blind study. Am J Dis Child. 1978;132(5):484-7.',
    pmid: '347921',
    population: 'Children with croup in a trial of racemic epinephrine, where the score was introduced to measure severity.',
    validation: 'Widely used to grade croup severity in trials and guidelines; not developed as a prediction rule.',
    prevalence: null, developed: null, validated: null,
    comment: 'The severity groups are those in common use (see, e.g., Bjornson CL, Johnson DW. Croup. Lancet 2008;371:329-39); they are not given in the 1978 paper. See also the BC Emergency Health Services clinical handbook: https://handbook.bcehs.ca/clinical-resources/clinical-scores/westley-croup-severity-score/'
  }
};
