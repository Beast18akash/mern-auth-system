![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)
![JWT](https://img.shields.io/badge/Auth-JWT-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

# 🔐 MERN Authentication Service

A production-ready authentication service built with the MERN stack that supports multiple authentication providers, secure session management, and modern authentication best practices.

---

## ✨ Features

### Authentication
- User Registration
- User Login
- Secure Logout
- JWT Authentication
- HTTP-only Cookie Authentication
- Protected Routes

### Social Authentication
- Google Sign-In
- GitHub Sign-In
- Automatic Account Linking
- Single Account Across Multiple Providers

### Password Management
- Forgot Password
- Reset Password
- Secure Email-Based Password Reset

### Security
- Password Hashing with bcryptjs
- JWT Authentication
- HTTP-only Cookies
- Secure Password Reset Tokens
- Input Validation
- Environment Variables
- OAuth 2.0 & OpenID Connect

---

## 🛠️ Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Axios

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

### Authentication
- JWT
- bcryptjs
- Google Identity Services
- GitHub OAuth
- Nodemailer
- Mailtrap

### Development
- ESLint
- Prettier

---

## 📂 Project Structure

```text
.
├── client/
├── server/
├── assets/
├── README.md
└── .gitignore
```

---

## 🚀 Getting Started

### Clone the repository

```bash
git clone https://github.com/Beast18akash/mern-auth-system.git
cd mern-auth-system
```

### Install dependencies

Frontend

```bash
cd client
npm install
```

Backend

```bash
cd server
npm install
```

---

## ⚙️ Environment Variables

Create the following files.

### Client

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Server

```env
PORT=5000

MONGO_URI=your_mongodb_uri

JWT_SECRET=your_jwt_secret

CLIENT_URL=http://localhost:5173

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=

GOOGLE_CLIENT_ID=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```

---

## ▶️ Running the Project

Start the backend

```bash
cd server
npm run dev
```

Start the frontend

```bash
cd client
npm run dev
```

---

## 📸 Screenshots

### Sign Up

![Sign Up](./mern-auth/assets/Screenshot%202026-07-09%20205833.png)

### Sign In

![Sign In](./mern-auth/assets/Screenshot%202026-07-09%20205845.png)

### Forgot Password

![Forgot Password](./mern-auth/assets/Screenshot%202026-07-09%20210201.png)

### Sign In with Google

![Sign In with Google button](./mern-auth/assets/Screenshot%202026-07-10%20155532.png)

![Google Account Chooser](./mern-auth/assets/Screenshot%202026-07-10%20192920.png)

### Sign In with GitHub

![GitHub Authorization Page](./mern-auth/assets/Screenshot%202026-07-10%20155541.png)

---

## 🏗️ Authentication Flow

```text
User
   │
   ├──────────────────┬──────────────────┐
   │                  │                  │
   ▼                  ▼                  ▼
Local Login      Google Login      GitHub Login
   │                  │                  │
   └──────────────────┼──────────────────┘
                      ▼
          Authentication Service
                      │
                      ▼
           Account Linking Layer
                      │
                      ▼
           JWT Authentication
                      │
                      ▼
          HTTP-only Cookie Session
                      │
                      ▼
          Protected Application
```

---

## 📦 Releases

| Version | Description |
|---------|-------------|
| v1.0.0  | Initial stable authentication service |
| v1.1.0  | GitHub OAuth & Multi-provider authentication |

---

## 🔮 Roadmap

- Email Verification
- Refresh Tokens
- Session Management
- User Profile
- Two-Factor Authentication (2FA)
- Role-Based Access Control (RBAC)

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

Feel free to fork the repository and submit a pull request.

---

## 📄 License

This project is licensed under the MIT License.
