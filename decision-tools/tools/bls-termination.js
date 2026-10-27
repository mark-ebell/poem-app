// BLS termination-of-resuscitation rule (Morrison 2006; EE+ 369). EE+ listed the criteria without a calculator.
module.exports = {
  id: 'bls-termination',
  eeId: 369,
  title: 'BLS termination of resuscitation rule',
  subtitle: 'When basic life support for out-of-hospital arrest may stop',
  question: 'For an out-of-hospital cardiac arrest treated with basic life support, are the criteria for terminating resuscitation met?',
  inputs: [
    { type: 'heading', label: 'Check each criterion that is met' },
    { id: 'notWitnessed', type: 'check', label: '1. Arrest not witnessed by EMS personnel' },
    { id: 'noShock', type: 'check', label: '2. No AED used and no manual shock given out of hospital' },
    { id: 'noRosc', type: 'check', label: '3. No return of spontaneous circulation out of hospital' }
  ],
  compute(a) {
    return a.notWitnessed && a.noShock && a.noRosc ? { level: 4, headline: 'All 3 criteria met: 5 of 2592 (0.2%) survived to hospital discharge' }
      : { level: 2, headline: 'Criteria not all met: 13.3% of these patients survived to hospital discharge' };
  }
};
