// Vancouver Chest Pain Rule (Cullen external validation; EE+ 586).
module.exports = {
  id: 'vancouver-chest-pain',
  eeId: 586,
  title: 'Vancouver Chest Pain Rule',
  subtitle: 'Identifying patients for early ED discharge',
  question: 'For a patient with chest pain suggestive of acute coronary syndrome, who is a candidate for early discharge from the emergency department?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'ecg', type: 'check', label: 'Abnormal initial ECG', ee: 'cb1' },
    { id: 'troponin', type: 'check', label: 'Positive troponin at 2 hours', ee: 'cb2' },
    { id: 'prior', type: 'check', label: 'Prior acute coronary syndrome or nitroglycerin use', ee: 'cb3' },
    { id: 'age', type: 'check', label: 'Age 50 or older', ee: 'cb4' },
    { id: 'radiates', type: 'check', label: 'Pain radiates to the neck, jaw or left arm', ee: 'cb5' },
    { id: 'palpation', type: 'check', label: 'Palpation reproduces the pain', ee: 'cb6' }
  ],
  compute(a) {
    const no = n => ({ level: 3, headline: 'Not a candidate for early discharge', lines: [`${n} were diagnosed with ACS within 30 days.`] });
    const yes = n => ({ level: 1, headline: 'Candidate for early ED discharge', lines: [`${n} were diagnosed with ACS within 30 days.`] });
    if (a.ecg || a.troponin || a.prior) return no('305 of 855');
    if (a.palpation) return yes('2 of 86');
    if (a.age || a.radiates) return no('26 of 568');
    return yes('1 of 126');
  }
};
