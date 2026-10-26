// Upper extremity DVT: Constans score and diagnostic algorithm (Kleinjan; EE+ 504).
module.exports = {
  id: 'upper-extremity-dvt',
  eeId: 504,
  title: 'Upper extremity DVT (Constans score)',
  subtitle: 'Clinical probability and diagnostic algorithm',
  question: 'For a patient with suspected upper extremity deep vein thrombosis, is DVT likely, and what is the next step?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'material', type: 'check', label: 'Venous material present (central venous catheter or pacemaker lead)', points: 1, ee: 'VENOUS' },
    { id: 'pain', type: 'check', label: 'Localized pain', points: 1, ee: 'PAIN' },
    { id: 'edema', type: 'check', label: 'Unilateral edema', points: 1, ee: 'EDEMA' },
    { id: 'other', type: 'check', label: 'Another diagnosis at least as plausible', points: -1, ee: 'OTHER' }
  ],
  compute(a) {
    const s = a.material + a.pain + a.edema - a.other;
    return s < 2
      ? { score: { value: s, label: 'Constans score' }, level: 1, headline: 'Upper extremity DVT unlikely', lines: ['Order a D-dimer. If normal, follow up in 3 months. If abnormal, order compression ultrasound: if positive, treat; if negative, follow up at 3 months; if inconclusive, repeat the ultrasound.'] }
      : { score: { value: s, label: 'Constans score' }, level: 3, headline: 'Upper extremity DVT likely', lines: ['Order compression ultrasound. If positive, treat. If inconclusive, repeat the ultrasound and, if necessary, order a venogram. If negative, order a D-dimer: if normal, follow up at 3 months; if abnormal, repeat the ultrasound.'] };
  }
};
