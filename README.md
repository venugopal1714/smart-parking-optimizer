# 🚗 Smart Parking Slot Optimizer

Full-stack parking management system with AI occupancy prediction.

## Tech Stack
- **Frontend**: React + Ant Design
- **Backend**: Node.js (Express) + PostgreSQL
- **Android**: Flutter
- **AI/ML**: Historical average prediction + Last-3-entries fallback

---

## 🚀 Quick Setup (Cursor)

### 1. Database Setup
```bash
# Install PostgreSQL, then:
psql -U postgres -f backend/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your DB password
npm install
npm run dev
# Runs on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

### 4. Android (Flutter)
```bash
cd android
flutter pub get
# Update BASE_URL in lib/services/api_service.dart if needed
flutter run
```

---

## 📱 Features

### User Web App (React)
| Feature | Route |
|---------|-------|
| Book parking slot | `/` |
| Visual slot map | `/map` |
| AI prediction panel | `/prediction` |
| Admin dashboard | `/admin` |

### Backend API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/slots` | All slots |
| GET | `/api/slots/available` | Available slots |
| PUT | `/api/slots/:id/status` | Update slot (Android) |
| POST | `/api/bookings` | Create booking |
| PUT | `/api/bookings/:id/cancel` | Cancel booking |
| GET | `/api/prediction` | Get occupancy prediction |
| GET | `/api/prediction/today` | 24h prediction chart |
| GET | `/api/admin/dashboard` | Admin stats |

### Android Guard App (Flutter)
- View all slot statuses live
- Update slot occupied/available with vehicle number
- View AI prediction with fallback toggle

---

## 🤖 AI/ML Prediction Logic

```
Primary (AI): 
  SELECT AVG(occupancy_rate) 
  FROM occupancy_history 
  WHERE hour_of_day = CURRENT_HOUR 
    AND day_of_week = CURRENT_DAY

Fallback (if samples < 3 OR manually toggled):
  SELECT AVG(occupancy_rate) 
  FROM occupancy_history 
  ORDER BY recorded_at DESC 
  LIMIT 3
```

### Demo Flow for Evaluators
1. **Book a slot** → Go to `/`, fill form, select slot, click "Book Now"
2. **See prediction** → Go to `/prediction`, see AI chart for today
3. **Toggle to fallback** → Switch "Disable AI" → chart changes color, method badge shows FALLBACK
4. **Update via Android** → Open Flutter app → Slots tab → tap slot → Mark Occupied
5. **Admin view** → Go to `/admin`, see stats, override slot status

---

## 🗂 Project Structure
```
smart-parking/
├── backend/
│   ├── schema.sql          ← Run this first
│   ├── .env.example        ← Copy to .env
│   └── src/
│       ├── index.js
│       ├── models/db.js
│       └── routes/
│           ├── slots.js
│           ├── bookings.js
│           ├── prediction.js  ← AI logic here
│           └── admin.js
├── frontend/
│   └── src/
│       ├── App.js
│       ├── services/api.js
│       ├── components/Layout.js
│       └── pages/
│           ├── UserBooking.js
│           ├── PredictionPanel.js  ← AI demo
│           ├── AdminDashboard.js
│           └── SlotMap.js
└── android/
    └── lib/
        ├── main.dart
        ├── services/api_service.dart
        ├── models/parking_slot.dart
        └── screens/
            ├── home_screen.dart
            ├── slot_list_screen.dart  ← Guard update
            └── prediction_screen.dart
```
