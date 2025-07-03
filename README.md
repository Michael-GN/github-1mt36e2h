# Rollcall & Timetable Management System

A comprehensive Progressive Web Application (PWA) for university discipline masters to manage student attendance, timetables, and generate reports with real-time synchronization and offline capabilities.

## 🚀 Features

### 📋 Core Functionality
- **Real-time Rollcall Management**: Take attendance for current sessions with automatic session removal after completion
- **Smart Timetable Management**: Create and manage weekly schedules with conflict detection
- **Student Management**: Complete CRUD operations for student records with import/export capabilities
- **Field Management**: Manage academic fields and departments with full CRUD operations
- **Comprehensive Reporting**: Generate detailed absentee reports with parent contact integration

### 📊 Analytics & Insights
- **Interactive Dashboard**: Visual charts showing field performance and attendance trends
- **Absentee Hours Tracking**: Monitor student absence patterns grouped by field
- **Performance Metrics**: Real-time statistics and attendance rates
- **Alert System**: Identify fields requiring immediate attention

### 🔄 Synchronization & Offline Support
- **Automatic Sync**: Background synchronization when online
- **Offline Functionality**: Continue working without internet connection
- **Queue Management**: Pending records sync automatically when connection is restored
- **Manual Sync**: Force synchronization with real-time status updates

### 📱 Progressive Web App Features
- **One-Click Installation**: Direct installation to desktop/mobile home screen
- **Responsive Design**: Optimized for all device sizes
- **Enhanced Dark/Light Mode**: Improved contrast and readability
- **Offline Caching**: Essential data cached for offline access

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- PHP 8.0+ with MySQL support
- Web server (Apache/Nginx) for production

