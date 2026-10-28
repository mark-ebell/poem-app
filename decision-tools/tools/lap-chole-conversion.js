// Conversion of laparoscopic to open cholecystectomy (Kologlu 2004; EE+ 292).
const { pointsOf } = require('../lib');
const tool = module.exports = {
  id: 'lap-chole-conversion',
  eeId: 292,
  title: 'Lap chole: probability of conversion',
  subtitle: 'Conversion to open cholecystectomy',
  question: 'For a patient undergoing laparoscopic cholecystectomy, what is the risk of conversion to an open operation?',
  inputs: [
    { id: 'male', type: 'check', label: 'Male', points: 11, ee: 'IDC_CHECKBOX_2' },
    { id: 'age', type: 'check', label: 'Age 60 or older', points: 5, ee: 'IDC_CHECKBOX_1' },
    { id: 'surgery', type: 'check', label: 'Previous upper abdominal operation', points: 8, ee: 'IDC_CHECKBOX_3' },
    { id: 'tender', type: 'check', label: 'Abdominal tenderness', points: 9, ee: 'IDC_CHECKBOX_4' },
    { id: 'wall', type: 'check', label: 'Gallbladder wall thickened on ultrasound', points: 13, ee: 'IDC_CHECKBOX_5' },
    { id: 'acute', type: 'check', label: 'Acute cholecystitis', points: 15, ee: 'IDC_CHECKBOX_6' }
  ],
  compute(a) {
    const s = pointsOf(tool, a) - 20;
    return { score: { value: s, label: 'Risk score' }, ...(s < -3 ? { level: 1, headline: 'Low risk: conversion 1.0%, complication 2.9%' } : { level: 3, headline: 'High risk: conversion 10.2%, complication 5.7%' }) };
  }
};
