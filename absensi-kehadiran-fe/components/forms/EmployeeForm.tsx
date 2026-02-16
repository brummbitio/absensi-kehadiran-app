'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"

import { Employee } from '@/lib/types';

interface EmployeeFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Employee | null; // If present, edit mode
}

export function EmployeeForm({ isOpen, onClose, onSuccess, initialData }: EmployeeFormProps) {
    const [name, setName] = useState('');
    const [identityNumber, setIdentityNumber] = useState('');
    const [division, setDivision] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setIdentityNumber(initialData.identity_number);
                setDivision(initialData.division);
            } else {
                setName('');
                setIdentityNumber('');
                setDivision('');
            }
            setError('');
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (initialData) {
                await api.put(`/employees/${initialData.id}`, { name, identity_number: identityNumber, division });
            } else {
                await api.post('/employees', { name, identity_number: identityNumber, division });
            }
            onSuccess();
            onClose();
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error(error);
            setError(error.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="id_num" className="text-right">ID Number</Label>
                            <Input id="id_num" value={identityNumber} onChange={e => setIdentityNumber(e.target.value)} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="division" className="text-right">Division</Label>
                            <Input id="division" value={division} onChange={e => setDivision(e.target.value)} className="col-span-3" required />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save files'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
