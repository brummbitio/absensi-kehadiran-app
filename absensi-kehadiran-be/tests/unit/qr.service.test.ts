import { describe, it, expect } from '@jest/globals';
import { generateQRPayload, verifyQRSignature, QRPayload } from '../../src/services/qr.service';

describe('QR Service', () => {
    const mockUid = 'EMP-1234567890';
    const mockDiv = 'IT';
    const mockSecret = 'super-secret-key';

    it('should generate a valid QR payload with signature', () => {
        const payload: QRPayload = generateQRPayload(mockUid, mockDiv, mockSecret);

        expect(payload).toHaveProperty('uid', mockUid);
        expect(payload).toHaveProperty('div', mockDiv);
        expect(payload).toHaveProperty('ts');
        expect(payload).toHaveProperty('sig');
        expect(typeof payload.sig).toBe('string');
    });

    it('should verify a valid signature correctly', () => {
        const payload: QRPayload = generateQRPayload(mockUid, mockDiv, mockSecret);
        const isValid = verifyQRSignature(payload, mockSecret);
        expect(isValid).toBe(true);
    });

    it('should reject an invalid signature', () => {
        const payload: QRPayload = generateQRPayload(mockUid, mockDiv, mockSecret);
        // Tamper with the signature
        payload.sig = 'invalid_signature_string';

        const isValid = verifyQRSignature(payload, mockSecret);
        expect(isValid).toBe(false);
    });

    it('should reject a tampered payload (e.g. changed uid)', () => {
        const payload: QRPayload = generateQRPayload(mockUid, mockDiv, mockSecret);
        // Tamper with data but keep old signature
        payload.uid = 'EMP-HACKER';

        const isValid = verifyQRSignature(payload, mockSecret);
        expect(isValid).toBe(false);
    });
});
