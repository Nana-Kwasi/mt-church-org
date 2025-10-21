import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import DonationScreen from '../screens/DonationScreen';
import GroupsScreen from '../screens/GroupsScreen';
import AssignMemberScreen from '../screens/AssignMemberScreen';
import EventsScreen from '../screens/EventsScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import SearchScreen from '../screens/SearchScreen';
import ReportsScreen from '../screens/ReportsScreen';
import UsersScreen from '../screens/UsersScreen';
import MemberDetailsScreen from '../screens/MemberDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Import components
import CustomDrawerContent from '../components/CustomDrawerContent';

// Import constants
import { Colors } from '../constants/colors';
import { USER_ROLES } from '../constants/constants';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Loading Screen Component
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
    <ActivityIndicator size="large" color={Colors.primary} />
    <Text style={{ marginTop: 10, color: Colors.text }}>Loading...</Text>
  </View>
);

// Drawer Navigator for main app screens
const MainDrawerNavigator = ({ userRole, userName }) => {
  const getDrawerScreens = () => {
    const baseScreens = [
      {
        name: 'Dashboard',
        component: DashboardScreen,
        options: {
          drawerLabel: 'Dashboard',
          title: 'Dashboard',
        }
      }
    ];

    // Add role-specific screens based on web version
    if (userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.FINANCE || userRole === USER_ROLES.SUPPORT) {
      baseScreens.push(
        {
          name: 'Registration',
          component: RegistrationScreen,
          options: {
            drawerLabel: 'Registration',
            title: 'Registration',
          }
        },
        {
          name: 'Attendance',
          component: AttendanceScreen,
          options: {
            drawerLabel: 'Attendance',
            title: 'Attendance',
          }
        },
        {
          name: 'Donation',
          component: DonationScreen,
          options: {
            drawerLabel: 'Collections',
            title: 'Collections',
          }
        }
      );
    }

    // Admin-only screens
    if (userRole === USER_ROLES.ADMIN) {
      baseScreens.push(
        {
          name: 'AssignMember',
          component: AssignMemberScreen,
          options: {
            drawerLabel: 'Members',
            title: 'Members',
          }
        },
        {
          name: 'Users',
          component: UsersScreen,
          options: {
            drawerLabel: 'User Management',
            title: 'User Management',
          }
        }
      );
    }

    // Common screens for all roles (except View)
    if (userRole !== USER_ROLES.VIEW) {
      baseScreens.push(
        {
          name: 'Events',
          component: EventsScreen,
          options: {
            drawerLabel: 'Events',
            title: 'Events',
          }
        },
        {
          name: 'Announcements',
          component: AnnouncementsScreen,
          options: {
            drawerLabel: 'Announcements',
            title: 'Announcements',
          }
        },
        {
          name: 'Search',
          component: SearchScreen,
          options: {
            drawerLabel: 'Search',
            title: 'Search',
          }
        },
        {
          name: 'Reports',
          component: ReportsScreen,
          options: {
            drawerLabel: 'Reports',
            title: 'Reports',
          }
        }
      );
    } else {
      // View role only gets Dashboard and Events
      baseScreens.push({
        name: 'Events',
        component: EventsScreen,
        options: {
          drawerLabel: 'Events',
          title: 'Events',
        }
      });
    }

    return baseScreens;
  };

  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <CustomDrawerContent {...props} userRole={userRole} userName={userName} />
      )}
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.surface,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerStyle: {
          backgroundColor: Colors.surface,
        },
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.textSecondary,
      }}
    >
      {getDrawerScreens().map((screen) => (
        <Drawer.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={screen.options}
        />
      ))}
    </Drawer.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userRole = await AsyncStorage.getItem('userRole');
      const userName = await AsyncStorage.getItem('userName');
      const isAuth = await AsyncStorage.getItem('isAuthenticated');
      
      if (userRole && isAuth === 'true') {
        setUserRole(userRole);
        setUserName(userName || 'User');
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.surface,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Main"
          options={{ headerShown: false }}
        >
          {() => <MainDrawerNavigator userRole={userRole} userName={userName} />}
        </Stack.Screen>
        <Stack.Screen
          name="MemberDetails"
          component={MemberDetailsScreen}
          options={{
            title: 'Member Details',
            headerShown: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
