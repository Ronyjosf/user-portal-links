# User Portal Links

A web application for users to create a personal portal of links. Features user registration, login, and personal dashboard for managing links.

## Stack
- Backend: Node.js (Express, Passport.js, Sequelize, SQLite)
- Frontend: React (Vite)

## Authentication System

The application uses a secure, session-based authentication system with the following components:

### User Storage
- Users are stored in SQLite database using Sequelize ORM
- Passwords are hashed using bcrypt before storage
- Each user has a unique username

### Authentication Flow
- Uses Passport.js with Local Strategy for authentication
- Session-based authentication with express-session
- Sessions are stored in SQLite using connect-session-sequelize

### Security Features
- Password hashing with bcrypt
- Session secret stored in environment variables
- CORS configured for secure cross-origin requests
- Protected API endpoints using authentication middleware
- User data isolation (users can only access their own links)

### Login Process
```javascript
passport.use(new LocalStrategy(async (username, password, done) => {
  // Find user in database
  const user = await User.findOne({ where: { username } });
  if (!user) return done(null, false);
  
  // Verify password
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return done(null, false);
  
  return done(null, user);
}));
```

## Local Development Setup

### Prerequisites
- Node.js 18 or higher
- npm

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with:
   ```
   SESSION_SECRET=your_secret_here
   PORT=5000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The backend will run on http://localhost:5000

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will run on http://localhost:5173

## Docker Setup

### Prerequisites
- Docker
- Docker Compose

### Running with Docker
1. Clone the repository
2. From the root directory, build and start the containers:
   ```bash
   docker-compose up --build
   ```
   This will start both frontend and backend services:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

### Docker Development Notes
- The database file is persisted in a Docker volume
- Source code changes will automatically reload in both containers
- To stop the services:
  ```bash
  docker-compose down
  ```

## Database
- SQLite database is used for development
- Database file is located at `backend/database.sqlite`
- To reset the database:
  1. Stop the server
  2. Delete `database.sqlite`
  3. Restart the server (a new database will be created automatically)

## Features
- User registration and authentication
- Create, read, update, and delete links
- Automatic URL formatting (adds https:// if missing)
- Persistent storage using SQLite
- Docker support for easy deployment

---

Set this directory as your active workspace for best results.
