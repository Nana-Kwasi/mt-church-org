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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, getDocs, addDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import DatePicker from '../components/DatePicker';
import DropdownWithAdd from '../components/DropdownWithAdd';
import { Colors } from '../constants/colors';
import { COLLECTION_TYPES, CURRENCIES } from '../constants/constants';
import {
  scaleWidth,
  scaleHeight,
  scaleFont,
  getResponsivePadding,
  getResponsiveMargin,
  getModalWidth,
  getModalHeight,
  getButtonHeight,
  getInputHeight,
  SCREEN_DIMENSIONS,
} from '../utils/responsive';

const { width } = Dimensions.get('window');

const DonationScreen = ({ navigation }) => {
  // State for members list
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // State for payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('GHS');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDate, setPaymentDate] = useState(null);
  const [comment, setComment] = useState('');

  // State for reports
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [currencyTotals, setCurrencyTotals] = useState({});

  const db = getFirestore();

  const PAYMENT_TYPES = [
    'Tithe', 'Welfare', 'Funeral Contributions', 'Special Offerings',
    'Building Fund', 'Mission Fund', 'Sunday Collection'
  ];

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "Members"));
      const membersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMembers(membersData);
      setFilteredMembers(membersData);
    } catch (error) {
      console.error("Error fetching members:", error);
      setError("Error fetching members. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = members.filter(
      (member) =>
        member.firstName?.toLowerCase().includes(query.toLowerCase()) ||
        member.lastName?.toLowerCase().includes(query.toLowerCase()) ||
        member.contact?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredMembers(filtered);
  };

  const handleMemberPress = (member) => {
    setSelectedMember(member);
    setShowPayModal(true);
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
        memberId: selectedMember.id,
        memberName: getFullName(selectedMember),
        paymentType: selectedOption,
        currency: selectedCurrency,
        amount: parseFloat(amount),
        timestamp: paymentTimestamp,
        comment: selectedOption === "Funeral Contributions" ? comment : ""
      };

      const moneyCollectionsRef = collection(db, "Money Collections");
      const docRef = await addDoc(moneyCollectionsRef, paymentData);
      console.log("Payment saved with ID:", docRef.id);

      if (selectedMember.contact) {
        const message = `Payment Confirmation from Mt Zion Methodist Church\nType: ${selectedOption}\nAmount: ${selectedCurrency} ${amount}\nDate: ${paymentTimestamp.toLocaleDateString()}\nThank you for your payment.`;
        
        try {
          const smsResult = await sendPaymentSMS(selectedMember.contact, message);
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
      setSelectedMember(null);
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

      Alert.alert('Success', `Report generated successfully! Found ${transactions.length} transactions.`);

    } catch (error) {
      console.error("Error generating report:", error);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setIsProcessing(false);
    }
  };

  const getFullName = (member) => {
    if (!member) return '';
    return `${member.firstName || ''} ${member.lastName || ''}`.trim();
  };

  const renderMemberItem = ({ item }) => (
    <TouchableOpacity
      style={styles.memberCard}
      onPress={() => handleMemberPress(item)}
    >
      <View style={styles.memberHeader}>
        <View style={styles.memberInfo}>
          {item.profileImage ? (
            <Image source={{ uri: item.profileImage }} style={styles.memberImage} />
          ) : (
            <View style={styles.memberImagePlaceholder}>
              <Text style={styles.memberInitials}>
                {item.firstName ? item.firstName.charAt(0).toUpperCase() : '?'}
                {item.lastName ? item.lastName.charAt(0).toUpperCase() : ''}
              </Text>
            </View>
          )}
          <View style={styles.memberDetails}>
            <Text style={styles.memberName}>{getFullName(item)}</Text>
            <Text style={styles.memberContact}>{item.contact || 'No contact'}</Text>
            <Text style={styles.memberMembership}>{item.membership || 'No membership'}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderTransactionItem = ({ item }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionType}>{item.paymentType}</Text>
        <Text style={styles.transactionAmount}>
          {item.currency} {item.amount.toFixed(2)}
        </Text>
      </View>
      <Text style={styles.transactionMember}>{item.memberName}</Text>
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
        <Text style={styles.loadingText}>Loading members...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchMembers}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Collections</Text>
        <Text style={styles.subtitle}>Record payments for members</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={styles.circularButton}
            onPress={() => setShowReportsModal(true)}
          >
            <Ionicons name="bar-chart-outline" size={32} color="#8B5CF6" />
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>Reports</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search members..."
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      {/* Members List */}
      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id}
        renderItem={renderMemberItem}
        contentContainerStyle={styles.membersList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No members found matching your search' : 'No members found'}
            </Text>
          </View>
        }
      />

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
            {selectedMember && (
              <View style={styles.selectedMemberInfo}>
                <Text style={styles.selectedMemberName}>{getFullName(selectedMember)}</Text>
                <Text style={styles.selectedMemberContact}>{selectedMember.contact || 'No contact'}</Text>
              </View>
            )}

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

      {/* Reports Modal */}
      <Modal
        visible={showReportsModal}
        animationType="slide"
        onRequestClose={() => setShowReportsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Generate Report</Text>
            <TouchableOpacity onPress={() => setShowReportsModal(false)}>
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
    </View>
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
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
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
    justifyContent: 'center',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  membersList: {
    padding: 16,
  },
  memberCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  memberImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  memberContact: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  memberMembership: {
    fontSize: 12,
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
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Add margin to prevent overlap with close button
  },
  closeButton: {
    fontSize: 28,
    color: '#000',
    fontWeight: 'bold',
    width: 40,
    height: 40,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: 'transparent',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  selectedMemberInfo: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedMemberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  selectedMemberContact: {
    fontSize: 14,
    color: Colors.textSecondary,
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
  transactionMember: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
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
});

export default DonationScreen;