// Clock drawing test for hazardous driving in older adults (Freund 2005; EE+ 343).
const check = (id, label, ee, note) => ({ id, type: 'check', label, ee, ...(note ? { note } : {}) });

module.exports = {
  id: 'clock-driving',
  eeId: 343,
  title: 'Driving competency screen for older adults (clock test)',
  subtitle: 'Clock drawing and hazardous driving',
  question: 'For an older driver, does a clock drawing suggest a risk of hazardous driving?',
  inputs: [
    { type: 'heading', label: 'Ask the patient to draw a clock, put in all the numbers and set the time to 10 minutes after 11. Check each element present.' },
    check('two', 'One hand points at the 2', 'chk1'),
    check('hands', 'Exactly 2 clock hands', 'chk2'),
    check('marks', 'No intrusive marks', 'chk3', 'Intrusive marks: writing or hands showing the wrong time (e.g. a hand pointing at the 10), tick marks, or the time written in text (e.g. 11:10, ten after eleven).'),
    check('inside', 'Numbers are inside the clock', 'chk4'),
    check('all', 'All numbers 1 to 12 are present, with no duplicates or omissions', 'chk5'),
    check('spacing', 'Numbers spaced equally or nearly equally from each other', 'chk6'),
    check('edge', 'Numbers spaced equally or nearly equally from the edge of the circle', 'chk7')
  ],
  compute(a) {
    const n = ['two', 'hands', 'marks', 'inside', 'all', 'spacing', 'edge'].reduce((t, k) => t + a[k], 0);
    return { score: { value: n, max: 7, label: 'Clock score' }, level: n <= 4 ? 4 : n === 5 ? 2 : 1,
      headline: n <= 4 ? 'High risk for hazardous driving' : n === 5 ? 'Moderate risk for hazardous driving' : 'Low risk for hazardous driving' };
  }
};
