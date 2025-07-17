# Elevator Management Simulation System

A full-stack real-time simulation system for managing elevators in buildings. Built with ASP.NET Core (API), React (TypeScript), SQL Server, and SignalR for real-time updates.

---

## 🚀 Tech Stack
- **Backend:** ASP.NET Core (API)
- **Frontend:** React (TypeScript)
- **Database:** SQL Server (using Entity Framework Core)
- **Real-time:** SignalR

---

## 📦 Project Structure

```
AdivceBackend/      # Backend (.NET Core API)
AdviceFrontend/     # Frontend (React)
```

---

## 🛠️ Setup Instructions

### 1. Database (SQL Server)
- Make sure SQL Server is running locally (default connection string is used, update if needed).
- Apply migrations automatically on first run.

### 2. Backend (ASP.NET Core)
```bash
cd AdivceBackend/AdivceBackend
# Restore dependencies
 dotnet restore
# Run the backend
 dotnet run
```
- The API will be available at `https://localhost:5001` (or as configured).

### 3. Frontend (React)
```bash
cd AdviceFrontend
# Install dependencies
npm install
# Run the frontend
npm run dev
```
- The app will be available at `http://localhost:3000`.

---

## 👤 Default Accounts

### Admin Account
- **Email:** `admin@gmail.com`
- **Password:** (Set during registration. The first person to register with this email becomes admin. No default password is enforced.)
- **Role:** Admin

### Test User Account (Auto-generated on first DB setup)
- **Email:** `user@gmail.com`
- **Password:** `User123!`
- **Role:** User

---

## 🔄 Real-Time Features
- Elevator status and movement updates are pushed to the frontend in real-time using SignalR.
- Users can see live elevator positions, door status, and call assignments.

---

## 🏢 Main Features
- User registration and login (admin and regular users)
- Building and elevator management
- Elevator call and assignment simulation
- Real-time updates for elevator status
- Statistics and recent call history

---

## 📝 Notes
- All passwords are securely hashed and stored.
- The admin role is assigned to the first user who registers with `admin@gmail.com`.
- The test user is created automatically for demo/testing purposes if it does not exist.
- You can change connection strings and other settings in the backend's `appsettings.json`.
