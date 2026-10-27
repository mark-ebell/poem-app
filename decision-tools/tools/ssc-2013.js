// 2013 ACR/EULAR classification criteria for systemic sclerosis (van den Hoogen 2013; EE+ 593).
const check = (id, label, ee) => ({ id, type: 'check', label, ee });

module.exports = {
  id: 'ssc-2013',
  eeId: 593,
  title: 'Systemic sclerosis criteria (ACR/EULAR 2013)',
  subtitle: 'Classification criteria for systemic sclerosis',
  question: 'Does a patient with suspected systemic sclerosis meet the 2013 ACR/EULAR criteria?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    check('proximal', 'Skin thickening of the fingers of both hands extending proximal to the MCP joints', 'cb1'),
    check('puffy', 'Skin thickening of the fingers: puffy fingers', 'cb2'),
    check('sclerodactyly', 'Skin thickening of the fingers: sclerodactyly (distal to the MCP but proximal to the PIP joints)', 'cb3'),
    check('ulcers', 'Fingertip lesions: digital tip ulcers', 'cb4'),
    check('pitting', 'Fingertip lesions: fingertip pitting scars', 'cb5'),
    check('telangiectasia', 'Telangiectasia', 'cb6'),
    check('nailfold', 'Abnormal nailfold capillaries', 'cb7'),
    check('pah', 'Pulmonary arterial hypertension', 'cb8'),
    check('ild', 'Interstitial lung disease', 'cb9'),
    check('raynaud', "Raynaud's phenomenon", 'cb10'),
    check('antibodies', 'Systemic sclerosis autoantibodies (anticentromere, anti-topoisomerase I [anti-Scl-70] or anti-RNA polymerase III)', 'cb11')
  ],
  footnote: 'Only the higher-scoring item counts within the finger-thickening and fingertip-lesion groups, and PAH and ILD together count 2 points.',
  compute(a) {
    const s = 9 * a.proximal + (a.sclerodactyly ? 4 : a.puffy ? 2 : 0) + (a.pitting ? 3 : a.ulcers ? 2 : 0) + 2 * a.telangiectasia + 2 * a.nailfold
      + (a.pah || a.ild ? 2 : 0) + 3 * a.raynaud + 3 * a.antibodies;
    return s >= 9 ? { score: { value: s, label: 'Score' }, level: 3, headline: 'Meets criteria for definite systemic sclerosis' }
      : { score: { value: s, label: 'Score' }, level: 1, headline: 'Does not meet criteria for definite systemic sclerosis' };
  }
};
