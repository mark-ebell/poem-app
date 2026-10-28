// Pneumonia in wheezing children (Mathews 2009; EE+ 407).
module.exports = {
  id: 'pneumonia-wheezing-children',
  eeId: 407,
  title: 'Pneumonia in wheezing children',
  subtitle: 'Radiographic pneumonia in children with wheeze',
  question: 'For a child with respiratory complaints and wheeze, what is the probability of pneumonia?',
  inputs: [
    { id: 'temp', type: 'check', label: 'Temperature in the ED 38.0 °C or more', ee: 'CHK_Temp' },
    { id: 'o2', type: 'check', label: 'Oxygen saturation under 92%', ee: 'CHK_O2' }
  ],
  compute(a) {
    if (!a.temp) return { level: 1, headline: 'Low risk: 7/317 with pneumonia (2.2%)' };
    return a.o2 ? { level: 4, headline: 'High risk: 7/34 with pneumonia (21%)' } : { level: 2, headline: 'Moderate risk: 12/175 with pneumonia (6.9%)' };
  }
};
