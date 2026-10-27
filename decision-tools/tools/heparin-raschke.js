// Weight-based heparin nomogram (Raschke 1993; EE+ 151).
module.exports = {
  id: 'heparin-raschke',
  eeId: 151,
  title: 'Weight-based heparin nomogram (Raschke)',
  subtitle: 'Initial heparin dose and adjustment by aPTT ratio',
  question: 'What are the initial heparin bolus and infusion for this weight, and how should the infusion be adjusted for the aPTT?',
  inputs: [
    { id: 'units', type: 'choice', label: 'Weight units', ee: 'IDC_RADIO', options: [{ label: 'Pounds' }, { label: 'Kilograms' }] },
    { id: 'weight', type: 'number', label: 'Weight', unit: 'lb or kg', min: 20, max: 700, step: 0.1, ee: 'Weight_ID' },
    { id: 'aptt', type: 'number', label: 'aPTT ratio 6 hours after starting (optional)', min: 0.5, max: 10, step: 0.1, optional: true, ee: 'APTT_ID' }
  ],
  compute(a) {
    const kg = a.units === 0 ? a.weight / 2.2 : a.weight, u = f => Math.trunc(kg * f);
    const out = { headline: `Loading dose ${u(80)} units; initial infusion ${u(18)} units/hour` };
    if (a.aptt !== undefined) {
      const r = a.aptt;
      out.lines = [r < 1.2 ? `aPTT ratio ${r}: increase by ${u(4)} units/hour, rebolus with ${u(80)} units, and recheck the aPTT in 6 hours.`
        : r < 1.5 ? `aPTT ratio ${r}: increase by ${u(2)} units/hour, rebolus with ${u(40)} units, and recheck the aPTT in 6 hours.`
        : r < 2.3 ? `aPTT ratio ${r}: no change; recheck the aPTT the next morning.`
        : r < 3 ? `aPTT ratio ${r}: decrease by ${u(2)} units/hour and recheck the aPTT in 6 hours.`
        : `aPTT ratio ${r}: decrease by ${u(3)} units/hour, stop the infusion for 1 hour, and recheck the aPTT in 6 hours.`];
    }
    return out;
  }
};
