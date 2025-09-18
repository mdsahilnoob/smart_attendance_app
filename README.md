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

### Development Setup

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd smart-attendance-app
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp packages/server/.env.example packages/server/.env
   # Edit the .env file with your configuration
   \`\`\`

4. **Start with Docker**
   \`\`\`bash
   npm run docker:up
   \`\`\`

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: localhost:5432

### Development Commands

\`\`\`bash
# Start development servers
npm run dev

# Build all packages
npm run build

# Docker commands
npm run docker:up      # Start all services
npm run docker:down    # Stop all services
npm run docker:build   # Rebuild containers
\`\`\`

## Project Structure

\`\`\`
smart-attendance-app/
├── packages/
│   ├── client/          # Next.js frontend
│   │   ├── app/         # App router pages
│   │   ├── components/  # React components
│   │   └── lib/         # Utilities
│   └── server/          # Express.js backend
│       ├── src/         # TypeScript source
│       ├── prisma/      # Database schema
│       └── dist/        # Compiled JavaScript
├── docker-compose.yml   # Container orchestration
└── package.json         # Workspace configuration
\`\`\`

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
