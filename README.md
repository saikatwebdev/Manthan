(cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF'
diff --git a/manthan/README.md b/manthan/README.md
--- a/manthan/README.md
+++ b/manthan/README.md
@@ -0,0 +1,408 @@
+# मंथन (Manthan) - Event Management System
+
+<div align="center">
+  <img src="https://img.shields.io/badge/मंथन-Event%20Management-blue?style=for-the-badge&logo=calendar" alt="Manthan Logo">
+  
+  <p><strong>Churning Ideas into Reality</strong></p>
+  
+  [![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react)](https://reactjs.org/)
+  [![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
+  [![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js)](https://nodejs.org/)
+  [![MongoDB](https://img.shields.io/badge/MongoDB-6+-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
+  [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3+-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
+  [![Express.js](https://img.shields.io/badge/Express.js-4+-000000?style=flat&logo=express)](https://expressjs.com/)
+</div>
+
+## 🌟 Overview
+
+**मंथन (Manthan)** is a comprehensive, modern event management web application designed for educational institutions. Built with cutting-edge technologies, it provides a seamless experience for students, event organizers, and administrators to manage events, registrations, certificates, and community interactions.
+
+### ✨ Key Highlights
+
+- 🎭 **Multi-role Support**: Student, Organizer, and Admin roles with tailored experiences
+- 📱 **Responsive Design**: Beautiful, mobile-first UI with Tailwind CSS
+- 🎫 **QR Code Integration**: Automated check-ins and certificate verification
+- 🏆 **Gamification**: Points, badges, and leaderboard system
+- 📜 **Digital Certificates**: Dynamic PDF generation with verification
+- 👥 **Team Management**: Advanced team formation and collaboration tools
+- 🔔 **Real-time Notifications**: Keep users informed and engaged
+- 🗣️ **Community Forum**: Discussion boards and team builder
+
+## 🚀 Features
+
+### 🎯 Core Features
+
+#### For Students
+- **Event Discovery**: Browse and search events with advanced filtering
+- **Easy Registration**: Simple registration process with team support
+- **Digital Certificates**: Automatically generated certificates with verification
+- **Progress Tracking**: Points, badges, and leaderboard participation
+- **Team Formation**: Find teammates and join existing teams
+- **QR Code Check-in**: Quick event attendance with mobile QR scanning
+
+#### For Event Organizers
+- **Event Creation**: Rich event creation with media uploads
+- **Registration Management**: Comprehensive attendee management
+- **Check-in System**: QR code-based attendance tracking
+- **Certificate Generation**: Bulk certificate creation and distribution
+- **Analytics Dashboard**: Event performance insights
+- **Team Oversight**: Monitor and manage team formations
+
+#### For Administrators
+- **User Management**: Complete user lifecycle management
+- **Event Approval**: Review and approve event submissions
+- **System Analytics**: Platform-wide insights and reporting
+- **Content Moderation**: Forum and community management
+- **Certificate Authority**: Verify and manage all certificates
+- **System Configuration**: Platform settings and customization
+
+### 🔥 Advanced Features
+
+- **QR Code Ecosystem**: Event check-ins, certificate verification, team joining
+- **Blockchain-ready Certificates**: Future-proof certificate verification
+- **Multi-channel Notifications**: Email, push, and in-app notifications
+- **Advanced Search**: Full-text search with filters and sorting
+- **File Management**: Secure image and document uploads
+- **API-first Architecture**: RESTful APIs for all functionality
+- **Security First**: JWT authentication, rate limiting, input validation
+
+## 🏗️ Architecture
+
+### Tech Stack
+
+#### Frontend
+- **React 18+** with TypeScript for type safety
+- **Tailwind CSS** for modern, responsive styling
+- **React Router** for client-side routing
+- **React Hook Form** for efficient form handling
+- **React Query** for state management and caching
+- **Axios** for API communication
+- **React Hot Toast** for notifications
+
+#### Backend
+- **Node.js** with Express.js framework
+- **MongoDB** with Mongoose ODM
+- **JWT** for authentication and authorization
+- **Multer** for file uploads
+- **PDFKit** for certificate generation
+- **QRCode** for QR code generation
+- **Nodemailer** for email services
+- **Helmet** and **CORS** for security
+
+### Project Structure
+
+```
+manthan/
+├── frontend/                 # React TypeScript Frontend
+│   ├── src/
+│   │   ├── components/      # Reusable UI components
+│   │   ├── pages/          # Page components
+│   │   ├── hooks/          # Custom React hooks
+│   │   ├── services/       # API services
+│   │   ├── contexts/       # React contexts
+│   │   ├── types/          # TypeScript definitions
+│   │   └── utils/          # Utility functions
+│   ├── public/             # Static assets
+│   └── package.json
+│
+├── backend/                 # Node.js Express Backend
+│   ├── models/             # MongoDB schemas
+│   ├── routes/             # API route handlers
+│   ├── middleware/         # Custom middleware
+│   ├── utils/              # Utility functions
+│   ├── uploads/            # File upload directory
+│   ├── server.js           # Main server file
+│   └── package.json
+│
+└── README.md               # This file
+```
+
+## 🚀 Quick Start
+
+### Prerequisites
+
+- **Node.js** (v18 or higher)
+- **MongoDB** (v6 or higher)
+- **npm** or **yarn**
+- **Git**
+
+### Installation
+
+1. **Clone the repository**
+   ```bash
+   git clone <repository-url>
+   cd manthan
+   ```
+
+2. **Backend Setup**
+   ```bash
+   cd backend
+   npm install
+   
+   # Copy environment file and configure
+   cp .env.example .env
+   # Edit .env with your configuration
+   
+   # Start MongoDB (if not running)
+   mongod
+   
+   # Start backend server
+   npm run dev
+   ```
+
+3. **Frontend Setup**
+   ```bash
+   cd ../frontend
+   npm install --legacy-peer-deps
+   
+   # Start frontend development server
+   npm start
+   ```
+
+4. **Access the Application**
+   - Frontend: http://localhost:3000
+   - Backend API: http://localhost:5000
+   - API Health Check: http://localhost:5000/health
+
+### Environment Configuration
+
+#### Backend (.env)
+```env
+NODE_ENV=development
+PORT=5000
+MONGODB_URI=mongodb://localhost:27017/manthan
+JWT_SECRET=your_super_secret_jwt_key_here
+JWT_EXPIRE=7d
+FRONTEND_URL=http://localhost:3000
+
+# Email Configuration
+EMAIL_HOST=smtp.gmail.com
+EMAIL_PORT=587
+EMAIL_USER=your_email@gmail.com
+EMAIL_PASS=your_app_password
+
+# File Upload
+MAX_FILE_SIZE=10485760
+UPLOAD_PATH=./uploads
+```
+
+#### Frontend (.env)
+```env
+REACT_APP_API_URL=http://localhost:5000/api
+REACT_APP_APP_NAME=मंथन (Manthan)
+```
+
+## 📚 API Documentation
+
+### Authentication Endpoints
+```
+POST /api/auth/register     # User registration
+POST /api/auth/login        # User login
+GET  /api/auth/me          # Get current user
+PUT  /api/auth/profile     # Update profile
+POST /api/auth/logout      # User logout
+```
+
+### Event Endpoints
+```
+GET    /api/events              # Get all events
+GET    /api/events/:id          # Get single event
+POST   /api/events              # Create event (Organizer/Admin)
+PUT    /api/events/:id          # Update event (Owner/Admin)
+DELETE /api/events/:id          # Delete event (Owner/Admin)
+PATCH  /api/events/:id/status   # Approve/Reject (Admin)
+```
+
+### Registration Endpoints
+```
+POST   /api/registrations           # Register for event
+GET    /api/registrations/my        # Get user registrations
+POST   /api/registrations/join-team # Join team
+POST   /api/registrations/:id/checkin # Check-in user
+```
+
+### Certificate Endpoints
+```
+POST /api/certificates/generate              # Generate certificate
+GET  /api/certificates/my                    # Get user certificates
+GET  /api/certificates/:id/download          # Download certificate
+GET  /api/certificates/verify/:code          # Verify certificate
+```
+
+For complete API documentation, visit `/api-docs` when the server is running.
+
+## 🎨 UI/UX Features
+
+### Design System
+- **Modern Interface**: Clean, intuitive design with smooth animations
+- **Responsive Layout**: Mobile-first approach with breakpoint optimization
+- **Accessibility**: WCAG 2.1 compliant with proper ARIA labels
+- **Dark Mode Ready**: Prepared for dark theme implementation
+- **Custom Components**: Reusable component library with consistent styling
+
+### User Experience
+- **Progressive Web App**: Installable with offline capabilities
+- **Fast Loading**: Optimized bundle sizes and lazy loading
+- **Real-time Updates**: Live notifications and status updates
+- **Intuitive Navigation**: Clear information architecture
+- **Search & Filter**: Advanced search with instant results
+
+## 🔒 Security Features
+
+### Authentication & Authorization
+- **JWT-based Authentication**: Secure token-based system
+- **Role-based Access Control**: Granular permissions system
+- **Password Security**: bcrypt hashing with salt rounds
+- **Session Management**: Automatic token refresh and expiry
+
+### Data Protection
+- **Input Validation**: Comprehensive server-side validation
+- **SQL Injection Prevention**: Mongoose ODM protection
+- **XSS Protection**: Content sanitization and CSP headers
+- **Rate Limiting**: API request throttling
+- **CORS Configuration**: Secure cross-origin requests
+
+### File Security
+- **Upload Validation**: File type and size restrictions
+- **Secure Storage**: Protected file access with authentication
+- **Malware Scanning**: File content validation
+
+## 📈 Performance & Scalability
+
+### Frontend Optimization
+- **Code Splitting**: Route-based lazy loading
+- **Bundle Optimization**: Tree shaking and minification
+- **Image Optimization**: WebP support and lazy loading
+- **Caching Strategy**: Service worker implementation
+
+### Backend Performance
+- **Database Indexing**: Optimized MongoDB queries
+- **Connection Pooling**: Efficient database connections
+- **Caching Layer**: Redis-ready architecture
+- **Load Balancing**: Horizontal scaling support
+
+## 🧪 Testing
+
+### Frontend Testing
+```bash
+cd frontend
+npm test                    # Run unit tests
+npm run test:coverage      # Run with coverage
+npm run test:e2e          # End-to-end tests
+```
+
+### Backend Testing
+```bash
+cd backend
+npm test                    # Run API tests
+npm run test:integration   # Integration tests
+npm run test:coverage     # Coverage report
+```
+
+## 🚀 Deployment
+
+### Production Build
+
+#### Frontend
+```bash
+cd frontend
+npm run build
+# Deploy build/ directory to your hosting service
+```
+
+#### Backend
+```bash
+cd backend
+npm start
+# Deploy to your server with PM2 or Docker
+```
+
+### Docker Deployment
+```bash
+# Build and run with Docker Compose
+docker-compose up --build
+```
+
+### Recommended Hosting
+- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
+- **Backend**: AWS EC2, DigitalOcean, Heroku
+- **Database**: MongoDB Atlas, AWS DocumentDB
+- **File Storage**: AWS S3, Cloudinary
+
+## 🤝 Contributing
+
+We welcome contributions! Please follow these steps:
+
+1. **Fork the repository**
+2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
+3. **Commit changes**: `git commit -m 'Add amazing feature'`
+4. **Push to branch**: `git push origin feature/amazing-feature`
+5. **Open a Pull Request**
+
+### Development Guidelines
+- Follow TypeScript best practices
+- Write comprehensive tests
+- Update documentation
+- Follow the existing code style
+- Add meaningful commit messages
+
+## 📄 License
+
+This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
+
+## 🆘 Support & Help
+
+### Documentation
+- **API Docs**: Available at `/api-docs` when server is running
+- **Component Library**: Storybook documentation (coming soon)
+- **User Guide**: Comprehensive user manual (coming soon)
+
+### Getting Help
+- 🐛 **Bug Reports**: Create an issue with detailed reproduction steps
+- 💡 **Feature Requests**: Open an issue with the enhancement label
+- 💬 **Questions**: Use GitHub Discussions for general questions
+- 📧 **Contact**: Reach out to the development team
+
+### Community
+- **Discord Server**: Join our developer community (coming soon)
+- **Newsletter**: Stay updated with latest features
+- **Blog**: Technical articles and updates
+
+## 🙏 Acknowledgments
+
+- **React Team** for the amazing framework
+- **MongoDB** for the flexible database
+- **Tailwind CSS** for the utility-first CSS framework
+- **Open Source Community** for the incredible tools and libraries
+
+## 🗺️ Roadmap
+
+### Phase 1 - Core Features ✅
+- [x] User authentication and authorization
+- [x] Event management system
+- [x] Registration and check-in system
+- [x] Certificate generation and verification
+- [x] Basic admin panel
+
+### Phase 2 - Enhanced Features 🚧
+- [ ] Real-time notifications
+- [ ] Advanced analytics dashboard
+- [ ] Mobile app (React Native)
+- [ ] Payment integration
+- [ ] Calendar integration
+
+### Phase 3 - Advanced Features 🔮
+- [ ] AI-powered event recommendations
+- [ ] Blockchain certificate verification
+- [ ] Advanced reporting and insights
+- [ ] Multi-language support
+- [ ] API marketplace
+
+---
+
+<div align="center">
+  <p><strong>मंथन (Manthan) - Churning Ideas into Reality</strong></p>
+  <p>Built with ❤️ for the education community</p>
+  
+  <img src="https://img.shields.io/badge/Made%20with-Love-red?style=for-the-badge" alt="Made with Love">
+</div>
EOF
)
