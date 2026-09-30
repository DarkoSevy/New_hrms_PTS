/**
 * Test script for leave balance calculation accuracy
 * Tests the calculateLeaveDays function with various date scenarios
 */

import { calculateLeaveDays, validateLeaveBalance } from './utils/leaveUtils';

// Test cases for calculateLeaveDays
const testCases = [
    {
        description: 'Single day leave (same start and end date)',
        startDate: '2025-01-15',
        endDate: '2025-01-15',
        expected: 1
    },
    {
        description: 'Two consecutive days',
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        expected: 2
    },
    {
        description: 'One week leave (7 days)',
        startDate: '2025-01-15',
        endDate: '2025-01-21',
        expected: 7
    },
    {
        description: 'Two weeks leave (14 days)',
        startDate: '2025-01-15',
        endDate: '2025-01-28',
        expected: 14
    },
    {
        description: 'One month leave (31 days)',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        expected: 31
    },
    {
        description: 'Leave spanning month boundary',
        startDate: '2025-01-28',
        endDate: '2025-02-03',
        expected: 7
    },
    {
        description: 'Leave in February (non-leap year)',
        startDate: '2025-02-01',
        endDate: '2025-02-28',
        expected: 28
    },
    {
        description: 'Leave spanning year boundary',
        startDate: '2024-12-30',
        endDate: '2025-01-05',
        expected: 7
    }
];

console.log('=== Leave Days Calculation Tests ===\n');

let passedTests = 0;
let failedTests = 0;

testCases.forEach((test, index) => {
    const result = calculateLeaveDays(test.startDate, test.endDate);
    const passed = result === test.expected;

    if (passed) {
        passedTests++;
        console.log(`✅ Test ${index + 1} PASSED: ${test.description}`);
        console.log(`   ${test.startDate} to ${test.endDate} = ${result} days\n`);
    } else {
        failedTests++;
        console.log(`❌ Test ${index + 1} FAILED: ${test.description}`);
        console.log(`   Expected: ${test.expected} days`);
        console.log(`   Got: ${result} days`);
        console.log(`   Dates: ${test.startDate} to ${test.endDate}\n`);
    }
});

console.log('=== Balance Validation Tests ===\n');

const validationTests = [
    {
        description: 'Sufficient balance',
        daysRequested: 5,
        remainingDays: 10,
        shouldBeValid: true
    },
    {
        description: 'Exact balance',
        daysRequested: 10,
        remainingDays: 10,
        shouldBeValid: true
    },
    {
        description: 'Insufficient balance',
        daysRequested: 15,
        remainingDays: 10,
        shouldBeValid: false
    },
    {
        description: 'Zero balance',
        daysRequested: 1,
        remainingDays: 0,
        shouldBeValid: false
    },
    {
        description: 'Invalid request (0 days)',
        daysRequested: 0,
        remainingDays: 10,
        shouldBeValid: false
    },
    {
        description: 'Invalid request (negative days)',
        daysRequested: -5,
        remainingDays: 10,
        shouldBeValid: false
    }
];

validationTests.forEach((test, index) => {
    const result = validateLeaveBalance(test.daysRequested, test.remainingDays);
    const passed = result.valid === test.shouldBeValid;

    if (passed) {
        passedTests++;
        console.log(`✅ Validation Test ${index + 1} PASSED: ${test.description}`);
        console.log(`   Requested: ${test.daysRequested}, Remaining: ${test.remainingDays}`);
        console.log(`   Result: ${result.valid ? 'Valid' : 'Invalid'} ${result.message ? `(${result.message})` : ''}\n`);
    } else {
        failedTests++;
        console.log(`❌ Validation Test ${index + 1} FAILED: ${test.description}`);
        console.log(`   Expected: ${test.shouldBeValid ? 'Valid' : 'Invalid'}`);
        console.log(`   Got: ${result.valid ? 'Valid' : 'Invalid'}\n`);
    }
});

console.log('=== Test Summary ===');
console.log(`Total Tests: ${passedTests + failedTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

export { };
