// Modified PUQE score: severity of nausea and vomiting of pregnancy (Lacasse 2008; EE+ 632). Bands as
// published (mild 6 or less, moderate 7 to 11, severe 12 or more; EE+ used 7 to 12 and 13 or more).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'puqe',
  eeId: 632,
  title: 'PUQE score (nausea and vomiting of pregnancy)',
  subtitle: 'Severity of nausea and vomiting in pregnancy over the past 12 hours',
  question: 'For a pregnant woman with nausea or vomiting, how severe is it?',
  inputs: [
    { type: 'text', text: 'Answer each question about the last 12 hours.' },
    { id: 'nausea', type: 'choice', label: 'How long have you felt nauseated or sick to your stomach?', ee: 'cboLong', options: ['Not at all', '1 hour or less', '2 to 3 hours', '4 to 6 hours', 'More than 6 hours'].map((label, k) => ({ label, points: k + 1 })) },
    { id: 'vomiting', type: 'choice', label: 'How many times have you vomited?', ee: 'cboTimes', options: ['None', '1 or 2 times', '3 or 4 times', '5 or 6 times', '7 or more times'].map((label, k) => ({ label, points: k + 1 })) },
    { id: 'retching', type: 'choice', label: 'How many times have you had retching or dry heaves without bringing anything up?', ee: 'cboHeaves', options: ['None', '1 or 2 times', '3 or 4 times', '5 or 6 times', '7 or more times'].map((label, k) => ({ label, points: k + 1 })) }
  ],
  points: { label: 'PUQE score', max: 15 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s <= 6 ? { level: 1, headline: 'Mild nausea and vomiting' } : s <= 11 ? { level: 2, headline: 'Moderate nausea and vomiting' } : { level: 4, headline: 'Severe nausea and vomiting' };
  }
};
