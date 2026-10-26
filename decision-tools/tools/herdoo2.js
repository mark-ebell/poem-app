// HERDOO2 rule validation: stopping anticoagulation in women after unprovoked VTE (Rodger 2017; EE+ 598).
module.exports = {
  id: 'herdoo2',
  eeId: 598,
  title: 'HERDOO2 rule (2017 validation)',
  subtitle: 'Who can stop anticoagulation after unprovoked VTE',
  question: 'For a woman who has had 5 to 12 months of anticoagulation for unprovoked VTE, can it safely be stopped?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'skin', type: 'check', label: 'Any hyperpigmentation, edema or redness of either leg, of any severity', points: 1, ee: 'cb1' },
    { id: 'ddimer', type: 'check', label: 'VIDAS D-dimer 250 µg/L or higher (drawn while anticoagulated)', points: 1, ee: 'cb2' },
    { id: 'bmi', type: 'check', label: 'Obesity (BMI 30 or higher)', points: 1, ee: 'cb3' },
    { id: 'age', type: 'check', label: 'Age 65 or older', points: 1, ee: 'cb4' }
  ],
  points: { label: 'HERDOO2 score', max: 4 },
  compute(a) {
    return a.skin + a.ddimer + a.bmi + a.age < 2
      ? { level: 1, headline: 'Low risk', lines: ['3.0% (95% CI 1.3% to 4.4%) risk of VTE in the next year if anticoagulation is stopped.'] }
      : { level: 3, headline: 'High risk', lines: ['7.4% (95% CI 3.0% to 15%) risk of VTE in the next year if anticoagulation is stopped.'] };
  }
};
