# MT Church Mobile App

A React Native Expo mobile application for the Methodist Church Ghana management system.

## Features

### ✅ Completed Features
- **Authentication System**: Login with role-based access control
- **Dashboard**: Real-time statistics and overview
- **Member Registration**: Comprehensive member registration forms
- **Attendance Tracking**: Record adult and children attendance
- **Financial Management**: Record collections and donations
- **Navigation**: Tab-based navigation with role-specific screens

### 🚧 In Development
- **Events Management**: Create and manage church events
- **Reports & Analytics**: Detailed reporting system
- **User Management**: Admin user management features

## Technology Stack

- **React Native** with Expo
- **Firebase** (Firestore, Auth, Storage)
- **React Navigation** (Stack, Tabs, Drawer)
- **AsyncStorage** for local data persistence
- **Expo Vector Icons** for UI icons

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Run on device/simulator:
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   
   # Web
   npm run web
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── constants/          # App constants and configurations
├── navigation/         # Navigation configuration
├── screens/           # App screens
├── services/          # Firebase and API services
└── utils/             # Utility functions
```

## User Roles

- **Admin**: Full access to all features
- **Finance**: Access to financial and reporting features
- **Support**: Access to member management and basic features
- **View**: Read-only access to dashboard and events

## Firebase Configuration

The app uses the same Firebase project as the web version:
- Project ID: mt-zion-14355
- Collections: Members, Attendance, Money Collections, Events, Announcements, Users

## Features Overview

### Dashboard
- Real-time statistics display
- Time-based greetings
- Rotating Bible verses
- Attendance and collection summaries
- Interactive navigation to other features

### Member Registration
- Comprehensive registration forms
- Ghana-specific data (regions, organizations)
- Photo upload capability
- Child member registration

### Attendance Tracking
- Separate tracking for adults and children
- Gender-based counting
- Date-based filtering
- Export capabilities

### Financial Management
- Multi-currency support
- Various collection types
- Member-specific tracking
- Financial reporting

## Development Notes

- The app follows the same data structure as the web version
- All Firebase collections are shared between web and mobile
- Role-based access control is implemented
- Responsive design for various screen sizes
- Offline capability with AsyncStorage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software for Methodist Church Ghana.

## Support

For technical support or questions, contact the development team.
