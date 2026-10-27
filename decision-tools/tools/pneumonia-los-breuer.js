// Prolonged hospitalization in pediatric complicated pneumonia (Breuer 2018; EE+ 563).
module.exports = {
  id: 'pneumonia-los-breuer',
  eeId: 563,
  title: 'Prolonged stay in pediatric complicated pneumonia (Breuer)',
  subtitle: 'Hospitalization over 10 days in children with pneumonia and pleural effusion',
  question: 'For a child hospitalized with complicated pneumonia, how likely is a stay of more than 10 days?',
  inputs: [
    { id: 'ldh', type: 'number', label: 'Pleural fluid LDH', unit: 'U/L', min: 0, max: 200000, step: 1, ee: 'txt_LDH' },
    { id: 'glucose', type: 'number', label: 'Pleural fluid glucose', unit: 'mmol/L', min: 0.1, max: 20, step: 0.1, ee: 'txt_Glucose' }
  ],
  footnote: 'In general, higher pleural fluid LDH and lower glucose go with longer hospitalization.',
  compute(a) {
    const high = (a.ldh > 1000 && a.glucose < 1) || (a.ldh > 2000 && a.glucose < 2) || (a.ldh > 3000 && a.glucose < 3);
    return high ? { level: 3, headline: 'High risk for prolonged hospitalization' } : { level: 1, headline: 'Low risk for prolonged hospitalization' };
  }
};
