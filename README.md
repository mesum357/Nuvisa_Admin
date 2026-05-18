# Nuvisa Admin System









A comprehensive admin dashboard system built with Next.js 15, Prisma, and Supabase for managing applications, users, and website content.


![Admin Dashboard](banner.png)

## 🚀 Features

### 1. Admin Access & Authentication
- ✅ Secure login with NextAuth.js
- ✅ Role-based access control (SUPER_ADMIN, ADMIN)
- ✅ JWT-based session management
- ✅ Protected routes with middleware
- ✅ Automatic session refresh

### 2. Dashboard
- ✅ Real-time key statistics
  - Total applications count
  - Total users count
  - Total revenue
  - Pending applications
- ✅ Today's new applications & users
- ✅ Monthly revenue tracking
- ✅ Application status distribution chart
- ✅ Recent applications table

### 3. Application Management
- ✅ View all applications with pagination
- ✅ Advanced filtering
  - Search by application number, name, email
  - Filter by status
  - Date range filtering
- ✅ Application details view
- ✅ Status management with history tracking
- ✅ Document management
- ✅ Comment system (internal & public)
- ✅ Email notifications on status changes
- ✅ CSV export

### 4. User Management
- ✅ View all users with pagination
- ✅ Search and filter users
- ✅ User verification
- ✅ Block/activate users
- ✅ View user applications
- ✅ Export user data to CSV

### 5. Content Management
- ✅ Edit website settings
- ✅ Manage appointment slots
- ✅ Update notices and alerts
- ✅ Dynamic content editing
- ✅ Track last updated information

### 6. Notifications & Reports
- ✅ Email notifications for status changes
- ✅ Activity logging
- ✅ CSV export for applications
- ✅ CSV export for users
- ✅ Customizable email templates

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: TailwindCSS 4.0
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Storage**: Supabase Storage
- **Email**: Nodemailer
- **Charts**: ApexCharts
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18 or higher
- PostgreSQL database (or Supabase account)
- SMTP server credentials (Gmail, SendGrid, etc.)

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd Nuvisa-Admin

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env.local` file (see `ENV_SETUP.md` for details):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/nuvisa_admin"
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password
EMAIL_FROM=noreply@nuvisa.com
```

### 3. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Run migrations
npx prisma migrate dev --name init
```

### 4. Seed Initial Admin

    ```bash
# Run the seed script
npx tsx prisma/seed.ts
```

Default admin credentials:
- Email: admin@nuvisa.com
- Password: Admin@123

**⚠️ Change these credentials immediately after first login!**

### 5. Run Development Server

    ```bash
    npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
Nuvisa-Admin/
├── prisma/
│   ├── schema.prisma          # Database schema with indexes
│   └── seed.ts                # Initial data seeding
├── src/
│   ├── app/
│   │   ├── (admin)/           # Admin routes
│   │   │   ├── admin/
│   │   │   │   ├── applications/  # Application management
│   │   │   │   ├── users/         # User management
│   │   │   │   └── content/       # Content management
│   │   │   ├── layout.tsx     # Admin layout
│   │   │   └── page.tsx       # Dashboard
│   │   ├── (full-width-pages)/
│   │   │   └── (auth)/signin/ # Sign in page
│   │   ├── api/               # API endpoints
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── admin/             # Admin components
│   │   ├── auth/              # Auth components
│   │   ├── common/            # Shared components + ErrorBoundary
│   │   └── ui/                # UI components
│   ├── hooks/
│   │   ├── useAuth.ts         # Auth hook
│   │   ├── useDebounce.ts     # Debounce hook
│   │   └── useModal.ts        # Modal hook
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── supabase.ts        # Supabase client
│   │   ├── auth.ts            # NextAuth config
│   │   ├── email.ts           # Email utilities
│   │   ├── utils.ts           # Utility functions
│   │   └── api-client.ts      # API client
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── layout/                # Layout components
│   └── middleware.ts          # Route protection
├── ENV_SETUP.md               # Environment setup
├── GET_STARTED.md             # Quick start guide
└── README.md                  # Main documentation
```

## 🔐 Security Features

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT-based session management
- ✅ Route protection with middleware
- ✅ Role-based access control
- ✅ Environment variables for secrets
- ✅ CSRF protection via NextAuth
- ✅ XSS protection via React

## 📊 Database Schema

The system includes the following main models:

- **Admin**: System administrators with role-based access
- **User**: End users who submit applications
- **Application**: User applications with status tracking
- **Document**: Application-related documents
- **ApplicationComment**: Comments and notes on applications
- **ApplicationStatusHistory**: Track status changes
- **SiteContent**: Dynamic website content
- **AppointmentSlot**: Available appointment slots
- **Notification**: System notifications
- **ActivityLog**: Admin activity tracking
- **SystemStats**: Daily statistics

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Applications
- `GET /api/applications` - List applications
- `GET /api/applications/[id]` - Get application details
- `PATCH /api/applications/[id]` - Update application
- `POST /api/applications/[id]/comments` - Add comment

### Users
- `GET /api/users` - List users
- `GET /api/users/[id]` - Get user details
- `PATCH /api/users/[id]` - Update user

### Content
- `GET /api/content` - Get all content
- `PATCH /api/content` - Update content

### Export
- `GET /api/export/applications` - Export applications
- `GET /api/export/users` - Export users

See `DEPLOYMENT.md` for complete API documentation.

## 🎨 UI Components

Built on TailAdmin with custom enhancements:

- **ComponentCard**: Reusable card wrapper
- **Button**: Multi-variant button component
- **Badge**: Status badges
- **Modal**: Accessible modal dialogs
- **Table**: Responsive data tables
- **Charts**: ApexCharts integration

## 📧 Email Templates

Customizable email templates for:

- Application status updates
- Welcome emails
- Password reset (to be implemented)
- Account verification

## 🔧 Development

### Code Quality

```bash
# Run linter
npm run lint

# Format code
npx prettier --write .
```

### Database Management

```bash
# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

## 🚢 Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push origin main

# 2. Import to Vercel
# 3. Add environment variables from .env.local
# 4. Deploy
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t nuvisa-admin .
docker run -p 3000:3000 nuvisa-admin
```

### Environment Variables for Production

Set these in your hosting platform:
- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_SECRET` - Auth secret
- `NEXTAUTH_URL` - Your domain URL
- All SMTP variables (for emails)
- All Supabase variables (if using)

## 📝 Best Practices Implemented

1. ✅ **Reusable Components**: All UI components are modular and reusable
2. ✅ **Type Safety**: Full TypeScript coverage
3. ✅ **Clean Code**: Consistent code style and formatting
4. ✅ **Error Handling**: Comprehensive error handling
5. ✅ **Performance**: Optimized queries and pagination
6. ✅ **Security**: Industry-standard security practices
7. ✅ **Responsive**: Mobile-first responsive design
8. ✅ **Accessibility**: WCAG compliant components
9. ✅ **SEO**: Proper meta tags and semantic HTML
10. ✅ **Documentation**: Comprehensive inline documentation

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
npx prisma db pull
```

### Authentication Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Build Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

Proprietary - Nuvisa Admin System

## 👥 Support

For support, contact the development team or refer to the documentation in `DEPLOYMENT.md`.

## 🎯 Roadmap

- [ ] Two-factor authentication
- [ ] Advanced analytics dashboard
- [ ] Bulk operations
- [ ] File upload with drag & drop
- [ ] Real-time notifications with WebSocket
- [ ] PDF generation for reports
- [ ] Mobile app (React Native)
- [ ] API rate limiting
- [ ] Audit trail improvements

---

**Built with ❤️ using TailAdmin and Next.js**
