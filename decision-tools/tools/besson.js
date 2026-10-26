// Besson score: ischemic or hemorrhagic stroke (Besson 1995; EE+ 127).
module.exports = {
  id: 'besson',
  eeId: 127,
  title: 'Besson score (ischemic vs hemorrhagic stroke)',
  subtitle: 'Hemorrhage in acute stroke, before imaging',
  question: 'For a patient with acute stroke, how likely is a hemorrhagic stroke?',
  inputs: [
    { id: 'plantar', type: 'choice', label: 'Plantar response', ee: 'PLANTAR', options: [{ label: 'No extensor response' }, { label: 'Extensor, same side as the lesion' }, { label: 'Extensor, opposite side' }, { label: 'Extensor on both sides' }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'alcohol', type: 'check', label: 'Drinks alcohol daily or nearly daily (any amount)', ee: 'DRINKS' },
    { id: 'htn', type: 'check', label: 'History of hypertension', ee: 'HISTORY' },
    { id: 'headache', type: 'check', label: 'Vomiting or headache within 2 hours before onset, or headache after onset', ee: 'VOMITING' },
    { id: 'tia', type: 'check', label: 'History of transient neurologic deficit (including amaurosis fugax)', ee: 'DEFICIT' },
    { id: 'pad', type: 'check', label: 'History of leg claudication, or loss of at least one ankle pulse', ee: 'PULSE' },
    { id: 'lipids', type: 'check', label: 'History of hyperlipidemia', ee: 'HYPER' },
    { id: 'af', type: 'check', label: 'Atrial fibrillation on admission', ee: 'ATRIAL' }
  ],
  compute(a) {
    const s = [0, 1.5, 3, 4.5][a.plantar] + 2 * a.alcohol + 3 * a.htn + 3 * a.headache - 5 * a.tia - 2 * a.pad - 1.5 * a.lipids - 2.5 * a.af;
    return s < 1
      ? { score: { value: s, label: 'Score' }, level: 1, headline: 'Hemorrhage unlikely', lines: ['72 of 200 patients scored below 1, and none had a hemorrhagic stroke.'] }
      : { score: { value: s, label: 'Score' }, level: 3, headline: 'Hemorrhage possible', lines: ['128 of 200 patients scored 1 or more, and 26% had a hemorrhagic stroke or cerebral hematoma.'] };
  }
};
