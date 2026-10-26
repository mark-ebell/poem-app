// LEFt score: DVT in pregnancy (Le Moigne validation; EE+ 525).
module.exports = {
  id: 'left-score',
  eeId: 525,
  title: 'LEFt score',
  subtitle: 'Deep vein thrombosis in pregnancy',
  question: 'For a pregnant woman with clinically suspected DVT, how likely is DVT?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'left', type: 'check', label: 'Left leg symptoms', points: 1, ee: 'LEFT' },
    { id: 'edema', type: 'check', label: 'Edema, with a calf circumference difference of 2 cm or more', points: 1, ee: 'EDEMA' },
    { id: 'first', type: 'check', label: 'First-trimester presentation', points: 1, ee: 'FIRST' }
  ],
  points: { label: 'LEFt score', max: 3 },
  compute(a) {
    const s = a.left + a.edema + a.first;
    return s === 0 ? { level: 1, headline: 'Low risk', lines: ['1 of 164 (0.8%, 95% CI 0.2% to 2.7%) had DVT.'] }
      : s === 1 ? { level: 2, headline: 'Moderate risk', lines: ['9 of 198 (5.0%, 95% CI 2.4% to 8.4%) had DVT.'] }
      : { level: 4, headline: 'High risk', lines: ['29 of 77 (38%, 95% CI 23% to 44%) had DVT.'] };
  }
};
