import axios from 'axios';
import { pool } from '../src/config/db';

const API_URL = 'http://localhost:4000/api';
const EMAIL = 'admin@local.dev';
const PASSWORD = 'ChangeMe123!';

async function runTest() {
    try {
        console.log('🚀 Starting Attendance Integration Test...');

        // 1. Login
        console.log('🔑 Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email: EMAIL, password: PASSWORD });
        const token = loginRes.data.data.access_token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('✅ Logged in.');

        // 2. Create Employee
        console.log('ignitor: Creating Test Employee...');
        const empId = 'TEST_EMP_' + Date.now();
        const empRes = await axios.post(`${API_URL}/employees`, {
            name: 'Test Employee',
            identity_number: empId,
            division: 'TEST_DIV'
        }, { headers });
        const employeeId = empRes.data.data.id;
        console.log(`✅ Employee Created (ID: ${employeeId}).`);

        // 3. Get QR
        console.log('📷 Fetching QR Payload...');
        const qrRes = await axios.get(`${API_URL}/employees/${employeeId}/qr`, { headers });
        const payload = qrRes.data.data;
        console.log('✅ QR Payload received.');

        // 4. Scan (Valid)
        console.log('📲 Scanning (Expect Success)...');
        try {
            const scanRes = await axios.post(`${API_URL}/attendance/scan`, payload, { headers });
            console.log('✅ Scan Success:', scanRes.data);
        } catch (e: any) {
            console.error('❌ Scan Failed:', e.response?.data || e.message);
            process.exit(1);
        }

        // 5. Scan (Duplicate)
        console.log('🔄 Scanning Duplicate (Expect 409)...');
        try {
            await axios.post(`${API_URL}/attendance/scan`, payload, { headers });
            console.error('❌ Duplicate Scan succeeded (Should fail)!');
        } catch (e: any) {
            if (e.response?.status === 409) {
                console.log('✅ Duplicate Scan blocked (409).');
            } else {
                console.error('❌ Unexpected Error:', e.response?.status, e.response?.data);
            }
        }

        // 6. Scan (Invalid Signature)
        console.log('🔓 Scanning Invalid Signature (Expect 403)...');
        const badPayload = { ...payload, sig: payload.sig.replace('a', 'b') };
        try {
            await axios.post(`${API_URL}/attendance/scan`, badPayload, { headers });
            console.error('❌ Invalid Sig Scan succeeded (Should fail)!');
        } catch (e: any) {
            if (e.response?.status === 403) {
                console.log('✅ Invalid Sig blocked (403).');
            } else {
                console.error('❌ Unexpected Error:', e.response?.status, e.response?.data);
            }
        }

        // 7. Holiday Test
        console.log('vacation: Testing Holiday Block (Expect 400)...');
        // Insert internal holiday for TODAY
        const today = new Date().toISOString().split('T')[0];
        await pool.query('INSERT INTO holidays (date, description) VALUES (?, ?)', [today, 'Integration Test Holiday']);

        // Create NEW employee for holiday test (since previous one is already checked in)
        const empId2 = 'TEST_EMP_HOL_' + Date.now();
        const empRes2 = await axios.post(`${API_URL}/employees`, {
            name: 'Holiday Tester',
            identity_number: empId2,
            division: 'TEST_DIV'
        }, { headers });
        const qrRes2 = await axios.get(`${API_URL}/employees/${empRes2.data.data.id}/qr`, { headers });

        try {
            await axios.post(`${API_URL}/attendance/scan`, qrRes2.data.data, { headers });
            console.error('❌ Holiday Scan succeeded (Should fail)!');
        } catch (e: any) {
            if (e.response?.status === 400 && e.response.data.message.includes('HOLIDAY_CLOSED')) {
                console.log('✅ Holiday Scan blocked (400).');
            } else {
                console.error('❌ Unexpected Error:', e.response?.status, e.response?.data);
            }
        }

        // Cleanup Holiday
        await pool.query('DELETE FROM holidays WHERE date = ?', [today]);
        console.log('🧹 Cleanup complete.');

    } catch (error: any) {
        console.error('❌ Test Script Error:', error.response?.data || error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

runTest();
