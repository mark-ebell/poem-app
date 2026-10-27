// 10 mg warfarin initiation nomogram (Kovacs 2003; EE+ 218).
const DAY3 = [['15 mg', '15 mg'], ['10 mg', '10 mg'], ['10 mg', '5 mg'], ['5 mg', '5 mg'], ['2.5 mg', '2.5 mg'], ['0 mg', '2.5 mg'], ['0 mg', '0 mg']];
const LATER = { // by day 3 INR group: [day 5 INR band][day 5, 6, 7 doses]
  a: [['15 mg', '15 mg', '15 mg'], ['7.5 mg', '5 mg', '7.5 mg'], ['0 mg', '5 mg', '5 mg'], ['0 mg', '0 mg', '2.5 mg']],
  b: [['7.5 mg', '7.5 mg', '7.5 mg'], ['5 mg', '5 mg', '5 mg'], ['2.5 mg', '2.5 mg', '2.5 mg'], ['0 mg', '2.5 mg', '2.5 mg']],
  c: [['5 mg', '5 mg', '5 mg'], ['2.5 mg', '5 mg', '2.5 mg'], ['0 mg', '2.5 mg', '0 mg'], ['0 mg', '0 mg', '2.5 mg']],
  d: [['2.5 mg', '2.5 mg', '2.5 mg'], ['2.5 mg', '0 mg', '2.5 mg'], ['0 mg', '2.5 mg', '0 mg'], ['0 mg', '0 mg', '2.5 mg']]
};

module.exports = {
  id: 'warfarin-kovacs',
  eeId: 218,
  title: 'Warfarin initiation: 10 mg nomogram (Kovacs)',
  subtitle: 'Warfarin doses for days 3 to 7 with LMWH for VTE',
  question: 'For an outpatient starting warfarin with LMWH for venous thromboembolism, what warfarin doses follow 10 mg on days 1 and 2?',
  inputs: [
    { type: 'text', text: 'Give 10 mg of warfarin on days 1 and 2.' },
    { id: 'day3', type: 'choice', label: 'Day 3 INR', ee: 'COMBO_DAY3', options: ['Under 1.3', '1.3 to 1.4', '1.5 to 1.6', '1.7 to 1.9', '2.0 to 2.2', '2.3 to 3.0', 'Over 3.0'].map(label => ({ label })) },
    { id: 'day5', type: 'choice', label: 'Day 5 INR', ee: 'COMBO_DAY5', when: a => a.day3 < 6, options: ['Under 2.0', '2.0 to 3.0', '3.1 to 3.5', 'Over 3.5'].map(label => ({ label })) },
    { id: 'day5high', type: 'choice', label: 'Day 5 INR', ee: 'COMBO_DAY5', when: a => a.day3 === 6, options: ['Under 2.0', '2.0 to 3.0', '3.1 to 4.0', 'Over 4.0'].map(label => ({ label })) }
  ],
  compute(a) {
    const [d3, d4] = DAY3[a.day3];
    const [d5, d6, d7] = LATER[a.day3 < 2 ? 'a' : a.day3 < 4 ? 'b' : a.day3 < 6 ? 'c' : 'd'][a.day3 === 6 ? a.day5high : a.day5];
    return { headline: `Day 3: ${d3}; day 4: ${d4}`, table: { head: ['Day', 'Dose'], rows: [['3', d3], ['4', d4], ['5', d5], ['6', d6], ['7', d7]] } };
  }
};
