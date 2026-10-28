// Common bile duct stones at cholecystectomy (Houdart 1995; EE+ 256).
module.exports = {
  id: 'cbd-stone-houdart',
  eeId: 256,
  title: 'Common bile duct stone risk',
  subtitle: 'Low risk of common bile duct stones at cholecystectomy',
  question: 'For a patient undergoing cholecystectomy, is the risk of a common bile duct stone low?',
  inputs: [
    { id: 'noJaundice', type: 'check', label: 'No jaundice', ee: 'IDC_CHECKBOX_1' },
    { id: 'normalLft', type: 'check', label: 'Normal transaminase levels', ee: 'IDC_CHECKBOX_2' },
    { id: 'cbd', type: 'check', label: 'Common bile duct diameter under 8 mm', ee: 'IDC_CHECKBOX_3' },
    { id: 'noDilation', type: 'check', label: 'No intrahepatic duct enlargement on ultrasound', ee: 'IDC_CHECKBOX_4' }
  ],
  compute(a) {
    return a.noJaundice && a.normalLft && a.cbd && a.noDilation ? { level: 1, headline: 'Low risk: 1/168 (0.6%) with a common bile duct stone' } : { level: 3, headline: 'At risk: 42/108 (39%) with a common bile duct stone' };
  }
};
