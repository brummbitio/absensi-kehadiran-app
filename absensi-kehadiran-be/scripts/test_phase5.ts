import axios from 'axios';
import { pool } from '../src/config/db';

const API_URL = 'http://localhost:4000/api';
const EMAIL = 'admin@local.dev';
const PASSWORD = 'ChangeMe123!';

async function runTest() {
    try {
        console.log('🚀 Starting Phase 5 Integration Test...');

        // 1. Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email: EMAIL, password: PASSWORD });
        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Logged in.');

        // 2. Create Holiday
        const hDate = '2026-12-25';
        try {
            await axios.post(`${API_URL}/holidays`, { date: hDate, description: 'Christmas' }, { headers });
            console.log('✅ Holiday Created.');
        } catch (e: any) {
            if (e.response?.status === 409) console.log('✅ Holiday already exists (409).');
            else throw new Error('Holiday create failed: ' + e.message);
        }

        // 3. Duplicate Holiday Check
        try {
            await axios.post(`${API_URL}/holidays`, { date: hDate, description: 'Dup' }, { headers });
            throw new Error('Duplicate holiday allowed!');
        } catch (e: any) {
            if (e.response?.status === 409) console.log('✅ Duplicate Holiday Blocked (409).');
            else throw e;
        }

        // 4. Get Holidays
        const hRes = await axios.get(`${API_URL}/holidays`, { headers });
        if (hRes.data.data.length > 0) console.log('✅ Holidays Fetched.');
        else throw new Error('No holidays found.');

        // 5. Monthly Report
        // Need attendance data to verify counts.
        // Assuming data exists from previous tests or manual.
        // Let's call report for current month
        const now = new Date();
        const m = now.getMonth() + 1;
        const y = now.getFullYear();

        console.log(`📊 Fetching Report for ${m}/${y}...`);
        const repRes = await axios.get(`${API_URL}/report/monthly?month=${m}&year=${y}`, { headers });
        const report = repRes.data.data;

        console.log('✅ Report Received:', {
            working_days: report.working_days,
            employees_count: report.employees.length,
            sample_employee: report.employees[0]
        });

        // 6. Cleanup Holiday
        const hId = hRes.data.data.find((h: any) => h.date === hDate)?.id;
        if (hId) {
            await axios.delete(`${API_URL}/holidays/${hId}`, { headers });
            console.log('✅ Holiday Cleanup.');
        }

    } catch (error: any) {
        console.error('❌ Test Script Error:', error.response?.data || error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

runTest();
