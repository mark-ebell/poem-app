// Pregnancy-adapted YEARS algorithm for suspected pulmonary embolism (van der Pol; EE+ 581).
const years = require('./years');
module.exports = {
  id: 'years-pregnancy',
  eeId: 581,
  title: 'YEARS algorithm for PE in pregnancy',
  subtitle: 'Pregnancy-adapted YEARS algorithm',
  question: 'For a pregnant woman with clinically suspected pulmonary embolism, can PE be excluded without CT?',
  inputs: years.inputsFor('If there are clinical signs of DVT, obtain compression ultrasound; if it is abnormal, start anticoagulation.'),
  footnote: 'With no YEARS items, PE is excluded if D-dimer is below 1000 ng/mL; with 1 or more items, if D-dimer is below 500 ng/mL.',
  compute: years.result
};
