# Buzzinga CMS

A modern full-stack Content Management System built with React, TypeScript, Node.js, and MongoDB.

## 🏗️ Project Structure

This is a monorepo containing both frontend and backend applications:

```
Buzzingacms/
├── frontend/              # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── styles/       # Global styles
│   │   ├── App.tsx       # Main app component
│   │   └── main.tsx      # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/              # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Custom middleware
│   │   ├── config/       # Configuration files
│   │   └── server.ts     # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── package.json          # Root package.json with workspaces
├── .gitignore
└── README.md
```

## 🚀 Features

### Frontend Features
- 📄 **Page Management** - Create and edit pages with visual editor
- 🗂️ **Dynamic Collections** - Manage structured content with custom fields
- 📁 **Media Library** - Upload and organize media files
- 🧭 **Menu Builder** - Create navigation menus with drag-and-drop
- 📝 **Forms** - Build and manage forms with response tracking
- 🔄 **Redirects** - Manage URL redirects
- 🌐 **Domain Settings** - Configure domain and site settings
- 🎨 **Modern UI** - Built with Radix UI and Tailwind CSS

### Backend Features
- 🔐 **Authentication** - JWT-based authentication
- 📊 **RESTful API** - Well-structured REST API endpoints
- 🗄️ **MongoDB** - NoSQL database for flexible data storage
- 📤 **File Upload** - Multer-based file upload handling
- 🛡️ **Security** - Helmet, CORS, rate limiting
- ✅ **Validation** - Request validation with Joi
- 📝 **TypeScript** - Full TypeScript support

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript
- **Build Tool**: Vite 6.3.5
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **Rich Text Editor**: Quill

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express 4.21+
- **Language**: TypeScript 5.7+
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer
- **Validation**: Joi
- **Security**: Helmet, CORS, express-rate-limit

## 📦 Installation

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- MongoDB (local or cloud instance)

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd Buzzingacms
```

2. **Install all dependencies**
```bash
npm run install:all
```

Or install individually:
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd backend && npm install
```

3. **Configure Backend Environment**
```bash
cd backend
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/buzzingacms
JWT_SECRET=your-super-secret-key
FRONTEND_URL=http://localhost:3000
```

4. **Start MongoDB**

Make sure MongoDB is running:
```bash
# If using local MongoDB
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## 🚀 Running the Application

### Development Mode

Run both frontend and backend simultaneously:
```bash
npm run dev
```

Or run them separately:

**Frontend only:**
```bash
npm run dev:frontend
# Opens at http://localhost:3000
```

**Backend only:**
```bash
npm run dev:backend
# Runs at http://localhost:5000
```

### Production Mode

1. **Build both applications:**
```bash
npm run build
```

2. **Start the backend:**
```bash
npm start
```

3. **Serve the frontend:**
```bash
cd frontend && npm run preview
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Pages
- `GET /api/pages` - Get all pages
- `GET /api/pages/:id` - Get single page
- `POST /api/pages` - Create new page
- `PUT /api/pages/:id` - Update page
- `DELETE /api/pages/:id` - Delete page

### Collections
- `GET /api/collections` - Get all collections
- `POST /api/collections` - Create collection

### Media
- `GET /api/media` - Get all media files
- `POST /api/media/upload` - Upload media file

### Menus
- `GET /api/menus` - Get all menus
- `POST /api/menus` - Create menu

### Forms
- `GET /api/forms` - Get all forms
- `POST /api/forms` - Create form
- `POST /api/forms/:id/responses` - Submit form response

### Health Check
- `GET /api/health` - Server health status

## 🔧 Available Scripts

### Root Level
- `npm run dev` - Run both frontend and backend
- `npm run dev:frontend` - Run frontend only
- `npm run dev:backend` - Run backend only
- `npm run build` - Build both applications
- `npm run build:frontend` - Build frontend only
- `npm run build:backend` - Build backend only
- `npm start` - Start production backend server

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm run dev` - Start development server with auto-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🌐 Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/buzzingacms |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `MAX_FILE_SIZE` | Max file upload size | 10485760 (10MB) |

## 🔐 Default Credentials

For development/testing:
- **Email**: admin@buzzinga.com
- **Password**: admin

## 📝 Development Guidelines

### Code Structure
- Follow TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper error handling
- Write meaningful comments

### API Development
- All routes should be prefixed with `/api`
- Use proper HTTP status codes
- Implement request validation
- Add authentication middleware where needed

### Frontend Development
- Keep components modular and reusable
- Use TypeScript interfaces for props
- Follow React best practices
- Maintain consistent styling

## 🤝 Contributing

This is an internal project. Please follow the established coding standards and submit pull requests for review.

## 📄 License

Private - Internal use only

## 🔗 Design Reference

The original UI design is available at [Figma](https://www.figma.com/design/92TKM5KWHFt6YUN30vm2PG/Admin-Dashboard-UI-Design).

## 📞 Support

For issues or questions, please contact the development team.

---

Built with ❤️ by the Buzzinga team
