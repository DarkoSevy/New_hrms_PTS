# Employee Import Template

## Instructions
Upload this Excel file with your employee data. The system will automatically import all employees into the database.

## Required Columns

| Column Name | Type | Required | Example | Description |
|-------------|------|----------|---------|-------------|
| name | Text | Yes | John Doe | Full name of employee |
| employeeId | Text | No | EMP001 | Unique employee ID (auto-generated if not provided) |
| department | Text | Yes | Operations | Department name |
| role | Text | Yes | Driver | Job role/title |
| status | Text | No | Active | Employee status (default: Active) |
| location | Text | No | Kigali | Work location |
| hireDate | Date | No | 2024-01-15 | Date of hire (default: today) |

## Valid Values

**Department:**
- Operations
- Sales
- HR
- Finance
- IT
- Marketing

**Role:**
- Administrator
- Manager
- Driver
- Sales Representative
- HR Specialist
- Accountant
- Developer
- Marketing Specialist

**Status:**
- Active
- OnLeave
- Terminated

## Example Data

| name | employeeId | department | role | status | location | hireDate |
|------|------------|------------|------|--------|----------|----------|
| John Doe | EMP001 | Operations | Driver | Active | Kigali | 2024-01-15 |
| Jane Smith | EMP002 | HR | HR Specialist | Active | Kigali | 2024-02-01 |
| Mike Johnson | EMP003 | Finance | Accountant | Active | Musanze | 2024-03-10 |

## Notes
- Make sure your Excel file has these column names exactly as shown (case-sensitive)
- The first row should contain the column headers
- Remove example data before importing your actual employees
- Duplicate employeeIds will be automatically generated if not provided
