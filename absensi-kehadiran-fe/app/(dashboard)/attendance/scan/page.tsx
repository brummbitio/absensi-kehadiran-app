'use client';

import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import api from '@/lib/api';
import { ScanResultCard } from '@/components/attendance/ScanResultCard';
import { ScanResult } from '@/lib/types';

export default function ScanPage() {
    const [scanResult, setScanResult] = useState<{ status: 'idle' | 'loading' | 'success' | 'error', data?: ScanResult, message?: string }>({ status: 'idle' });
    const [lastScan, setLastScan] = useState<string>('');
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (scanResult.status === 'success' || scanResult.status === 'error') {
            const timer = setTimeout(() => {
                setScanResult({ status: 'idle' });
                setIsPaused(false);
                setLastScan('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [scanResult.status]);

    const handleScan = async (detectedCodes: any[]) => {
        if (isPaused || detectedCodes.length === 0) return;

        const rawValue = detectedCodes[0].rawValue;
        if (rawValue === lastScan) return;

        setIsPaused(true);
        setLastScan(rawValue);
        setScanResult({ status: 'loading' });

        try {
            let payload;
            try {
                payload = JSON.parse(rawValue);
            } catch {
                throw new Error('Format QR Tidak Valid (Bukan JSON)');
            }

            const res = await api.post('/attendance/scan', payload);
            setScanResult({ status: 'success', data: res.data.data });

        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            const msg = error.response?.data?.message || error.message || 'Scan failed';
            setScanResult({ status: 'error', message: msg });
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-center">Scan Absensi</h2>

            <div className="border rounded-lg overflow-hidden bg-black aspect-square relative">
                <Scanner
                    onScan={handleScan}
                    allowMultiple={true}
                    scanDelay={500}
                    components={{
                        onOff: true,
                        torch: true
                    }}
                />

                {/* Overlay for status */}
                {isPaused && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <p className="text-white font-bold">Processing...</p>
                    </div>
                )}
            </div>

            <ScanResultCard {...scanResult} />

            <div className="text-center text-sm text-gray-500">
                Pastikan pencahayaan cukup dan pegang dengan stabil.
            </div>
        </div>
    );
}
