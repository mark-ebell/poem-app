// Serious bacterial infection in children 1 month to 15 years in the ED (Brent 2011; EE+ 436).
const { pointsOf } = require('../lib');
const opt = (labels, pts) => labels.map((label, k) => ({ label, points: pts[k] }));

const tool = module.exports = {
  id: 'sbi-craig',
  eeId: 436,
  title: 'Serious bacterial infection risk in children',
  subtitle: 'Serious bacterial infection in children seen in the ED with possible infection',
  question: 'For a child 1 month to 15 years seen in the ED with possible acute infection, what is the risk of serious bacterial infection?',
  inputs: [
    { id: 'state', type: 'choice', label: 'State variation', ee: 'VARIATION', options: opt(['Eyes open', 'Eyes open briefly', 'Falls asleep'], [0, 1, 2]) },
    { id: 'temp', type: 'choice', label: 'Temperature', ee: 'TEMP', options: opt(['Under 37.5°C', '37.5 to 38.4°C', 'Over 38.4°C'], [0, 1, 2]) },
    { id: 'hydration', type: 'choice', label: 'Hydration', ee: 'HYDRATION', options: opt(['Well hydrated', 'Dry mucous membranes', 'Reduced skin turgor'], [0, 2, 4]) },
    { id: 'hypoxia', type: 'choice', label: 'Hypoxia', ee: 'HYPOXIA', options: opt(['None', 'Mild', 'Severe'], [0, 1, 2]),
      note: 'Mild: oxygen saturation under 95%, or oxygen therapy. Severe: under 90%, or under 92% despite oxygen therapy.' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'delay', type: 'check', label: 'Developmental delay', points: 4, ee: 'DELAY' },
    { id: 'risk', type: 'check', label: 'Risk factor for infection', points: 2, ee: 'INFECTION',
      note: 'Neutropenia, sickle cell disease, primary ciliary dyskinesia, Down syndrome, glycogen storage disease 1b, Hunter or Hurler syndrome, cryptogenic cirrhosis, biliary atresia, vesicoureteral reflux, hydronephrosis, congenital pneumonia, or recurrent infections.' },
    { id: 'refill', type: 'check', label: 'Capillary refill 2 seconds or more', points: 1, ee: 'REFILL' },
    { id: 'tachypnea', type: 'check', label: 'Tachypnea', points: 1, ee: 'TACHYPNEIC' }
  ],
  points: { label: 'Risk score' },
  compute(a) {
    const s = pointsOf(tool, a);
    return s < 6 ? { level: 1, headline: '21 of 1085 (1.9%, 95% CI 1.2% to 2.9%) had a serious bacterial infection' }
      : s < 7 ? { level: 2, headline: '17 of 214 (7.9%, 95% CI 4.7% to 12.4%) had a serious bacterial infection' }
      : s < 8 ? { level: 3, headline: '9 of 68 (13.2%, 95% CI 6.2% to 23.6%) had a serious bacterial infection' }
      : s < 9 ? { level: 3, headline: '9 of 51 (17.7%, 95% CI 6.4% to 30.9%) had a serious bacterial infection' }
      : { level: 4, headline: '10 of 29 (34.5%, 95% CI 17.9% to 54.3%) had a serious bacterial infection' };
  }
};
