🔧 Stove Monitoring Dashboard Architecture
🔑 Tech Stack
Frontend: React.js (Vite)

Backend: Node.js + Express

Database: MongoDB Atlas

Authentication: JWT + Role-based access (Super Admin, Viewer)

State Management: React hooks + Context API (Auth)

Hosting: Frontend – Hostinger, Backend – Render/any Node-compatible server

🗂️ File + Folder Structure
plaintext
Copy
Edit
stove-dashboard/
├── client/                      # React + Vite frontend
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── assets/              # Icons, images
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Route-level components
│   │   ├── context/             # Auth and global context
│   │   ├── services/            # API service calls
│   │   ├── hooks/               # Custom hooks
│   │   ├── utils/               # Helper functions
│   │   ├── App.jsx              # App wrapper with routes
│   │   ├── main.jsx             # Vite entry point
│   ├── .env                    # VITE_API_URL
│   ├── vite.config.js          # Vite config
│
├── server/                      # Node.js backend
│   ├── controllers/             # Request handlers
│   ├── models/                  # Mongoose models
│   ├── routes/                  # Express routes
│   ├── middleware/              # Auth, error handling
│   ├── config/                  # DB and env config
│   ├── index.js                 # Express app entry point
│   ├── .env                     # JWT_SECRET, Mongo URI
│
├── README.md
├── package.json                # Root dependencies
🧠 Functional Overview
📲 Frontend (client/)
components/
Navbar.jsx: Role-based nav (Super Admin / Viewer)

StoveTable.jsx: Displays list of stove_ids and location

DataModal.jsx: Shows detailed timestamp data

StoveForm.jsx: Used by Super Admin to add/edit/delete entries

pages/
Dashboard.jsx: Main dashboard with stove usage summary

Login.jsx: Login form (role assigned on login)

Unauthorized.jsx: If role permissions denied

context/AuthContext.jsx
Stores user info + token

Provides login(), logout(), isAdmin functions

services/api.js
Axios setup with auth header

API methods: login, getStoves, addStove, deleteStove, editStove

hooks/useAuth.js
Easy access to auth context

🌐 Backend (server/)
models/User.js
js
Copy
Edit
{
  username: String,
  password: String (hashed),
  role: 'super_admin' | 'viewer'
}
models/StoveData.js
js
Copy
Edit
{
  stove_id: String,
  location: String,
  logs: [
    {
      date: Date,
      start_time: String,
      end_time: String,
      duration: Number, // in mins
      cooking_time: Number, // in mins
      wattage_W: Number
    }
  ]
}
routes/auth.js
POST /login – issues JWT token

Validates credentials and sets role

routes/stoves.js
GET /stoves – returns stove list

GET /stoves/:id – return logs for one stove

POST /stoves – add new entry (super_admin only)

PUT /stoves/:id – edit entry (super_admin only)

DELETE /stoves/:id – delete (super_admin only)

middleware/auth.js
verifyToken – JWT check

requireRole('super_admin') – access control

🔐 Authentication & Authorization
Users log in via /login

JWT token stored in localStorage

Token sent on each API request (Authorization: Bearer <token>)

Backend verifies token and checks role before allowing actions

Role-based frontend rendering (e.g., hide Add/Delete buttons for viewer)

🧩 State Management
Area	Managed by	Notes
Auth	AuthContext	Provides user, token, role
Stove List	Dashboard.jsx (useState)	Refetched on update
Selected Stove	StoveTable.jsx → Modal	Modal shows timestamped logs
Form Input	StoveForm.jsx	Controlled inputs
Global API State	Axios + custom hooks	Handle errors, loading

🔄 How Services Connect
plaintext
Copy
Edit
Frontend (React + Vite)
   |
   |---> API Call via Axios (with JWT in headers)
   |
Backend (Express.js + MongoDB Atlas)
   |
   |---> Auth Middleware → Role Check
   |---> Mongoose Models → MongoDB Atlas
🔍 Example Flow: Viewer Logs In and Checks Stove
Viewer visits /login → enters credentials

Auth API issues JWT with role viewer

Viewer redirected to /dashboard

Stove table is fetched → shows stove_id, location

Viewer clicks "View Logs" → modal shows all logs for that stove

Viewer cannot see Add/Edit/Delete buttons

🛠️ Example Flow: Super Admin Adds Entry
Logs in → gets token with super_admin role

On dashboard, clicks "Add Stove Data"

Form modal pops up to enter details

On submit → POST /stoves called with data

MongoDB stores new stove + usage logs

UI refetches and updates