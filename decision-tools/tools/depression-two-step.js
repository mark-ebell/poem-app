// Two-step depression screen: two initial questions, then four follow-up symptoms (EE+ 126).
module.exports = {
  id: 'depression-two-step',
  eeId: 126,
  title: 'Depression screening (two questions and follow-up)',
  subtitle: 'Screen for major depression',
  question: 'For an adult in primary care, does a brief screen suggest major depression?',
  inputs: [
    { type: 'heading', label: 'During the past month, have you often been bothered by:' },
    { id: 'interest', type: 'check', label: 'Little interest or pleasure in doing things', ee: 'CHK_Interest' },
    { id: 'down', type: 'check', label: 'Feeling down, depressed or hopeless', ee: 'CHK_Depressed' },
    { type: 'heading', id: 'followHead', label: 'Follow-up: check each symptom present', when: a => a.interest || a.down },
    { id: 'sleep', type: 'check', label: 'Sleep disturbance', ee: 'CHK_Sleep', when: a => a.interest || a.down },
    { id: 'anhedonia', type: 'check', label: 'Anhedonia', ee: 'CHK_Anhedonia', when: a => a.interest || a.down },
    { id: 'esteem', type: 'check', label: 'Low self-esteem', ee: 'CHK_SelfEsteem', when: a => a.interest || a.down },
    { id: 'appetite', type: 'check', label: 'Change in appetite', ee: 'CHK_Appetite', when: a => a.interest || a.down }
  ],
  compute(a) {
    if (!(a.interest || a.down)) return { level: 1, headline: 'Major depression unlikely' };
    return a.sleep + a.anhedonia + a.esteem + a.appetite >= 2 ? { level: 3, headline: 'Major depression likely (97% sensitive, 94% specific)' } : { level: 1, headline: 'Major depression unlikely' };
  }
};
