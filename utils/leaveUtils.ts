// Utility function to calculate the number of leave days between two dates
export const calculateLeaveDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate difference in milliseconds
    const diffTime = Math.abs(end.getTime() - start.getTime());

    // Convert to days and add 1 to include both start and end dates
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return diffDays;
};

// Format date to YYYY-MM-DD
export const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Check if leave balance is sufficient
export const validateLeaveBalance = (
    daysRequested: number,
    remainingDays: number
): { valid: boolean; message?: string } => {
    if (daysRequested <= 0) {
        return { valid: false, message: 'Invalid number of days requested' };
    }

    if (remainingDays < daysRequested) {
        return {
            valid: false,
            message: `Insufficient leave balance. You have ${remainingDays} days remaining, but requested ${daysRequested} days.`
        };
    }

    return { valid: true };
};
