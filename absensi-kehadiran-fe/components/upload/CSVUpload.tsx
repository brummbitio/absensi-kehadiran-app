'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ImportResult } from '@/lib/types';

export function CSVUpload({ onSuccess }: { onSuccess: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState('');

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError('');
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/employees/import', formData);
            setResult(res.data.data);
            setFile(null); // Reset file
            onSuccess();
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4 border p-4 rounded-lg bg-white shadow-sm">
            <h3 className="text-lg font-medium">Upload Data Karyawan (CSV)</h3>
            <div className="flex items-center gap-4">
                <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="max-w-sm"
                />
                <Button onClick={handleUpload} disabled={!file || uploading}>
                    {uploading ? 'Uploading...' : 'Import CSV'}
                    <Upload className="ml-2 h-4 w-4" />
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {result && (
                <Alert className="bg-green-50 text-green-900 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle>Import Successful</AlertTitle>
                    <AlertDescription>
                        Inserted: {result.inserted}, Skipped: {result.skipped}
                        {result.errors?.length > 0 && (
                            <div className="mt-2 text-sm text-red-600">
                                Errors:
                                <ul className="list-disc pl-4 max-h-20 overflow-auto">
                                    {result.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                                </ul>
                            </div>
                        )}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
