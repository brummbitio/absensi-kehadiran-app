export interface Employee {
    id: number;
    name: string;
    identity_number: string;
    division: string;
    is_active: boolean;
    created_at?: string;
}

export interface Holiday {
    id: number;
    date: string;
    description: string;
}

export interface ScanResult {
    employee_name: string;
    time: string;
    status: string;
}

export interface ImportResult {
    inserted: number;
    skipped: number;
    errors: string[];
}
