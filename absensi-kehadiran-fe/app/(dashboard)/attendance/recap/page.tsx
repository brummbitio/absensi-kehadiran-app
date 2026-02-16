'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Employee } from '@/lib/types'; // Using Employee type, though report structure is arguably different

interface ReportEmployee extends Employee {
    employee_id: number;
    present_days: number;
    absent_days: number;
    attendance_dates: string[]; // Array of YYYY-MM-DD strings
}


export default function RecapPage() {
    const now = new Date();
    const [month, setMonth] = useState<string>((now.getMonth() + 1).toString());
    const [year, setYear] = useState<string>(now.getFullYear().toString());
    const [report, setReport] = useState<{ working_days: number; employees: ReportEmployee[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/report/monthly?month=${month}&year=${year}`);
            setReport(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const toggleRow = (employeeId: number) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(employeeId)) {
                newSet.delete(employeeId);
            } else {
                newSet.add(employeeId);
            }
            return newSet;
        });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Rekapitulasi Bulanan</h2>
                <div className="flex gap-2">
                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <SelectItem key={m} value={m.toString()}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button onClick={fetchReport} variant="outline">Refresh</Button>
                </div>
            </div>

            {report && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Hari Kerja</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{report.working_days}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Karyawan</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{report.employees.length}</div></CardContent>
                    </Card>
                </div>
            )}

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Nama Karyawan</TableHead>
                            <TableHead>Divisi</TableHead>
                            <TableHead className="text-center">Hadir</TableHead>
                            <TableHead className="text-center">Tidak Hadir</TableHead>
                            <TableHead className="text-center">Persentase Kehadiran</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
                        ) : !report?.employees?.length ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24">Tidak ada data</TableCell></TableRow>
                        ) : (
                            report.employees.map((emp) => {
                                const pct = report.working_days > 0 ? Math.round((emp.present_days / report.working_days) * 100) : 0;
                                const isExpanded = expandedRows.has(emp.employee_id);

                                return (
                                    <Collapsible key={emp.employee_id} asChild open={isExpanded} onOpenChange={() => toggleRow(emp.employee_id)}>
                                        <>
                                            <TableRow className="cursor-pointer hover:bg-gray-50">
                                                <CollapsibleTrigger asChild>
                                                    <TableCell className="text-center">
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4 mx-auto" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 mx-auto" />
                                                        )}
                                                    </TableCell>
                                                </CollapsibleTrigger>
                                                <TableCell className="font-medium">{emp.name}</TableCell>
                                                <TableCell>{emp.division}</TableCell>
                                                <TableCell className="text-center text-green-600 font-bold">{emp.present_days}</TableCell>
                                                <TableCell className="text-center text-red-600 font-bold">{emp.absent_days}</TableCell>
                                                <TableCell className="text-center">{pct}%</TableCell>
                                            </TableRow>
                                            <CollapsibleContent asChild>
                                                <TableRow>
                                                    <TableCell colSpan={6} className="bg-gray-50 p-4">
                                                        <div className="space-y-2">
                                                            <h4 className="font-semibold text-sm text-gray-700">Detail Kehadiran:</h4>
                                                            {emp.attendance_dates.length > 0 ? (
                                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                                    {emp.attendance_dates.map((date, idx) => (
                                                                        <div key={idx} className="text-sm bg-white p-2 rounded border border-green-200 text-green-700">
                                                                            {formatDate(date)}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-gray-500">Tidak ada kehadiran</p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            </CollapsibleContent>
                                        </>
                                    </Collapsible>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
