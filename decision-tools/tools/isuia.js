// Unruptured intracranial aneurysm: 5-year rupture risk (ISUIA 2003; EE+ 239).
const ANTERIOR = { sah: ['1.5%', '2.6%', '14.5%', '40%'], none: ['0%', '2.6%', '14.5%', '40%'] };
const POSTERIOR = { sah: ['3.2%', '14.5%', '18.4%', '50%'], none: ['2.5%', '14.5%', '18.4%', '50%'] };

module.exports = {
  id: 'isuia',
  eeId: 239,
  title: 'Unruptured intracranial aneurysm rupture risk (ISUIA)',
  subtitle: '5-year risk of rupture',
  question: 'For a patient with an unruptured intracranial aneurysm, what is the 5-year risk of rupture?',
  inputs: [
    { id: 'site', type: 'choice', label: 'Location', ee: 'IDC_COMBOBOX_1', options: ['Cavernous carotid artery', 'Anterior communicating or anterior cerebral artery', 'Internal carotid artery (not cavernous)', 'Middle cerebral artery',
      'Vertebrobasilar artery', 'Posterior cerebral artery system', 'Posterior communicating artery'].map(label => ({ label })) },
    { id: 'size', type: 'choice', label: 'Size', ee: 'IDC_COMBOBOX_2', default: 2, options: [{ label: 'Under 7 mm' }, { label: '7 to 12 mm' }, { label: '13 to 24 mm' }, { label: '25 mm or more' }] },
    { id: 'sah', type: 'check', label: 'Previous subarachnoid hemorrhage from another aneurysm', ee: 'IDC_CHECKBOX_1', when: a => a.size === 0 }
  ],
  compute(a) {
    const r = a.site === 0 ? ['0%', '0%', '3.0%', '6.4%'][a.size] : (a.site <= 3 ? ANTERIOR : POSTERIOR)[a.sah ? 'sah' : 'none'][a.size];
    return { headline: `5-year risk of rupture: ${r}` };
  },
  evidence: { reference: 'Wiebers DO, Whisnant JP, Huston J 3rd, et al. Unruptured intracranial aneurysms: natural history, clinical outcome, and risks of surgical and endovascular treatment. Lancet. 2003;362(9378):103-110.' }
};
