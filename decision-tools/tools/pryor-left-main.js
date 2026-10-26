// Probability of left main coronary artery disease (Pryor; EE+ 42).
const { logistic } = require('../lib');

module.exports = {
  id: 'pryor-left-main',
  eeId: 42,
  title: 'Left main CAD (Pryor)',
  subtitle: 'Probability of left main coronary artery disease',
  question: 'In a patient with chest pain referred for testing, how likely is left main coronary artery disease?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 110, step: 1, ee: 'AGE' },
    { id: 'duration', type: 'number', label: 'Duration of symptoms', unit: 'months', min: 0.1, max: 600, step: 0.1, ee: 'DURATION' },
    { id: 'episodes', type: 'number', label: 'Episodes of pain per week', min: 0, max: 1000, step: 1, ee: 'EPISODES' },
    { id: 'pain', type: 'choice', label: 'Type of pain', ee: 'PAIN_TYPE', options: [{ label: 'Typical angina' }, { label: 'Atypical angina' }, { label: 'Non-anginal' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'female', type: 'check', label: 'Female', ee: 'FEMALE' },
    { id: 'htn', type: 'check', label: 'Hypertension', ee: 'HYPERTENSION' },
    { id: 'lipids', type: 'check', label: 'Hyperlipidemia', ee: 'HYPER' },
    { id: 'diabetes', type: 'check', label: 'Diabetes', ee: 'DIABETES' },
    { id: 'nocturnal', type: 'check', label: 'Nocturnal angina', ee: 'ANGINA' },
    { id: 'progressive', type: 'check', label: 'Progressive pain', ee: 'PROGRESSIVE' },
    { id: 'pvd', type: 'check', label: 'History of peripheral vascular disease', ee: 'VASCULAR' },
    { id: 'cvd', type: 'check', label: 'History of cerebrovascular disease', ee: 'HISTORY' },
    { id: 'bruit', type: 'check', label: 'Carotid bruit', ee: 'CARTOID' },
    { id: 'q', type: 'check', label: 'Q waves on ECG', ee: 'Q_WAVE' },
    { id: 'stt', type: 'check', label: 'ST-T wave changes on ECG', ee: 'ST_WAVE' }
  ],
  compute(a) {
    const episodes = Math.min(a.episodes, 35);
    const typical = a.pain === 0 ? 1 : 0;
    const painType = [2, 1, 0][a.pain];
    const stNoQ = a.stt && !a.q ? 1 : 0;
    const painIndex = typical * episodes * (+a.progressive + 4) * (stNoQ + 2) * +a.nocturnal;
    const logDur = Math.log10(a.duration) + 1;
    const x = -3.4732 + logDur * 0.3424 + painType * 0.3014 + logDur * painType * 0.1559 + a.age * 0.0299
      + 0.3513 * a.q + 0.0054 * painIndex - 0.3823 * a.female + 0.1734 * (a.lipids + a.diabetes + a.htn)
      + 0.2402 * (a.pvd + a.cvd + a.bruit);
    const p = logistic(x);
    return { headline: `Probability of left main CAD: ${p < 10 ? p.toFixed(1) : Math.round(p)}%` };
  }
};
