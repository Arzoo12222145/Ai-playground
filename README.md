# AI Playground

**Live Site:** [ai-playground.vercel.app](https://ai-playground-5tqv.vercel.app/)

## 🧠 Project Overview

**AI Playground** is a microfrontend-based AI-powered application that enables users to interact with AI through a clean, modular interface. The app uses secure authentication, persistent database storage, and integrates with OpenRouter to offer advanced AI features.

This project follows a microfrontend architecture, making it scalable and modular, with seamless backend–frontend communication.

## 🚀 Features

- ✅ **JWT-based User Authentication**
- 🔐 **Secure Sessions** (with password hashing & token management)
- 🤖 **AI Capabilities via OpenRouter API**
- 🧩 **Modular Microfrontend Architecture**
- 🗃️ **Persistent Data Storage** (MongoDB)
- 🔄 **Protected Routes and Role-based Access (if extended)**

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js or React (via microfrontends)
- **Deployment:** Vercel
- **Routing:** App Router (Next.js 13+ if used)
- **Styling:** (Assumed) Tailwind CSS or CSS Modules

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Authentication:** JWT (JSON Web Tokens)
- **Database:** MongoDB (with Mongoose ORM)
- **AI Integration:** OpenRouter API (AI model layer)

### DevOps / Misc
- **Version Control:** Git & GitHub
- **Hosting:** Vercel (Frontend), other platform (Backend)
- **API Format:** REST (or possibly GraphQL)

## 📂 Project Folder Structure
 ai-microfrontend-playground/
│
├── backend/
│   ├── .env
│   ├── package.json
│   ├── server.js (or app.js)
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── utils/
│
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.js
│   └── public/
│
├── README.md
└── .gitignore
