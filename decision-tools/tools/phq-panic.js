// PHQ (PRIME-MD) panic disorder questions (EE+ 519).
module.exports = {
  id: 'phq-panic',
  eeId: 519,
  title: 'Panic disorder screening (PHQ)',
  subtitle: 'Five-question panic disorder screen from the Patient Health Questionnaire',
  question: 'For an adult, do the PHQ panic questions suggest panic disorder? (Positive only if all 5 are yes.)',
  inputs: [
    { type: 'heading', label: 'Check each yes answer' },
    { id: 'attack', type: 'check', label: 'In the last 4 weeks, have you had an anxiety attack, suddenly feeling fear or panic?', ee: 'ANXIETY' },
    { id: 'before', type: 'check', label: 'Has this ever happened before?', ee: 'BEFORE' },
    { id: 'blue', type: 'check', label: "Do some of these attacks come suddenly out of the blue, in situations where you don't expect to be nervous or uncomfortable?", ee: 'SUDDEN' },
    { id: 'worry', type: 'check', label: 'Do these attacks bother you a lot, or are you worried about having another attack?', ee: 'WORRIED' },
    { id: 'symptoms', type: 'check', label: 'During your last bad anxiety attack, did you have symptoms like shortness of breath, sweating, a racing or pounding heart, dizziness or faintness, tingling or numbness, or nausea or upset stomach?', ee: 'SYMPTOMS' }
  ],
  footnote: '81% sensitive and 99% specific.',
  compute(a) {
    return a.attack && a.before && a.blue && a.worry && a.symptoms ? { level: 3, headline: 'High likelihood of panic disorder' } : { level: 1, headline: 'Panic disorder unlikely' };
  }
};
