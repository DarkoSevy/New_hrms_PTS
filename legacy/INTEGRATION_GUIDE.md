# Frontend-Backend Integration Guide

## Current Status

✅ **Backend**: Fully functional REST API running on http://localhost:5000
✅ **Frontend**: React app running on http://localhost:5173
✅ **API Service Layer**: Created at `services/api.ts`
⚠️ **Integration**: Needs manual completion due to file corruption

## What's Been Done

### Backend (Complete)
- Express.js server with TypeScript
- SQLite database with full schema
- All CRUD API endpoints for:
  - Employees (`/api/employees`)
  - Leave Requests (`/api/leaves`)
  - Vehicles (`/api/vehicles`)
  - Driver Schedules (`/api/schedules`)
  - Leads (`/api/leads`)
  - Payroll Records (`/api/payroll`)
  - Vacancies (`/api/vacancies`)
  - Candidates (`/api/candidates`)

### Frontend
- API service layer created (`services/api.ts`)
- Axios installed for HTTP requests
- All API methods defined

## Integration Steps

### Step 1: Fix DashboardLayout.tsx

The file got corrupted during automated editing. You need to manually add the API integration:

1. **Add imports** at the top of `DashboardLayout.tsx`:
```typescript
import { employeesAPI, vacanciesAPI, candidatesAPI } from '../services/api';
```

2. **Update state initialization** in the `DashboardLayout` component:
```typescript
const [employees, setEmployees] = useState<Employee[]>([]);
const [vacancies, setVacancies] = useState<Vacancy[]>([]);
const [candidates, setCandidates] = useState<Candidate[]>([]);
const [loading, setLoading] = useState(true);
```

3. **Add useEffect to fetch data** on component mount:
```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const [employeesRes, vacanciesRes, candidatesRes] = await Promise.all([
        employeesAPI.getAll(),
        vacanciesAPI.getAll(),
        candidatesAPI.getAll(),
      ]);
      setEmployees(employeesRes.data || []);
      setVacancies(vacanciesRes.data || []);
      setCandidates(candidatesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to initial data if API fails
      setEmployees(initialEmployees);
      setVacancies(initialVacancies);
      setCandidates(initialCandidates);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

### Step 2: Update CRUD Operations

For each component that manages data (EmployeeManagement, LeaveManagement, etc.), update the create/update/delete handlers to call the API:

**Example for Employee Creation:**
```typescript
const handleSaveEmployee = async (data: Employee) => {
  try {
    if (data.id) {
      // Update
      await employeesAPI.update(data.id, data);
      setEmployees(employees.map(e => e.id === data.id ? data : e));
    } else {
      // Create
      const response = await employeesAPI.create(data);
      setEmployees([response.data, ...employees]);
    }
  } catch (error) {
    console.error('Error saving employee:', error);
    alert('Failed to save employee');
  }
};
```

### Step 3: Add Loading States

Show loading indicators while data is being fetched:

```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-xl text-gray-600">Loading...</div>
    </div>
  );
}
```

### Step 4: Update Other Components

Apply the same pattern to:
- `Operations.tsx` - use `schedulesAPI`
- `SalesMarketing.tsx` - use `leadsAPI`
- `Finance.tsx` - use `payrollAPI`
- `Recruitment.tsx` - use `vacanciesAPI` and `candidatesAPI`

## Testing the Integration

1. **Start both servers:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
npm run dev
```

2. **Test API endpoints** using the browser console:
```javascript
// In browser console
fetch('http://localhost:5000/api/employees')
  .then(r => r.json())
  .then(console.log);
```

3. **Verify CORS** is working (backend already configured)

4. **Test CRUD operations** in the UI

## Common Issues & Solutions

### Issue: CORS Errors
**Solution**: Backend already has CORS enabled. If issues persist, check browser console.

### Issue: Empty Data
**Solution**: Backend seeds initial employee data automatically. Check backend console for "Database seeded successfully!"

### Issue: 404 Errors
**Solution**: Verify backend is running on port 5000 and endpoints match the API service.

## Next Steps

1. Fix the corrupted `DashboardLayout.tsx` file
2. Add API calls to all CRUD operations
3. Add proper error handling and user feedback
4. Add loading states throughout the app
5. Implement authentication (JWT tokens)
6. Add form validation
7. Implement optimistic UI updates

## File Locations

- **API Service**: `services/api.ts`
- **Backend Server**: `backend/src/server.ts`
- **Database**: `backend/database.sqlite` (auto-created)
- **Routes**: `backend/src/routes/*.ts`

## API Documentation

See `backend/README.md` for complete API documentation.
