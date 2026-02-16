import crypto from 'crypto';

export interface QRPayload {
    uid: string;
    div: string;
    ts: string;
    sig: string;
}

export const generateQRPayload = (
    uniqueId: string,
    division: string,
    qrSecret: string
): QRPayload => {
    // Static timestamp (creation time) - in real world might rotate, but for "Static QR" we use creation time or a fixed value.
    // To make it deterministic for the specific employee secret, we just need a value that is verified.
    // Let's use current time as the "timestamp of generation" which stays frozen in the printed QR.
    const ts = Date.now().toString();

    // Data to sign
    const dataToSign = `${uniqueId}${division}${ts}`;

    // HMAC-SHA256
    const sig = crypto
        .createHmac('sha256', qrSecret)
        .update(dataToSign)
        .digest('hex');

    return {
        uid: uniqueId,
        div: division,
        ts: ts,
        sig: sig
    };
};

export const verifyQRSignature = (
    payload: QRPayload,
    qrSecret: string
): boolean => {
    const { uid, div, ts, sig } = payload;
    const dataToSign = `${uid}${div}${ts}`;

    const expectedSig = crypto
        .createHmac('sha256', qrSecret)
        .update(dataToSign)
        .digest('hex');

    const sigBuffer = Buffer.from(sig, 'hex');
    const expectedSigBuffer = Buffer.from(expectedSig, 'hex');

    if (sigBuffer.length !== expectedSigBuffer.length) {
        return false;
    }

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(sigBuffer, expectedSigBuffer);
};
