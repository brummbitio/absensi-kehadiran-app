'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, QrCode, ChevronLeft, ChevronRight } from 'lucide-react';
import { Employee } from '@/lib/types';
import { EmployeeForm } from '../forms/EmployeeForm';
import { QRModal } from '../modals/QRModal';
import { CSVUpload } from '../upload/CSVUpload';

export default function EmployeeTable() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [qrPayload, setQrPayload] = useState<object | null>(null);
    const [qrEmployeeName, setQrEmployeeName] = useState('');
    const [isQROpen, setIsQROpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const itemsPerPage = 10;

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/employees?page=${currentPage}&limit=${itemsPerPage}`);
            const data = res.data.data;
            setEmployees(data.data || []);
            setTotalEmployees(data.total || 0);
            setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [currentPage]);

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                await api.delete(`/employees/${id}`);
                if (employees.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                } else {
                    fetchEmployees();
                }
            } catch (err) {
                console.error(err);
                alert('Failed to delete');
            }
        }
    };

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setEditingEmployee(null);
        setIsFormOpen(true);
    };

    const handleShowQR = async (employee: Employee) => {
        try {
            const res = await api.get(`/employees/${employee.id}/qr`);
            setQrPayload(res.data.data);
            setQrEmployeeName(employee.name);
            setIsQROpen(true);
        } catch (err) {
            console.error(err);
            alert('Failed to load QR');
        }
    };

    const handleFormSuccess = () => {
        setCurrentPage(1);
        fetchEmployees();
    };

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(1, prev - 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Daftar Karyawan</h2>
                <Button onClick={handleCreate}>Tambah Karyawan</Button>
            </div>

            <CSVUpload onSuccess={handleFormSuccess} />

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead>Nomor Karyawan</TableHead>
                            <TableHead>Divisi</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
                            </TableRow>
                        ) : employees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">Tidak ada data karyawan</TableCell>
                            </TableRow>
                        ) : (
                            employees.map((emp, index) => (
                                <TableRow key={emp.id}>
                                    <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                                    <TableCell className="font-medium">{emp.name}</TableCell>
                                    <TableCell>{emp.identity_number}</TableCell>
                                    <TableCell>{emp.division}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${emp.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {emp.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleShowQR(emp)}>
                                            <QrCode className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(emp)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(emp.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {!loading && totalEmployees > 0 && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-gray-500">
                        Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalEmployees)} dari {totalEmployees} karyawan
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Sebelumnya
                        </Button>
                        <div className="text-sm font-medium px-3">
                            Halaman {currentPage} dari {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                        >
                            Selanjutnya
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            <EmployeeForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={handleFormSuccess}
                initialData={editingEmployee}
            />

            <QRModal
                isOpen={isQROpen}
                onClose={() => setIsQROpen(false)}
                payload={qrPayload}
                employeeName={qrEmployeeName}
            />
        </div>
    );
}
