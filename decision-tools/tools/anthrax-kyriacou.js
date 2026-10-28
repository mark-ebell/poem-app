// Inhalational anthrax vs community-acquired pneumonia (Kyriacou 2007; EE+ 406).
module.exports = {
  id: 'anthrax-kyriacou',
  eeId: 406,
  title: 'Inhalation anthrax diagnosis',
  subtitle: 'Inhalational anthrax or community-acquired pneumonia',
  question: 'After possible exposure, in a patient with cough, congestion and dyspnea, is inhalational anthrax possible?',
  inputs: [
    { id: 'cxr', type: 'check', label: 'Chest x-ray shows mediastinal widening, with or without other findings', ee: 'CHK_CXR' },
    { id: 'mental', type: 'check', label: 'Altered mental status', ee: 'CHK_Mental' },
    { id: 'hct', type: 'check', label: 'Hematocrit over 45%', ee: 'CHK_Hematocrit' }
  ],
  compute(a) {
    return (a.cxr && a.hct) || (!a.cxr && a.mental) ? { level: 4, headline: 'Anthrax possible' } : { level: 1, headline: 'Anthrax unlikely' };
  }
};
