// Brief reflux inventory for GERD (Zimmerman 2004; EE+ 268).
const FREQ = ['Never', 'Rarely', 'Once a month to once a week', 'At least twice a week', 'Daily'].map(label => ({ label }));
const ITEMS = [['pain', 'Pain, pressure or burning that starts in the stomach and spreads up the front of the chest', 5.61],
  ['throat', 'A burning sensation deep in the throat', 4.15], ['taste', 'A bitter, salty or sour taste in the mouth', 1.94],
  ['regurgitation', 'A feeling that something eaten a while ago is coming back up', 4.05], ['night', 'Waking at night with heartburn, coughing or choking', 5.23]];

module.exports = {
  id: 'gerd-zimmerman',
  eeId: 268,
  title: 'GERD diagnosis (Zimmerman reflux inventory)',
  subtitle: 'Five-question inventory for gastroesophageal reflux disease',
  question: 'How likely is gastroesophageal reflux disease, from five symptom questions?',
  inputs: [{ type: 'text', text: 'How often do you have each of the following?' },
    ...ITEMS.map(([id, label], k) => ({ id, type: 'choice', label, ee: `cboReflux_${k}`, options: FREQ }))],
  footnote: 'Reference standard: GERD on endoscopy or 24-hour pH monitoring. The maximum score is 83.9; the cut-off of 26.5 is 31.6% of the maximum.',
  compute(a) {
    const s = ITEMS.reduce((t, [id, , w]) => t + w * a[id], 0);
    return s > 26.52
      ? { score: { value: Number(s.toFixed(2)), label: 'Score' }, level: 3, headline: 'GERD likely', lines: ['91% with a score above 26.5 had GERD.'] }
      : { score: { value: Number(s.toFixed(2)), label: 'Score' }, level: 1, headline: 'GERD unlikely', lines: ['91% with a score below 26.5 did not have GERD.'] };
  }
};
