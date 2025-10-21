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
} from 'react-native';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import DropdownWithAdd from '../components/DropdownWithAdd';
import { Colors } from '../constants/colors';
import { USER_ROLES } from '../constants/constants';

const GroupsScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [requests, setRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [updatingRequestId, setUpdatingRequestId] = useState(null);

  const MEMBERSHIP_TYPES = ["Catechumens", "Full Member"];

  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    contact: '',
    email: '',
    password: '',
    membership: '',
    role: '',
  });

  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const requestsRef = collection(db, 'Request');
      const q = query(requestsRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const requestsData = [];
      querySnapshot.forEach((doc) => {
        requestsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to fetch requests');
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    setUpdatingRequestId(requestId);
    try {
      const requestRef = doc(db, 'Request', requestId);
      await updateDoc(requestRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      setRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: newStatus, updatedAt: new Date() }
            : req
        )
      );

      Alert.alert('Success', `Request ${newStatus.toLowerCase()} successfully!`);
    } catch (error) {
      console.error('Error updating request:', error);
      Alert.alert('Error', 'Failed to update request status');
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const openRequestsModal = () => {
    setShowRequestsModal(true);
    fetchRequests();
  };

  const handleChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!userData.firstName || !userData.lastName || !userData.gender || 
        !userData.contact || !userData.email || !userData.password || 
        !userData.membership || !userData.role) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );

      // Prepare user data for Firestore
      const userSubmissionData = {
        ...userData,
        registeredAt: new Date().toISOString(),
        uid: userCredential.user.uid,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Prepare authentication data for separate collection
      const authSubmissionData = {
        email: userData.email,
        role: userData.role,
        uid: userCredential.user.uid,
        createdAt: serverTimestamp()
      };

      // Submit user data to Firestore
      await addDoc(collection(db, "Users"), userSubmissionData);
      await addDoc(collection(db, "UserAccess"), authSubmissionData);

      // Reset form
      setUserData({
        firstName: '',
        lastName: '',
        gender: '',
        contact: '',
        email: '',
        password: '',
        membership: '',
        role: '',
      });

      setSuccess('User created successfully!');
      setIsFormVisible(false);
    } catch (error) {
      console.error("Error creating user:", error);
      setError(error.message || 'Failed to create user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderRequestItem = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.requestTitle}>{item.title || 'No Title'}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.requestDescription}>
        {item.description || 'No description available'}
      </Text>
      
      <Text style={styles.requestDate}>
        {item.timestamp?.toDate?.()?.toLocaleDateString() || 'Unknown Date'}
      </Text>
      
      <View style={styles.requestActions}>
        {item.status !== 'RESOLVED' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.resolveButton]}
            onPress={() => updateRequestStatus(item.id, 'RESOLVED')}
            disabled={updatingRequestId === item.id}
          >
            <Text style={styles.actionButtonText}>
              {updatingRequestId === item.id ? '...' : 'Resolve'}
            </Text>
          </TouchableOpacity>
        )}
        {item.status !== 'REJECTED' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => updateRequestStatus(item.id, 'REJECTED')}
            disabled={updatingRequestId === item.id}
          >
            <Text style={styles.actionButtonText}>
              {updatingRequestId === item.id ? '...' : 'Reject'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#ff9800';
      case 'RESOLVED': return '#4caf50';
      case 'REJECTED': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
      <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>Manage users and requests</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setIsFormVisible(!isFormVisible)}
        >
          <Text style={styles.buttonText}>Create User</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={openRequestsModal}
        >
          <Text style={styles.buttonText}>View Requests</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{success}</Text>
        </View>
      ) : null}

      {/* Create User Form */}
      {isFormVisible && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Create New User</Text>
          
          <View style={styles.form}>
            <View style={styles.formRow}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={userData.firstName}
                  onChangeText={(value) => handleChange('firstName', value)}
                  placeholder="Enter first name"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={userData.lastName}
                  onChangeText={(value) => handleChange('lastName', value)}
                  placeholder="Enter last name"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            <DropdownWithAdd
              label="Gender *"
              options={['Male', 'Female'].map(option => ({ value: option, label: option }))}
              value={userData.gender}
              onValueChange={(value) => handleChange('gender', value)}
              onAddOption={() => {}}
              placeholder="Select gender"
            />

            <Text style={styles.label}>Contact *</Text>
            <TextInput
              style={styles.input}
              value={userData.contact}
              onChangeText={(value) => handleChange('contact', value)}
              placeholder="Enter contact number"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={userData.email}
              onChangeText={(value) => handleChange('email', value)}
              placeholder="Enter email address"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              value={userData.password}
              onChangeText={(value) => handleChange('password', value)}
              placeholder="Enter password"
              placeholderTextColor={Colors.textSecondary}
              secureTextEntry
            />

            <DropdownWithAdd
              label="Membership Type *"
              options={MEMBERSHIP_TYPES.map(option => ({ value: option, label: option }))}
              value={userData.membership}
              onValueChange={(value) => handleChange('membership', value)}
              onAddOption={() => {}}
              placeholder="Select membership type"
            />

            <DropdownWithAdd
              label="Role *"
              options={Object.values(USER_ROLES).map(role => ({ value: role, label: role }))}
              value={userData.role}
              onValueChange={(value) => handleChange('role', value)}
              onAddOption={() => {}}
              placeholder="Select role"
            />

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Creating User...' : 'Create User'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Requests Modal */}
      <Modal
        visible={showRequestsModal}
        animationType="slide"
        onRequestClose={() => setShowRequestsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Requests</Text>
            <TouchableOpacity onPress={() => setShowRequestsModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {isLoadingRequests ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading requests...</Text>
              </View>
            ) : (
              <FlatList
                data={requests}
                keyExtractor={(item) => item.id}
                renderItem={renderRequestItem}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No requests found</Text>
                  </View>
                }
                contentContainerStyle={styles.requestsList}
              />
            )}
          </View>
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
  header: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  primaryButton: {
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
    flex: 1,
    backgroundColor: Colors.textSecondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    margin: 16,
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
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '500',
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
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroup: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  requestsList: {
    paddingBottom: 16,
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  requestDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  resolveButton: {
    backgroundColor: '#4caf50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});

export default GroupsScreen;