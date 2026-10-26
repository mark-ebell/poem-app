// 30-day mortality in acute MI from the initial ECG and clinical findings (Hathaway, GUSTO-I; EE+ 31).
const opts = (labels, points) => labels.map((label, k) => ({ label, points: points[k] }));
const MORT = [[61, '0.1%'], [87, '0.5%'], [98, '1%'], [110, '2%'], [117, '3%'], [122, '4%'], [125, '5%'], [129, '6%'], [131, '7%'], [134, '8%'], [136, '9%'], [138, '10%'], [151, '20%'], [167, '40%'], [180, '60%'], [Infinity, '80%']];

const tool = module.exports = {
  id: 'hathaway-ecg',
  eeId: 31,
  title: 'Acute MI prognosis from the initial ECG (GUSTO-I)',
  subtitle: '30-day mortality in acute MI presenting within 6 hours',
  question: 'For a patient with acute MI presenting within 6 hours of chest pain onset, what is the 30-day mortality, based on the initial ECG?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age (years)', ee: 'AGE', default: 4, options: opts(['20', '30', '40', '50', '60', '70', '80', '90', '100'], [0, 13, 25, 38, 50, 62, 75, 87, 100]) },
    { id: 'sbp', type: 'choice', label: 'Systolic BP (mm Hg)', ee: 'SYSTOLIC', default: 8, options: opts(['40', '50', '60', '70', '80', '90', '100', '110', '120', '140', '150', '160'], [46, 40, 34, 28, 23, 17, 11, 6, 0, 0, 0, 0]) },
    { id: 'pulse', type: 'choice', label: 'Pulse (beats/min)', ee: 'PULSE', default: 2, options: opts(['40', '60', '80', '100', '120', '140', '160', '180', '200'], [0, 0, 6, 11, 17, 23, 28, 34, 40]) },
    { id: 'height', type: 'choice', label: 'Height (cm)', ee: 'HEIGHT', default: 4, options: opts(['140', '150', '160', '170', '180', '190', '200', '210', '220'], [30, 27, 23, 19, 15, 11, 8, 4, 0]) },
    { id: 'killip', type: 'choice', label: 'Killip class', ee: 'KILLIP', options: opts(['I: no symptoms with normal activity, clear lungs', 'II: symptoms with normal activity that subside with rest', 'III: symptoms with minimal activity or at rest, pulmonary edema', 'IV: cardiogenic shock'], [0, 8, 18, 30]) },
    { id: 'st', type: 'choice', label: 'Sum of absolute ST-segment deviation (mm)', ee: 'SUM', options: opts(['0', '10', '20', '30', '40', '50', '60', '70', '80'], [0, 7, 15, 19, 19, 19, 19, 19, 18]) },
    { id: 'qrs', type: 'choice', label: 'QRS duration (ms)', ee: 'QRS', default: 3, options: ['60', '80', '100', '120', '140', '160', '180', '200'].map(label => ({ label })) },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'diabetes', type: 'check', label: 'History of diabetes', points: 6, ee: 'HISTORY' },
    { id: 'cabg', type: 'check', label: 'Prior CABG', points: 10, ee: 'CABG' },
    { id: 'prior', type: 'check', label: 'ECG evidence of prior infarct', ee: 'INFARCT' },
    { id: 'anterior', type: 'check', label: 'Anterior MI', ee: 'ANTERIOR' },
    { id: 'inferior', type: 'check', label: 'Inferior MI', ee: 'INFERIOR' }
  ],
  footnote: 'QRS duration points depend on infarct location (anterior or not). Prior infarct on ECG, or an MI that is not inferior, adds 10 points.',
  scoreOf(a) {
    const pts = (id) => tool.inputs.find(i => i.id === id).options[a[id]].points;
    const qrs = a.anterior ? [16, 21, 26, 31, 36, 41, 47, 52] : [22, 23, 25, 26, 27, 29, 30, 32];
    return pts('age') + pts('sbp') + pts('pulse') + pts('height') + pts('killip') + pts('st') + qrs[a.qrs]
      + 6 * a.diabetes + 10 * a.cabg + (a.prior || !a.inferior ? 10 : 0);
  },
  compute(a) {
    const s = tool.scoreOf(a);
    const m = MORT.find(([max]) => s <= max)[1];
    return { score: { value: s, label: 'Score' }, headline: `30-day mortality: ${m}` };
  }
};
