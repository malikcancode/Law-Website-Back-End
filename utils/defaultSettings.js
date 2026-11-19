const defaultSettings = {
  key: 'default',
  firmName: '[Lawyer Name] Law Firm & Legal Consultations',
  shortName: '[Firm Name]',
  license: 'License No. [———]',
  phone: '0500000000',
  whatsapp: '966500000000',
  publicEmail: 'info@yourfirm.sa',
  address: '[District, Street], Riyadh, Kingdom of Saudi Arabia',
  hours: 'Sunday – Thursday, 9:00 AM – 6:00 PM',
  logoUrl: '',
  services: [
    {
      title: 'Financial & commercial fraud',
      body: 'Scams, fictitious contracts and deals, bounced cheques, and manipulation of financial or commercial data.',
    },
    {
      title: 'Embezzlement of company funds',
      body: 'Misappropriation by an employee, partner, or manager of company money or assets, and breach-of-trust cases.',
    },
    {
      title: 'Recovery of owed funds',
      body: 'Filing claims, requesting precautionary attachment, and following through on judgment enforcement until funds are recovered.',
    },
    {
      title: 'Large financial disputes & claims',
      body: 'Managing the dispute from negotiation and settlement through litigation before the competent courts and committees.',
    },
  ],
  caseTypes: [
    { value: 'financial_fraud', label: 'Financial & commercial fraud' },
    { value: 'embezzlement', label: 'Embezzlement of company funds' },
    { value: 'funds_recovery', label: 'Recovery of owed funds' },
    { value: 'financial_disputes', label: 'Large financial disputes & claims' },
    { value: 'other', label: 'Other matter' },
  ],
};

module.exports = { defaultSettings };
