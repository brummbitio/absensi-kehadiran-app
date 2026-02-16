'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Trash2 } from 'lucide-react';

import { Holiday } from '@/lib/types';

export default function HolidaysPage() {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState('');

    const fetchHolidays = async () => {
        try {
            const res = await api.get('/holidays');
            setHolidays(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        setError('');

        try {
            await api.post('/holidays', { date, description });
            setDate('');
            setDescription('');
            fetchHolidays();
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.response?.data?.message || 'Failed to add holiday');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this holiday?')) return;
        try {
            await api.delete(`/holidays/${id}`);
            fetchHolidays();
        } catch (err) {
            console.error(err);
            alert('Failed to delete');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Manajemen Hari Libur</h2>

            {/* Add Form */}
            <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
                <h3 className="font-medium">Tambah Hari Libur</h3>
                <form onSubmit={handleAdd} className="flex gap-4 items-end">
                    <div className="space-y-1">
                        <Label>Date</Label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                    </div>
                    <div className="space-y-1 flex-1">
                        <Label>Description</Label>
                        <Input placeholder="e.g. Christmas" value={description} onChange={e => setDescription(e.target.value)} required />
                    </div>
                    <Button type="submit" disabled={adding}>{adding ? 'Adding...' : 'Add Holiday'}</Button>
                </form>
                {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Deskripsi</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={3} className="text-center h-24">Loading...</TableCell></TableRow>
                        ) : holidays.length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="text-center h-24">Tidak ada hari libur.</TableCell></TableRow>
                        ) : (
                            holidays.map((h) => (
                                <TableRow key={h.id}>
                                    <TableCell>{h.date}</TableCell>
                                    <TableCell>{h.description}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(h.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
