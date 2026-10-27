// National Osteoporosis Foundation screening criteria (EE+ 300).
module.exports = {
  id: 'osteo-nof',
  eeId: 300,
  title: 'Osteoporosis screening (NOF)',
  subtitle: 'National Osteoporosis Foundation risk factors in women',
  question: 'For a postmenopausal woman, does she screen positive for osteoporosis risk?',
  inputs: [
    { type: 'heading', label: 'Check all that apply' },
    { id: 'age', type: 'check', label: 'Age 65 or older', ee: 'IDC_CHECKBOX_1' },
    { id: 'weight', type: 'check', label: 'Weight under 57.6 kg (127 lb)', ee: 'IDC_CHECKBOX_2' },
    { id: 'fracture', type: 'check', label: 'History of fracture', ee: 'IDC_CHECKBOX_3' },
    { id: 'family', type: 'check', label: 'Family history of fracture', ee: 'IDC_CHECKBOX_4' },
    { id: 'smoker', type: 'check', label: 'Current smoker', ee: 'IDC_CHECKBOX_5' }
  ],
  compute(a) {
    return a.age || a.weight || a.fracture || a.family || a.smoker ? { level: 3, headline: 'Positive screen: 27% had osteoporosis' } : { level: 1, headline: 'Negative screen: under 3% had osteoporosis' };
  }
};
