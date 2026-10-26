// Six simple variables model: outcome 6 months after stroke (Counsell 2002; FOOD trial validation 2003; EE+ 294).
const yesNo = (id, label, ee, def) => ({ id, type: 'choice', label, ee, default: def, options: [{ label: 'Yes' }, { label: 'No' }] });
// [free of dependency, alive, alive and at home] coefficients when the answer is yes; "no" counts double
// (and adds nothing to survival), as in EE+.
const COEF = { alone: [0.661, 0.406, 1.182], independent: [-2.744, -0.501, -1.167], verbal: [-2.16, -0.776, -1.175], arms: [-2.106, -0.851, -1.404], walk: [-1.311, -0.489, -1.346] };

module.exports = {
  id: 'six-simple-variables',
  eeId: 294,
  title: 'Six simple variables (stroke outcome)',
  subtitle: 'Survival and independence 6 months after acute stroke',
  question: 'For a patient with acute stroke, how likely are survival, living at home and independence at 6 months?',
  inputs: [
    { type: 'text', text: 'If an answer is unknown, leave the starting answer.' },
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 120, step: 1, ee: 'AGE' },
    yesNo('alone', 'Living alone before the stroke', 'IDC_CHECKBOX_1', 0),
    yesNo('independent', 'Independent in daily activities before the stroke', 'IDC_CHECKBOX_2', 0),
    yesNo('verbal', 'Can talk and is oriented (Glasgow verbal score 5)', 'IDC_CHECKBOX_3', 1),
    yesNo('arms', 'Able to lift both arms to horizontal', 'IDC_CHECKBOX_4', 1),
    yesNo('walk', 'Able to walk without help from another person (a stick or walker is allowed)', 'IDC_CHECKBOX_5', 1)
  ],
  compute(a) {
    const s = [12.34 - 0.051 * a.age, (a.age - 70) * 0.034, 9.043 - 0.05 * a.age];
    for (const [id, c] of Object.entries(COEF)) {
      const yes = a[id] === 0;
      s[0] += yes ? c[0] : 2 * c[0]; s[1] += yes ? c[1] : 0; s[2] += yes ? c[2] : 2 * c[2];
    }
    const logistic = x => 100 / (1 + Math.exp(-x)), f = p => `${p.toFixed(1)}%`;
    return {
      headline: `Alive and free of dependency at 6 months: ${f(logistic(s[0]))}`,
      lines: [`Alive: ${f(100 * Math.pow(0.41, Math.exp(s[1])))}`, `Alive and at home: ${f(logistic(s[2]))}`]
    };
  }
};
