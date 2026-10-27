// COAG clinical algorithm: warfarin dose adjustment on days 4 to 5 (Gage 2008; Kimmel 2013; EE+ 508).
const { SIZE, bsaOf } = require('./warfarin-coag-start');

module.exports = {
  id: 'warfarin-coag-adjust',
  eeId: 508,
  title: 'Warfarin dose adjustment (COAG clinical algorithm)',
  subtitle: 'Refined warfarin dose from the INR and recent doses',
  question: 'For an adult starting warfarin with a target INR of 2.0 to 3.0, what daily dose does the clinical algorithm suggest from today\'s INR and recent doses?',
  inputs: [
    { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 18, max: 110, step: 1, ee: 'AGE' },
    ...SIZE,
    { id: 'inr', type: 'number', label: "Today's INR", min: 1, max: 30, step: 0.1, ee: 'INR' },
    { id: 'dose2', type: 'number', label: 'Warfarin dose 2 days ago', unit: 'mg', min: 0, max: 15, step: 0.5, ee: 'WAR2' },
    { id: 'dose3', type: 'number', label: 'Warfarin dose 3 days ago', unit: 'mg', min: 0, max: 15, step: 0.5, ee: 'WAR3' },
    { id: 'dose4', type: 'number', label: 'Warfarin dose 4 days ago', unit: 'mg', min: 0, max: 15, step: 0.5, ee: 'WAR4' },
    { type: 'heading', label: 'Check all that apply' },
    { id: 'black', type: 'check', label: 'Black race', ee: 'BLACK' },
    { id: 'dm', type: 'check', label: 'Diabetes', ee: 'DIABETES' },
    { id: 'stroke', type: 'check', label: 'Stroke', ee: 'STROKE' },
    { id: 'amio', type: 'check', label: 'Taking amiodarone', ee: 'AMIO' },
    { id: 'fluva', type: 'check', label: 'Taking fluvastatin', ee: 'FLUV' }
  ],
  compute(a) {
    const x = 2.81602 - 0.0059 * a.age + 0.07123 * a.black + 0.1765 * bsaOf(a) - 0.16759 * a.dm - 0.2284 * a.stroke - 0.11137 * a.amio - 0.25487 * a.fluva
      + 0.27815 * 2.5 - 0.76679 * Math.log(a.inr) + 0.03471 * a.dose2 + 0.03047 * a.dose3 + 0.01929 * a.dose4;
    return { headline: `Suggested dose: ${(Math.exp(x) / 7).toFixed(1)} mg/day` };
  }
};
