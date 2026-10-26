// YEARS algorithm for suspected pulmonary embolism (van der Hulle; EE+ 580).
const result = a => {
  const items = a.dvt || a.hemoptysis || a.likely;
  const ct = items ? a.ddimer > 0 : a.ddimer === 2;
  return ct ? { level: 3, headline: 'Order CT pulmonary angiography', lines: ['PE not excluded.'] } : { level: 1, headline: 'Pulmonary embolism excluded' };
};
const inputs = (extraNote) => [
  { id: 'ddimer', type: 'choice', label: 'D-dimer (ng/mL)', ee: 'ddl1', options: [{ label: 'Below 500' }, { label: '500 to 1000' }, { label: 'Above 1000' }] },
  { type: 'heading', label: 'YEARS items: check all that apply' },
  { id: 'dvt', type: 'check', label: 'Clinical signs of deep vein thrombosis', ee: 'cb1', note: extraNote },
  { id: 'hemoptysis', type: 'check', label: 'Hemoptysis', ee: 'cb2' },
  { id: 'likely', type: 'check', label: 'Pulmonary embolism the most likely diagnosis', ee: 'cb3' }
];

module.exports = {
  id: 'years',
  eeId: 580,
  title: 'YEARS algorithm for PE',
  subtitle: 'Simplified diagnosis of suspected pulmonary embolism',
  question: 'For an adult with clinically suspected pulmonary embolism, can PE be excluded without CT?',
  inputs: inputs(),
  footnote: 'With no YEARS items, PE is excluded if D-dimer is below 1000 ng/mL; with 1 or more items, if D-dimer is below 500 ng/mL.',
  compute: result
};
module.exports.result = result;
module.exports.inputsFor = inputs;
