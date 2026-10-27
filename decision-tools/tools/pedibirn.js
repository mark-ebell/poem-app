// PediBIRN 4-variable rule: abusive head trauma in children under 3 in the PICU (Hymel 2014; EE+ 512).
module.exports = {
  id: 'pedibirn',
  eeId: 512,
  title: 'Pediatric abusive head trauma (PediBIRN)',
  subtitle: 'Abusive head trauma in young children with head injury in the PICU',
  question: 'For a child under 3 admitted to the PICU with head trauma not from a motor vehicle crash, should abusive head trauma be evaluated?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'resp', type: 'check', label: 'Clinically significant respiratory compromise at the scene, in transport, in the ED or before admission', ee: 'RESP' },
    { id: 'bruising', type: 'check', label: 'Bruising of the ears, neck or torso', ee: 'BRUISING' },
    { id: 'sdh', type: 'check', label: 'Subdural hemorrhages or fluid collections that are bilateral or interhemispheric', ee: 'HEMORRHAGES' },
    { id: 'fracture', type: 'check', label: 'Any skull fracture other than an isolated, unilateral, nondiastatic, linear parietal fracture', ee: 'FRACTURE' }
  ],
  compute(a) {
    return a.resp || a.bruising || a.sdh || a.fracture ? { level: 4, headline: 'Evaluate thoroughly for abuse: 119 of 215 at high risk in the validation group had abusive head trauma' }
      : { level: 1, headline: 'Abuse unlikely: 5 of 76 in the validation group had abusive head trauma' };
  }
};
