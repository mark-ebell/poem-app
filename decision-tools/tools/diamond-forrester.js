// Pretest probability of coronary artery disease (Diamond-Forrester; EE+ 336).
const P = { // [sex][age group][asymptomatic, nonanginal, atypical, typical]
  0: [[2.0, 5.2, 21.8, 69.7], [5.5, 14.1, 46.1, 87.3], [9.7, 21.5, 58.9, 92], [12.3, 28.1, 67.1, 94.4]],
  1: [[0.3, 0.8, 4.2, 25.8], [1.0, 2.8, 13.3, 55.2], [3.2, 8.4, 32.4, 79.4], [7.5, 18.6, 54.4, 90.6]]
};

module.exports = {
  id: 'diamond-forrester',
  eeId: 336,
  title: 'Diamond-Forrester pretest probability of CAD',
  subtitle: 'Pretest probability of coronary artery disease by age, sex and symptoms',
  question: 'Before testing, how likely is coronary artery disease given age, sex and type of chest pain?',
  inputs: [
    { id: 'sex', type: 'choice', label: 'Sex', ee: 'GENDER', options: [{ label: 'Male' }, { label: 'Female' }] },
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [{ label: '30 to 39 years' }, { label: '40 to 49 years' }, { label: '50 to 59 years' }, { label: '60 to 69 years' }] },
    { id: 'pain', type: 'choice', label: 'Type of chest pain', ee: 'ANGINA',
      note: 'Typical angina: discomfort (1) in the anterior chest, neck, shoulders, jaw or arms, (2) brought on by physical exertion or psychological stress, and (3) relieved by rest or nitroglycerin within minutes. Atypical: 2 of these 3 features. Nonanginal: fewer than 2.',
      options: [{ label: 'Asymptomatic' }, { label: 'Nonanginal' }, { label: 'Atypical angina' }, { label: 'Typical angina' }] }
  ],
  compute(a) {
    const p = P[a.sex][a.age][a.pain];
    return { headline: `Probability of CAD: ${Number.isInteger(p) ? p : p.toFixed(1)}%`,
      note: a.pain === 0 ? 'The probability in asymptomatic people comes from autopsy studies.' : undefined };
  }
};
