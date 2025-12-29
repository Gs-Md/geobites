# GeoBites – CSCI426 Advanced Web Programming Project

   ## Project Description

      GeoBites is a full-stack web application developed as part of CSCI426: Advanced Web Programming.
      The project implements a functional backend using Node.js and MySQL, integrated with a ReactJS frontend to deliver a complete client–server web application.

      The system allows users to register, log in, interact with the platform, and submit messages, while the owner (admin) can securely manage received messages through a protected inbox.

   ## Live Deployment

      The application is deployed and accessible online:
         •	Frontend: https://geobites.vercel.app
         •	Backend: https://geobites.onrender.com

   ## Core Features

   ### Backend Functionality
      •	User Signup & Login (JWT authentication)
      •	Secure password hashing
      •	CRUD operations on database entities
      •	Owner-only admin inbox (messages management)
      •	Input validation and error handling

   ### Frontend Functionality
      •	Fully responsive UI (mobile, tablet, desktop)
      •	Dynamic pages and routing
      •	Contact form connected to backend
      •	Cart and order interface
      •	Clean navigation and layout

   ## Database Design
      The database uses MySQL and includes multiple related entities:
         •	Users
         •	Contacts / Messages

      Relationships are implemented to ensure data integrity and proper backend functionality.

   ## Technologies Used
   ### Backend
      •	Node.js
      •	Express.js
      •	MySQL
      •	JSON Web Tokens (JWT)
      •	bcrypt

   ### Frontend
      •	ReactJS
      •	React Router
      •	CSS3
      •	MUI Icons

   ### Tools & Deployment
      •	Git & GitHub
      •	Render (backend deployment)
      •	Vercel (frontend deployment)

   ## Project Structure
      geobites/
      │
      ├── backend/             # Node.js + Express backend
      ├── frontend/            # ReactJS frontend
      ├── database/            # MySQL schema / queries
      ├── screenshots/         # UI screenshots
      └── README.md

   ## How to run the project locally
   ### Backend:
      cd backend
      node server.js

   ### Create .env file with:
      PORT=4000
      DB_HOST=localhost
      DB_USER=your_user
      DB_PASSWORD=your_password
      DB_NAME=geobites
      JWT_SECRET=your_secret

   ### Frontend:
      cd frontend
      npm install
      npm start

   ### The application will run on:
      •	Frontend: http://localhost:3000
      •	Backend: http://localhost:4000

   ## Screenshots

   ### Home Page
   ![Home](./screenshots/home.png)

   ### About Page
   ![About](./screenshots/about.png)

   ### Menu Page
   ![Menu](./screenshots/menu.png)

   ### Order Page
   ![Order](./screenshots/order.png)

   ### Cart (Order)
   ![Cart](./screenshots/cart(order).png)

   ### Contact Page
   ![Contact](./screenshots/contact.png)

   ### Login / Signup
   ![Login-Signup](./screenshots/login-Signup.png)

   ### Owner Inbox (Admin Panel)
   ![Inbox](./screenshots/inbox.png)

# Conclusion & Future Scope

This project demonstrates backend development, database integration, authentication, and deployment using modern web technologies.
Future enhancements may include email notifications, role-based access control, and improved administrative features.