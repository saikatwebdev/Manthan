# मंथन (Manthan) Event Management System - Backend API

A comprehensive event management system backend built with Node.js, Express.js, and MongoDB.

## 🚀 Features

- **Multi-role Authentication**: Student, Organizer, and Admin roles
- **Event Management**: Create, manage, and track events
- **Registration System**: Event registration with team support
- **QR Code Check-in**: Automated attendance tracking
- **Certificate Generation**: Dynamic PDF certificate creation
- **Leaderboard & Badges**: Gamification system
- **Forum & Team Builder**: Community features
- **Notifications**: Real-time notification system
- **File Uploads**: Image and document handling

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **PDF Generation**: PDFKit
- **QR Code**: qrcode library
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting

## 📁 Project Structure

```
backend/
├── models/           # MongoDB schemas
├── routes/           # API route handlers
├── middleware/       # Custom middleware
├── utils/            # Utility functions
├── uploads/          # File upload directory
├── server.js         # Main server file
└── .env             # Environment variables
```

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd manthan/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🌐 API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /me` - Get current user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password
- `POST /forgot-password` - Forgot password
- `POST /reset-password/:token` - Reset password
- `GET /verify-email/:token` - Verify email
- `POST /logout` - User logout

### Event Routes (`/api/events`)
- `GET /` - Get all events (with filtering)
- `GET /:id` - Get single event
- `POST /` - Create new event (Organizer/Admin)
- `PUT /:id` - Update event (Owner/Admin)
- `DELETE /:id` - Delete event (Owner/Admin)
- `PATCH /:id/status` - Approve/Reject event (Admin)
- `GET /organizer/:organizerId` - Get events by organizer
- `GET /featured/list` - Get featured events
- `GET /search/query` - Search events

### Registration Routes (`/api/registrations`)
- `POST /` - Register for event
- `GET /my` - Get user's registrations
- `GET /event/:eventId` - Get event registrations (Organizer/Admin)
- `GET /:id` - Get single registration
- `DELETE /:id` - Cancel registration
- `POST /:id/checkin` - Check-in user (Organizer/Admin)
- `POST /join-team` - Join team using team code
- `PUT /:id/team` - Update team information
- `POST /:id/feedback` - Submit event feedback

### User Management Routes (`/api/users`)
- `GET /` - Get all users (Admin)
- `GET /:id` - Get user by ID (Admin)
- `PUT /:id/role` - Update user role (Admin)
- `PATCH /:id/status` - Activate/Deactivate user (Admin)
- `DELETE /:id` - Delete user (Admin)
- `GET /leaderboard/top` - Get leaderboard

### Certificate Routes (`/api/certificates`)
- `POST /generate` - Generate certificate (Organizer/Admin)
- `GET /my` - Get user's certificates
- `GET /:id` - Get certificate by ID
- `GET /:id/download` - Download certificate
- `GET /verify/:verificationCode` - Verify certificate (Public)
- `GET /event/:eventId` - Get event certificates (Organizer/Admin)
- `PATCH /:id/revoke` - Revoke certificate (Admin)
- `POST /:id/share` - Share certificate on social media

### Leaderboard Routes (`/api/leaderboard`)
- `GET /` - Get global leaderboard
- `GET /department/:department` - Get department leaderboard

### Notification Routes (`/api/notifications`)
- `GET /` - Get user notifications
- `PATCH /:id/read` - Mark notification as read
- `POST /` - Create notification (Admin)

### Forum Routes (`/api/forum`)
- `GET /` - Get forum posts
- `POST /` - Create forum post
- `GET /:id` - Get single forum post
- `POST /:id/like` - Like/Unlike post
- `POST /:id/apply` - Apply for team

## 🔐 Authentication & Authorization

The API uses JWT-based authentication with role-based access control:

- **Public Routes**: No authentication required
- **Private Routes**: Require valid JWT token
- **Role-based Routes**: Require specific user roles

### User Roles
- **Student**: Basic user with event participation rights
- **Organizer**: Can create and manage events
- **Admin**: Full system access and user management

## 📊 Database Models

### User Model
- Personal information and authentication
- Role-based permissions
- Points and badges system
- Social links and preferences

### Event Model
- Comprehensive event details
- Location and timing information
- Registration settings
- Analytics and metadata

### Registration Model
- User-event relationships
- Team management
- Check-in and attendance tracking
- Feedback and certificates

### Certificate Model
- Digital certificate management
- Verification system
- Download tracking
- Social sharing features

### Notification Model
- Multi-channel notifications
- Targeted messaging
- Delivery tracking
- Analytics

### ForumPost Model
- Community discussions
- Team formation features
- Engagement tracking
- Moderation system

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: API request throttling
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Cross-origin request security
- **Helmet Security**: HTTP header security
- **File Upload Security**: Safe file handling

## 📈 Advanced Features

### QR Code System
- Event check-in QR codes
- Certificate verification QR codes
- Team joining QR codes

### Certificate Generation
- Dynamic PDF generation
- Custom templates
- Verification system
- Social sharing

### Points & Badges System
- Activity-based points
- Achievement badges
- Leaderboard rankings

### Team Management
- Team formation tools
- Application system
- Team codes and invitations

## 🚀 Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/manthan
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:3000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Production Setup
1. Set environment variables
2. Configure MongoDB connection
3. Set up file upload directories
4. Configure email service
5. Deploy to your preferred platform

## 📝 API Response Format

All API responses follow a consistent format:

```json
{
  "success": true|false,
  "message": "Response message",
  "data": {
    // Response data
  },
  "errors": [
    // Validation errors (if any)
  ]
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📚 Documentation

- **API Documentation**: Available at `/api-docs` (Swagger/OpenAPI)
- **Postman Collection**: Import the provided collection for testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and queries:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**मंथन (Manthan)** - Churning Ideas into Reality 🌟