// Neurologic outcome after surgery for brain arteriovenous malformation (Spears 2006; EE+ 347).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'spears-avm',
  eeId: 347,
  title: 'Brain AVM surgery outcome (Spears)',
  subtitle: 'Disabling neurologic outcome after AVM surgery',
  question: 'For a patient having surgery for a brain arteriovenous malformation, what is the risk of a disabling neurologic outcome?',
  inputs: [
    { type: 'text', text: 'Based on MRI and angiography.' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'eloquence', type: 'check', label: 'Eloquent location', points: 4, ee: 'chk1',
      note: 'Nidus in sensorimotor, language or visual cortex, thalamus, hypothalamus, internal capsule, brain stem, cerebellar peduncles or deep cerebellar nuclei.' },
    { id: 'diffuse', type: 'check', label: 'Diffuse nidus', points: 3, ee: 'chk3',
      note: 'Brain tissue seen between the vessels of the nidus on MRI, or expected on angiography (a compact nidus has clear margins and no brain tissue within it).' },
    { id: 'deep', type: 'check', label: 'Deep venous drainage', points: 2, ee: 'chk2', note: 'Any drainage of the nidus into the deep venous system.' }
  ],
  points: { label: 'Score', max: 9 },
  compute(a) {
    const s = pointsOf(tool, a);
    const [level, label, early, permanent] = s <= 2 ? [1, 'Low risk', '4%', '1%'] : s <= 5 ? [2, 'Moderate risk', '20%', '3%'] : s <= 7 ? [3, 'High risk', '31%', '19%'] : [4, 'Very high risk', '51%', '31%'];
    return { level, headline: label, lines: [`Disabling neurologic outcome: ${early} early, ${permanent} permanent.`] };
  },
  evidence: { reference: 'Spears J, TerBrugge KG, Moosavian M, et al. A discriminative prediction model of neurological outcome for patients undergoing surgery of brain arteriovenous malformations. Stroke. 2006;37(6):1457-1464.' }
};
