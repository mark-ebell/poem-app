// Ottawa score: recurrent VTE in cancer-associated thrombosis (Louzada; EE+ 476).
module.exports = {
  id: 'ottawa-cancer-vte',
  eeId: 476,
  title: 'Recurrent VTE in cancer (Ottawa score)',
  subtitle: 'Risk of recurrence in cancer-associated venous thromboembolism',
  question: 'For a patient with cancer and a venous thromboembolism, what is the risk of recurrence?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'female', type: 'check', label: 'Female sex', points: 1, ee: 'FEMALE' },
    { id: 'lung', type: 'check', label: 'Lung cancer', points: 1, ee: 'LUNGCA' },
    { id: 'breast', type: 'check', label: 'Breast cancer', points: -1, ee: 'BREASTCA' },
    { id: 'stage1', type: 'check', label: 'TNM stage I', points: -2, ee: 'TNM' },
    { id: 'previous', type: 'check', label: 'Previous VTE', points: 1, ee: 'PREVVTE' }
  ],
  compute(a) {
    const s = a.female + a.lung - a.breast - 2 * a.stage1 + a.previous;
    return s <= 0 ? { score: { value: s, label: 'Ottawa score' }, level: 1, headline: 'Low risk', lines: ['Risk of recurrence 4.5% or less.'] }
      : { score: { value: s, label: 'Ottawa score' }, level: 4, headline: 'High risk', lines: ['Risk of recurrence 19% or more.'] };
  }
};
