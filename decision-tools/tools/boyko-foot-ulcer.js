// Diabetic foot ulcer risk (Boyko 2006; EE+ 354).
module.exports = {
  id: 'boyko-foot-ulcer',
  eeId: 354,
  title: 'Diabetic foot ulcer risk (Boyko)',
  subtitle: 'Foot ulcer in diabetes over about 5.5 years',
  question: 'For a patient with diabetes, what is the risk of developing a foot ulcer?',
  inputs: [
    { id: 'a1c', type: 'choice', label: 'Hemoglobin A1c', ee: 'combo1', options: Array.from({ length: 21 }, (_, k) => ({ label: `${(5 + k / 2).toFixed(1)}%` })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'amputation', type: 'check', label: 'Previous amputation', ee: 'chk6' },
    { id: 'ulcer', type: 'check', label: 'Previous foot ulcer', ee: 'chk5' },
    { id: 'neuropathy', type: 'check', label: 'Neuropathy (cannot feel a 5.07 monofilament at one or more sites on a foot)', ee: 'chk1' },
    { id: 'onychomycosis', type: 'check', label: 'Onychomycosis', ee: 'chk4' },
    { id: 'vision', type: 'check', label: 'Poor vision (worse than 20/40 in both eyes)', ee: 'chk2' },
    { id: 'tinea', type: 'check', label: 'Tinea pedis', ee: 'chk3' }
  ],
  compute(a) {
    const s = 0.0975 * (5 + a.a1c / 2) + 0.7101 * a.neuropathy + 0.3888 * a.vision - 0.3206 * a.tinea + 0.4579 * a.onychomycosis + 0.7784 * a.ulcer + 0.943 * a.amputation;
    const [level, label, p] = s < 1.48 ? [1, 'Low risk', '7%'] : s < 2 ? [2, 'Low to moderate risk', '13%'] : s <= 2.61 ? [3, 'Moderate to high risk', '25%'] : [4, 'High risk', '47%'];
    return { level, headline: `${label}: ${p} with a foot ulcer at 2000 days (5.5 years)` };
  }
};
