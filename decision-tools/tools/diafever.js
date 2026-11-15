// DIAFEVER decision rule for young children with fever without source (Nantes; protocol Hubert 2020,
// cluster randomised trial Malorey 2026). Not an EE+ tool: added from the trial's algorithm figure at
// Mark Ebell's request (2026-11-15). Branches follow the figure exactly: age group, toxic appearance,
// then urine (leukocyturia under 1 month, a positive dipstick otherwise), point-of-care procalcitonin
// (cut-off 0.5 ng/mL up to 3 months, 1 ng/mL after), and, for well-appearing children over 3 months,
// a history of UTI or urinary tract malformation and fever for more than 48 hours.
const yesNo = [{ label: 'Yes' }, { label: 'No' }];
const YES = 0, NO = 1;
const UNDER1 = 0, ONE_TO_3 = 1, OVER3 = 2;

const pctInput = (id, cut, when) => ({
  id, type: 'choice', required: true, when,
  label: 'Point-of-care procalcitonin',
  options: [{ label: `Below ${cut} ng/mL` }, { label: `${cut} ng/mL or more` }]
});
const LOW = 0;

const REPEAT = 'Repeat the procalcitonin 6 hours later (H6). A second measurement is most informative when the first was taken within 6 hours of the onset of fever.';

// What each risk level means (from the figure legend, Malorey 2026), for the child's age group.
// The box's own action comes first; the legend's disposition is added only where the box gives none.
const RISK = { 4: 'High infectious risk', 3: 'Intermediate infectious risk', 1: 'Low infectious risk' };
function guidance(level, age, action) {
  const saysHospital = /hospitali/i.test(action);
  if (level === 4) return [
    `Blood cultures; urine analysis${age === UNDER1 ? '; lumbar puncture' : ''}.`,
    'Start parenteral empirical antibiotics for 48 hours while waiting for the culture results.',
    ...(saysHospital ? [] : [age === OVER3
      ? 'Short-stay unit or ambulatory management, depending on the symptoms and whether the family can watch the child.'
      : 'Hospital admission.'])
  ];
  if (level === 3) return [
    'Blood cultures; urine analysis.',
    ...(saysHospital ? [] : [age === UNDER1 ? 'Hospital admission.' : 'Hospital observation for a few hours.'])
  ];
  return [
    'Discharge home with treatment of the fever, and spoken and written instructions on what to watch for.',
    'Return if worrying symptoms appear (explain them carefully to the parents or caregivers) or if fever lasts more than 48 hours.'
  ];
}
const TOXIC_COURSE = 'With a toxic appearance, the course decides: keep observing in hospital if the child improves quickly; if toxic signs persist or worsen, start antibiotics promptly after blood, urine and, if needed, cerebrospinal fluid cultures.';

