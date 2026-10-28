// ABC score for massive transfusion (Cotton 2010; EE+ 472).
const { count } = require('../lib');
module.exports = {
  id: 'abc-massive-transfusion',
  eeId: 472,
  title: 'Need for massive transfusion in trauma',
  subtitle: 'Assessment of Blood Consumption (ABC) score',
  question: 'For a trauma patient transported from the scene, what is the risk of needing massive transfusion?',
  inputs: [
    { id: 'penetrating', type: 'check', label: 'Penetrating mechanism of injury', ee: 'INJURY' },
    { id: 'sbp', type: 'check', label: 'ED systolic BP under 90 mm Hg', ee: 'SBP' },
    { id: 'hr', type: 'check', label: 'ED heart rate over 120 beats/min', ee: 'HR' },
    { id: 'fast', type: 'check', label: 'Positive FAST examination', ee: 'FAST' }
  ],
  compute(a) {
    const n = count(a, ['penetrating', 'sbp', 'hr', 'fast']);
    return { score: { value: n, max: 4, label: 'ABC score' }, ...(n < 2 ? { level: 1, headline: 'Low risk: 28/763 (3.7%) needed massive transfusion in the 3-hospital validation study' } : { level: 4, headline: 'High risk: 119/255 (47%) needed massive transfusion in the 3-hospital validation study' }) };
  },
  evidence: { reference: 'Cotton BA, Dossett LA, Haut ER, et al. Multicenter validation of a simplified score to predict massive transfusion in trauma. J Trauma. 2010;69 Suppl 1:S33-9.' }
};
