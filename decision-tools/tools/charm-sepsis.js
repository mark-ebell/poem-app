// CHARM score: mortality in suspected sepsis (Chen 2017; EE+ 572).
const OUT = ['5 of 543 (0.9%)', '114 of 4350 (2.6%)', '280 of 3689 (7.6%)', '415 of 2434 (17%)', '291 of 1018 (29%)', '37 of 76 (49%)'];

module.exports = {
  id: 'charm-sepsis',
  eeId: 572,
  title: 'CHARM score (suspected sepsis)',
  subtitle: 'In-hospital mortality in ED patients with suspected sepsis',
  question: 'For a patient in the ED with suspected sepsis, what is the risk of death in hospital?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'chills', type: 'check', label: 'No complaint of chills', ee: 'cb1' },
    { id: 'hypothermia', type: 'check', label: 'Hypothermia (below 36°C / 96.8°F)', ee: 'cb2' },
    { id: 'anemia', type: 'check', label: 'Anemia (red cell count below 4 million/µL)', ee: 'cb3' },
    { id: 'rdw', type: 'check', label: 'Red cell distribution width above 14.5%', ee: 'cb4' },
    { id: 'cancer', type: 'check', label: 'History of malignancy', ee: 'cb5' }
  ],
  compute(a) {
    const s = a.chills + a.hypothermia + a.anemia + a.rdw + a.cancer;
    return { score: { value: s, max: 5, label: 'CHARM score' }, headline: `In-hospital mortality: ${OUT[s]}` };
  }
};
