// Mortality of elective abdominal aortic aneurysm surgery (Steyerberg 1995; EE+ 17).
const MORT = [[-2.5, '1%'], [2.5, '2%'], [7.5, '3%'], [12.5, '5%'], [17.5, '8%'], [22.5, '12%'], [27.5, '19%'], [32.5, '28%'], [37.5, '39%'], [Infinity, '51%']];

module.exports = {
  id: 'aaa-mortality',
  eeId: 17,
  title: 'Elective AAA surgery mortality (Steyerberg)',
  subtitle: 'Perioperative mortality of elective abdominal aortic aneurysm repair',
  question: 'For a patient having elective open repair of an abdominal aortic aneurysm, what is the risk of perioperative death?',
  inputs: [
    { id: 'center', type: 'choice', label: "Your center's overall AAA surgical mortality", ee: 'AAA', options: ['3%', '4%', '5%', '6%', '8%', '12%'].map(label => ({ label })) },
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [{ label: '65 or younger' }, { label: '66 to 75' }, { label: 'Over 75' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'female', type: 'check', label: 'Female', ee: 'FEMALE' },
    { id: 'mi', type: 'check', label: 'Documented history of MI', ee: 'HISTORY' },
    { id: 'chf', type: 'check', label: 'Cardiogenic pulmonary edema, jugular venous distension or a gallop rhythm, regardless of treatment', ee: 'CARDIO' },
    { id: 'st', type: 'check', label: 'ST depression over 2 mm on the resting ECG', ee: 'ST' },
    { id: 'pulm', type: 'check', label: 'Pulmonary comorbidity (COPD, emphysema, dyspnea or previous pulmonary surgery)', ee: 'COPD' },
    { id: 'creat', type: 'check', label: 'Serum creatinine 1.8 mg/dL (158 µmol/L) or more', ee: 'SERUM' }
  ],
  compute(a) {
    const s = [-5, -2, 0, 2, 5, 10][a.center] + [-4, 0, 4][a.age] + 4 * a.female + 3 * a.mi + 8 * a.chf + 8 * a.st + 7 * a.pulm + 12 * a.creat;
    return { score: { value: s, label: 'Score' }, headline: `Estimated perioperative mortality: ${MORT.find(([max]) => s <= max)[1]}` };
  }
};
