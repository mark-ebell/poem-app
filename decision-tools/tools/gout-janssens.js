// Diagnostic rule for gout in primary care (Janssens 2010; EE+ 439).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'gout-janssens',
  eeId: 439,
  title: 'Gout diagnosis (Janssens rule)',
  subtitle: 'Gout in primary care patients with monoarthritis',
  question: 'For a primary care patient with acute monoarthritis, how likely is gout?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male sex', points: 2, ee: 'MALE' },
    { id: 'previous', type: 'check', label: 'Previous patient-reported arthritis attack', points: 2, ee: 'PREVIOUS_ATTACK' },
    { id: 'onset', type: 'check', label: 'Onset within 1 day', points: 0.5, ee: 'PAIN' },
    { id: 'redness', type: 'check', label: 'Joint redness', points: 1, ee: 'REDNESS' },
    { id: 'mtp', type: 'check', label: 'First metatarsophalangeal joint involved', points: 2.5, ee: 'MTP' },
    { id: 'htn', type: 'check', label: 'Hypertension or cardiovascular disease', points: 1.5, ee: 'HYPERTENSION_CVD' },
    { id: 'urate', type: 'check', label: 'Serum uric acid above 5.88 mg/dL (350 µmol/L)', points: 3.5, ee: 'SERUM_URIC' }
  ],
  points: { label: 'Score', max: 13 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 4 ? { level: 1, headline: '2 of 72 (2.7%) had gout' } : s < 8 ? { level: 2, headline: '17 of 63 (27%) had gout' } : { level: 4, headline: '197 of 245 (80.4%) had gout' };
  }
};
