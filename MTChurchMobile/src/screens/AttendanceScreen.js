import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import DatePicker from '../components/DatePicker';
import { Colors } from '../constants/colors';
import { ATTENDANCE_TYPES } from '../constants/constants';
import {
  scaleWidth,
  scaleHeight,
  scaleFont,
  getResponsivePadding,
  getResponsiveMargin,
  getButtonHeight,
  getInputHeight,
  SCREEN_DIMENSIONS,
} from '../utils/responsive';

const { width } = Dimensions.get('window');

const AttendanceScreen = () => {
  // Form visibility states
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isReportsVisible, setIsReportsVisible] = useState(false);
  const [isYearlyReportVisible, setIsYearlyReportVisible] = useState(false);

  // Form data state
  const [attendanceData, setAttendanceData] = useState({
    date: null,
    attendanceType: '',
    numberOfMen: '',
    numberOfWomen: '',
    numberOfBoys: '',
    numberOfGirls: '',
  });

  // Reports states
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedAttendanceType, setSelectedAttendanceType] = useState('');

  // Yearly report states
  const [selectedYear, setSelectedYear] = useState('');
  const [yearlyReports, setYearlyReports] = useState([]);
  const [yearlyReportLoading, setYearlyReportLoading] = useState(false);
  const [yearlyReportError, setYearlyReportError] = useState('');
  const [yearlyReportSummary, setYearlyReportSummary] = useState(null);

  // Form submission states
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');

  const db = getFirestore();

  // Calculate total people based on attendance type
  const calculateTotalPeople = () => {
    if (attendanceData.attendanceType === 'Adult') {
      const men = parseInt(attendanceData.numberOfMen) || 0;
      const women = parseInt(attendanceData.numberOfWomen) || 0;
      return men + women;
    } else if (attendanceData.attendanceType === 'Children') {
      const boys = parseInt(attendanceData.numberOfBoys) || 0;
      const girls = parseInt(attendanceData.numberOfGirls) || 0;
      return boys + girls;
    }
    return 0;
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!attendanceData.date || !attendanceData.attendanceType) {
      Alert.alert('Error', 'Please fill in date and attendance type');
      return;
    }

    const totalPeople = calculateTotalPeople();
    if (totalPeople === 0) {
      Alert.alert('Error', 'Please enter attendance numbers');
      return;
    }

    setIsSubmitLoading(true);
    setSubmitError('');
    setSuccess('');

    try {
      const attendanceRecord = {
        ...attendanceData,
        totalPeople,
        createdAt: serverTimestamp(),
        date: attendanceData.date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      };

      await addDoc(collection(db, 'Attendance'), attendanceRecord);

      setSuccess('Attendance recorded successfully!');
      
      // Reset form
      setAttendanceData({
        date: null,
        attendanceType: '',
        numberOfMen: '',
        numberOfWomen: '',
        numberOfBoys: '',
        numberOfGirls: '',
      });

      // Hide form after successful submission
      setTimeout(() => {
        setIsFormVisible(false);
        setSuccess('');
      }, 2000);

    } catch (error) {
      console.error('Error recording attendance:', error);
      setSubmitError('Failed to record attendance. Please try again.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Fetch attendance logs for reports
  const fetchAttendanceLogs = async () => {
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please select start and end dates');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      let q = query(
        collection(db, 'Attendance'),
        orderBy('date', 'desc')
      );

      // Add date range filter
      q = query(q, where('date', '>=', startDateStr));
      q = query(q, where('date', '<=', endDateStr));

      const querySnapshot = await getDocs(q);
      const logs = [];
      
      querySnapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Filter by attendance type if selected
      let filtered = logs;
      if (selectedAttendanceType) {
        filtered = logs.filter(log => log.attendanceType === selectedAttendanceType);
      }

      setAttendanceLogs(logs);
      setFilteredLogs(filtered);
    } catch (error) {
      console.error('Error fetching attendance logs:', error);
      setError('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  // Generate yearly report
  const generateYearlyReport = async () => {
    if (!selectedYear) {
      Alert.alert('Error', 'Please select a year');
      return;
    }

    setYearlyReportLoading(true);
    setYearlyReportError('');

    try {
      const startOfYear = `${selectedYear}-01-01`;
      const endOfYear = `${selectedYear}-12-31`;

      const q = query(
        collection(db, 'Attendance'),
        where('date', '>=', startOfYear),
        where('date', '<=', endOfYear),
        orderBy('date', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const logs = [];
      
      querySnapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Process monthly data
      const monthlyData = {};
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      // Initialize monthly data
      months.forEach(month => {
        monthlyData[month] = {
          men: 0, women: 0, boys: 0, girls: 0,
          adultTotal: 0, childrenTotal: 0, total: 0
        };
      });

      // Process logs
      logs.forEach(log => {
        const date = new Date(log.date);
        const month = months[date.getMonth()];
        
        if (log.attendanceType === 'Adult') {
          monthlyData[month].men += parseInt(log.numberOfMen) || 0;
          monthlyData[month].women += parseInt(log.numberOfWomen) || 0;
        } else if (log.attendanceType === 'Children') {
          monthlyData[month].boys += parseInt(log.numberOfBoys) || 0;
          monthlyData[month].girls += parseInt(log.numberOfGirls) || 0;
        }
      });

      // Calculate totals
      const yearlyTotals = {
        Men: 0, Women: 0, Boys: 0, Girls: 0,
        AdultTotal: 0, ChildrenTotal: 0, Total: 0
      };

      const monthlyReports = months.map(month => {
        const data = monthlyData[month];
        data.adultTotal = data.men + data.women;
        data.childrenTotal = data.boys + data.girls;
        data.total = data.adultTotal + data.childrenTotal;

        // Add to yearly totals
        yearlyTotals.Men += data.men;
        yearlyTotals.Women += data.women;
        yearlyTotals.Boys += data.boys;
        yearlyTotals.Girls += data.girls;
        yearlyTotals.AdultTotal += data.adultTotal;
        yearlyTotals.ChildrenTotal += data.childrenTotal;
        yearlyTotals.Total += data.total;

        return {
          month,
          men: data.men,
          women: data.women,
          boys: data.boys,
          girls: data.girls,
          adultTotal: data.adultTotal,
          childrenTotal: data.childrenTotal,
          total: data.total
        };
      });

      setYearlyReports(monthlyReports);
      setYearlyReportSummary({
        selectedYear,
        yearlyTotals
      });

    } catch (error) {
      console.error('Error generating yearly report:', error);
      setYearlyReportError('Failed to generate yearly report');
    } finally {
      setYearlyReportLoading(false);
    }
  };

  // Generate year options (current year ± 5 years)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i.toString());
    }
    return years;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Render attendance log item
  const renderAttendanceLog = ({ item, index }) => (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <Text style={styles.logNumber}>#{index + 1}</Text>
        <Text style={styles.logType}>{item.attendanceType}</Text>
      </View>
      <View style={styles.logDetails}>
        <View style={styles.logRow}>
          <Text style={styles.logLabel}>
            {item.attendanceType === 'Adult' ? 'Men' : 'Boys'}:
          </Text>
          <Text style={styles.logValue}>
            {item.attendanceType === 'Adult' ? item.numberOfMen : item.numberOfBoys}
          </Text>
        </View>
        <View style={styles.logRow}>
          <Text style={styles.logLabel}>
            {item.attendanceType === 'Adult' ? 'Women' : 'Girls'}:
          </Text>
          <Text style={styles.logValue}>
            {item.attendanceType === 'Adult' ? item.numberOfWomen : item.numberOfGirls}
          </Text>
        </View>
        <View style={styles.logRow}>
          <Text style={styles.logLabel}>Total:</Text>
          <Text style={styles.logValue}>{item.totalPeople}</Text>
        </View>
        <View style={styles.logRow}>
          <Text style={styles.logLabel}>Date:</Text>
          <Text style={styles.logValue}>{formatDate(item.date)}</Text>
        </View>
      </View>
    </View>
  );

  // Render yearly report item
  const renderYearlyReportItem = ({ item }) => (
    <View style={styles.yearlyReportItem}>
      <Text style={styles.yearlyReportMonth}>{item.month}</Text>
      <View style={styles.yearlyReportStats}>
        <Text style={styles.yearlyReportStat}>Men: {item.men}</Text>
        <Text style={styles.yearlyReportStat}>Women: {item.women}</Text>
        <Text style={styles.yearlyReportStat}>Boys: {item.boys}</Text>
        <Text style={styles.yearlyReportStat}>Girls: {item.girls}</Text>
        <Text style={styles.yearlyReportTotal}>Total: {item.total}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance Management</Text>
        <Text style={styles.subtitle}>Record and track church attendance</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={styles.circularButton}
            onPress={() => {
              setIsFormVisible(!isFormVisible);
              setIsReportsVisible(false);
              setIsYearlyReportVisible(false);
              setSubmitError('');
              setSuccess('');
            }}
          >
            <Ionicons name="add-circle-outline" size={32} color="#8B5CF6" />
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>Record</Text>
        </View>
        
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={styles.circularButton}
            onPress={() => {
              setIsReportsVisible(!isReportsVisible);
              setIsFormVisible(false);
              setIsYearlyReportVisible(false);
            }}
          >
            <Ionicons name="bar-chart-outline" size={32} color="#8B5CF6" />
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>Reports</Text>
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={styles.circularButton}
            onPress={() => {
              setIsYearlyReportVisible(!isYearlyReportVisible);
              setIsFormVisible(false);
              setIsReportsVisible(false);
            }}
          >
            <Ionicons name="calendar-outline" size={32} color="#8B5CF6" />
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>Yearly</Text>
        </View>
      </View>

      {/* Attendance Form */}
      {isFormVisible && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Record Attendance</Text>
          
          {/* Error Message */}
          {submitError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          ) : null}

          {/* Success Message */}
          {success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            {/* Attendance Type */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Attendance Type *</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => {
                  Alert.alert(
                    'Select Attendance Type',
                    'Choose attendance type:',
                    ATTENDANCE_TYPES.map(type => ({
                      text: type,
                      onPress: () => handleInputChange('attendanceType', type)
                    })).concat([{ text: 'Cancel', style: 'cancel' }])
                  );
                }}
              >
                <Text style={[styles.pickerText, !attendanceData.attendanceType && styles.placeholder]}>
                  {attendanceData.attendanceType || 'Select Attendance Type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Date */}
            <DatePicker
              label="Date *"
              value={attendanceData.date}
              onValueChange={(value) => handleInputChange('date', value)}
              placeholder="Select Date"
            />

            {/* Gender-specific fields */}
            {attendanceData.attendanceType === 'Adult' && (
              <>
                <View style={styles.row}>
                  <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>Number of Men</Text>
                    <TextInput
                      style={styles.input}
                      value={attendanceData.numberOfMen}
                      onChangeText={(value) => handleInputChange('numberOfMen', value)}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor={Colors.textSecondary}
                    />
                  </View>
                  <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                    <Text style={styles.label}>Number of Women</Text>
                    <TextInput
                      style={styles.input}
                      value={attendanceData.numberOfWomen}
                      onChangeText={(value) => handleInputChange('numberOfWomen', value)}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor={Colors.textSecondary}
                    />
                  </View>
                </View>
              </>
            )}

            {attendanceData.attendanceType === 'Children' && (
              <>
                <View style={styles.row}>
                  <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>Number of Boys</Text>
                    <TextInput
                      style={styles.input}
                      value={attendanceData.numberOfBoys}
                      onChangeText={(value) => handleInputChange('numberOfBoys', value)}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor={Colors.textSecondary}
                    />
                  </View>
                  <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                    <Text style={styles.label}>Number of Girls</Text>
                    <TextInput
                      style={styles.input}
                      value={attendanceData.numberOfGirls}
                      onChangeText={(value) => handleInputChange('numberOfGirls', value)}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor={Colors.textSecondary}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Display total */}
            {attendanceData.attendanceType && (
              <View style={styles.totalContainer}>
                <Text style={styles.totalText}>Total People: {calculateTotalPeople()}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, isSubmitLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitLoading}
            >
              {isSubmitLoading ? (
                <ActivityIndicator color={Colors.surface} />
              ) : (
                <Text style={styles.submitButtonText}>Record Attendance</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Monthly Reports Section */}
      {isReportsVisible && (
        <View style={styles.reportsContainer}>
          <Text style={styles.sectionTitle}>Monthly Attendance Reports</Text>

          <View style={styles.filterContainer}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onValueChange={setStartDate}
              placeholder="Select Start Date"
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onValueChange={setEndDate}
              placeholder="Select End Date"
            />
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Attendance Type</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => {
                  Alert.alert(
                    'Select Attendance Type',
                    'Choose attendance type:',
                    [
                      { text: 'All Types', onPress: () => setSelectedAttendanceType('') },
                      ...ATTENDANCE_TYPES.map(type => ({
                        text: type,
                        onPress: () => setSelectedAttendanceType(type)
                      }))
                    ].concat([{ text: 'Cancel', style: 'cancel' }])
                  );
                }}
              >
                <Text style={[styles.pickerText, !selectedAttendanceType && styles.placeholder]}>
                  {selectedAttendanceType || 'All Types'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={fetchAttendanceLogs}
            >
              <Text style={styles.generateButtonText}>Generate Report</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : filteredLogs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No attendance records found</Text>
            </View>
          ) : (
            <>
              {/* Summary */}
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Summary</Text>
                <Text style={styles.summaryText}>
                  Total Records: {filteredLogs.length}
                </Text>
                <Text style={styles.summaryText}>
                  Total People: {filteredLogs.reduce((sum, log) => sum + log.totalPeople, 0)}
                </Text>
                {selectedAttendanceType === 'Adult' && (
                  <>
                    <Text style={styles.summaryText}>
                      Total Men: {filteredLogs.reduce((sum, log) => sum + (parseInt(log.numberOfMen) || 0), 0)}
                    </Text>
                    <Text style={styles.summaryText}>
                      Total Women: {filteredLogs.reduce((sum, log) => sum + (parseInt(log.numberOfWomen) || 0), 0)}
                    </Text>
                  </>
                )}
                {selectedAttendanceType === 'Children' && (
                  <>
                    <Text style={styles.summaryText}>
                      Total Boys: {filteredLogs.reduce((sum, log) => sum + (parseInt(log.numberOfBoys) || 0), 0)}
                    </Text>
                    <Text style={styles.summaryText}>
                      Total Girls: {filteredLogs.reduce((sum, log) => sum + (parseInt(log.numberOfGirls) || 0), 0)}
                    </Text>
                  </>
                )}
                {!selectedAttendanceType && (
                  <>
                    <Text style={styles.summaryText}>
                      Total Men: {filteredLogs.reduce((sum, log) => sum + (parseInt(log.numberOfMen) || 0), 0)}
                    </Text>
                    <Text style={styles.summaryText}>
                      Total Women: {filteredLogs.reduce((sum, log) => sum + (parseInt(log.numberOfWomen) || 0), 0)}
                    </Text>
                    <Text style={styles.summaryText}>
                      Total Boys: {filteredLogs.reduce((sum, log) => sum + (parseInt(log.numberOfBoys) || 0), 0)}
                    </Text>
                    <Text style={styles.summaryText}>
                      Total Girls: {filteredLogs.reduce((sum, log) => sum + (parseInt(log.numberOfGirls) || 0), 0)}
                    </Text>
                  </>
                )}
              </View>

              {/* Attendance Logs */}
              <FlatList
                data={filteredLogs}
                keyExtractor={(item) => item.id}
                renderItem={renderAttendanceLog}
                scrollEnabled={false}
                contentContainerStyle={styles.logsList}
              />
            </>
          )}
        </View>
      )}

      {/* Yearly Reports Section */}
      {isYearlyReportVisible && (
        <View style={styles.reportsContainer}>
          <Text style={styles.sectionTitle}>Yearly Attendance Report</Text>

          <View style={styles.yearlyControls}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Year</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => {
                  Alert.alert(
                    'Select Year',
                    'Choose a year:',
                    generateYearOptions().map(year => ({
                      text: year,
                      onPress: () => setSelectedYear(year)
                    })).concat([{ text: 'Cancel', style: 'cancel' }])
                  );
                }}
              >
                <Text style={[styles.pickerText, !selectedYear && styles.placeholder]}>
                  {selectedYear || 'Select Year'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.generateButton, !selectedYear && styles.generateButtonDisabled]}
              onPress={generateYearlyReport}
              disabled={!selectedYear || yearlyReportLoading}
            >
              {yearlyReportLoading ? (
                <ActivityIndicator color={Colors.surface} />
              ) : (
                <Text style={styles.generateButtonText}>Generate Report</Text>
              )}
            </TouchableOpacity>
          </View>

          {yearlyReportError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{yearlyReportError}</Text>
            </View>
          ) : null}

          {yearlyReportSummary && (
            <View style={styles.yearlyReportContainer}>
              <Text style={styles.yearlyReportTitle}>
                Yearly Attendance Report - {yearlyReportSummary.selectedYear}
              </Text>

              <View style={styles.yearlySummaryContainer}>
                <Text style={styles.yearlySummaryTitle}>Yearly Totals</Text>
                <View style={styles.yearlySummaryGrid}>
                  <View style={styles.yearlySummaryColumn}>
                    <Text style={styles.yearlySummarySubtitle}>Adults</Text>
                    <Text style={styles.yearlySummaryText}>
                      Men: {yearlyReportSummary.yearlyTotals.Men}
                    </Text>
                    <Text style={styles.yearlySummaryText}>
                      Women: {yearlyReportSummary.yearlyTotals.Women}
                    </Text>
                    <Text style={styles.yearlySummaryTotal}>
                      Adult Total: {yearlyReportSummary.yearlyTotals.AdultTotal}
                    </Text>
                  </View>
                  <View style={styles.yearlySummaryColumn}>
                    <Text style={styles.yearlySummarySubtitle}>Children</Text>
                    <Text style={styles.yearlySummaryText}>
                      Boys: {yearlyReportSummary.yearlyTotals.Boys}
                    </Text>
                    <Text style={styles.yearlySummaryText}>
                      Girls: {yearlyReportSummary.yearlyTotals.Girls}
                    </Text>
                    <Text style={styles.yearlySummaryTotal}>
                      Children Total: {yearlyReportSummary.yearlyTotals.ChildrenTotal}
                    </Text>
                  </View>
                </View>
                <Text style={styles.grandTotal}>
                  Grand Total Attendance: {yearlyReportSummary.yearlyTotals.Total}
                </Text>
              </View>

              <FlatList
                data={yearlyReports}
                keyExtractor={(item) => item.month}
                renderItem={renderYearlyReportItem}
                scrollEnabled={false}
                contentContainerStyle={styles.yearlyReportsList}
              />
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.surface,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.surface,
    opacity: 0.9,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: Colors.surface,
  },
  buttonWrapper: {
    alignItems: 'center',
  },
  circularButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 8,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  formContainer: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  row: {
    flexDirection: 'row',
  },
  picker: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: Colors.text,
  },
  placeholder: {
    color: Colors.textSecondary,
  },
  totalContainer: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  submitButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  successContainer: {
    backgroundColor: '#dcfce7',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '500',
  },
  reportsContainer: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  filterContainer: {
    gap: 16,
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  generateButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  logsList: {
    paddingBottom: 16,
  },
  logItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  logType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    backgroundColor: Colors.primary,
    color: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  logDetails: {
    gap: 4,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  logValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  yearlyControls: {
    gap: 16,
    marginBottom: 20,
  },
  yearlyReportContainer: {
    marginTop: 16,
  },
  yearlyReportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  yearlySummaryContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  yearlySummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  yearlySummaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  yearlySummaryColumn: {
    flex: 1,
  },
  yearlySummarySubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  yearlySummaryText: {
    fontSize: 12,
    color: Colors.text,
    marginBottom: 2,
  },
  yearlySummaryTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 4,
  },
  grandTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  yearlyReportsList: {
    paddingBottom: 16,
  },
  yearlyReportItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  yearlyReportMonth: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  yearlyReportStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearlyReportStat: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  yearlyReportTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
  },
});

export default AttendanceScreen;