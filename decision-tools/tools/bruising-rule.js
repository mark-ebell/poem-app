// Bruising Clinical Decision Rule (TEN-4-FACESp; Pierce 2021; EE+ 603).
module.exports = {
  id: 'bruising-rule',
  eeId: 603,
  title: 'Child abuse from bruising (Bruising Clinical Decision Rule)',
  subtitle: 'Bruising that suggests abuse in children under 4',
  question: 'For a child under 4 seen with trauma and bruising, does the bruising suggest abuse?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'region', type: 'check', label: 'Bruising on the ear, neck or torso (chest, abdomen, back, buttocks or genitourinary area)', ee: 'cb1' },
    { id: 'infant', type: 'check', label: 'Any bruising in an infant under 5 months', ee: 'cb2' },
    { id: 'pattern', type: 'check', label: 'Patterned bruise (bite, loop, hand slap, squeeze, grab or multilinear)', ee: 'cb3' },
    { id: 'face', type: 'check', label: 'Bruising of the frenulum, angle of the jaw, fleshy cheeks, eyelids or subconjunctivae', ee: 'cb4' }
  ],
  footnote: 'Likelihoods are from a validation study with an overall likelihood of abuse of 19%.',
  compute(a) {
    return a.region || a.infant || a.pattern || a.face ? { level: 4, headline: 'Positive screen for child abuse; further assessment needed', lines: ['64% with a positive screen had been abused.'] }
      : { level: 1, headline: 'Negative screen for child abuse', lines: ['1.2% with a negative screen had been abused.'] };
  }
};
