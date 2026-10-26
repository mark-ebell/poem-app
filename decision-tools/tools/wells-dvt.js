// Wells score for deep vein thrombosis, with D-dimer (Wells 2003; EE+ 23).
const ITEMS = [['cancer', 'Active cancer (treatment ongoing, within the last 6 months, or palliative)', 1, 'CANCER'],
  ['bedridden', 'Recently bedridden more than 3 days, or major surgery within 12 weeks', 1, 'BEDRIDDEN'],
  ['tender', 'Localized tenderness along the distribution of the deep venous system', 1, 'TENDERNESS'],
  ['calf', 'Calf swelling more than 3 cm compared with the other leg (measured 10 cm below the tibial tuberosity)', 1, 'CALF_SWELLING'],
  ['pitting', 'Pitting edema (greater in the symptomatic leg)', 1, 'PITTING_EDEMA'], ['collateral', 'Collateral superficial veins (nonvaricose)', 1, 'COLLATERAL'],
  ['paralysis', 'Paralysis, paresis or recent plaster immobilization of the legs', 1, 'PARALYSIS'], ['leg', 'Entire leg swollen', 1, 'LEG_SWELLING'],
  ['previous', 'Previously documented DVT', 1, 'PREVIOUS_DVT'], ['alternative', 'Alternative diagnosis as likely as or more likely than DVT', -2, 'ALTERNATE_DX']];

module.exports = {
  id: 'wells-dvt',
  eeId: 23,
  title: 'Wells score for DVT',
  subtitle: 'Clinical probability of deep vein thrombosis, with D-dimer',
  question: 'For an outpatient with suspected deep vein thrombosis, how likely is DVT?',
  inputs: [{ type: 'heading', label: 'Check all that apply' }, ...ITEMS.map(([id, label, points, ee]) => ({ id, type: 'check', label, points, ee }))],
  points: { label: 'Wells score', max: 9 },
  compute(a) {
    const s = ITEMS.reduce((n, [id, , p]) => n + (a[id] ? p : 0), 0);
    if (s <= 0) return { level: 1, headline: 'Low risk of DVT (5%)', lines: ['If D-dimer is positive, risk is 11%: order ultrasound. If D-dimer is negative, risk is 0.5%: DVT is ruled out.'] };
    if (s < 3) return { level: 2, headline: 'Moderate risk of DVT (17%)', lines: ['If D-dimer is positive, risk is 25%: order ultrasound. If D-dimer is negative, risk is 1%: DVT is ruled out.'] };
    return { level: 4, headline: 'High risk of DVT (53%)', lines: ['If D-dimer is positive, risk is 63%; if negative, 9%. Consider ultrasound in either case, and if negative consider serial ultrasound.'] };
  }
};
