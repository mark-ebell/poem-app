// Guy's prognostic score: death or disability 6 months after stroke (Gompertz 1994; EE+ 45).
const RISK = { 3: '55% (95% CI 45% to 70%)', 4: '62% (95% CI 60% to 74%)', 5: '83% (95% CI 73% to 93%)' };

module.exports = {
  id: 'guys-stroke',
  eeId: 45,
  title: "Guy's prognostic score (stroke)",
  subtitle: 'Death or disability 6 months after acute stroke',
  question: 'For a patient 24 hours after admission with acute stroke, what is the risk of death or disability at 6 months?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [{ label: '50 or younger' }, { label: '51 to 75' }, { label: 'Over 75' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'paralysis', type: 'check', label: 'Complete paralysis of the worst limb', ee: 'COMPLETE' },
    { id: 'loc', type: 'check', label: 'Loss of consciousness at onset', ee: 'ONSET' },
    { id: 'hemi', type: 'check', label: 'Hemiplegia, hemianopia and higher cerebral dysfunction (dysphasia, perceptual or cognitive impairment)', ee: 'HEMI' },
    { id: 'drowsy', type: 'check', label: 'Drowsy or comatose after 24 hours', ee: 'DROWSY' },
    { id: 'uncomplicated', type: 'check', label: 'Uncomplicated hemiparesis', ee: 'UNCOMP' }
  ],
  compute(a) {
    const s = a.paralysis + a.drowsy + a.loc + a.hemi - a.uncomplicated + a.age + 1;
    return { score: { value: s, label: 'Score' }, headline: `Risk of death or disability at 6 months: ${s <= 2 ? '47% (95% CI 36% to 58%)' : RISK[s] || '95% (95% CI 90% to 100%)'}` };
  }
};
