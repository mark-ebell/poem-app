// Duke treadmill score (EE+ 4).
const RISK = {
  normal: [ // resting ECG normal
    { min: 5, group: 'Low', level: 1, overall: '5%', cardiac: '1%', any: '12%' },
    { min: -10, group: 'Intermediate', level: 2, overall: '9%', cardiac: '3%', any: '22%' },
    { min: -Infinity, group: 'High', level: 3, overall: '22%', cardiac: '7%', any: '40%' }],
  nonspecific: [
    { min: 5, group: 'Low', level: 1, overall: '9%', cardiac: '3%', any: '16%' },
    { min: -10, group: 'Intermediate', level: 2, overall: '20%', cardiac: '8%', any: '27%' },
    { min: -Infinity, group: 'High', level: 3, overall: '22%', cardiac: '24%', any: '62%' }]
};

module.exports = {
  id: 'duke-treadmill',
  eeId: 4,
  title: 'Duke treadmill score',
  subtitle: 'Treadmill exercise test interpretation',
  question: 'After a treadmill exercise test, what is the 7-year risk of death and cardiac events?',
  inputs: [
    { id: 'duration', type: 'number', label: 'Duration of exercise', unit: 'min', min: 0.1, max: 30, step: 0.1, ee: 'DURATION' },
    { id: 'st', type: 'choice', label: 'Maximal ST-segment deviation', ee: 'ST', options: [
      { label: '0 mm' }, { label: '1 mm' }, { label: '2 mm' }, { label: '3 mm' }, { label: '4 mm' }, { label: '5 mm' }, { label: '6 mm' }, { label: 'More than 6 mm' }] },
    { id: 'resting', type: 'choice', label: 'Resting ECG', ee: 'RESTING', options: [
      { label: 'Normal' }, { label: 'Nonspecific ST-T wave changes (less than 1 mm)' }] },
    { id: 'angina', type: 'choice', label: 'Angina during the test', ee: 'TYPE', options: [
      { label: 'None' }, { label: 'Non-limiting angina' }, { label: 'Exercise-limiting angina' }] }
  ],
  evidence: { reference: 'Kwok, Miller, Christian, et al. Prognostic value of a treadmill exercise score in symptomatic patients with nonspecific ST-T abnormalities on resting ECG. JAMA 1999; 282: 1047-53.' },
  compute(a) {
    const score = a.duration - 5 * (a.st === 7 ? 7 : a.st) - 4 * a.angina;
    const r = (a.resting === 0 ? RISK.normal : RISK.nonspecific).find(x => score >= x.min);
    return {
      score: { value: Math.round(score * 10) / 10, label: 'Duke treadmill score' },
      level: r.level,
      headline: `${r.group} risk`,
      lines: [{ label: 'Overall mortality (7 years)', value: r.overall }, { label: 'Cardiac death (7 years)', value: r.cardiac },
        { label: 'Cardiac death, MI or late revascularization (7 years)', value: r.any }],
      note: 'Score = exercise minutes − 5 × ST deviation (mm) − 4 × angina index (0 none, 1 non-limiting, 2 exercise-limiting).'
    };
  }
};
