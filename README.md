# SinggahSana 🏠

**SinggahSana** is a web-based kost searching platform designed to help users find and discover kost accommodations based on their needs and preferences.

The platform provides a centralized place for users to browse available kosts, view detailed information, search and filter accommodations, save favorite kosts, and submit rental requests. Kost owners can manage their kost listings, rooms, and incoming rental requests through the platform.

---

## 📌 Features

### 👤 User Management

* User registration
* User login and logout
* Session management
* User profile management
* Role-based access for users and kost owners

### 🏠 Kost Management

* View available kosts
* View kost details
* Add kost listings
* Edit kost listings
* Delete kost listings
* Manage rooms and room availability
* Manage kost facilities and information

### 🔎 Search & Discovery

* Search kosts
* Filter by location
* Filter by price range
* Filter by facilities
* Sort search results

### ❤️ Favorites

* Add kost to favorites
* View saved kosts
* Remove kost from favorites

### 📋 Rental Request

* Submit rental/booking requests
* View request status
* Kost owners can accept or reject requests
* Track rental request history

### ⚡ Cache

* Redis-based caching
* Cache frequently requested data
* Time-to-live (TTL) for temporary cached data

---

## 🔗 API

The backend provides RESTful API endpoints for communication between the frontend and backend.

Example endpoint groups:

```text
/api/auth
/api/users
/api/kost
/api/bookings
/api/favorites
```

Detailed API documentation and testing results are available in the `postman/` directory and project documentation.

---

## 🗄️ Database

SinggahSana uses **MongoDB** as its primary database.

Main data models include:

```text
User
 ├── owns → Kost
 ├── favorites → Kost
 └── creates → Booking

Kost
 └── contains → Room

Booking
 ├── belongs to → User
 └── references → Room
```

The database design is documented in the project's ERD.

---

## ⚡ Caching

**Redis** is used as a caching layer for data that may be requested frequently or needs temporary storage.

Potential use cases include:

* Cached kost search results
* Temporary session-related data
* Temporary verification data
* Data with a defined TTL

Caching is implemented separately from the primary MongoDB data storage.

---

## 🧪 API Testing

API endpoints are tested using **Postman**.

Testing covers:

* Authentication
* User management
* Kost management
* Room management
* Search and filtering
* Favorites
* Booking/rental requests
* Session management
* Cache-related functionality

The Postman collection is provided in:

```text
postman/SinggahSana-API.json
```

---

## 📖 Documentation

Project documentation contains:

* User stories
* Requirements analysis
* Feature analysis
* Use Case Diagram
* ERD
* Flowcharts
* System architecture
* API documentation
* API testing results

Documentation can be found in:

```text
docs/
```

---

## 👥 Team

| Role     | Member         | NIM |
| -------- | -------------- | --- |
| **Suki Liar** | Farand Hafiz | 24/540618/TK/60027 |
| **Larper** | Stella Florencia Doulim | 24/542739/TK/60285 |
| **Sukibidi** | Faiz Gymnastiar Wibawa | 24/537851/TK/59634 |
| **Penyawit Handal** | Aurelia Mutiah Raudyatuzzahra | 24/534903/TK/59310 |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone [REPOSITORY_URL]
cd SinggahSana
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `backend/` directory:

```env
PORT=5000

MONGODB_URI=[YOUR_MONGODB_CONNECTION_STRING]

REDIS_URL=[YOUR_REDIS_CONNECTION_STRING]

SESSION_SECRET=[YOUR_SESSION_SECRET]
```

### 4. Run the backend

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

### 5. Run the frontend

```bash
cd ../frontend
```

Then run the frontend according to the framework being used.

---

## 📄 Project Information

**Project Name:** SinggahSana
**Type:** Web-Based Application
**Course:** Pengembangan Aplikasi Berbasis Web (PAW)
**Platform:** Web
**Repository:** [GitHub Repository URL]
**Documentation:** [Google Drive Documentation URL]

---

> **SinggahSana** — Temukan tempat tinggal yang pas untukmu.