### Local Development
```bash
# Clone the repository
git clone <repository-url>
cd rollcall-timetable-pwa

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 PWA Installation Guide

### Automatic Installation
The app will show an install prompt after a few seconds of usage. Simply click "Install" to add it to your device.

### Manual Installation

#### Chrome/Edge (Desktop)
1. Click the three dots menu (⋮) in the top right corner
2. Select "Install app" or "Add to Home screen"
3. Click "Install" in the popup dialog
4. The app will be added to your desktop/home screen

#### Firefox (Desktop)
1. Click the three lines menu (☰) in the top right corner
2. Select "Install this site as an app"
3. Choose your installation preferences
4. Click "Install" to complete the process

#### Safari (iOS)
1. Tap the Share button (square with arrow)
2. Scroll down and tap "Add to Home Screen"
3. Edit the name if desired
4. Tap "Add" to install the app

#### Chrome (Android)
1. Tap the three dots menu in the top right corner
2. Select "Add to Home screen"
3. Confirm the installation
4. The app icon will appear on your home screen

## 🔧 Backend Integration

### API Configuration
The application connects to a PHP backend with MySQL database. Configure your API endpoints in `src/utils/api.ts`:

```typescript
const API_BASE_URL = 'https://your-domain.com/api';
```

### Required API Endpoints

#### Session Management
- `GET /api/get_current_sessions.php` - Fetch active sessions
- `POST /api/submit_attendance.php` - Submit attendance records

#### Student Management
- `GET /api/get_students.php` - Fetch all students
- `POST /api/add_student.php` - Add new student
- `POST /api/update_student.php` - Update student information
- `POST /api/delete_student.php` - Delete student

#### Field Management
- `GET /api/get_fields.php` - Fetch all fields
- `POST /api/add_field.php` - Add new field
- `POST /api/update_field.php` - Update field information
- `POST /api/delete_field.php` - Delete field

#### Timetable Management
- `GET /api/get_timetable.php` - Fetch timetable entries
- `POST /api/add_timetable_entry.php` - Add timetable entry
- `POST /api/update_timetable_entry.php` - Update timetable entry
- `POST /api/delete_timetable_entry.php` - Delete timetable entry

#### Reports & Analytics
- `GET /api/get_dashboard_stats.php` - Dashboard statistics
- `GET /api/get_absentee_report.php` - Absentee reports with filters

### Database Schema
The application expects a MySQL database with the following tables:
- `fields` - Academic fields/departments
- `students` - Student information and parent contacts
- `courses` - Course information
- `timetable` - Weekly schedule entries
- `sessions` - Active rollcall sessions
- `attendance` - Attendance records
- `admin_users` - System administrators

## 🔄 Synchronization System

### How It Works
1. **Online Mode**: All operations sync immediately with the backend
2. **Offline Mode**: Data is stored locally and queued for synchronization
3. **Background Sync**: Automatic sync attempts every 2 minutes when online
4. **Manual Sync**: Users can force synchronization via the settings page
5. **Conflict Resolution**: Last-write-wins strategy for data conflicts

### Sync Status Indicators
- **🟢 Green**: All data synchronized
- **🟡 Yellow**: Sync in progress
- **🔴 Red**: Pending records waiting for sync
- **⚫ Gray**: Offline mode

### Data Persistence
- **LocalStorage**: User preferences and cache
- **IndexedDB**: Attendance queue and offline data
- **Service Worker**: Background sync and caching

## 🎯 Key Features Explained

### Automatic Session Removal
After completing attendance for a session, it's automatically removed from the current sessions list, preventing duplicate entries and ensuring data integrity.

### Enhanced Absentee Management
- **Grouped Display**: Absentees are grouped by field and course for better organization
- **Detailed View**: Click "View Student Info" to see individual student details and parent contacts
- **Communication Tools**: Direct calling and SMS functionality for parent contact

### Smart Filtering
- **Modal Filters**: Clean, accessible filter interfaces on all pages
- **Real-time Search**: Instant filtering as you type
- **Persistent State**: Filter preferences maintained across sessions

### Enhanced Dark Mode
- **Improved Contrast**: Better text readability with WCAG compliant colors
- **Consistent Theming**: Unified color scheme across all components
- **Smooth Transitions**: Seamless switching between light and dark modes

### Field Performance Charts
- **Visual Analytics**: Interactive bar charts showing attendance rates
- **Color-coded Performance**: Green (95%+), Blue (90%+), Yellow (85%+), Red (<85%)
- **Real-time Updates**: Charts update automatically with new data

## 🚀 Deployment Guide

### Using Netlify (Recommended)
1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Configure redirects for SPA routing
4. Set up environment variables for API endpoints

### Using Vercel
1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Deploy automatically on push

### Using Traditional Hosting
1. Build the project: `npm run build`
2. Upload contents of `dist` folder to your web server
3. Configure web server for SPA routing
4. Ensure HTTPS is enabled for PWA features

### Environment Variables
Create a `.env` file for production:
```env
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_APP_NAME=Rollcall System
VITE_APP_VERSION=1.0.0
```

## 🔧 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Charts**: Chart.js with React integration
- **PWA**: Vite PWA plugin with Workbox
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Backend**: PHP with MySQL (separate repository)
- **State Management**: React Hooks + Local Storage
- **Offline Storage**: IndexedDB + LocalStorage

## 🌐 Browser Support

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅
- Mobile browsers with PWA support ✅

## 📱 Mobile Features

- **Touch-optimized Interface**: Designed for mobile-first usage
- **Offline Functionality**: Core features work without internet
- **Native App Feel**: Smooth animations and transitions
- **Home Screen Installation**: One-tap installation on mobile devices

## 🔒 Security Features

- **Input Validation**: Client and server-side validation
- **XSS Protection**: Sanitized data handling
- **CSRF Protection**: Token-based request validation
- **Secure Communication**: HTTPS-only in production

## 🐛 Troubleshooting

### Common Issues

#### PWA Not Installing
- Ensure HTTPS is enabled
- Check that manifest.json is accessible
- Verify service worker registration

#### Sync Issues
- Check network connectivity
- Verify API endpoints are accessible
- Clear browser cache and try again

#### Dark Mode Issues
- Clear localStorage: `localStorage.clear()`
- Refresh the page
- Check system theme preferences

### Debug Mode
Enable debug logging by adding to localStorage:
```javascript
localStorage.setItem('debug', 'true');
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Ensure mobile responsiveness
- Test offline functionality
- Maintain accessibility standards

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For technical support or feature requests:
- Open an issue in the repository
- Contact the development team
- Check the documentation wiki

## 🎉 Acknowledgments

- Built with modern web technologies
- Designed for educational institutions
- Optimized for mobile and desktop usage
- Focused on user experience and accessibility

---

**Made with ❤️ for IME Business and Engineering School**