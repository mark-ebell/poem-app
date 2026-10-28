// Acute lung injury or cardiogenic pulmonary edema (Schmickl 2012; EE+ 459).
const BANDS = [[-2, 11], [-0.5, 19], [0.5, 34], [1.5, 51], [3, 63], [4.5, 71], [6, 88], [Infinity, 97]];
module.exports = {
  id: 'ali-vs-edema',
  eeId: 459,
  title: 'Acute lung injury vs pulmonary edema diagnosis',
  subtitle: 'Acute lung injury or cardiogenic pulmonary edema in hypoxic ICU patients',
  question: 'For a critically ill patient with hypoxia, how likely is acute lung injury rather than cardiogenic pulmonary edema?',
  inputs: [
    { id: 'young', type: 'check', label: 'Age under 45 years', ee: 'AGE' },
    { id: 'hf', type: 'check', label: 'History of heart failure', ee: 'HF' },
    { id: 'cad', type: 'check', label: 'History of coronary artery disease', ee: 'CAD' },
    { id: 'st', type: 'check', label: 'New ST changes or LBBB', ee: 'ST' },
    { id: 'sepsis', type: 'check', label: 'Sepsis or pancreatitis', ee: 'SEPSIS' },
    { id: 'pneumonia', type: 'check', label: 'Pneumonia', ee: 'PNEUMONIA' },
    { id: 'aspiration', type: 'check', label: 'Aspiration', ee: 'ASPIRATION' },
    { id: 'alcohol', type: 'check', label: 'Alcohol abuse', ee: 'ALCOHOL', note: 'Counts only with sepsis, pneumonia or aspiration.' },
    { id: 'chemo', type: 'check', label: 'Chemotherapy', ee: 'CHEMO' },
    { id: 'hypox', type: 'check', label: 'Persistent hypoxemia (SpO₂/FiO₂ ratio under 235 at 6 hours)', ee: 'HYPOXEMIA' }
  ],
  compute(a) {
    let s = 4.5 * a.young - 1.5 * a.hf - 1 * a.cad - 1.5 * a.st + 2.5 * a.sepsis + 1 * a.pneumonia + 0.5 * a.aspiration + 4 * a.chemo + 1 * a.hypox;
    if (a.sepsis || a.pneumonia || a.aspiration) s += 4 * a.alcohol;
    const p = BANDS.find(([max]) => s <= max)[1];
    return { score: { value: s, label: 'Score' }, level: p < 30 ? 1 : p < 60 ? 2 : p < 85 ? 3 : 4, headline: `${p}% with acute lung injury, ${100 - p}% with cardiogenic pulmonary edema` };
  }
};
