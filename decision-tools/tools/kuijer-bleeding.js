// Bleeding during anticoagulation for venous thromboembolism (Kuijer 1999; EE+ 106).
// Score = 1.6 (age 60 or older) + 1.3 (female) + 2.2 (cancer); EE+ replaced the score with 1.6 for age
// instead of adding it, which never changed the risk group.
module.exports = {
  id: 'kuijer-bleeding',
  eeId: 106,
  title: 'Bleeding on warfarin for VTE (Kuijer)',
  subtitle: 'Bleeding during the first 3 months of anticoagulation for venous thromboembolism',
  question: 'For a patient starting anticoagulation for DVT or PE, what is the risk of bleeding in the first 3 months?',
  inputs: [
    { id: 'sex', type: 'choice', label: 'Sex', ee: 'MALE', options: [{ label: 'Male' }, { label: 'Female' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age 60 or older', ee: 'AGE' },
    { id: 'cancer', type: 'check', label: 'Malignancy', ee: 'MALIGNANCY' }
  ],
  compute(a) {
    const s = 1.6 * a.age + 1.3 * (a.sex === 1) + 2.2 * a.cancer;
    return s === 0 ? { score: { value: 0, label: 'Score' }, level: 1, headline: 'Low risk: 4% any bleeding, 1% major bleeding' }
      : s <= 3 ? { score: { value: Number(s.toFixed(1)), label: 'Score' }, level: 2, headline: 'Moderate risk: 8% any bleeding, 2% major bleeding' }
      : { score: { value: Number(s.toFixed(1)), label: 'Score' }, level: 4, headline: 'High risk: 17% any bleeding, 7% major bleeding' };
  }
};
