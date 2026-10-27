// BLS termination-of-resuscitation rule for out-of-hospital cardiac arrest (Verbeek 2002; Morrison 2006; EE+ 342).
// EE+ applied the rule when ANY criterion was met; the rule requires all three.
module.exports = {
  id: 'cpr-ohca-bls',
  eeId: 342,
  title: 'Out-of-hospital cardiac arrest: BLS termination rule with response time',
  subtitle: 'Survival to discharge after out-of-hospital cardiac arrest',
  question: 'For an adult with presumed cardiac out-of-hospital arrest, does the BLS termination rule apply, and what is the chance of survival?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'notWitnessed', type: 'check', label: 'Arrest not witnessed by EMS personnel', ee: 'chk1' },
    { id: 'noShock', type: 'check', label: 'No shock given before transport', ee: 'chk2' },
    { id: 'noRosc', type: 'check', label: 'No return of spontaneous circulation before transport', ee: 'chk3' },
    { id: 'slow', type: 'check', label: 'Response time over 8 minutes', ee: 'chk4' }
  ],
  compute(a) {
    if (!(a.notWitnessed && a.noShock && a.noRosc)) return { level: 2, headline: 'Termination rule not met: transport to hospital recommended' };
    return a.slow ? { level: 4, headline: 'Termination rule met: survival to discharge 0.3% (1 of 389)' } : { level: 4, headline: 'Termination rule met: survival to discharge 0.5% (4 of 776)' };
  }
};
