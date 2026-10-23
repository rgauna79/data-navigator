<div style="text-align: center">
<img src="./client-frontend/src/assets/images/logo.png" alt="logo" width="400">
</div>

# Data Navigator

## Overview

Data Navigator is a robust web application built on the MERN (MongoDB, Express.js, React.js, Node.js) stack, designed to simplify data management and reporting tasks. With its intuitive user interface and powerful functionality, Data Navigator streamlines the process of working with Excel files, providing features such as:

- **Excel File Reader**: Easily read Excel files uploaded by users.
- **Sheet Selection and Content Display**: Load and display specific sheets from uploaded Excel files.
- **Column Filtering**: Filter data columns to display relevant information.
- **Personalized Reports Generation**: Generate personalized reports from the sheet data, including top records and most repeated values.
- **Database Integration**: Store data efficiently in MongoDB, ensuring reliability and scalability.

## Features

- **Excel Files Management**: Seamlessly manage Excel files, extracting relevant data with ease.
- **Dynamic Data Filtering**: Effortlessly filter data columns to focus on pertinent information.
- **Customized Reporting**: Generate personalized reports tailored to specific needs, including top records and recurring values analysis.
- **Intuitive User Interface**: User-friendly interface designed for smooth navigation and efficient task execution.
- **Data Storage and Management**: Store and manage data securely in MongoDB, ensuring accessibility and scalability.

## Future Additions

In the future, we plan to introduce the following enhancements:

- **Database Content Management Panel**: Implement a dedicated panel for managing database content directly within the application.

## Technologies Used

- **Frontend**:
  - React.js
  - Vite
  - Tailwind CSS
  - TanStack Table
  - Chart.js / react-chartjs-2
  - SheetJS (xlsx)

- **Backend**:
  - Node.js
  - Express.js
  - MongoDB (Mongoose)

## Local Setup

### Backend (`backend/`)

1. Copy `backend/.sampleenv` to `backend/.env` and fill in the real values:
   - `MONGO_URI` — connection string for MongoDB
   - `TOKEN_SECRET` — generate one with:
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. `npm install` and run `npm run dev` (default port 3000).

### Frontend (`client-frontend/`)

1. Copy `client-frontend/.env.example` to `client-frontend/.env` and set `VITE_BACKEND_URL` to your backend URL.
2. `npm install` and run `npm run dev` (default port 5173).

### Tests

- Backend: `cd backend && npm test` (Node test runner + an in-memory MongoDB,
  downloaded automatically on the first run).
- Frontend: `cd client-frontend && npm test` (Vitest), `npm run lint`.

Both run in GitHub Actions on every pull request (`.github/workflows/ci.yml`).

> `xlsx` is installed from the SheetJS CDN because the npm registry version is no longer
> maintained. Check https://cdn.sheetjs.com for new releases; Dependabot does not track it.

### Roles and admin access

User-management endpoints (`GET /api/users`, `/api/users/:id`, `/api/users/update/:id`,
`/api/users/delete/:id`) are restricted to admins. Every user registers with role `user`;
promote one manually in MongoDB:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

### Upgrading an existing database

Saved sheets now belong to the user who saved them. Documents saved before this change have
no `owner` and are no longer listed for anyone. To assign them to a user:

```js
const owner = db.users.findOne({ email: "you@example.com" })._id;
db.datas.updateMany({ owner: { $exists: false } }, { $set: { owner } });
```

The old global unique index on `sheetName` is dropped automatically when the server starts.

> **Security note:** never commit `.env` files. They are gitignored. If credentials were
> ever committed to the repository history, rotate them immediately.

## About the Developer

Data Navigator is developed and maintained by Roberto Gauna.

---

*Copyright © 2024 Data Navigator. All rights reserved.*
