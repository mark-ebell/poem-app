// Intimate partner violence screening in women with head, face or neck injury (Halpern 2006; EE+ 422).
const { count } = require('../lib');
module.exports = {
  id: 'ipv-screen',
  eeId: 422,
  title: 'Intimate partner violence screening (combined protocol)',
  subtitle: 'Screening women in the ED with head, face or neck injuries',
  question: 'For a woman in the ED with a visible head, face or neck injury, is the screen for intimate partner violence positive?',
  inputs: [
    { id: 'safe', type: 'choice', label: 'Do you feel safe in your current relationship?', ee: 'CHK_Save', default: 1, options: [{ label: 'Yes' }, { label: 'No' }] },
    { type: 'heading', label: 'Check each answered "Yes":' },
    { id: 'previous', type: 'check', label: 'Is there a partner from a previous relationship who is making you feel unsafe?', ee: 'CHK_PartnerPrev' },
    { id: 'hurt', type: 'check', label: 'Have you been hit, kicked, punched, or otherwise hurt by someone within the past year?', ee: 'CHK_Hurt' },
    { id: 'tension', type: 'check', label: 'In general, would you describe your relationship as having some or a lot of tension?', ee: 'CHK_Tension' },
    { id: 'arguments', type: 'check', label: 'Do you and your partner work out arguments with some or a lot of difficulty?', ee: 'CHK_WorkItOut' }
  ],
  compute(a) {
    const pos = a.safe === 1 || count(a, ['previous', 'hurt', 'tension', 'arguments']) > 0;
    return pos ? { level: 4, headline: 'Positive screen for intimate partner violence: present in 75/102 (74%)' } : { level: 1, headline: 'Negative screen for intimate partner violence: present in 12/298 (4%)' };
  }
};
