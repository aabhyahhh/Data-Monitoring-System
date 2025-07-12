✅ MVP Build Plan: Stove Monitoring Dashboard
🔧 Phase 1: Backend Setup
🔹 Task 1: Initialize Node.js backend with Express
Start: Create server/ folder

End: index.js runs Express on port 5000 with a test route GET /ping → "pong"

🔹 Task 2: Connect to MongoDB Atlas
Start: Install mongoose, set up .env

End: Server logs "MongoDB connected" using Atlas URI

🔹 Task 3: Create User model
Start: Create models/User.js

End: Mongoose model with username, password, and role schema

🔹 Task 4: Create StoveData model
Start: Create models/StoveData.js

End: Mongoose model with stove_id, location, logs[] (date, start_time, etc.)

🔹 Task 5: Set up user login route
Start: Create routes/auth.js

End: POST /login accepts username + password, returns JWT (mock user hardcoded for now)

🔹 Task 6: Add JWT-based middleware
Start: Create middleware/auth.js

End: verifyToken adds req.user, rejects invalid tokens

🔹 Task 7: Create role-based middleware
Start: Add requireRole(role) function

End: Blocks access to protected routes if role mismatch

🔹 Task 8: Create CRUD routes for StoveData
Start: routes/stoves.js

End: GET, POST, PUT, DELETE routes working, with role restrictions

🔹 Task 9: Seed test user (Super Admin)
Start: Add user in DB manually or seed script

End: Can login with username admin, password test, role super_admin

🖼️ Phase 2: Frontend Setup (Vite + React)
🔹 Task 10: Initialize Vite + React frontend
Start: Create client/ with Vite React template

End: App runs on localhost:5173 and displays "Hello World"

🔹 Task 11: Set up React Router
Start: Install and configure react-router-dom

End: Routes: /login, /dashboard, /unauthorized

🔹 Task 12: Create login page UI
Start: Build form with username + password

End: Console logs input on submit

🔹 Task 13: Connect login to API
Start: services/api.js with login() method

End: On successful login, save JWT to localStorage

🔹 Task 14: Set up Auth Context
Start: Create AuthContext.jsx

End: useAuth() exposes user, role, login(), logout()

🔹 Task 15: Create private route component
Start: Add <PrivateRoute /> wrapper for protected routes

End: Redirects unauthenticated users to /login

📊 Phase 3: Stove Data UI
🔹 Task 16: Fetch stove list on dashboard
Start: Dashboard.jsx makes GET request to /stoves

End: Stove IDs and locations are displayed in a table

🔹 Task 17: View logs for a stove
Start: Add "View Logs" button to each stove row

End: Clicking shows a modal with date, start_time, end_time, etc.

🔹 Task 18: Format timestamps for readability
Start: Use date formatting in log modal

End: Dates appear as dd-mm-yyyy, times as hh:mm AM/PM

✏️ Phase 4: Admin-only Controls
🔹 Task 19: Show Add Entry button for Super Admin only
Start: Conditionally render based on role === 'super_admin'

End: Viewers don’t see the button

🔹 Task 20: Add form modal for new stove data
Start: StoveForm.jsx opens via “Add” button

End: Inputs for stove_id, location, and logs

🔹 Task 21: Submit new stove data to backend
Start: Form sends POST to /stoves with auth token

End: Data appears in stove table after success

🔹 Task 22: Implement Edit button for logs
Start: Add “Edit” next to each log entry

End: Opens modal prefilled with data

🔹 Task 23: Implement Delete log entry button
Start: Add “Delete” button to each log

End: Sends DELETE request, removes log from UI

🔐 Phase 5: Role Testing + Cleanup
🔹 Task 24: Create Viewer role user in DB
Start: Seed viewer user

End: Can log in but gets 403 if trying to access admin actions

🔹 Task 25: Show friendly error if access is denied
Start: Create Unauthorized.jsx

End: Redirect to this on 403 Forbidden

🔹 Task 26: Logout function
Start: Add logout() to AuthContext

End: Clears token + user state + redirects to /login

🔹 Task 27: Add loading + error states to all fetches
Start: Add local state for loading and error in all pages

End: Users see spinner or error message when appropriate

🚀 Optional Final Touches
Add chart of daily usage in dashboard

Add search or filter by location

Add pagination if logs are too many

Responsive design tweaks