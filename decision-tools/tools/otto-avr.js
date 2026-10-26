// Aortic valve replacement in aortic stenosis from Doppler echo (Otto; EE+ 20).
module.exports = {
  id: 'otto-avr',
  eeId: 20,
  title: 'Aortic valve replacement in aortic stenosis',
  subtitle: 'Doppler echocardiography in symptomatic aortic stenosis (Otto)',
  question: 'For an adult with symptomatic aortic stenosis, does Doppler echocardiography indicate aortic valve replacement?',
  inputs: [
    { id: 'jet', type: 'choice', label: 'Maximum aortic jet velocity', ee: 'IDC_COMBOBOX_1', options: [{ label: 'Above 4.0 m/s' }, { label: '3.0 to 4.0 m/s' }, { label: 'Below 3.0 m/s' }] },
    { id: 'area', type: 'choice', label: 'Doppler aortic valve area', ee: 'IDC_COMBOBOX_2', options: [{ label: 'Above 1.6 cm²' }, { label: '1.1 to 1.6 cm²' }, { label: 'Below 1.1 cm²' }] },
    { id: 'ai', type: 'choice', label: 'Aortic insufficiency', ee: 'AORTIC', options: [{ label: 'Absent, or turbulence only next to the aortic leaflets' }, { label: 'Turbulence reaching the mitral leaflet tips or beyond' }] }
  ],
  compute(a) {
    const avr = a.jet === 0 || (a.jet === 1 && (a.area === 2 || (a.area === 1 && a.ai === 1)));
    return avr ? { level: 3, headline: 'AVR recommended', lines: ['97% predicted to require it had AVR.'] }
      : { level: 1, headline: 'AVR not recommended', lines: ['94% predicted not to require it did not have AVR.'] };
  }
};
