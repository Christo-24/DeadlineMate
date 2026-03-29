# DeadlineMate Frontend

A React-based frontend for the DeadlineMate deadline management application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Features

- User authentication (Login/Register) with JWT tokens
- Task management (Create, read, update, delete)
- Mark tasks as complete/incomplete
- View pending and completed tasks
- Responsive design

## Environment Variables

Create a `.env` file in the root directory:

```
REACT_APP_API_URL=http://localhost:8000/api
```

## Build for Production

```bash
npm run build
```

## Available Scripts

- `npm start` - Run development server
- `npm build` - Build for production
- `npm test` - Run tests

## API Integration

The frontend communicates with the Django backend at:
- API URL: `http://localhost:8000/api`
- Token endpoint: `http://localhost:8000/api/token/`
- Refresh endpoint: `http://localhost:8000/api/token/refresh/`
