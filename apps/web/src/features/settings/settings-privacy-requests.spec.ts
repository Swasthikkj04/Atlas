import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRIVACY_REQUEST_OPTIONS,
  validatePrivacyRequest,
  generatePrivacyMailtoUrl,
} from './contracts/privacy-requests.contract.ts';

describe('LEGAL-003 / AX-109: Data Subject Rights & Privacy Requests Specifications', () => {
  describe('1. Canonical Privacy Request Options', () => {
    it('defines 5 canonical data subject request categories', () => {
      assert.equal(PRIVACY_REQUEST_OPTIONS.length, 5);
      const types = PRIVACY_REQUEST_OPTIONS.map((opt) => opt.type);
      assert.ok(types.includes('DATA_ACCESS'));
      assert.ok(types.includes('DATA_RECTIFICATION'));
      assert.ok(types.includes('PROCESSING_RESTRICTION'));
      assert.ok(types.includes('DELETION_ASSISTANCE'));
      assert.ok(types.includes('GENERAL_PRIVACY_INQUIRY'));
    });
  });

  describe('2. Request Payload Validation Engine', () => {
    it('passes for valid payload with sufficient subject and detail length', () => {
      const res = validatePrivacyRequest({
        requestType: 'DATA_ACCESS',
        subject: 'Export my domain historical telemetry',
        details: 'I would like a machine-readable export of all snapshot metadata.',
      });
      assert.equal(res.isValid, true);
      assert.equal(res.error, undefined);
    });

    it('rejects payload missing requestType', () => {
      const res = validatePrivacyRequest({
        subject: 'Valid Subject',
        details: 'Valid details describing the request.',
      });
      assert.equal(res.isValid, false);
      assert.equal(res.error, 'Please select a request type.');
    });

    it('rejects short or empty subject', () => {
      const res = validatePrivacyRequest({
        requestType: 'DATA_ACCESS',
        subject: 'ab',
        details: 'Valid details describing the request.',
      });
      assert.equal(res.isValid, false);
      assert.equal(res.error, 'Subject must be at least 3 characters.');
    });

    it('rejects short or empty details', () => {
      const res = validatePrivacyRequest({
        requestType: 'DATA_ACCESS',
        subject: 'Valid Subject',
        details: 'too short',
      });
      assert.equal(res.isValid, false);
      assert.equal(res.error, 'Please provide at least 10 characters describing your request.');
    });
  });

  describe('3. Privacy Mailto URI Generator', () => {
    it('generates a properly encoded mailto URI directed to privacy@argonion.com', () => {
      const url = generatePrivacyMailtoUrl({
        requestType: 'DATA_ACCESS',
        subject: 'Export Domain Data',
        details: 'Please export all records.',
        userEmail: 'alice@example.com',
        userId: 'usr_1234567890',
      });

      assert.ok(url.startsWith('mailto:privacy@argonion.com'));
      assert.ok(url.includes('subject='));
      assert.ok(url.includes('body='));
      assert.ok(url.includes('alice%40example.com') || url.includes('alice@example.com'));
      assert.ok(url.includes('usr_1234567890'));
    });
  });
});
