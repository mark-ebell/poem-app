// Pulmonary Embolism Rule-out Criteria (Kline; EE+ 448).
const ITEMS = [['age', 'Age under 50', 'AGE'], ['pulse', 'Pulse below 100 beats/min', 'PULSE'], ['o2', 'Oxygen saturation 95% or higher', 'O2'],
  ['hemoptysis', 'No hemoptysis', 'HEMOPTYSIS'], ['estrogen', 'No estrogen use', 'ESTROGEN'], ['surgery', 'No surgery or trauma requiring hospitalization within 4 weeks', 'SURGERY'],
  ['vte', 'No prior VTE', 'VTE'], ['swelling', 'No unilateral leg swelling', 'SWELLING']];

module.exports = {
  id: 'perc',
  eeId: 448,
  title: 'PERC rule',
  subtitle: 'Pulmonary Embolism Rule-out Criteria',
  question: 'In a patient being evaluated for possible pulmonary embolism, can PE be considered unlikely without further testing?',
  inputs: [{ type: 'heading', label: 'PE is unlikely when all of these are true: check each one that is' }, ...ITEMS.map(([id, label, ee]) => ({ id, type: 'check', label, ee }))],
  compute(a) {
    const met = ITEMS.filter(([id]) => a[id]).length;
    return met === ITEMS.length
      ? { level: 1, headline: 'Pulmonary embolism unlikely (1%)' }
      : { level: 3, headline: 'Pulmonary embolism possible', lines: [`Further evaluation recommended (${met} of ${ITEMS.length} criteria met).`] };
  }
};
