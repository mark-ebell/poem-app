// Low-risk criteria for isolated subdural hematoma (EE+ 595).
module.exports = {
  id: 'sdh-low-risk',
  eeId: 595,
  title: 'Subdural hematoma: low-risk criteria',
  subtitle: 'Low risk of a complicated course with isolated subdural hematoma',
  question: 'For a patient 16 or older with a Glasgow Coma Scale over 12 and an isolated subdural hematoma, is the risk of a complicated course low?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'anticoag', type: 'check', label: 'Takes an anticoagulant', ee: 'cb1' },
    { id: 'p2y12', type: 'check', label: 'Takes clopidogrel, prasugrel or ticagrelor', ee: 'cb2' },
    { id: 'multiple', type: 'check', label: 'More than one discrete hematoma', ee: 'cb3' },
    { id: 'thick', type: 'check', label: 'Hematoma thicker than 5 mm', ee: 'cb4' },
    { id: 'shift', type: 'check', label: 'Any midline shift with a Glasgow Coma Scale under 14', ee: 'cb5' }
  ],
  compute(a) {
    return a.anticoag || a.p2y12 || a.multiple || a.thick || a.shift ? { level: 3, headline: 'Does not meet the low-risk criteria' }
      : { level: 1, headline: 'Meets the low-risk criteria', lines: ['Low risk of neurologic deterioration, surgery or radiographic worsening (4 of 155, 2.6%).'] };
  }
};
