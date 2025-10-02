# Smart Curriculum Activity & Attendance App

A comprehensive full-stack web application for automated attendance tracking, real-time classroom displays, and personalized student activity suggestions.

## Architecture

- **Monorepo**: NPM Workspaces
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Node.js with Express.js and TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with role-based access control
- **Real-time**: WebSocket communication using Socket.IO
- **Containerization**: Docker and Docker Compose

## Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Git

### Quick Start

#### **Prerequisites**
- Node.js (v18 or higher)
- Docker and Docker Compose
- Git

#### **Development Setup**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mdsahilnoob/smart_attendance_app.git
    cd smart-attendance-app
    ```

2.  **Install dependencies:**
    This command installs dependencies for all packages in the workspace.
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Copy the example environment file for the server.
    ```bash
    cp packages/server/.env.example packages/server/.env
    ```
    Now, **edit the new `.env` file** in `packages/server/` with your database credentials and a JWT secret.

4.  **Start the database and services:**
    This command starts the PostgreSQL database, the backend, and the frontend containers.
    ```bash
    npm run docker:up
    ```

5.  **Run database migrations (Crucial Step):**
    After the containers are running, open a **new terminal** and run the Prisma migrate command to set up your database schema.
    ```bash
    npm run prisma:migrate
    ```

6.  **Access the application:**
    - **Frontend:** [http://localhost:3000](http://localhost:3000)
    - **Backend API:** [http://localhost:5000](http://localhost:5000)

---
### Development Commands

| Command              | Description                                             |
| :------------------- | :------------------------------------------------------ |
| `npm run dev`        | Starts the frontend and backend development servers.    |
| `npm run build`      | Builds all packages for production.                     |
| `npm run docker:up`  | Starts all services in detached mode via Docker Compose. |
| `npm run docker:down`| Stops and removes all running containers.               |
| `npm run docker:build`| Forces a rebuild of the Docker images.                  |

---
### Project Structure
```
smart-attendance-app/
├── packages/
│   ├── client/           # Next.js Frontend
│   │   ├── app/          # Next.js App Router
│   │   ├── components/   # UI, feature, and layout components
│   │   ├── lib/          # Helper functions, API client
│   │   └── ...
│   └── server/           # Express.js Backend
│       ├── src/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── routes/
│       │   └── ...
│       ├── prisma/       # Database Schema & Migrations
│       └── ...
├── docker-compose.yml    # Container Orchestration
└── package.json          # NPM Workspace Configuration
```

## Features

- **Role-based Authentication**: Student, Teacher, and Admin roles
- **QR Code Attendance**: Automated attendance marking system
- **Real-time Updates**: Live attendance tracking with WebSocket
- **Smart Suggestions**: Personalized activity recommendations
- **Comprehensive Dashboards**: Role-specific interfaces
- **Docker Deployment**: Production-ready containerization

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Attendance
- `POST /api/attendance/mark-qr` - Mark attendance via QR code
- `GET /api/attendance/class/:classId` - Get class attendance

### Schedule
- `GET /api/schedule/my` - Get personal schedule

### Suggestions
- `GET /api/suggestions/my` - Get personalized suggestions

## Development Phases

1. ✅ **Phase 1**: Monorepo & Docker Infrastructure
2. 🔄 **Phase 2**: Database Schema with Prisma
3. ⏳ **Phase 3**: Backend API with Authentication
4. ⏳ **Phase 4**: Frontend with Role-based Dashboards
5. ⏳ **Phase 5**: Real-time WebSocket Features
6. ⏳ **Phase 6**: QR Code Attendance System

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
