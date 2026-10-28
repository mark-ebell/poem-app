// Emergency intervention in adult trauma (Haukoos 2011; EE+ 473).
module.exports = {
  id: 'denver-trauma-intervention',
  eeId: 473,
  title: 'Need for emergency intervention in trauma',
  subtitle: 'Emergency operative or procedural intervention after trauma',
  question: 'For a patient in the ED after trauma, is the risk of needing emergency intervention high?',
  inputs: [
    { id: 'penetrating', type: 'check', label: 'Penetrating injury', ee: 'INJURY' },
    { id: 'sbp', type: 'check', label: 'Systolic BP under 100 mm Hg', ee: 'SBP' },
    { id: 'pulse', type: 'check', label: 'Pulse over 100 beats/min', ee: 'PULSE' }
  ],
  compute(a) {
    return a.penetrating || a.sbp || a.pulse
      ? { level: 3, headline: 'High risk for emergency operative or procedural intervention (PV+ 11%, LR+ 2.2)', lines: ['Have a trauma surgeon available.'] }
      : { level: 1, headline: 'Low risk for emergency operative or procedural intervention (PV− 99.6%, LR− 0.1)', lines: ['A trauma surgeon is unlikely to be needed.'] };
  }
};
