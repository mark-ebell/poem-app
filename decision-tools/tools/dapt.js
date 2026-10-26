// DAPT score: benefit and harm of dual antiplatelet therapy beyond 1 year after PCI (Yeh; EE+ 562).
module.exports = {
  id: 'dapt',
  eeId: 562,
  title: 'DAPT score',
  subtitle: 'Dual antiplatelet therapy beyond 1 year after PCI',
  question: 'After PCI, what is the balance of benefit and harm of continuing dual antiplatelet therapy beyond 1 year?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'ddl1', options: [{ label: 'Under 65', points: 0 }, { label: '65 to 74', points: -1 }, { label: '75 or older', points: -2 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'smoking', type: 'check', label: 'Cigarette smoking', points: 1, ee: 'cb1' },
    { id: 'diabetes', type: 'check', label: 'Diabetes mellitus', points: 1, ee: 'cb2' },
    { id: 'mi', type: 'check', label: 'MI at presentation', points: 1, ee: 'cb3' },
    { id: 'prior', type: 'check', label: 'Prior PCI or prior MI', points: 1, ee: 'cb4' },
    { id: 'paclitaxel', type: 'check', label: 'Paclitaxel-eluting stent', points: 1, ee: 'cb5' },
    { id: 'diameter', type: 'check', label: 'Stent diameter below 3 mm', points: 1, ee: 'cb6' },
    { id: 'chf', type: 'check', label: 'CHF or LVEF below 30%', points: 2, ee: 'cb7' },
    { id: 'graft', type: 'check', label: 'Vein graft stenting', points: 2, ee: 'cb8' }
  ],
  points: { label: 'DAPT score', max: 10 },
  compute(a) {
    const s = -a.age + ['smoking', 'diabetes', 'mi', 'prior', 'paclitaxel', 'diameter'].filter(k => a[k]).length + 2 * a.chf + 2 * a.graft;
    return s < 2
      ? { score: { value: s, label: 'DAPT score' }, headline: 'Score below 2', lines: ['Patients with a score below 2 have higher rates of moderate or severe bleeding: less favorable net benefit from continuing DAPT beyond 1 year.'] }
      : { score: { value: s, label: 'DAPT score' }, headline: 'Score 2 or higher', lines: ['Patients with a score of 2 or more have higher rates of stent thrombosis and recurrent ischemia: greater net benefit from continuing DAPT beyond 1 year.'] };
  }
};
