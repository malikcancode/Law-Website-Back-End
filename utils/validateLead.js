const { AMOUNT_RANGES, CONTACT_METHODS } = require('../models/Lead');

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;

const toLatinDigits = (value = '') =>
  String(value).replace(ARABIC_DIGITS, (d) => {
    const code = d.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });

const normalizeSaudiPhone = (raw) => {
  const digits = toLatinDigits(raw).replace(/[\s\-()]/g, '');
  const match = digits.match(/^(?:\+?966|00966|0)?(5\d{8})$/);
  return match ? `+966${match[1]}` : null;
};

const clean = (value, max) =>
  typeof value === 'string' ? value.trim().slice(0, max) : undefined;

const validateLead = (body = {}, allowedCaseTypes = []) => {
  const errors = {};

  const fullName = clean(body.fullName, 120);
  if (!fullName || fullName.length < 3) errors.fullName = 'Please enter your full name';

  const phone = normalizeSaudiPhone(body.phone);
  if (!phone) errors.phone = 'Enter a valid Saudi mobile number starting with 05';

  const email = clean(body.email, 160);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Email format looks incorrect';
  }

  const allowed = allowedCaseTypes.map((c) => c.value || c);
  if (!body.caseType || (allowed.length && !allowed.includes(body.caseType))) {
    errors.caseType = 'Please select a case type';
  }

  const amountRange = AMOUNT_RANGES.includes(body.amountRange) ? body.amountRange : 'unspecified';
  const preferredContact = CONTACT_METHODS.includes(body.preferredContact)
    ? body.preferredContact
    : 'call';

  if (body.consent !== true) errors.consent = 'Please confirm we may contact you about this request';

  const source = body.source && typeof body.source === 'object' ? body.source : {};

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    data: {
      fullName,
      phone,
      email: email || undefined,
      companyName: clean(body.companyName, 160),
      city: clean(body.city, 80),
      caseType: clean(body.caseType, 80),
      amountRange,
      preferredContact,
      message: clean(body.message, 3000),
      consent: body.consent === true,
      source: {
        page: clean(source.page, 300),
        referrer: clean(source.referrer, 300),
        utmSource: clean(source.utmSource, 100),
        utmMedium: clean(source.utmMedium, 100),
        utmCampaign: clean(source.utmCampaign, 100),
      },
    },
  };
};

module.exports = { validateLead, normalizeSaudiPhone };
