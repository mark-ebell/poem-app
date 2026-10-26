// Goldman algorithm for acute MI in ED chest pain (Goldman 1988; EE+ 219). A branching
// yes/no algorithm: each question is asked only on its path.
const YN = [{ label: 'Yes' }, { label: 'No' }];
const Y = 0, N = 1;
const q = (id, label, when) => ({ id, type: 'choice', label, options: YN, required: true, when });
const notSt = a => a.st === N;
const late = a => notSt(a) && a.late === Y;
const recent = a => notSt(a) && a.late === N;
const prior = a => recent(a) && a.prior === Y;
const noPrior = a => recent(a) && a.prior === N;

module.exports = {
  id: 'goldman-mi',
  eeId: 219,
  title: 'Acute MI diagnosis (Goldman algorithm)',
  subtitle: 'Probability of MI in ED chest pain',
  question: 'In an adult with non-traumatic chest pain and a normal chest x-ray, how likely is acute MI?',
  inputs: [
    q('st', 'ST elevation or Q waves in 2 or more leads, not known to be old?'),
    q('late', 'Did the chest pain begin 48 hours ago or more?', notSt),
    q('lateStt', 'ST-T changes of ischemia or strain, not known to be old?', late),
    q('prior', 'History of angina or MI?', recent),
    q('priorStt', 'ST-T changes of ischemia or strain, not known to be old?', prior),
    q('hour', 'Longest episode of pain 1 hour or more?', a => prior(a) && a.priorStt === N),
    q('worse', 'Pain worse than prior angina, or the same as a prior MI?', a => prior(a) && a.priorStt === N && a.hour === Y),
    q('radiates', 'Pain radiates to the neck, left shoulder or left arm?', noPrior),
    q('age40', 'Age 40 or older, and pain not reproduced by palpation?', a => noPrior(a) && a.radiates === Y),
    q('back', 'Pain radiates to the back, abdomen or legs?', a => noPrior(a) && a.radiates === Y && a.age40 === Y),
    q('stab', 'Is the chest pain "stabbing"?', a => noPrior(a) && a.radiates === Y && a.age40 === Y && a.back === N),
    q('stt2', 'ST-T changes of ischemia or strain, not known to be old?', a => noPrior(a) && a.radiates === N)
  ],
  compute(a) {
    const r = (level, label, n) => ({ level, headline: `${label} probability of MI: ${n}` });
    if (a.st === Y) return r(4, 'High', '75% (262 of 350)');
    if (a.late === Y) return a.lateStt === Y ? r(3, 'Moderate', '21% (32 of 149)') : r(1, 'Low', '2% (17 of 1039)');
    if (a.prior === Y) {
      if (a.priorStt === Y) return r(3, 'Moderate', '26% (89 of 343)');
      if (a.hour === N) return r(2, 'Low to moderate', '4% (16 of 404)');
      return a.worse === Y ? r(3, 'Moderate', '11% (34 of 304)') : r(1, 'Low', '1% (2 of 194)');
    }
    if (a.radiates === Y) {
      if (a.age40 === N) return r(1, 'Low', '2% (4 of 203)');
      if (a.back === Y) return r(2, 'Low to moderate', '8% (5 of 65)');
      return a.stab === Y ? r(1, 'Low', '2% (1 of 57)') : r(3, 'Moderate to high', '17% (51 of 294)');
    }
    return a.stt2 === Y ? r(3, 'Moderate', '26% (39 of 150)') : r(1, 'Low', '2% (24 of 1218)');
  }
};
