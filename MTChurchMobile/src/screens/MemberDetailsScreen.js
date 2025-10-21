import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { getFirestore, doc, getDoc, addDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import DatePicker from '../components/DatePicker';
import DropdownWithAdd from '../components/DropdownWithAdd';
import { Colors } from '../constants/colors';

const MemberDetailsScreen = ({ route, navigation }) => {
  const { memberId } = route.params;
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('GHS');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [comment, setComment] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [currencyTotals, setCurrencyTotals] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [selectedPaymentType, setSelectedPaymentType] = useState('all');
  const [paymentDate, setPaymentDate] = useState(null);

  const db = getFirestore();

  const PAYMENT_TYPES = [
    'Tithe', 'Welfare', 'Funeral Contributions', 'Special Offerings',
    'Building Fund', 'Mission Fund', 'Sunday Collection'
  ];

  const CURRENCIES = [
    { code: 'GHS', symbol: 'GH₵' },
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' }
  ];

  useEffect(() => {
    fetchMemberDetails();
  }, [memberId]);

  const fetchMemberDetails = async () => {
    try {
      const docRef = doc(db, "Members", memberId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setMember(docSnap.data());
      } else {
        setError("Member not found.");
      }
    } catch (error) {
      console.error("Error fetching member details:", error);
      setError("Error fetching member details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('233') ? cleaned : `233${cleaned.startsWith('0') ? cleaned.slice(1) : cleaned}`;
  };

  const sendPaymentSMS = async (phoneNumber, message) => {
    try {
      const hubtelEndpoint = 'https://smsc.hubtel.com/v1/messages/send';
      const clientId = 'vxojxzbs';
      const clientSecret = 'uznaitfd';
      
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      
      const params = new URLSearchParams({
        clientid: clientId,
        clientsecret: clientSecret,
        from: 'MtZionMeth',
        to: formattedPhone,
        content: message
      });

      const url = `${hubtelEndpoint}?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      const responseData = await response.json();
      
      if (responseData.status === 0) {
        return responseData;
      } else {
        throw new Error(responseData.statusDescription || 'SMS sending failed');
      }
    } catch (error) {
      console.error("SMS Sending Error:", error);
      throw error;
    }
  };

  const handlePay = async () => {
    if (!selectedOption || !selectedCurrency || !amount) {
      Alert.alert('Error', 'Please select a payment type, currency, and enter an amount.');
      return;
    }

    setIsProcessing(true);

    try {
      const paymentTimestamp = paymentDate || new Date();
      
      const paymentData = {
        memberId: memberId,
        memberName: getFullName(),
        paymentType: selectedOption,
        currency: selectedCurrency,
        amount: parseFloat(amount),
        timestamp: paymentTimestamp,
        comment: selectedOption === "Funeral Contributions" ? comment : ""
      };

      const moneyCollectionsRef = collection(db, "Money Collections");
      const docRef = await addDoc(moneyCollectionsRef, paymentData);
      console.log("Payment saved with ID:", docRef.id);

      if (member.contact) {
        const message = `Payment Confirmation from Mt Zion Methodist Church\nType: ${selectedOption}\nAmount: ${selectedCurrency} ${amount}\nDate: ${paymentTimestamp.toLocaleDateString()}\nThank you for your payment.`;
        
        try {
          const smsResult = await sendPaymentSMS(member.contact, message);
          if (smsResult) {
            Alert.alert('Success', 'Payment recorded and SMS confirmation sent successfully!');
          }
        } catch (smsError) {
          console.error("SMS Error:", smsError);
          Alert.alert('Success', `Payment successful! However, SMS notification failed: ${smsError.message}`);
        }
      } else {
        Alert.alert('Success', 'Payment successful! (No SMS sent - no contact number found)');
      }

      setShowPayModal(false);
      setSelectedOption('');
      setSelectedCurrency('GHS');
      setAmount('');
      setComment('');
      setPaymentDate(null);

    } catch (error) {
      console.error("Payment Processing Error:", error);
      Alert.alert('Error', 'Error processing payment: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please select both start and end dates');
      return;
    }

    setIsProcessing(true);
    try {
      const moneyCollectionsRef = collection(db, "Money Collections");
      const snapshot = await getDocs(moneyCollectionsRef);

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const transactions = [];
      const currencyGroups = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate?.() || new Date(data.timestamp);

        if (
          data.memberId === memberId &&
          timestamp >= start &&
          timestamp <= end &&
          (selectedPaymentType === "all" || data.paymentType === selectedPaymentType)
        ) {
          const transaction = {
            id: doc.id,
            amount: parseFloat(data.amount) || 0,
            currency: data.currency || "Unknown",
            memberId: data.memberId,
            memberName: data.memberName || "Unknown",
            paymentType: data.paymentType || "Unknown",
            timestamp: timestamp,
            formattedDate: timestamp.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            comment: data.comment || "",
          };

          transactions.push(transaction);

          if (!currencyGroups[transaction.currency]) {
            currencyGroups[transaction.currency] = 0;
          }
          currencyGroups[transaction.currency] += transaction.amount;
        }
      });

      setTransactions(transactions);
      setCurrencyTotals(currencyGroups);
      setFilteredLogs(transactions);

      Alert.alert('Success', `Report generated successfully! Found ${transactions.length} transactions.`);

    } catch (error) {
      console.error("Error generating report:", error);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setIsProcessing(false);
    }
  };

  const getFullName = () => {
    if (!member) return '';
    return `${member.firstName || ''} ${member.lastName || ''}`.trim();
  };

  const renderTransactionItem = ({ item }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionType}>{item.paymentType}</Text>
        <Text style={styles.transactionAmount}>
          {item.currency} {item.amount.toFixed(2)}
        </Text>
      </View>
      <Text style={styles.transactionDate}>{item.formattedDate}</Text>
      {item.comment && (
        <Text style={styles.transactionComment}>{item.comment}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading member details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{getFullName()} Dashboard</Text>
      </View>

      {/* Profile Image Section */}
      <View style={styles.profileSection}>
        {member?.profileImage ? (
          <Image 
            source={{ uri: member.profileImage }} 
            style={styles.profileImage}
          />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Text style={styles.profileInitials}>
              {member?.firstName ? member.firstName.charAt(0).toUpperCase() : '?'}
              {member?.lastName ? member.lastName.charAt(0).toUpperCase() : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowPayModal(true)}
        >
          <Text style={styles.actionButtonText}>Record Payment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => setShowReportModal(true)}
        >
          <Text style={styles.actionButtonText}>Generate Report</Text>
        </TouchableOpacity>
      </View>

      {/* Member Information */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Member Information</Text>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contact:</Text>
            <Text style={styles.infoValue}>{member.contact || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{member.email || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender:</Text>
            <Text style={styles.infoValue}>{member.gender || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Age:</Text>
            <Text style={styles.infoValue}>{member.age || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Membership:</Text>
            <Text style={styles.infoValue}>{member.membership || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Class:</Text>
            <Text style={styles.infoValue}>{member.class || 'Not provided'}</Text>
          </View>
        </View>
      </View>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <FlatList
            data={transactions.slice(0, 5)}
            keyExtractor={(item) => item.id}
            renderItem={renderTransactionItem}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Payment Modal */}
      <Modal
        visible={showPayModal}
        animationType="slide"
        onRequestClose={() => setShowPayModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <TouchableOpacity onPress={() => setShowPayModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <DropdownWithAdd
              label="Payment Type *"
              options={PAYMENT_TYPES.map(type => ({ value: type, label: type }))}
              value={selectedOption}
              onValueChange={setSelectedOption}
              onAddOption={() => {}}
              placeholder="Select payment type"
            />

            <DropdownWithAdd
              label="Currency *"
              options={CURRENCIES.map(curr => ({ value: curr.code, label: `${curr.code} (${curr.symbol})` }))}
              value={selectedCurrency}
              onValueChange={setSelectedCurrency}
              onAddOption={() => {}}
              placeholder="Select currency"
            />

            <Text style={styles.label}>Amount *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
            />

            <DatePicker
              label="Payment Date"
              value={paymentDate}
              onValueChange={setPaymentDate}
              placeholder="Select payment date (optional)"
            />

            {selectedOption === "Funeral Contributions" && (
              <>
                <Text style={styles.label}>Comment</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Enter comment"
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.submitButton, isProcessing && styles.submitButtonDisabled]}
              onPress={handlePay}
              disabled={isProcessing}
            >
              <Text style={styles.submitButtonText}>
                {isProcessing ? 'Processing...' : 'Record Payment'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Generate Report</Text>
            <TouchableOpacity onPress={() => setShowReportModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <DatePicker
              label="Start Date *"
              value={startDate}
              onValueChange={setStartDate}
              placeholder="Select start date"
            />

            <DatePicker
              label="End Date *"
              value={endDate}
              onValueChange={setEndDate}
              placeholder="Select end date"
            />

            <DropdownWithAdd
              label="Payment Type"
              options={['all', ...PAYMENT_TYPES].map(type => ({ 
                value: type, 
                label: type === 'all' ? 'All Payment Types' : type 
              }))}
              value={selectedPaymentType}
              onValueChange={setSelectedPaymentType}
              onAddOption={() => {}}
              placeholder="Select payment type"
            />

            <TouchableOpacity
              style={[styles.submitButton, isProcessing && styles.submitButtonDisabled]}
              onPress={generateReport}
              disabled={isProcessing}
            >
              <Text style={styles.submitButtonText}>
                {isProcessing ? 'Generating...' : 'Generate Report'}
              </Text>
            </TouchableOpacity>

            {transactions.length > 0 && (
              <View style={styles.reportResults}>
                <Text style={styles.reportTitle}>Report Results</Text>
                
                {Object.entries(currencyTotals).map(([currency, total]) => (
                  <View key={currency} style={styles.currencyTotal}>
                    <Text style={styles.currencyLabel}>{currency}:</Text>
                    <Text style={styles.currencyAmount}>{total.toFixed(2)}</Text>
                  </View>
                ))}

                <FlatList
                  data={transactions}
                  keyExtractor={(item) => item.id}
                  renderItem={renderTransactionItem}
                  style={styles.transactionsList}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
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
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  profilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  profileInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  secondaryButton: {
    backgroundColor: Colors.textSecondary,
  },
  actionButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
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
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  infoGrid: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 2,
    textAlign: 'right',
  },
  transactionsSection: {
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
  transactionCard: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  transactionComment: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
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
  reportResults: {
    marginTop: 20,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  currencyTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  currencyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  transactionsList: {
    maxHeight: 300,
  },
});

export default MemberDetailsScreen;