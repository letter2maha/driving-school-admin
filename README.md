# Driving School Admin Dashboard

A comprehensive Next.js admin dashboard for managing instructor applications and approvals for a driving school platform.

## 🚀 Features

### Core Functionality
- **Admin Authentication**: Secure login system for administrators
- **Dashboard Overview**: Real-time statistics and recent applications
- **Application Management**: View, filter, and search instructor applications
- **Document Review**: View KYC documents, profile images, and car photos
- **Approval Workflow**: Approve or reject applications with reason tracking
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Key Pages
- **Login Page** (`/`): Admin authentication
- **Dashboard** (`/admin/dashboard`): Overview with statistics and recent applications
- **Applications List** (`/admin/applications`): Comprehensive list with filtering and pagination
- **Application Detail** (`/admin/applications/[id]`): Detailed view with document viewer and approval actions

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom admin authentication system
- **UI Components**: Headless UI, Heroicons
- **State Management**: React hooks
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

## 🚀 Getting Started

### 1. Clone and Install

```bash
# Navigate to the project directory
cd driving-school-admin

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://parriuibqsfakwlmbdac.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcnJpdWlicXNmYWt3bG1iZGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTIxMjksImV4cCI6MjA2ODc4ODEyOX0.PHfq49BUm2SFisBzlJl5mt33PODz22-7NoJ_JMXERM4
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database Setup

Ensure your Supabase database has the following tables:

#### `profiles` table:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  profile_image_url TEXT,
  car_image_url TEXT,
  role TEXT CHECK (role IN ('instructor', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `instructor_profiles` table:
```sql
CREATE TABLE instructor_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id),
  expertise TEXT[],
  experience_years INTEGER,
  bio TEXT,
  manual_price_min DECIMAL,
  manual_price_max DECIMAL,
  automatic_price_min DECIMAL,
  automatic_price_max DECIMAL,
  expertise_keywords TEXT[],
  car_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `verification_status` table:
```sql
CREATE TABLE verification_status (
  id UUID PRIMARY KEY REFERENCES profiles(id),
  phone_verified BOOLEAN DEFAULT FALSE,
  phone_verified_at TIMESTAMP WITH TIME ZONE,
  kyc_status TEXT CHECK (kyc_status IN ('pending', 'submitted', 'approved', 'rejected')) DEFAULT 'pending',
  kyc_photo_id_path TEXT,
  kyc_instructor_id_path TEXT,
  kyc_submitted_at TIMESTAMP WITH TIME ZONE,
  kyc_approved_at TIMESTAMP WITH TIME ZONE,
  profile_completed BOOLEAN DEFAULT FALSE,
  profile_submitted_at TIMESTAMP WITH TIME ZONE,
  profile_approved BOOLEAN,
  profile_approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Authentication

### Demo Credentials
- **Email**: admin@drivingschool.com
- **Password**: admin123

### Adding New Admins
To add new admin users, update the `adminEmails` array in `src/lib/auth.ts`:

```typescript
export const adminEmails = [
  'admin@drivingschool.com',
  'superadmin@drivingschool.com',
  'newadmin@drivingschool.com' // Add new admin emails here
]
```

## 📱 Mobile App Integration

This admin dashboard is designed to work seamlessly with your React Native driving school app:

### Real-time Updates
- When admins approve/reject applications, the mobile app should reflect changes
- Consider implementing real-time subscriptions using Supabase Realtime

### Push Notifications
- Send notifications to users when their application status changes
- Integrate with your mobile app's push notification system

### Document Access
- KYC documents are securely stored in Supabase Storage
- Ensure proper RLS policies for document access

## 🎨 Customization

### Styling
- Modify `tailwind.config.js` to customize colors and theme
- Update `src/app/globals.css` for global styles
- Use the predefined CSS classes in `globals.css` for consistent styling

### Components
- Reusable components are in `src/components/ui/`
- Layout components are in `src/components/layout/`
- Add new components following the existing patterns

## 🔧 API Integration

### Supabase Queries
The dashboard uses several key queries:

#### Get Pending Applications:
```typescript
const { data } = await supabase
  .from('profiles')
  .select(`
    *,
    instructor_profiles(*),
    verification_status(*)
  `)
  .eq('role', 'instructor')
  .eq('verification_status.profile_completed', true)
  .is('verification_status.profile_approved', null)
```

#### Approve Application:
```typescript
const { error } = await supabase
  .from('verification_status')
  .update({
    profile_approved: true,
    profile_approved_at: new Date().toISOString()
  })
  .eq('id', applicationId)
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
- **Netlify**: Compatible with Next.js
- **Railway**: Easy deployment with database integration
- **DigitalOcean**: App Platform supports Next.js

## 🔒 Security Considerations

### Production Checklist
- [ ] Replace demo authentication with proper admin authentication
- [ ] Implement Row Level Security (RLS) policies in Supabase
- [ ] Add rate limiting for API endpoints
- [ ] Enable HTTPS in production
- [ ] Implement proper session management
- [ ] Add audit logging for admin actions
- [ ] Secure document storage with proper access controls

### Environment Variables
- Never commit `.env.local` to version control
- Use different Supabase projects for development and production
- Rotate service role keys regularly

## 📊 Analytics & Monitoring

### Recommended Integrations
- **Analytics**: Google Analytics or Mixpanel for user behavior
- **Error Tracking**: Sentry for error monitoring
- **Performance**: Vercel Analytics or similar
- **Logging**: Structured logging for admin actions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments for implementation details

## 🔄 Future Enhancements

### Planned Features
- [ ] Bulk approval/rejection operations
- [ ] Email notifications to applicants
- [ ] Advanced analytics dashboard
- [ ] Document expiration tracking
- [ ] Admin activity audit trail
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Advanced search and filtering
- [ ] Export functionality (CSV/PDF)
- [ ] Real-time notifications

### Integration Opportunities
- [ ] SMS notifications via Twilio
- [ ] Email service integration (SendGrid, Mailgun)
- [ ] Calendar integration for scheduling
- [ ] Payment processing integration
- [ ] Advanced reporting and analytics

---

Built with ❤️ for driving school administrators
