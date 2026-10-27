// Pregnancy dating: gestational age and estimated date of delivery from the LMP or an ultrasound (EE+ 140).
const DAY = 86400000;
const parse = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const show = t => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const weeks = d => `${Math.floor(d / 7)} weeks ${d % 7} day${d % 7 === 1 ? '' : 's'}`;

module.exports = {
  id: 'pregnancy-wheel',
  eeId: 140,
  title: 'Pregnancy wheel (dates)',
  subtitle: 'Gestational age and estimated date of delivery',
  question: 'From the last menstrual period or an ultrasound, what is the gestational age today and the estimated date of delivery?',
  inputs: [
    { id: 'method', type: 'choice', label: 'Date by', options: [{ label: 'Last menstrual period' }, { label: 'Ultrasound' }] },
    { id: 'lmp', type: 'date', label: 'First day of the last menstrual period', when: a => a.method === 0 },
    { id: 'cycle', type: 'number', label: 'Usual cycle length', unit: 'days', min: 20, max: 45, step: 1, default: 28, when: a => a.method === 0 },
    { id: 'usDate', type: 'date', label: 'Date of the ultrasound', when: a => a.method === 1 },
    { id: 'usWeeks', type: 'number', label: 'Gestational age at the ultrasound: weeks', unit: 'weeks', min: 4, max: 42, step: 1, when: a => a.method === 1 },
    { id: 'usDays', type: 'number', label: 'and days', unit: 'days', min: 0, max: 6, step: 1, default: 0, when: a => a.method === 1 }
  ],
  footnote: "Delivery date = LMP + 280 days, adjusted by the cycle's difference from 28 days; by ultrasound, 280 days minus the gestational age at the scan. Today is the server's date (UTC).",
  compute(a) {
    const now = new Date(), today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    let edd, ga;
    if (a.method === 0) {
      const lmp = parse(a.lmp), adj = a.cycle - 28;
      edd = lmp + (280 + adj) * DAY;
      ga = Math.round((today - lmp) / DAY) - adj;
    } else {
      const us = parse(a.usDate), gaUs = a.usWeeks * 7 + a.usDays;
      edd = us + (280 - gaUs) * DAY;
      ga = gaUs + Math.round((today - us) / DAY);
    }
    if (ga < 0) return { headline: 'That date is in the future; check the dates entered.' };
    const left = 280 - ga;
    return {
      headline: `Estimated date of delivery: ${show(edd)}`,
      lines: [`Gestational age today: ${weeks(ga)}`, left >= 0 ? `${weeks(left)} to go` : `${weeks(-left)} past the due date`, `Equivalent LMP: ${show(edd - 280 * DAY)}`]
    };
  }
};
