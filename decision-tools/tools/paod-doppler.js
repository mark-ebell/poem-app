// Peripheral arterial disease: Doppler and pulse examination (Farkouh 2002; EE+ 334).
const PT = { type: 'choice', options: [{ label: '0' }, { label: '1' }, { label: '2' }, { label: '3' }], default: 3 };
const PALP = { type: 'choice', options: [{ label: 'Not palpable' }, { label: 'Abnormal' }, { label: 'Normal' }], default: 2 };
const scoreOf = a => a.ptR + a.palpR + (a.legs === 1 ? a.ptL + a.palpL : 0) + (a.mi ? 0 : 1);

module.exports = {
  id: 'paod-doppler',
  eeId: 334,
  title: 'Peripheral arterial disease: Doppler and pulse examination',
  subtitle: 'Low ankle-brachial index in older adults',
  question: 'For an older adult with suspected peripheral arterial disease, how do the posterior tibial pulse and Doppler signal change its likelihood?',
  inputs: [
    { id: 'legs', type: 'choice', label: 'Legs examined', ee: 'COMBO_Legs', default: 1, options: [{ label: 'One leg' }, { label: 'Both legs' }] },
    { id: 'ptR', ...PT, label: 'Right leg (or the leg examined): posterior tibial Doppler, number of components heard', ee: 'COMBO_PostTibR',
      note: 'A normal Doppler arterial signal has 3 components (triphasic).' },
    { id: 'palpR', ...PALP, label: 'Right leg (or the leg examined): palpated posterior tibial pulse', ee: 'COMBO_PalpateR' },
    { id: 'ptL', ...PT, label: 'Left leg: posterior tibial Doppler, number of components heard', ee: 'COMBO_PostTibL', when: a => a.legs === 1 },
    { id: 'palpL', ...PALP, label: 'Left leg: palpated posterior tibial pulse', ee: 'COMBO_PalpateL', when: a => a.legs === 1 },
    { type: 'heading', label: 'Check if present' },
    { id: 'mi', type: 'check', label: 'History of MI', ee: 'CHK_MI' }
  ],
  footnote: 'Score: Doppler components (0 to 3) plus pulse (0 not palpable, 1 abnormal, 2 normal) for each leg examined, plus 1 point if there is no history of MI.',
  scoreOf,
  compute(a) {
    const s = scoreOf(a), one = a.legs === 0, cut = one ? 4 : 6;
    const less = s >= cut;
    return {
      score: { value: s, max: one ? 6 : 11, label: 'Score' },
      level: less ? 1 : 3,
      headline: less ? 'PAD less likely' : 'PAD more likely',
      lines: [`Likelihood ratio ${less ? (one ? 0.1 : 0.2) : (one ? 4.9 : 7.8)} (score ${cut} or more is reassuring when ${one ? 'one leg is' : 'both legs are'} examined).`]
    };
  },
  evidence: {
    reference: 'Farkouh ME, Oddone EZ, Simel DL. Improving the clinical examination for a low ankle-brachial index. Int J Angiol. 2002;11:41-45.',
    comment: 'Not prospectively validated.'
  }
};
