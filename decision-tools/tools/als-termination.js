// ALS termination-of-resuscitation rule (Morrison 2007; EE+ 370). EE+ listed the criteria without a calculator.
module.exports = {
  id: 'als-termination',
  eeId: 370,
  title: 'ACLS termination of resuscitation rule',
  subtitle: 'When advanced life support for out-of-hospital arrest may stop',
  question: 'For an out-of-hospital cardiac arrest treated with advanced life support, are the criteria for terminating resuscitation met?',
  inputs: [
    { type: 'heading', label: 'Check each criterion that is met' },
    { id: 'notWitnessed', type: 'check', label: '1. Arrest not witnessed by EMS personnel' },
    { id: 'noShock', type: 'check', label: '2. No AED used and no manual shock given out of hospital' },
    { id: 'noRosc', type: 'check', label: '3. No return of spontaneous circulation out of hospital' },
    { id: 'noBystander', type: 'check', label: '4. Arrest not witnessed by a bystander' },
    { id: 'noBystanderCpr', type: 'check', label: '5. No bystander CPR' }
  ],
  compute(a) {
    return a.notWitnessed && a.noShock && a.noRosc && a.noBystander && a.noBystanderCpr ? { level: 4, headline: 'All 5 criteria met: none of 1192 survived to hospital discharge' }
      : { level: 2, headline: 'Criteria not all met: 9.1% of these patients survived to hospital discharge' };
  }
};
