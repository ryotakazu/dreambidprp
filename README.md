# DreamBid Unified Application

A monolithic property auction platform that combines the frontend, backend, and admin panel into a single application with unified build and deployment process.

## 🚀 Features

- **Unified Codebase**: Single repository for frontend, backend, and admin panel
- **Role-Based Authentication**: Separate access for public users and admin/staff
- **Property Management**: Complete CRUD operations for property listings
- **Auction System**: Online bidding and auction management
- **Enquiry Tracking**: User interest and lead management
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Live auction status and notifications

## 📁 Project Structure

```
dreambid-unified/
├── src/                          # Frontend source
│   ├── components/              # Shared React components
│   ├── contexts/                # React contexts (Auth, etc.)
│   ├── pages/                   # Page components
│   │   ├── public/              # Public website pages
│   │   └── admin/               # Admin panel pages
│   ├── services/                # API services
│   ├── utils/                   # Utility functions
│   ├── styles/                  # Global styles
│   ├── App.jsx                  # Main React app
│   └── main.jsx                 # Entry point
├── routes/                      # Backend API routes
├── config/                      # Database and server config
├── middleware/                  # Express middleware
├── uploads/                     # File upload storage
├── server.js                    # Express server
├── package.json                 # Dependencies and scripts
├── vite.config.js              # Vite configuration
└── tailwind.config.js          # Tailwind CSS config
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dreambid-unified
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and other settings
   ```

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb dreambid
   
   # Import the schema (adjust path as needed)
   psql -d dreambid -f database/schema.sql
   ```

## 🏃‍♂️ Running the Application

### Development Mode

Start both frontend and backend concurrently:

```bash
npm run dev
```

This will start:
- Frontend (Vite) on http://localhost:3000
- Backend (Express) on http://localhost:5000

### Individual Services

Frontend only:
```bash
npm run dev:client
```

Backend only:
```bash
npm run dev:server
```

### Production Mode

Build and start the application:

```bash
npm run build
npm start
```

## 📦 Build & Deployment

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized production files.

### Netlify Deployment

1. **Connect your repository** to Netlify
2. **Set build command**: `npm run build`
3. **Set publish directory**: `dist`
4. **Add environment variables** in Netlify dashboard

The application includes:
- `netlify.toml` for deployment configuration
- `_redirects` for SPA routing
- Automatic API proxy configuration

### Environment Variables

Required for production:

```bash
# Database
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=dreambid
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=production

# Frontend
VITE_API_URL=https://your-domain.com/api
```

## 🔐 Authentication

The application uses JWT-based authentication with role-based access control:

- **Public Users**: Can browse properties, submit enquiries, register requirements
- **Admin/Staff**: Full access to property management, enquiries, and dashboard
- **Protected Routes**: Admin routes require authentication and proper role

## 📱 Access Points

- **Public Website**: `/` - Property listings and details
- **User Registration**: `/register` - Submit property requirements
- **Admin Login**: `/admin/login` - Admin panel access
- **Admin Dashboard**: `/admin/dashboard` - Management interface

## 🎨 Design System

- **Framework**: Tailwind CSS with custom configuration
- **Colors**: Primary red (#dc2626) with gray palette
- **Typography**: Inter font family
- **Components**: Custom reusable components with consistent styling
- **Responsive**: Mobile-first approach with breakpoints

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - Get all properties (with filters)
- `GET /api/properties/:id` - Get single property
- `POST /api/properties` - Create property (admin only)
- `PUT /api/properties/:id` - Update property (admin only)
- `DELETE /api/properties/:id` - Delete property (admin only)

### Enquiries
- `POST /api/enquiries` - Submit enquiry
- `GET /api/enquiries` - Get all enquiries (admin only)
- `PUT /api/enquiries/:id/status` - Update enquiry status

### Interests
- `POST /api/interests` - Track user interaction
- `GET /api/interests/stats/:id` - Get property statistics

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running and credentials are correct
2. **Port Conflicts**: Change ports in `.env` if 3000/5000 are occupied
3. **CORS Issues**: API proxy is configured in Vite for development
4. **Build Errors**: Check all dependencies are installed and environment variables set

### Development Tips

- Use `npm run dev` for hot reloading on both frontend and backend
- Check browser console for API errors
- Use `npm run build` to test production build locally
- Environment variables must be prefixed with `VITE_` for frontend access

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.