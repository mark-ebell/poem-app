// Pediatric criteria for familial Mediterranean fever (Yalçınkaya 2009; EE+ 401).
module.exports = {
  id: 'fmf-children',
  eeId: 401,
  title: 'Familial Mediterranean fever diagnosis (children)',
  subtitle: 'Pediatric diagnostic criteria for familial Mediterranean fever',
  question: 'For a child with recurrent fever and suspected familial Mediterranean fever, is the diagnosis likely?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'fever', type: 'check', label: 'Fever: 3 or more episodes of axillary temperature above 38°C lasting 6 to 72 hours', ee: 'CHK_Fever' },
    { id: 'chest', type: 'check', label: 'Chest pain: 3 or more attacks lasting 6 to 72 hours', ee: 'CHK_ChestPain' },
    { id: 'abdominal', type: 'check', label: 'Abdominal pain: 3 or more attacks lasting 6 to 72 hours', ee: 'CHK_AbPain' },
    { id: 'arthritis', type: 'check', label: 'Arthritis: 3 or more attacks lasting 6 to 72 hours', ee: 'CHK_Arthritis' },
    { id: 'family', type: 'check', label: 'Family history of familial Mediterranean fever', ee: 'CHK_History' }
  ],
  compute(a) {
    const n = a.fever + a.chest + a.abdominal + a.arthritis + a.family;
    return n >= 2 ? { score: { value: n, max: 5, label: 'Criteria' }, level: 3, headline: 'Consider genetic testing for familial Mediterranean fever' }
      : { score: { value: n, max: 5, label: 'Criteria' }, level: 1, headline: 'Familial Mediterranean fever unlikely' };
  }
};
