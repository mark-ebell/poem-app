// Warfarin maintenance dose from the day 5 INR after 5 mg daily (Pengo 2001; EE+ 142).
const TABLE = [[1.05, 71], [1.15, 57], [1.25, 48], [1.35, 43], [1.45, 39], [1.55, 35], [1.65, 33], [1.75, 31], [1.85, 29], [1.95, 27], [2.05, 26], [2.15, 24],
  [2.25, 23], [2.35, 22], [2.45, 21], [2.55, 20], [2.65, 19], [2.75, 18], [2.85, 17], [2.95, 16.5], [3.05, 16], [3.15, 15], [3.25, 14], [3.35, 13.5],
  [3.45, 13], [3.55, 12], [3.65, 11.5], [3.75, 11], [3.85, 10.5], [3.95, 10], [4.05, 9], [4.15, 8.5], [4.25, 8], [4.35, 7.5], [4.45, 7]];

module.exports = {
  id: 'warfarin-pengo',
  eeId: 142,
  title: 'Warfarin initiation: 5 mg scheme (Pengo)',
  subtitle: 'Maintenance warfarin dose from the day 5 INR',
  question: 'After 5 mg of warfarin on days 1 to 4, what maintenance dose does the day 5 INR predict?',
  inputs: [
    { type: 'text', text: 'Give 5 mg of warfarin on days 1 to 4, and check the INR on day 5.' },
    { id: 'inr', type: 'number', label: 'Day 5 INR', min: 0.8, max: 10, step: 0.01, ee: 'INR' }
  ],
  compute(a) {
    const row = TABLE.find(([max]) => a.inr <= max);
    if (!row) return { headline: 'No prediction for a day 5 INR above 4.45' };
    return { headline: `Predicted weekly dose: ${row[1]} mg`, lines: [`Average daily dose: ${(row[1] / 7).toFixed(2)} mg`] };
  }
};
