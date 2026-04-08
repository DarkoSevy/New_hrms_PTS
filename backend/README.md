# PTS HRMS Backend API

Backend API for the PTS HRMS system built with Node.js, Express, and SQLite.

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   - Copy `.env` and update `JWT_SECRET` for production

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

Base URL: `http://localhost:5000/api`

### Employees
- `GET /employees` - Get all employees
- `GET /employees/:id` - Get employee by ID
- `POST /employees` - Create new employee
- `PUT /employees/:id` - Update employee
- `DELETE /employees/:id` - Delete employee

### Leave Requests
- `GET /leaves` - Get all leave requests
- `POST /leaves` - Create leave request
- `PUT /leaves/:id` - Update leave request
- `DELETE /leaves/:id` - Delete leave request

### Vehicles
- `GET /vehicles` - Get all vehicles
- `POST /vehicles` - Create vehicle
- `PUT /vehicles/:id` - Update vehicle
- `DELETE /vehicles/:id` - Delete vehicle

### Driver Schedules
- `GET /schedules` - Get all schedules
- `POST /schedules` - Create schedule
- `PUT /schedules/:id` - Update schedule
- `DELETE /schedules/:id` - Delete schedule

### Leads
- `GET /leads` - Get all leads
- `POST /leads` - Create lead
- `PUT /leads/:id` - Update lead
- `DELETE /leads/:id` - Delete lead

### Payroll
- `GET /payroll` - Get all payroll records
- `POST /payroll` - Create payroll record
- `PUT /payroll/:id` - Update payroll record
- `DELETE /payroll/:id` - Delete payroll record

### Vacancies
- `GET /vacancies` - Get all vacancies
- `POST /vacancies` - Create vacancy
- `PUT /vacancies/:id` - Update vacancy
- `DELETE /vacancies/:id` - Delete vacancy

### Candidates
- `GET /candidates` - Get all candidates
- `GET /candidates/vacancy/:vacancyId` - Get candidates by vacancy
- `POST /candidates` - Create candidate
- `PUT /candidates/:id` - Update candidate
- `DELETE /candidates/:id` - Delete candidate

## Database

SQLite database is automatically created at `backend/database.sqlite` on first run.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** SQLite3
- **Auth:** JWT (ready for implementation)
- **Dev Tools:** Nodemon, ts-node
