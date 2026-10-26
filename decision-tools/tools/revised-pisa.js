// Revised Pisa model for pulmonary embolism (Miniati 2008; EE+ 452).
const AGE = [0, 0.8, 0.87, 1.14];
const ITEMS = [['male', 'Male sex', 0.6, 'MALE'], ['immobile', 'Recent immobilization', 0.42, 'IMMOBILIZATION'], ['dvt', 'Previous deep vein thrombosis (ever)', 0.64, 'DVT'],
  ['cvd', 'Pre-existing cardiovascular disease', -0.51, 'CD'], ['lung', 'Pre-existing pulmonary disease', -0.89, 'PULMONARY'],
  ['dyspnea', 'Dyspnea of sudden onset', 2.0, 'DYSPNEA'], ['orthopnea', 'Orthopnea', -1.51, 'ORTHOPNEA'], ['pain', 'Chest pain', 1.01, 'CHESTPAIN'], ['syncope', 'Fainting or syncope', 0.66, 'FAINTING'],
  ['hemoptysis', 'Hemoptysis', 0.93, 'HEMOPTYSIS'], ['leg', 'Unilateral leg swelling', 0.8, 'LEGSWELLING'], ['fever', 'Temperature above 38 °C', -1.47, 'TEMP'],
  ['wheezes', 'Wheezes', -1.2, 'WHEEZES'], ['crackles', 'Crackles', -0.61, 'CRACKLES'],
  ['corPulmonale', 'Acute cor pulmonale on ECG (S1Q3T3, S1S2S3, negative T waves in right precordial leads, transient RBBB, or pseudo-infarction)', 1.96, 'ECG']];

module.exports = {
  id: 'revised-pisa',
  eeId: 452,
  title: 'Pulmonary embolism diagnosis (revised Pisa model)',
  subtitle: 'Probability of PE from history, symptoms and ECG',
  question: 'For a non-pregnant adult with suspected pulmonary embolism, how likely is PE?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [{ label: 'Under 57' }, { label: '57 to 67' }, { label: '68 to 74' }, { label: '75 or older' }] },
    { type: 'heading', label: 'Check all that apply' },
    ...ITEMS.map(([id, label, , ee]) => ({ id, type: 'check', label, ee }))
  ],
  compute(a) {
    const x = -3.43 + AGE[a.age] + ITEMS.reduce((n, [id, , b]) => n + (a[id] ? b : 0), 0);
    const p = 100 / (1 + Math.exp(-x));
    const r = p < 10 ? [1, 'Low risk'] : p < 50 ? [2, 'Intermediate risk'] : p < 80 ? [3, 'Moderately high risk'] : [4, 'High risk'];
    return { level: r[0], headline: r[1], lines: [`Probability of PE: ${p.toFixed(1)}%`] };
  }
};
