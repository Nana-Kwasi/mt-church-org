import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { Colors } from '../constants/colors';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import DatePicker from '../components/DatePicker';
import Dropdown from '../components/Dropdown';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import {
  scaleWidth,
  scaleHeight,
  scaleFont,
  getResponsivePadding,
  getResponsiveMargin,
  getModalWidth,
  getModalHeight,
  getButtonHeight,
  getTableCellHeight,
  SCREEN_DIMENSIONS,
} from '../utils/responsive';

const ReportsScreen = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [year, setYear] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [currencyTotals, setCurrencyTotals] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const paymentTypes = [
    { label: 'All Payment Types', value: '' },
    { label: 'Tithe', value: 'Tithe' },
    { label: 'Donation', value: 'Donation' },
    { label: 'Funeral Contributions', value: 'Funeral Contributions' },
    { label: 'Special Offerings', value: 'Special Offerings' },
    { label: 'Welfare', value: 'Welfare' },
  ];

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 10; i--) {
      years.push({ label: i.toString(), value: i.toString() });
    }
    return years;
  };

  const fetchLogs = async () => {
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please select both start and end dates.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const snapshot = await getDocs(collection(db, 'Money Collections'));
      const currencyGroups = {};
      const logsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.timestamp?.seconds
          ? new Date(data.timestamp.seconds * 1000)
          : null;
        const formattedTimestamp = date
          ? date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : '---';

        const currency = data.currency || 'Unknown';
        if (!currencyGroups[currency]) currencyGroups[currency] = 0;
        currencyGroups[currency] += data.amount || 0;

        return {
          id: doc.id,
          amount: data.amount || 0,
          currency: data.currency || 'Unknown',
          memberId: data.memberId || '---',
          memberName: data.memberName || '---',
          paymentType: data.paymentType || '---',
          timestamp: date, // Keep the raw Date object for sorting
          formattedTimestamp, // Store formatted string separately
        };
      });

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const filtered = logsData.filter((log) => {
        return (
          log.timestamp &&
          log.timestamp >= start &&
          log.timestamp <= end &&
          (!paymentType || log.paymentType === paymentType)
        );
      });

      // Sort logs by date in ascending order
      const sortedLogs = filtered.sort((a, b) => a.timestamp - b.timestamp);

      setLogs(sortedLogs);
      setFilteredLogs(sortedLogs.map((log) => ({
        ...log,
        timestamp: log.formattedTimestamp, // Use formatted date for display
      })));
      setCurrencyTotals(currencyGroups);
      
      // Auto-generate PDF after fetching data
      if (sortedLogs.length > 0) {
        await generatePDF(sortedLogs, currencyGroups, 'dateRange');
      }
    } catch (error) {
      setError(`Failed to retrieve data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchYearlyLogs = async () => {
    if (!year) {
      Alert.alert('Error', 'Please select a year.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const snapshot = await getDocs(collection(db, 'Money Collections'));
      const currencyGroups = {};
      const logsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.timestamp?.seconds
          ? new Date(data.timestamp.seconds * 1000)
          : null;
        const formattedTimestamp = date
          ? date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : '---';

        const currency = data.currency || 'Unknown';
        if (!currencyGroups[currency]) currencyGroups[currency] = 0;
        currencyGroups[currency] += data.amount || 0;

        return {
          id: doc.id,
          amount: data.amount || 0,
          currency: data.currency || 'Unknown',
          memberId: data.memberId || '---',
          memberName: data.memberName || '---',
          paymentType: data.paymentType || '---',
          timestamp: date, // Keep the raw Date object for filtering
          formattedTimestamp, // Store formatted string separately
        };
      });

      // Filter by year using the raw Date object
      console.log('Selected year:', year);
      console.log('Total logs before filtering:', logsData.length);
      console.log('Sample log timestamps:', logsData.slice(0, 3).map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        year: log.timestamp?.getFullYear(),
        formatted: log.formattedTimestamp
      })));
      
      const filtered = logsData.filter((log) => {
        const logYear = log.timestamp?.getFullYear();
        const matchesYear = logYear === parseInt(year);
        const matchesPaymentType = !paymentType || log.paymentType === paymentType;
        
        console.log(`Log ${log.id}: year=${logYear}, matchesYear=${matchesYear}, paymentType=${log.paymentType}, matchesPaymentType=${matchesPaymentType}`);
        
  return (
          log.timestamp &&
          matchesYear &&
          matchesPaymentType
        );
      });
      
      console.log('Filtered logs count:', filtered.length);

      // Sort the filtered logs by date in ascending order
      const sortedLogs = filtered.sort((a, b) => a.timestamp - b.timestamp);

      // Calculate currency totals only for filtered data
      const filteredCurrencyGroups = {};
      sortedLogs.forEach(log => {
        const currency = log.currency;
        if (!filteredCurrencyGroups[currency]) filteredCurrencyGroups[currency] = 0;
        filteredCurrencyGroups[currency] += log.amount || 0;
      });

      setLogs(sortedLogs);
      setFilteredLogs(sortedLogs.map((log) => ({
        ...log,
        timestamp: log.formattedTimestamp, // Use formatted date for display
      })));
      setCurrencyTotals(filteredCurrencyGroups);
      
      // Auto-generate PDF after fetching data
      if (sortedLogs.length > 0) {
        await generatePDF(sortedLogs.map((log) => ({
          ...log,
          timestamp: log.formattedTimestamp, // Use formatted date for PDF
        })), filteredCurrencyGroups, 'yearly');
      }
    } catch (error) {
      setError(`Failed to retrieve data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (logs, currencyTotals, reportType) => {
    try {
      const currentDate = new Date().toLocaleString();
      const reportTitle = reportType === 'yearly' ? `Yearly Report - ${year}` : `Date Range Report - ${startDate?.toLocaleDateString()} to ${endDate?.toLocaleDateString()}`;
      
      // Calculate totals
      const totalTransactions = logs.length;
      const grandTotal = Object.values(currencyTotals).reduce((sum, amount) => sum + amount, 0);
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Financial Report</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px;
              margin-bottom: 30px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            }
            .header p {
              margin: 10px 0 0 0;
              font-size: 16px;
              opacity: 0.9;
            }
            .report-info {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .report-info h2 {
              color: #333;
              margin: 0 0 15px 0;
              font-size: 20px;
              border-bottom: 2px solid #667eea;
              padding-bottom: 10px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .info-label {
              font-weight: 600;
              color: #555;
            }
            .info-value {
              color: #333;
            }
            .summary-section {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .summary-section h2 {
              color: #333;
              margin: 0 0 15px 0;
              font-size: 20px;
              border-bottom: 2px solid #667eea;
              padding-bottom: 10px;
            }
            .currency-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
            }
            .currency-item {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 6px;
              text-align: center;
              border-left: 4px solid #667eea;
            }
            .currency-name {
              font-weight: bold;
              color: #333;
              font-size: 16px;
            }
            .currency-amount {
              color: #667eea;
              font-size: 18px;
              font-weight: bold;
              margin-top: 5px;
            }
            .transactions-section {
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .transactions-section h2 {
              color: #333;
              margin: 0 0 20px 0;
              font-size: 20px;
              border-bottom: 2px solid #667eea;
              padding-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              background: #667eea;
              color: white;
              padding: 12px 8px;
              text-align: left;
              font-weight: bold;
              font-size: 14px;
            }
            td {
              padding: 10px 8px;
              border-bottom: 1px solid #eee;
              font-size: 13px;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            tr:hover {
              background-color: #e3f2fd;
            }
            .amount {
              text-align: right;
              font-weight: bold;
              color: #667eea;
            }
            .number {
              text-align: center;
              font-weight: bold;
              color: #666;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #666;
              font-size: 12px;
              padding: 20px;
              border-top: 1px solid #eee;
            }
            @media print {
              body { background-color: white; }
              .header { background: #667eea !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Mt Zion Methodist Church</h1>
            <p>Financial Report</p>
          </div>
          
          <div class="report-info">
            <h2>Report Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Report Type:</span>
                <span class="info-value">${reportTitle}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Payment Type:</span>
                <span class="info-value">${paymentType || 'All Payment Types'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Generated On:</span>
                <span class="info-value">${currentDate}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total Transactions:</span>
                <span class="info-value">${totalTransactions}</span>
              </div>
            </div>
          </div>
          
          <div class="summary-section">
            <h2>Currency Summary</h2>
            <div class="currency-grid">
              ${Object.entries(currencyTotals).map(([currency, amount]) => `
                <div class="currency-item">
                  <div class="currency-name">${currency}</div>
                  <div class="currency-amount">${amount.toFixed(2)}</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="transactions-section">
            <h2>Transaction Details</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Member Name</th>
                  <th>Payment Type</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${logs.map((log, index) => `
                  <tr>
                    <td class="number">${index + 1}</td>
                    <td>${log.memberName}</td>
                    <td>${log.paymentType}</td>
                    <td class="amount">${log.amount} ${log.currency}</td>
                    <td>${log.timestamp}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>This report was generated automatically by Mt Zion Methodist Church Management System</p>
            <p>Generated on ${currentDate}</p>
          </div>
        </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // Share the PDF
      await shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
      });

      Alert.alert('Success', 'PDF report has been generated and is ready to share!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF report. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (year) {
      await fetchYearlyLogs();
    } else if (startDate && endDate) {
      await fetchLogs();
    }
    setRefreshing(false);
  };

  const renderTransactionItem = ({ item, index }) => (
    <View style={styles.transactionRow}>
      <Text style={styles.transactionNumber}>{index + 1}</Text>
      <Text style={styles.transactionName} numberOfLines={1}>
        {item.memberName}
      </Text>
      <Text style={styles.transactionType} numberOfLines={1}>
        {item.paymentType}
      </Text>
      <Text style={styles.transactionAmount}>
        {item.amount} {item.currency}
      </Text>
      <Text style={styles.transactionDate} numberOfLines={1}>
        {item.timestamp}
      </Text>
    </View>
  );

  const renderSummaryItem = ({ item }) => (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryCurrency}>{item.currency}</Text>
      <Text style={styles.summaryAmount}>{item.amount.toFixed(2)}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Financial Reports</Text>

      {/* Date Range Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Filter by Date Range</Text>
        
        <View style={styles.dateRow}>
          <View style={styles.dateInput}>
            <DatePicker
              value={startDate}
              onValueChange={(date) => setStartDate(date)}
              placeholder="Select Start Date"
              label="Start Date"
            />
          </View>
          
          <View style={styles.dateInput}>
            <DatePicker
              value={endDate}
              onValueChange={(date) => setEndDate(date)}
              placeholder="Select End Date"
              label="End Date"
            />
          </View>
        </View>

        <View style={styles.dropdownContainer}>
          <Dropdown
            options={paymentTypes}
            value={paymentType}
            onValueChange={(value) => setPaymentType(value)}
            placeholder="Select Payment Type"
            label="Payment Type"
          />
        </View>

        <TouchableOpacity style={styles.fetchButton} onPress={fetchLogs}>
          <Text style={styles.fetchButtonText}>Fetch Transactions</Text>
        </TouchableOpacity>
      </View>

      {/* Year Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Filter by Year</Text>
        
        <View style={styles.dropdownContainer}>
          <Dropdown
            options={generateYearOptions()}
            value={year}
            onValueChange={(value) => setYear(value)}
            placeholder="Select Year"
            label="Year"
          />
        </View>

        <TouchableOpacity style={styles.fetchButton} onPress={fetchYearlyLogs}>
          <Text style={styles.fetchButtonText}>Fetch Yearly Transactions</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
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
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No transactions found for the selected criteria.</Text>
        </View>
      ) : (
        <>
          {/* Summary Section */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Summary by Currency</Text>
            <FlatList
              data={Object.keys(currencyTotals).map(currency => ({
                currency,
                amount: currencyTotals[currency]
              }))}
              renderItem={renderSummaryItem}
              keyExtractor={(item) => item.currency}
              scrollEnabled={false}
            />
          </View>

          {/* Transactions Table */}
          <View style={styles.tableContainer}>
            <Text style={styles.sectionTitle}>Transactions</Text>
            
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.headerNumber}>#</Text>
              <Text style={styles.headerName}>Member</Text>
              <Text style={styles.headerType}>Type</Text>
              <Text style={styles.headerAmount}>Amount</Text>
              <Text style={styles.headerDate}>Date</Text>
            </View>

            {/* Table Body */}
            <FlatList
              data={filteredLogs}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>

        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: scaleFont(24),
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginVertical: getResponsiveMargin(20),
  },
  filterSection: {
    backgroundColor: Colors.surface,
    margin: getResponsiveMargin(15),
    padding: getResponsivePadding(15),
    borderRadius: scaleWidth(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: getResponsiveMargin(15),
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  dropdownContainer: {
    marginBottom: 15,
  },
  fetchButton: {
    backgroundColor: Colors.primary,
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(20),
    borderRadius: scaleWidth(8),
    alignItems: 'center',
    minHeight: getButtonHeight(),
  },
  fetchButtonText: {
    color: Colors.surface,
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  summarySection: {
    backgroundColor: Colors.surface,
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryCurrency: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryAmount: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  tableContainer: {
    backgroundColor: Colors.surface,
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(8),
    borderRadius: scaleWidth(6),
    marginBottom: getResponsiveMargin(8),
    minHeight: getTableCellHeight(),
  },
  headerNumber: {
    flex: 0.5,
    color: Colors.surface,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: scaleFont(12),
  },
  headerName: {
    flex: 2,
    color: Colors.surface,
    fontWeight: 'bold',
    fontSize: scaleFont(12),
  },
  headerType: {
    flex: 1.5,
    color: Colors.surface,
    fontWeight: 'bold',
    fontSize: scaleFont(12),
  },
  headerAmount: {
    flex: 1.5,
    color: Colors.surface,
    fontWeight: 'bold',
    textAlign: 'right',
    fontSize: scaleFont(12),
  },
  headerDate: {
    flex: 1.5,
    color: Colors.surface,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: scaleFont(12),
  },
  transactionRow: {
    flexDirection: 'row',
    paddingVertical: getResponsivePadding(10),
    paddingHorizontal: getResponsivePadding(8),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
    minHeight: getTableCellHeight(),
  },
  transactionNumber: {
    flex: 0.5,
    textAlign: 'center',
    fontSize: scaleFont(12),
    color: Colors.textSecondary,
  },
  transactionName: {
    flex: 2,
    fontSize: scaleFont(12),
    color: Colors.text,
    fontWeight: '500',
  },
  transactionType: {
    flex: 1.5,
    fontSize: scaleFont(12),
    color: Colors.textSecondary,
  },
  transactionAmount: {
    flex: 1.5,
    textAlign: 'right',
    fontSize: scaleFont(12),
    color: Colors.primary,
    fontWeight: '600',
  },
  transactionDate: {
    flex: 1.5,
    textAlign: 'center',
    fontSize: scaleFont(12),
    color: Colors.textSecondary,
  },
});

export default ReportsScreen;