module.exports = {
  id: 'diafever',
  categories: ['Infectious disease', 'Perinatal and infant'],
  title: 'DIAFEVER rule (fever without source, 6 days to 36 months)',
  subtitle: 'Antibiotics, hospitalization and lumbar puncture in young children with fever without source',
  question: 'For a child aged 6 days to 36 months with fever without source and no signs of septic shock in the emergency department, who needs antibiotics, a lumbar puncture or hospitalization?',
  inputs: [
    { id: 'age', type: 'choice', label: 'Age', required: true,
      options: [{ label: '6 days to < 1 month' }, { label: '1 to 3 months' }, { label: 'Over 3 months (to 36 months)' }] },
    { id: 'toxic', type: 'choice', label: 'Toxic appearance?', required: true, options: yesNo,
      note: 'Any of: the clinician\'s sense that something is wrong; abnormal skin colour; dehydration or lethargy; cyanosis or rapid breathing; petechial rash; altered crying pattern or inconsolability; fever over 40 °C.' },

    // Under 1 month, not toxic
    { id: 'leuk', type: 'choice', label: 'Leukocyturia (positive urine analysis)?', required: true, options: yesNo,
      note: 'Positive: dipstick with any trace of leukocytes or with nitrites, or leukocytes over 10/mm³, or a Gram stain showing bacteria. Under 1 month, microscopy and culture are also needed.',
      when: a => a.age === UNDER1 && a.toxic === NO },
    pctInput('pct1', '0.5', a => a.age === UNDER1 && a.toxic === NO && a.leuk === NO),

    // 1 to 3 months, and toxic children over 3 months
    { id: 'ud', type: 'choice', label: 'Urine dipstick positive?', required: true, options: yesNo,
      note: 'Positive: any trace of leukocytes, or nitrites (with or without leukocytes).',
      when: a => (a.age === ONE_TO_3 && a.toxic !== undefined) || (a.age === OVER3 && a.toxic === YES) },
    pctInput('pct2', '0.5', a => a.age === ONE_TO_3 && a.ud === NO),
    pctInput('pct3', '1', a => a.age === OVER3 && a.toxic === YES && a.ud === NO),

    // Over 3 months, not toxic
    { id: 'uti', type: 'choice', label: 'History of urinary tract infection, or a urinary tract malformation?', required: true, options: yesNo,
      when: a => a.age === OVER3 && a.toxic === NO },
    { id: 'long', type: 'choice', label: 'Fever for more than 48 hours?', required: true, options: yesNo,
      when: a => a.age === OVER3 && a.toxic === NO && a.uti === NO },
    { id: 'ud2', type: 'choice', label: 'Urine dipstick positive?', required: true, options: yesNo,
      note: 'Positive: any trace of leukocytes, or nitrites (with or without leukocytes).',
      when: a => a.age === OVER3 && a.toxic === NO && (a.uti === YES || a.long === YES) }
  ],
  footnote: 'For febrile children with no source on examination and no signs of septic shock. Procalcitonin is measured at the point of care on 20 µL of capillary blood. Red, orange and green in the original figure are high, intermediate and low infectious risk.',
  compute(a) {
    // level: the colour of the figure's box (4 red, 3 orange, 1 green); action: the box's text.
    const r = (level, action, ...extra) => ({
      level, headline: `${RISK[level]}: ${action}`,
      lines: [...extra, ...guidance(level, a.age, action), ...(level === 3 && a.toxic === YES ? [TOXIC_COURSE] : [])]
    });
    if (a.age === UNDER1) {
      if (a.toxic === YES) return r(4, 'Lumbar puncture and antibiotics');
      if (a.leuk === YES) return r(4, 'Antibiotics');
      return a.pct1 === LOW
        ? r(3, 'Hospitalization', REPEAT)
        : r(4, 'Lumbar puncture and antibiotics');
    }
    if (a.age === ONE_TO_3) {
      if (a.toxic === YES) {
        if (a.ud === YES) return r(4, 'Antibiotics and hospitalization');
        return a.pct2 === LOW
          ? r(3, 'Short hospitalization', REPEAT)
          : r(4, 'Antibiotics and hospitalization');
      }
      if (a.ud === YES) return r(4, 'Antibiotics, with or without hospitalization');
      return a.pct2 === LOW
        ? r(1, 'Discharge with parental surveillance')
        : r(3, 'Antibiotics and hospitalization');
    }
    // Over 3 months
    if (a.toxic === YES) {
      if (a.ud === YES) return r(4, 'Antibiotics and hospitalization');
      return a.pct3 === LOW
        ? r(3, 'Hospitalization', REPEAT)
        : r(4, 'Antibiotics and hospitalization');
    }
    if (a.uti === NO && a.long === NO) return r(1, 'Discharge');
    return a.ud2 === YES ? r(4, 'Antibiotics') : r(1, 'Discharge');
  },
  evidence: {
    reference: 'Malorey D, Tavernier E, Drouard A, et al; Diafever Study Group. Point-of-care decision rule for antibiotic prescriptions in young children with fever without source: an open cluster randomised trial. Arch Dis Child. 2026;111(10):858-865. Protocol: Hubert G, Launay E, Feildel Fournial C, et al. Assessment of the impact of a new sequential approach to antimicrobial use in young febrile children in the emergency department (DIAFEVERCHILD). BMJ Open. 2020;10(8):e034828.',
    pmid: '41407517',
    population: '4882 children aged 6 days to 36 months (median 3 months) with acute fever without source in 25 paediatric emergency departments in France and Switzerland, 2018 to 2021.',
    validation: 'Cluster randomised trial of the rule against usual care: antibiotics within 15 days in 26.2% with the rule vs 38.0% with usual care (OR 0.57, 95% CI 0.43 to 0.75), with similar morbidity and mortality at day 15 (OR 0.83, 95% CI 0.57 to 1.22). 15.7% had a serious and 1.4% an invasive bacterial infection.',
    prevalence: 1.4, developed: null, validated: 4882,
    comment: 'Not an EE+ tool. The rule\'s accuracy for serious or invasive bacterial infection at each branch was not reported in the trial abstract.'
  }
};
