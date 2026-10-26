// INTERCHEST rule: coronary artery disease in primary care chest pain (Aerts; EE+ 573).
const R = {
  '-1': [1, '0/87 (0%)', 'Further testing generally not warranted unless clinically indicated.'],
  0: [1, '1/208 (0.5%)', 'Further testing generally not warranted unless clinically indicated.'],
  1: [2, '6/160 (4%)', 'If CT angiography is positive, 15% have CAD; if negative, 0%.'],
  2: [2, '11/85 (13%)', 'If CT angiography is positive, 40% have CAD; if negative, 1%.'],
  3: [3, '29/53 (55%)', 'If CT angiography is positive, 84% have CAD; if negative, 10%.'],
  4: [4, '21/32 (66%)', 'If CT angiography is positive, 89% have CAD; if negative, 15%.'],
  5: [4, '17/19 (89%)', 'If CT angiography is positive, 97% have CAD; if negative, 50%.']
};

module.exports = {
  id: 'interchest',
  eeId: 573,
  title: 'INTERCHEST rule',
  subtitle: 'Coronary artery disease in primary care patients with chest pain',
  question: 'For an adult seeing a primary care physician for chest pain, how likely is coronary artery disease as the cause?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Older age (men 55 or older, women 65 or older)', points: 1, ee: 'cb1' },
    { id: 'serious', type: 'check', label: 'Physician initially suspected a serious condition', points: 1, ee: 'cb2' },
    { id: 'pressure', type: 'check', label: 'Chest discomfort feels like "pressure"', points: 1, ee: 'cb3' },
    { id: 'effort', type: 'check', label: 'Chest pain related to effort or exertion', points: 1, ee: 'cb4' },
    { id: 'palpation', type: 'check', label: 'Pain reproduced by palpation', points: -1, ee: 'cb5' },
    { id: 'history', type: 'check', label: 'History of coronary artery disease', points: 1, ee: 'cb6' }
  ],
  points: { label: 'INTERCHEST score', max: 5 },
  evidence: { reference: 'Aerts M, Minalu G, Bosner S, et al. Pooled individual patient data from five countries were used to derive a clinical prediction rule for coronary artery disease in primary care. J Clin Epidemiol 2017; 81: 120-8.' },
  compute(a) {
    const s = a.age + a.serious + a.pressure + a.effort - a.palpation + a.history;
    const r = R[s];
    return { level: r[0], headline: `${r[1]} had CAD`, lines: [r[2]], note: 'Scores range from −1 to 5. The original report called a score of 1 or less low risk (2.3% likelihood of CAD).' };
  }
};
