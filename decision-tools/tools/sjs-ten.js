// Stevens-Johnson syndrome / toxic epidermal necrolysis among suspected cases (Weinkle 2019; validation Kolitz 2022; EE+ 628).
module.exports = {
  id: 'sjs-ten',
  eeId: 628,
  title: 'Stevens-Johnson syndrome / TEN diagnosis',
  subtitle: 'SJS/TEN vs mimics in suspected cases',
  question: 'For a patient with suspected Stevens-Johnson syndrome or toxic epidermal necrolysis, how likely is it?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'nikolsky', type: 'check', label: 'Nikolsky sign', ee: 'cb1' },
    { id: 'target', type: 'check', label: 'Atypical targets (two-zone targetoid lesions with poorly defined borders, or a dusky macule with a dusky center)', ee: 'cb2' },
    { id: 'fever', type: 'check', label: 'Fever above 38°C (100.4°F)', ee: 'cb3' },
    { id: 'mucosal', type: 'check', label: 'Mucosal involvement', ee: 'cb4' }
  ],
  compute(a) {
    const s = -6.2 + 3.9 * a.nikolsky + 3.3 * a.target + 2.0 * a.fever + 3.1 * a.mucosal;
    return { score: { value: Number(s.toFixed(1)), label: 'Score' }, headline: `Probability of SJS/TEN: ${(100 / (1 + Math.exp(-s))).toFixed(1)}%` };
  }
};
