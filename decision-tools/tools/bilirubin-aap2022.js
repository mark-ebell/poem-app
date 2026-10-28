// 2022 AAP hyperbilirubinemia thresholds (Kemper 2022). Replaces EE+ 348 (2004 AAP thresholds) at Mark Ebell's
// request (2026-10-27). Hour-by-hour phototherapy and exchange-transfusion thresholds from the guideline's
// Supplemental Tables 1 to 4 (decision-tools/aap-bilirubin-2022.json). Table 3 at 37 weeks says the cap of 27.0 mg/dL
// starts at 151 h but also "6 completed days and 10 h" (154 h); its row reaches 27.0 at 154 h, which is used.
const T = require('../aap-bilirubin-2022.json');
const WEEKS = ['35', '36', '37', '38', '39', '40 or more'];
const pick = (table, week) => { const keys = Object.keys(table).map(Number).sort((x, y) => x - y); return table[String(Math.min(week, keys[keys.length - 1]))]; };
const f1 = v => v.toFixed(1);

module.exports = {
  id: 'bilirubin-aap2022',
  eeId: 348,
  title: 'Newborn jaundice: AAP 2022 phototherapy and exchange thresholds',
  subtitle: 'Hour-specific bilirubin thresholds for newborns 35 weeks or more',
  question: 'For a newborn of 35 weeks or more, how does the total serum bilirubin compare with the 2022 AAP phototherapy and exchange-transfusion thresholds?',
  inputs: [
    { id: 'hours', type: 'number', label: 'Age', unit: 'hours after birth', min: 1, max: 359, step: 1 },
    { id: 'week', type: 'choice', label: 'Gestational age (completed weeks)', options: WEEKS.map(label => ({ label })), default: 5 },
    { id: 'units', type: 'choice', label: 'Bilirubin units', options: [{ label: 'mg/dL' }, { label: 'µmol/L' }] },
    { id: 'tsbMg', type: 'number', label: 'Total serum bilirubin', unit: 'mg/dL', min: 0.1, max: 50, step: 0.1, when: a => a.units === 0, note: 'Use the total bilirubin; do not subtract the direct or conjugated fraction.' },
    { id: 'tsbUmol', type: 'number', label: 'Total serum bilirubin', unit: 'µmol/L', min: 2, max: 855, step: 1, when: a => a.units === 1, note: 'Use the total bilirubin; do not subtract the direct or conjugated fraction.' },
    { type: 'heading', label: 'Check if present' },
    { id: 'risk', type: 'check', label: 'A hyperbilirubinemia neurotoxicity risk factor other than gestational age',
      note: 'Albumin under 3.0 g/dL; isoimmune hemolytic disease, G6PD deficiency or another hemolytic condition; sepsis; or significant clinical instability in the previous 24 hours.' }
  ],
  footnote: 'Thresholds are from the 2022 AAP guideline (Supplemental Tables 1 to 4) and are based on expert opinion. The escalation-of-care threshold is 2 mg/dL below the exchange-transfusion threshold. Gestational age under 38 weeks is itself a neurotoxicity risk factor and is already built into the thresholds for each week.',
  compute(a) {
    const week = 35 + a.week, h = a.hours - 1;
    const photo = pick(a.risk ? T.phototherapyRisk : T.phototherapy, week)[h];
    const exch = pick(a.risk ? T.exchangeRisk : T.exchange, week)[h];
    const escalate = exch - 2;
    const tsb = a.units === 0 ? a.tsbMg : a.tsbUmol / 17.1;
    const diff = tsb - photo;
    const [level, headline] = tsb >= exch ? [4, 'At or above the exchange-transfusion threshold'] : tsb >= escalate ? [4, 'At or above the escalation-of-care threshold'] : tsb >= photo ? [3, 'At or above the phototherapy threshold']
      : diff >= -2 ? [2, `Below the phototherapy threshold by ${f1(-diff)} mg/dL`] : [1, `Below the phototherapy threshold by ${f1(-diff)} mg/dL`];
    return { level, headline, table: { head: ['Threshold at ' + a.hours + ' hours', 'mg/dL', 'µmol/L'],
      rows: [['Phototherapy', f1(photo), String(Math.round(photo * 17.1))], ['Escalation of care', f1(escalate), String(Math.round(escalate * 17.1))], ['Exchange transfusion', f1(exch), String(Math.round(exch * 17.1))], ['This infant\'s bilirubin', f1(tsb), String(Math.round(tsb * 17.1))]] } };
  },
  evidence: {
    reference: 'Kemper AR, Newman TB, Slaughter JL, et al. Clinical Practice Guideline Revision: Management of Hyperbilirubinemia in the Newborn Infant 35 or More Weeks of Gestation. Pediatrics. 2022;150(3):e2022058859.',
    pmid: '35927462',
    population: 'Newborn infants 35 or more weeks of gestation.',
    validation: 'Thresholds set by the AAP subcommittee from the 2004 thresholds and the evidence on neurotoxicity; based on expert opinion.',
    prevalence: null, developed: null, validated: null,
    comment: 'Replaces EE+ 348, which used the 2004 AAP thresholds.'
  }
};
