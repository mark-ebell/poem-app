// GerontoNet ADR risk score: adverse drug reactions in hospitalized older adults (Onder 2010; EE+ 444).
const { pointsOf } = require('../lib');

const tool = module.exports = {
  id: 'gerontonet',
  eeId: 444,
  title: 'GerontoNet ADR risk score',
  subtitle: 'Adverse drug reactions in hospitalized adults 65 and older',
  question: 'For a hospitalized adult aged 65 or older, what is the risk of an adverse drug reaction?',
  inputs: [
    { id: 'meds', type: 'choice', label: 'Number of medications', ee: 'MEDS', options: [{ label: '0 to 4', points: 0 }, { label: '5 to 7', points: 1 }, { label: '8 or more', points: 4 }] },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'adr', type: 'check', label: 'Previous adverse drug reaction', points: 2, ee: 'ADR' },
    { id: 'comorbid', type: 'check', label: '4 or more comorbid conditions', points: 1, ee: 'COMORBID' },
    { id: 'hf', type: 'check', label: 'Heart failure', points: 1, ee: 'HF' },
    { id: 'liver', type: 'check', label: 'Liver disease', points: 1, ee: 'LD' },
    { id: 'renal', type: 'check', label: 'Renal failure (GFR below 60 mL/min)', points: 1, ee: 'RENAL' }
  ],
  points: { label: 'GerontoNet score', max: 10 },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 4 ? { level: 1, headline: 'Low risk of an adverse drug reaction: 5 of 116 (4.3%)' }
      : s < 8 ? { level: 2, headline: 'Moderate risk of an adverse drug reaction: 25 of 274 (9.1%)' }
      : { level: 4, headline: 'High risk of an adverse drug reaction: 26 of 93 (28%)' };
  }
};
