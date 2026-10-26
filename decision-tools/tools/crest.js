// CREST model: circulatory etiology death after cardiac arrest (Bascom 2018; EE+ 564).
const { pointsOf } = require('../lib');
const RISK = ['10%', '10%', '15% to 20%', '30% to 35%', '30% to 35%', '50%'];

const tool = module.exports = {
  id: 'crest',
  eeId: 564,
  title: 'CREST model',
  subtitle: 'Circulatory etiology death after resuscitation from cardiac arrest',
  question: 'For a comatose patient resuscitated from cardiac arrest without ST-elevation MI, how likely is death from a circulatory cause?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'cad', type: 'check', label: 'History of coronary artery disease', points: 1, ee: 'cb1' },
    { id: 'rhythm', type: 'check', label: 'Non-shockable rhythm (asystole or PEA)', points: 1, ee: 'cb2' },
    { id: 'ef', type: 'check', label: 'Left ventricular ejection fraction below 30% on admission', points: 1, ee: 'cb3' },
    { id: 'shock', type: 'check', label: 'Shock on admission', points: 1, ee: 'cb4',
      note: 'Systolic BP below 90 mm Hg during the first hour despite fluids, inotropes or vasopressors, or the need for an intra-aortic balloon pump.' },
    { id: 'time', type: 'check', label: 'Ischemic time (from arrest to return of spontaneous circulation) over 25 minutes', points: 1, ee: 'cb5' }
  ],
  points: { label: 'CREST score', max: 5 },
  footnote: 'Circulatory etiology death: death from repeat cardiopulmonary arrest, progressive refractory shock, refractory arrhythmia, or progressive acidosis and multiorgan failure, as judged by the treating physician.',
  compute(a) {
    const s = pointsOf(tool, a);
    return { headline: `Likelihood of circulatory etiology death: ${RISK[s]}` };
  }
};
