'use client';

import { QRCodeSVG } from 'qrcode.react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog"

interface QRModalProps {
    isOpen: boolean;
    onClose: () => void;
    payload: object | string | null; // The JSON payload from backend
    employeeName: string;
}

export function QRModal({ isOpen, onClose, payload, employeeName }: QRModalProps) {
    const qrValue = payload ? JSON.stringify(payload) : '';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>QR Code for {employeeName}</DialogTitle>
                    <DialogDescription>
                        Scan this code to check in/out.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center p-6">
                    {qrValue && (
                        <QRCodeSVG value={qrValue} size={256} />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
