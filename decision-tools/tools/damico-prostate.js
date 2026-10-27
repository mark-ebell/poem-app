// D'Amico nomogram: 2-year PSA recurrence after surgery or radiation for localized prostate cancer
// (D'Amico 1999; EE+ 304). Table as in EE+, indexed [treatment][PSA][Gleason][stage].
const T = [[[[4,5,8,10],[8,9,15,18],[10,11,19,24],[14,15,25,31],[24,26,42,50]],[[5,6,10,13],[10,11,18,22],[13,14,24,29],[17,19,31,37],[29,32,50,58]],[[7,8,15,18],[14,15,25,31],[18,20,33,39],[24,26,42,49],[39,43,63,72]],[[18,20,33,40],[31,34,52,61],[40,43,63,72],[50,53,75,82],[72,76,92,96]]],
  [[[3,4,5,6],[7,8,11,12],[10,12,16,17],[14,18,23,25],[29,36,45,48]],[[4,5,6,7],[8,10,13,14],[11,14,18,20],[16,20,26,28],[33,40,50,52]],[[4,5,7,8],[9,12,16,17],[14,17,22,24],[20,25,32,34],[39,47,58,61]],[[7,9,12,13],[16,20,26,27],[23,28,36,38],[32,39,49,51],[58,67,78,80]]]];

module.exports = {
  id: 'damico-prostate',
  eeId: 304,
  title: "Prostate cancer 2-year recurrence (D'Amico)",
  subtitle: 'PSA recurrence 2 years after surgery or radiation',
  question: 'For a man with localized prostate cancer (T1c to T2), what is the risk of PSA recurrence within 2 years of surgery or radiation?',
  inputs: [
    { id: 'treatment', type: 'choice', label: 'Treatment', ee: 'cboTreatment', options: [{ label: 'Surgery' }, { label: 'Radiation' }] },
    { id: 'psa', type: 'choice', label: 'PSA', ee: 'cboPSA', options: [{ label: '0 to 4.0 ng/mL' }, { label: '4.1 to 10' }, { label: '10.1 to 20' }, { label: '20.1 to 50' }] },
    { id: 'gleason', type: 'choice', label: 'Gleason score', ee: 'cboGleason', options: [{ label: '2 to 4' }, { label: '5' }, { label: '6' }, { label: '7' }, { label: '8 to 10' }] },
    { id: 'stage', type: 'choice', label: 'Stage', ee: 'cboStage', options: [{ label: 'T1c' }, { label: 'T2a' }, { label: 'T2b' }, { label: 'T2c' }] }
  ],
  footnote: 'Developed in a large population but not prospectively validated.',
  compute(a) {
    return { headline: `2-year PSA recurrence: ${T[a.treatment][a.psa][a.gleason][a.stage]}%` };
  }
};
