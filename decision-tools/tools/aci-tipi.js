// ACI-TIPI: probability of acute cardiac ischemia (Selker; EE+ 30).
module.exports = {
  id: 'aci-tipi',
  eeId: 30,
  title: 'ACI-TIPI',
  subtitle: 'Acute cardiac ischemia time-insensitive predictive instrument',
  question: 'In an ED patient with possible acute cardiac ischemia, how likely is it, given an overall rate of about 30%?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', ee: 'AGE', options: [{ label: '40 or younger' }, { label: '41 to 50' }, { label: 'Over 50' }] },
    { id: 'pain', type: 'choice', label: 'Chest or left arm pressure or pain', ee: 'CHEST_PAIN', options: [
      { label: 'Present, and the chief complaint' }, { label: 'Present, but not the chief complaint' }, { label: 'Absent' }] },
    { id: 'stdep', type: 'choice', label: 'ST-segment depression', ee: 'DEPRESSION', default: 3, options: [
      { label: '2 mm or more' }, { label: '1 to 2 mm' }, { label: '0.5 to 1 mm' }, { label: 'None' }] },
    { id: 'stel', type: 'choice', label: 'ST-segment elevation', ee: 'ELEVATION', default: 2, options: [
      { label: '2 mm or more' }, { label: '1 to 2 mm' }, { label: 'None' }] },
    { id: 'twave', type: 'choice', label: 'T waves', ee: 'ECG', default: 3, options: [
      { label: 'Flat' }, { label: 'Inverted 1 to 5 mm' }, { label: 'Inverted more than 5 mm' }, { label: 'Normal' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'male', type: 'check', label: 'Male', ee: 'MALE' },
    { id: 'q', type: 'check', label: 'Q waves more than 1 mm', ee: 'Q_WAVE' },
    { id: 'hyperacute', type: 'check', label: 'Hyperacute T waves (50% or more of QRS deviation)', ee: 'T_WAVE' }
  ],
  compute(a) {
    const cpain = a.pain < 2 ? 1 : 0, chief = a.pain === 0 ? 1 : 0, male = a.male ? 1 : 0;
    const young = a.age === 0 ? 1 : 0, over50 = a.age === 2 ? 1 : 0, maleOver50 = over50 && male ? 1 : 0;
    const stel = 2 - a.stel, stdep = [2, 1, 0.5, 0][a.stdep], twinv = [2, 1, 0.5, 0][a.twave];
    const both = stdep !== 0 && twinv !== 0 ? 1 : 0;
    const f = -3.933 + 1.231 * cpain + 0.882 * chief + 0.712 * male - 1.441 * young + 0.667 * over50 - 0.426 * maleOver50
      + 0.616 * a.q + 1.314 * stel + 0.993 * stdep + 1.095 * a.hyperacute + 1.127 * twinv - 0.314 * both;
    const p = 100 - 100 / (1 + Math.exp(f));
    return { level: p < 10 ? 1 : p < 30 ? 2 : p < 60 ? 3 : 4, headline: `Probability of acute cardiac ischemia: ${p.toFixed(1)}%` };
  }
};
