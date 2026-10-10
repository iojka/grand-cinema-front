import { describe, expect, it } from 'vitest';
import { checkCustomer, isValidEmail } from './customer.js';

// Coordonnées correctes d'un spectateur
const FORM = {
  name: 'Marine Crognier',
  email: 'marine@example.com',
  confirmation: 'marine@example.com',
  postcode: '48000',
  country: '',
};

describe('coordonnées (US 2.4)', () => {
  it('reconnaît une adresse e-mail valide', () => {
    expect(isValidEmail('marine@example.com')).toBe(true);
    expect(isValidEmail('marine.example.com')).toBe(false);
    expect(isValidEmail('marine@example')).toBe(false);
  });

  it("vérifie les coordonnées avant l'envoi", () => {
    expect(checkCustomer(FORM)).toBe('');
    expect(checkCustomer({ ...FORM, name: ' ' })).toBe('name');
    expect(
      checkCustomer({ ...FORM, email: 'marine', confirmation: 'marine' }),
    ).toBe('email');
    expect(checkCustomer({ ...FORM, confirmation: 'autre@example.com' })).toBe(
      'confirmation',
    );
    expect(checkCustomer({ ...FORM, postcode: '', country: '' })).toBe('place');
    expect(checkCustomer({ ...FORM, postcode: '', country: 'DE' })).toBe('');
  });
});
