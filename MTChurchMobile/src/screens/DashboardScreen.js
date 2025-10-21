import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Colors } from '../constants/colors';
import { BIBLE_VERSES } from '../constants/constants';
import {
  scaleWidth,
  scaleHeight,
  scaleFont,
  getResponsivePadding,
  getResponsiveMargin,
  getGridColumns,
  getCardWidth,
  getChartHeight,
  getChartWidth,
  SCREEN_DIMENSIONS,
} from '../utils/responsive';

const { width } = Dimensions.get('window');
const chartWidth = getChartWidth();

const DashboardScreen = ({ navigation }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [membersData, setMembersData] = useState([]);
  const [collectionsData, setCollectionsData] = useState([]);
  const [announcementsData, setAnnouncementsData] = useState([]);
  const [eventsData, setEventsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentScripture, setCurrentScripture] = useState(0);
  const [userName, setUserName] = useState('');
  const [summaryStats, setSummaryStats] = useState({
    totalMembers: 0,
    totalAttendance: 0,
    attendanceBreakdown: { Adult: 0, Children: 0 },
    totalCollectionsByCurrency: {},
    totalAnnouncements: 0,
    totalEvents: 0,
  });

  useEffect(() => {
    fetchUserData();
    fetchData();
    
    // Start clock timer
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Start scripture rotation timer (every 30 seconds instead of 10)
    const scriptureTimer = setInterval(() => {
      setCurrentScripture((prev) => (prev + 1) % BIBLE_VERSES.length);
    }, 30000);
    
    // Cleanup timers on unmount
    return () => {
      clearInterval(clockTimer);
      clearInterval(scriptureTimer);
    };
  }, []);

  const fetchUserData = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      setUserName(name || 'User');
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };


  const fetchData = async () => {
    const db = getFirestore();
    try {
      // Fetch all data in parallel
      const [
        attendanceSnapshot,
        membersSnapshot,
        collectionsSnapshot,
        announcementsSnapshot,
        eventsSnapshot,
      ] = await Promise.all([
        getDocs(collection(db, 'Attendance')),
        getDocs(collection(db, 'Members')),
        getDocs(collection(db, 'Money Collections')),
        getDocs(collection(db, 'Announcements')),
        getDocs(collection(db, 'Events')),
      ]);

      const currentYear = new Date().getFullYear();

      // Process attendance data
      const attendanceList = attendanceSnapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id }))
        .filter(attendance => {
          const attendanceDate = new Date(attendance.date);
          return attendanceDate.getFullYear() === currentYear;
        });

      // Process members data
      const membersList = membersSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));

      // Process collections data
      const collectionsList = collectionsSnapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id }))
        .filter(collection => {
          const collectionDate = collection.timestamp?.toDate?.() || new Date(collection.timestamp);
          return collectionDate.getFullYear() === currentYear;
        });

      // Process announcements data
      const announcementsList = announcementsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));

      // Process events data
      const eventsList = eventsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));

      setAttendanceData(attendanceList);
      setMembersData(membersList);
      setCollectionsData(collectionsList);
      setAnnouncementsData(announcementsList);
      setEventsData(eventsList);

      // Calculate statistics
      const attendanceBreakdown = attendanceList.reduce((acc, item) => {
        const type = item.attendanceType || 'Other';
        const count = parseInt(item.numberOfPeople || 0);
        acc[type] = (acc[type] || 0) + count;
        return acc;
      }, {});

      const totalAttendance = Object.values(attendanceBreakdown).reduce((sum, count) => sum + count, 0);

      const totalCollectionsByCurrency = collectionsList.reduce((acc, item) => {
        const currency = item.currency || 'GHS';
        const amount = item.amount || 0;
        acc[currency] = (acc[currency] || 0) + amount;
        return acc;
      }, {});

      setSummaryStats({
        totalMembers: membersList.length,
        totalAttendance,
        attendanceBreakdown,
        totalCollectionsByCurrency,
        totalAnnouncements: announcementsList.length,
        totalEvents: eventsList.length,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning! 🌅';
    if (hour < 17) return 'Good Afternoon! ☀️';
    if (hour < 21) return 'Good Evening! 🌆';
    return 'Good Night! 🌙';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
      
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }

      if (typeof timestamp === 'number') {
        return new Date(timestamp).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }

      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }

      if (typeof timestamp === 'string') {
        if (timestamp.includes(' at ')) {
          return timestamp.split(' at ')[0];
        }
        return new Date(timestamp).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }

      return 'Invalid Date Format';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date Error';
    }
  };

  // Prepare data for bar chart (Attendance and Collections Trends)
  const processMonthlyData = () => {
    const monthlyData = {};
    const currentYear = new Date().getFullYear();
    
    // Initialize all months with zero values
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach(month => {
      monthlyData[month] = { month, attendance: 0, collections: 0 };
    });
    
    // Process attendance data by month
    attendanceData.forEach(item => {
      try {
        const date = new Date(item.date);
        if (date.getFullYear() === currentYear) {
          const monthKey = date.toLocaleDateString('en-GB', { month: 'short' });
          if (monthlyData[monthKey]) {
            monthlyData[monthKey].attendance += parseInt(item.numberOfPeople || 0);
          }
        }
      } catch (error) {
        console.error('Error processing attendance item:', error);
      }
    });
    
    // Process collections data by month
    collectionsData.forEach(item => {
      try {
        let date;
        if (item.timestamp?.toDate) {
          date = item.timestamp.toDate();
        } else if (item.timestamp) {
          date = new Date(item.timestamp);
        } else if (item.date) {
          date = new Date(item.date);
        }
        
        if (date && date.getFullYear() === currentYear) {
          const monthKey = date.toLocaleDateString('en-GB', { month: 'short' });
          if (monthlyData[monthKey]) {
            monthlyData[monthKey].collections += parseFloat(item.amount || 0);
          }
        }
      } catch (error) {
        console.error('Error processing collection item:', error);
      }
    });
    
    // Return array in correct order
    return months.map(month => monthlyData[month]);
  };

  const barChartData = processMonthlyData();

  // Prepare data for line chart (Attendance Trends)
  const processAttendanceData = (data) => {
    const groupedData = data.reduce((acc, item) => {
      const date = formatDate(item.submittedAt || item.date);
      if (!acc[date]) {
        acc[date] = {
          date,
          Adult: 0,
          Children: 0
        };
      }
      
      const type = item.attendanceType || 'Other';
      if (type === 'Adult' || type === 'Children') {
        acc[date][type] += parseInt(item.numberOfPeople || 0);
      }
      
      return acc;
    }, {});

    return Object.values(groupedData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  };

  const lineChartData = processAttendanceData(attendanceData);

  // Calendar component for events
  const EventCalendar = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Get events for current month
    const currentMonthEvents = eventsData.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });

    // Get days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = currentMonthEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getDate() === day;
      });
      days.push({ day, events: dayEvents });
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
      <View style={styles.calendarContainer}>
        <Text style={styles.calendarTitle}>
          {monthNames[currentMonth]} {currentYear}
        </Text>
        <View style={styles.calendarGrid}>
          <View style={styles.calendarHeader}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.calendarHeaderText}>{day}</Text>
            ))}
          </View>
          <View style={styles.calendarDays}>
            {days.map((dayData, index) => (
              <View key={index} style={styles.calendarDay}>
                {dayData ? (
                  <View style={styles.calendarDayContent}>
                    <Text style={[
                      styles.calendarDayText,
                      dayData.day === currentDate.getDate() && styles.currentDayText
                    ]}>
                      {dayData.day}
                    </Text>
                    {dayData.events.length > 0 && (
                      <View style={styles.eventIndicator}>
                        <Text style={styles.eventIndicatorText}>{dayData.events.length}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.calendarDayEmpty} />
                )}
              </View>
            ))}
          </View>
        </View>
        {currentMonthEvents.length > 0 && (
          <View style={styles.calendarEvents}>
            <Text style={styles.calendarEventsTitle}>This Month's Events:</Text>
            {currentMonthEvents.slice(0, 3).map((event, index) => (
              <View key={index} style={styles.calendarEventItem}>
                <Text style={styles.calendarEventDate}>
                  {new Date(event.date).getDate()}
                </Text>
                <Text style={styles.calendarEventTitle}>{event.title}</Text>
              </View>
            ))}
            {currentMonthEvents.length > 3 && (
              <Text style={styles.calendarMoreEvents}>
                +{currentMonthEvents.length - 3} more events
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // Prepare recent collections data for table
  const recentCollections = Object.values(
    collectionsData.reduce((acc, collection) => {
      const date = collection.timestamp?.toDate?.() || new Date(collection.timestamp);
      const monthYear = date.toLocaleDateString('en-GB', { 
        month: 'long',
        year: 'numeric'
      });
      const type = collection.paymentType || 'Other';
      const amount = collection.amount || 0;
      
      if (!acc[monthYear]) {
        acc[monthYear] = {
          monthYear,
          types: new Set(),
          totalAmount: 0
        };
      }
      
      acc[monthYear].types.add(type);
      acc[monthYear].totalAmount += amount;
      return acc;
    }, {})
  )
  .sort((a, b) => {
    const dateA = new Date(a.monthYear);
    const dateB = new Date(b.monthYear);
    return dateA - dateB;
  })
  .slice(0, 5);

  // Prepare recent attendance data for table
  const recentAttendance = attendanceData
    .sort((a, b) => new Date(b.submittedAt || b.date) - new Date(a.submittedAt || a.date))
    .slice(0, 5);

  const StatCard = ({ title, value, icon, color, onPress, subtitle }) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.statContent}>
        <View style={styles.statIconContainer}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.statTextContainer}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  const TableRow = ({ date, type, amount, isHeader = false }) => (
    <View style={[styles.tableRow, isHeader && styles.tableHeader]}>
      <Text style={[styles.tableCell, styles.tableCellDate, isHeader && styles.tableHeaderText]}>{date}</Text>
      <Text style={[styles.tableCell, styles.tableCellType, isHeader && styles.tableHeaderText]}>{type}</Text>
      <Text style={[styles.tableCell, styles.tableCellAmount, isHeader && styles.tableHeaderText]}>{amount}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>{getTimeBasedGreeting()}</Text>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.currentDate}>
            {currentTime.toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.currentTime}>
            {currentTime.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </Text>
        </View>
      </View>

      {/* Scripture Section */}
      <View style={styles.scriptureCard}>
        <Text style={styles.scriptureText}>"{BIBLE_VERSES[currentScripture].text}"</Text>
        <Text style={styles.scriptureReference}>- {BIBLE_VERSES[currentScripture].reference}</Text>
      </View>

      {/* Statistics Cards - 2 per row */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Overview</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statCardHalf}>
            <StatCard
              title="Total Members"
              value={summaryStats.totalMembers}
              icon="people"
              color={Colors.primary}
              onPress={() => navigation.navigate('Groups')}
            />
          </View>
          <View style={styles.statCardHalf}>
            <StatCard
              title={`Attendance (${new Date().getFullYear()})`}
              value={summaryStats.totalAttendance}
              icon="checkmark-circle"
              color={Colors.success}
              onPress={() => navigation.navigate('Attendance')}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCardHalf}>
            <StatCard
              title={`Collections (${new Date().getFullYear()})`}
              value={`GHS ${Object.values(summaryStats.totalCollectionsByCurrency).reduce((sum, amount) => sum + amount, 0).toLocaleString()}`}
              icon="card"
              color={Colors.warning}
              onPress={() => navigation.navigate('Donation')}
            />
          </View>
          <View style={styles.statCardHalf}>
            <StatCard
              title="Announcements"
              value={summaryStats.totalAnnouncements}
              icon="megaphone"
              color={Colors.secondary}
              onPress={() => navigation.navigate('Events')}
            />
          </View>
        </View>

      </View>

      {/* Tables Section - Moved after cards */}
      <View style={styles.tablesContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        
        {/* Recent Collections Table */}
        <View style={styles.tableCard}>
          <Text style={styles.tableTitle}>Recent Collections</Text>
          <TableRow date="Month" type="Types" amount="Amount" isHeader />
          {recentCollections.map((collection, index) => (
            <TableRow
              key={index}
              date={collection.monthYear}
              type={Array.from(collection.types).join(', ')}
              amount={`GHS ${collection.totalAmount.toLocaleString()}`}
            />
          ))}
        </View>

        {/* Recent Attendance Table */}
        <View style={styles.tableCard}>
          <Text style={styles.tableTitle}>Recent Attendance</Text>
          <TableRow date="Date" type="Type" amount="People" isHeader />
          {recentAttendance.map((attendance) => (
            <TableRow
              key={attendance.id}
              date={formatDate(attendance.submittedAt || attendance.date)}
              type={attendance.attendanceType}
              amount={attendance.numberOfPeople}
            />
          ))}
        </View>
      </View>

      {/* Event Calendar - Moved after tables */}
      <View style={styles.chartsContainer}>
        <Text style={styles.sectionTitle}>Event Calendar</Text>
        <View style={styles.chartCard}>
          <EventCalendar />
        </View>
      </View>

      {/* Charts Section */}
      <View style={styles.chartsContainer}>
        <Text style={styles.sectionTitle}>Analytics</Text>
        
        {/* Monthly Trends Bar Chart */}
        {barChartData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Monthly Trends (Attendance & Collections)</Text>
            <BarChart
              data={{
                labels: barChartData.map(item => item.month),
                datasets: [
                  {
                    data: barChartData.map(item => Math.max(item.attendance, 0.1)), // Ensure minimum value for visibility
                    color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                  },
                  {
                    data: barChartData.map(item => Math.max(Math.round(item.collections / 1000), 0.1)), // Scale down collections and ensure minimum value
                    color: (opacity = 1) => `rgba(130, 202, 157, ${opacity})`,
                  }
                ]
              }}
              width={chartWidth}
              height={getChartHeight()}
              chartConfig={{
                backgroundColor: Colors.surface,
                backgroundGradientFrom: Colors.surface,
                backgroundGradientTo: Colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                barPercentage: 0.7,
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#8641f4' }]} />
                <Text style={styles.legendText}>Attendance</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#82ca9d' }]} />
                <Text style={styles.legendText}>Collections (in 1000s)</Text>
              </View>
            </View>
          </View>
        )}

        {/* Attendance Trends Line Chart */}
        {lineChartData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Attendance Trends</Text>
            <LineChart
              data={{
                labels: lineChartData.map(item => item.date.split(' ')[0]), // Just the day
                datasets: [
                  {
                    data: lineChartData.map(item => item.Adult),
                    color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                    strokeWidth: 2
                  },
                  {
                    data: lineChartData.map(item => item.Children),
                    color: (opacity = 1) => `rgba(130, 202, 157, ${opacity})`,
                    strokeWidth: 2
                  }
                ]
              }}
              width={chartWidth}
              height={getChartHeight()}
              chartConfig={{
                backgroundColor: Colors.surface,
                backgroundGradientFrom: Colors.surface,
                backgroundGradientTo: Colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: Colors.primary
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#8641f4' }]} />
                <Text style={styles.legendText}>Adult</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#82ca9d' }]} />
                <Text style={styles.legendText}>Children</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.text,
    fontSize: 16,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: getResponsivePadding(20),
    paddingTop: getResponsivePadding(40),
  },
  greetingSection: {
    alignItems: 'center',
  },
  greeting: {
    fontSize: scaleFont(24),
    fontWeight: 'bold',
    color: Colors.surface,
    marginBottom: getResponsiveMargin(5),
  },
  userName: {
    fontSize: scaleFont(18),
    color: Colors.surface,
    marginBottom: getResponsiveMargin(10),
  },
  currentDate: {
    fontSize: scaleFont(16),
    color: Colors.surface,
    opacity: 0.9,
    marginBottom: getResponsiveMargin(5),
  },
  currentTime: {
    fontSize: scaleFont(20),
    fontWeight: 'bold',
    color: Colors.surface,
  },
  scriptureCard: {
    backgroundColor: Colors.surface,
    margin: getResponsiveMargin(20),
    padding: getResponsivePadding(20),
    borderRadius: scaleWidth(12),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scriptureText: {
    fontSize: scaleFont(16),
    fontStyle: 'italic',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: getResponsiveMargin(10),
    lineHeight: scaleFont(24),
  },
  scriptureReference: {
    fontSize: scaleFont(14),
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: getResponsivePadding(20),
  },
  sectionTitle: {
    fontSize: scaleFont(20),
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: getResponsiveMargin(15),
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCardHalf: {
    flex: 1,
    marginHorizontal: 6,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statSubtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chartsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tablesContainer: {
    padding: 20,
    paddingTop: 0,
  },
  tableCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableHeader: {
    backgroundColor: Colors.background,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
  },
  tableCellDate: {
    flex: 1.2,
  },
  tableCellType: {
    flex: 1.5,
  },
  tableCellAmount: {
    flex: 1,
    textAlign: 'right',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  breakdownCard: {
    backgroundColor: Colors.surface,
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  breakdownType: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  breakdownCount: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  // Calendar styles
  calendarContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  calendarGrid: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    paddingVertical: 8,
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  calendarDayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    position: 'relative',
  },
  calendarDayText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  currentDayText: {
    color: Colors.primary,
    fontWeight: 'bold',
    backgroundColor: Colors.primary + '20',
    borderRadius: 12,
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  calendarDayEmpty: {
    flex: 1,
  },
  eventIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventIndicatorText: {
    color: Colors.surface,
    fontSize: 8,
    fontWeight: 'bold',
  },
  calendarEvents: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  calendarEventsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  calendarEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  calendarEventDate: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
    backgroundColor: Colors.background,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
    minWidth: 24,
    textAlign: 'center',
  },
  calendarEventTitle: {
    fontSize: 12,
    color: Colors.text,
    flex: 1,
  },
  calendarMoreEvents: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default DashboardScreen;