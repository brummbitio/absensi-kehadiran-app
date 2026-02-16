'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { ScanResult } from '@/lib/types';

interface ScanResultCardProps {
    status: 'success' | 'error' | 'idle' | 'loading';
    data?: ScanResult;
    message?: string;
}

export function ScanResultCard({ status, data, message }: ScanResultCardProps) {
    if (status === 'idle') {
        return (
            <Card className="tc-center bg-gray-50 border-dashed">
                <CardContent className="pt-6 pb-6 text-center text-gray-500">
                    Arahkan QR Code ke Kamera
                </CardContent>
            </Card>
        );
    }

    if (status === 'loading') {
        return (
            <Card className="animate-pulse">
                <CardContent className="pt-6 pb-6 text-center">
                    Processing...
                </CardContent>
            </Card>
        );
    }

    if (status === 'success') {
        return (
            <Card className="bg-green-50 border-green-200">
                <CardHeader>
                    <CardTitle className="flex items-center text-green-700">
                        <CheckCircle2 className="mr-2 h-6 w-6" />
                        Check-In Successful
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-green-800 space-y-2">
                    <p className="font-bold text-lg">{data?.employee_name}</p>
                    <p>Time: {data?.time ? new Date(data.time).toLocaleTimeString() : '-'}</p>
                    <p className="text-sm opacity-75">Status: {data?.status}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-red-50 border-red-200">
            <CardHeader>
                <CardTitle className="flex items-center text-red-700">
                    <AlertCircle className="mr-2 h-6 w-6" />
                    Scan Failed
                </CardTitle>
            </CardHeader>
            <CardContent className="text-red-800">
                <p>{message || 'Unknown error occurred.'}</p>
                {/* Specific help text based on error messages could go here */}
            </CardContent>
        </Card>
    );
}
