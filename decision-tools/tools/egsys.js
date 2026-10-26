// EGSYS score: cardiac syncope (Del Rosso 2008; EE+ 617).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'egsys',
  eeId: 617,
  title: 'EGSYS score',
  subtitle: 'Cardiac cause of syncope',
  question: 'For a patient with syncope of unknown cause, how likely is a cardiac cause?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'palpitations', type: 'check', label: 'Palpitations before syncope', points: 4, ee: 'cb1' },
    { id: 'ecg', type: 'check', label: 'Abnormal ECG or known heart disease', points: 3, ee: 'cb2',
      note: 'Abnormal ECG: bradycardia below 40/min, repetitive sinoatrial block, sinus pauses over 3 seconds, ST elevation or depression over 1 mm, QT 440 ms or more, ventricular tachycardia, Mobitz 2, second- or third-degree AV block, alternating left and right bundle branch block, sick sinus syndrome, ventricular or rapid paroxysmal supraventricular arrhythmias, or pacemaker malfunction.' },
    { id: 'effort', type: 'check', label: 'Syncope during effort', points: 3, ee: 'cb3' },
    { id: 'supine', type: 'check', label: 'Syncope while supine', points: 2, ee: 'cb4' },
    { id: 'prodrome', type: 'check', label: 'Autonomic prodrome', points: -1, ee: 'cb5',
      note: 'Nausea, vomiting, abdominal discomfort, feeling cold, sweating, aura, pain in the neck or shoulders, blurred vision or dizziness.' },
    { id: 'factors', type: 'check', label: 'Precipitating or predisposing factors', points: -1, ee: 'cb6',
      note: 'Warm crowded places, prolonged standing, the period after a meal, fear, intense pain, emotion, neck movements, or syncope during or just after urination, defecation, cough or swallowing.' }
  ],
  points: { label: 'EGSYS score', max: 12 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 3
      ? { level: 1, headline: 'Cardiac syncope less likely', lines: ['A score below 3 had likelihood ratios of 0.12 to 0.17 in 2 prospective validations.'] }
      : { level: 3, headline: 'Cardiac syncope more likely', lines: ['A score of 3 or more had a likelihood ratio of 3.0 in 2 prospective validations.'] };
  }
};
