// Perinatal depression screen: two questions and a help question (EE+ 463).
module.exports = {
  id: 'perinatal-depression',
  eeId: 463,
  title: 'Perinatal depression screen',
  subtitle: 'Two-question depression screen in pregnancy and after delivery',
  question: 'For a woman who is pregnant or has just delivered, does a brief screen suggest depression?',
  inputs: [
    { type: 'heading', label: 'During the past month, have you often been bothered by (check each yes):' },
    { id: 'down', type: 'check', label: 'Feeling down, depressed or hopeless?', ee: 'Q1' },
    { id: 'interest', type: 'check', label: 'Having little interest or pleasure in doing things?', ee: 'Q2' },
    { type: 'heading', id: 'helpHead', label: 'Confirmatory question', when: a => a.down || a.interest },
    { id: 'help', type: 'check', label: 'Is this something you feel you need or want help with?', ee: 'Q3', when: a => a.down || a.interest,
      note: 'Confirms depression if positive, but does not rule it out if negative.' }
  ],
  compute(a) {
    if (!(a.down || a.interest)) return { level: 1, headline: 'Initial screen negative for depression' };
    return a.help ? { level: 4, headline: 'Initial screen and confirmatory question both positive for depression' } : { level: 3, headline: 'Initial screen positive for depression' };
  }
};
