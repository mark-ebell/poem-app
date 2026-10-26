// PEN-FAST: likelihood of true penicillin allergy (Trubiano; EE+ 609).
module.exports = {
  id: 'pen-fast',
  eeId: 609,
  title: 'PEN-FAST',
  subtitle: 'Likelihood of a true penicillin allergy',
  question: 'For an adult with a history of penicillin allergy, how likely is a positive penicillin allergy test?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'recent', type: 'check', label: '5 years or less since the reaction', points: 2, ee: 'cb1' },
    { id: 'anaphylaxis', type: 'check', label: 'Anaphylaxis or angioedema', ee: 'cb2' },
    { id: 'scar', type: 'check', label: 'Severe cutaneous adverse reaction (SCAR)', ee: 'cb3',
      note: 'SCAR: Stevens-Johnson syndrome, toxic epidermal necrolysis, drug reaction with eosinophilia and systemic symptoms, or acute generalized exanthematous pustulosis; also a severe delayed rash with mucosal involvement.' },
    { id: 'treatment', type: 'check', label: 'Treatment required for the reaction', points: 1, ee: 'cb4' }
  ],
  footnote: 'Anaphylaxis, angioedema or SCAR adds 2 points (once).',
  compute(a) {
    const s = 2 * a.recent + (a.anaphylaxis || a.scar ? 2 : 0) + a.treatment;
    const r = s === 0 ? [1, 'Very low risk', 'below 1%'] : s <= 2 ? [1, 'Low risk', '5%'] : s === 3 ? [2, 'Moderate risk', '20%'] : [4, 'High risk', '50%'];
    return { score: { value: s, max: 5, label: 'PEN-FAST' }, level: r[0], headline: r[1], lines: [`Positive penicillin allergy test: ${r[2]}.`] };
  }
};
