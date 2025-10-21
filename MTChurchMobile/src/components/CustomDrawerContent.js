import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import { USER_ROLES } from '../constants/constants';

const CustomDrawerContent = ({ navigation, userRole, userName }) => {
  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      // Use replace to go back to Welcome screen
      navigation.getParent()?.replace('Welcome');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getDrawerItems = () => {
    const baseItems = [
      {
        name: 'Dashboard',
        icon: 'home-outline',
        label: 'Dashboard',
        screen: 'Dashboard',
      },
    ];

    // Add role-specific screens
    if (userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.FINANCE || userRole === USER_ROLES.SUPPORT) {
      baseItems.push(
        {
          name: 'Registration',
          icon: 'person-add-outline',
          label: 'Registration',
          screen: 'Registration',
        },
        {
          name: 'Attendance',
          icon: 'checkmark-circle-outline',
          label: 'Attendance',
          screen: 'Attendance',
        },
        {
          name: 'Donation',
          icon: 'card-outline',
          label: 'Collections',
          screen: 'Donation',
        }
      );
    }

    if (userRole === USER_ROLES.ADMIN) {
      baseItems.push(
        {
          name: 'AssignMember',
          icon: 'people-outline',
          label: 'Members',
          screen: 'AssignMember',
        },
        {
          name: 'Users',
          icon: 'person-outline',
          label: 'User Management',
          screen: 'Users',
        }
      );
    }

    baseItems.push(
      {
        name: 'Events',
        icon: 'calendar-outline',
        label: 'Events',
        screen: 'Events',
      },
      {
        name: 'Reports',
        icon: 'bar-chart-outline',
        label: 'Reports',
        screen: 'Reports',
      }
    );

    return baseItems;
  };

  const drawerItems = getDrawerItems();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>⛪</Text>
        </View>
        <Text style={styles.appName}>MT Zion Mobile</Text>
        <Text style={styles.userInfo}>{userName}</Text>
        <Text style={styles.userRole}>{userRole}</Text>
      </View>

      {/* Navigation Items */}
      <ScrollView style={styles.menuContainer}>
        {drawerItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.menuItem}
            onPress={() => {
              navigation.navigate(item.screen);
              navigation.closeDrawer();
            }}
          >
            <Ionicons name={item.icon} size={24} color={Colors.text} />
            <Text style={styles.menuText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Footer with Logout */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={Colors.surface} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 30,
    color: Colors.primary,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.surface,
    marginBottom: 5,
  },
  userInfo: {
    fontSize: 14,
    color: Colors.surface,
    opacity: 0.9,
  },
  userRole: {
    fontSize: 12,
    color: Colors.surface,
    opacity: 0.7,
    marginTop: 2,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 15,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
  },
  logoutText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default CustomDrawerContent;
