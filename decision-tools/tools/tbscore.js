// TBscore: mortality in pulmonary tuberculosis (Wejse 2008; EE+ 415).
module.exports = {
  id: 'tbscore',
  eeId: 415,
  title: 'TBscore (pulmonary tuberculosis)',
  subtitle: '8-month mortality at the start of TB treatment',
  question: 'For a patient starting treatment for pulmonary tuberculosis, what is the risk of death within 8 months?',
  inputs: [
    { id: 'bmi', type: 'choice', label: 'Body mass index', ee: 'CMB_BMI', options: [{ label: '18 kg/m² or more' }, { label: '16 to 18' }, { label: 'Under 16' }] },
    { id: 'muac', type: 'choice', label: 'Mid-upper arm circumference (non-dominant arm, over the biceps)', ee: 'CMB_Arm', options: [{ label: '220 mm or more' }, { label: '200 to 220 mm' }, { label: 'Under 200 mm' }] },
    { type: 'heading', label: 'Check all that apply' },
    ...[['hiv', 'HIV positive', 'CHK_HIV'], ['cough', 'Cough', 'CHK_Cough'], ['hemoptysis', 'Hemoptysis', 'CHK_Hemo'], ['dyspnea', 'Dyspnea', 'CHK_Dyspnea'], ['chest', 'Chest pain', 'CHK_Chest'],
      ['sweats', 'Night sweats', 'CHK_Sweat'], ['pallor', 'Pale (anemic) conjunctivae', 'CHK_Anemic'], ['tachy', 'Heart rate over 90/min', 'CHK_Tachy'],
      ['lungs', 'Crepitations, rhonchi or decreased breath sounds', 'CHK_Lung'], ['temp', 'Axillary temperature over 37°C', 'CHK_Temp']].map(([id, label, ee]) => ({ id, type: 'check', label, ee }))
  ],
  compute(a) {
    const s = a.cough + a.hemoptysis + a.dyspnea + a.chest + a.sweats + a.pallor + a.tachy + a.lungs + a.temp + a.bmi + a.muac;
    const high = s > 7;
    if (a.hiv) return { score: { value: s, label: 'TBscore' }, level: high ? 4 : 3, headline: high ? 'Very high risk: 8-month mortality 31%' : 'High risk: 8-month mortality 20%' };
    return { score: { value: s, label: 'TBscore' }, level: high ? 2 : 1, headline: high ? 'Moderate risk: 8-month mortality 12%' : 'Low risk: 8-month mortality 6%' };
  }
};
