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
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import DropdownWithAdd from '../components/DropdownWithAdd';
import { Colors } from '../constants/colors';
import { USER_ROLES } from '../constants/constants';
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

const UserCard = ({ user, onEdit, onDelete, onToggleStatus }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  const [showPassword, setShowPassword] = useState(false);

  const openModal = () => {
    setIsModalVisible(true);
    setIsEditing(false);
    setEditedUser({ ...user });
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setIsEditing(false);
    setEditedUser({ ...user });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleInputChange = (field, value) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onEdit(editedUser);
    setIsEditing(false);
    closeModal();
  };

  const handleCancel = () => {
    setEditedUser({ ...user });
    setIsEditing(false);
  };

  const handleToggleUserStatus = async () => {
    try {
      const newStatus = !(user.isActive ?? true);
      onToggleStatus(user.id, newStatus);
      Alert.alert('Success', `User account ${newStatus ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error("Error toggling user status:", error);
      Alert.alert('Error', 'Failed to update user status.');
    }
  };

  return (
    <>
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={styles.userRole}>{user.role}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
          
          <View style={styles.userActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={openModal}
            >
              <Text style={styles.actionButtonText}>View</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => onDelete(user.id)}
            >
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* User Details Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>
              <TouchableOpacity
                style={styles.closeButtonContainer}
                onPress={closeModal}
              >
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {isEditing ? (
                <View style={styles.editForm}>
                  <Text style={styles.sectionTitle}>Edit User Information</Text>
                  
                  <View style={styles.formRow}>
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>First Name</Text>
                      <TextInput
                        style={styles.input}
                        value={editedUser.firstName}
                        onChangeText={(value) => handleInputChange('firstName', value)}
                        placeholder="First name"
                        placeholderTextColor={Colors.textSecondary}
                      />
                    </View>
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Last Name</Text>
                      <TextInput
                        style={styles.input}
                        value={editedUser.lastName}
                        onChangeText={(value) => handleInputChange('lastName', value)}
                        placeholder="Last name"
                        placeholderTextColor={Colors.textSecondary}
                      />
                    </View>
                  </View>

                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={editedUser.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    placeholder="Email address"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      value={editedUser.password}
                      onChangeText={(value) => handleInputChange('password', value)}
                      placeholder="Password"
                      placeholderTextColor={Colors.textSecondary}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={togglePasswordVisibility}
                    >
                      <Text style={styles.passwordToggleText}>
                        {showPassword ? '🙈' : '👁️'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.label}>Contact</Text>
                  <TextInput
                    style={styles.input}
                    value={editedUser.contact}
                    onChangeText={(value) => handleInputChange('contact', value)}
                    placeholder="Contact number"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="phone-pad"
                  />

                  <Text style={styles.label}>Gender</Text>
                  <TextInput
                    style={styles.input}
                    value={editedUser.gender}
                    onChangeText={(value) => handleInputChange('gender', value)}
                    placeholder="Gender"
                    placeholderTextColor={Colors.textSecondary}
                  />

                  <Text style={styles.label}>Role</Text>
                  <TextInput
                    style={styles.input}
                    value={editedUser.role}
                    onChangeText={(value) => handleInputChange('role', value)}
                    placeholder="Role"
                    placeholderTextColor={Colors.textSecondary}
                  />

                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={[styles.editButton, styles.saveButton]}
                      onPress={handleSave}
                    >
                      <Text style={styles.editButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.editButton, styles.cancelButton]}
                      onPress={handleCancel}
                    >
                      <Text style={styles.editButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.userInfoGrid}>
                  <Text style={styles.sectionTitle}>User Information</Text>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name:</Text>
                    <Text style={styles.infoValue}>{user.firstName} {user.lastName}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{user.email}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Contact:</Text>
                    <Text style={styles.infoValue}>{user.contact || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Gender:</Text>
                    <Text style={styles.infoValue}>{user.gender || 'N/A'}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Role:</Text>
                    <Text style={styles.infoValue}>{user.role}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Registered:</Text>
                    <Text style={styles.infoValue}>
                      {user.registeredAt ? new Date(user.registeredAt).toLocaleDateString() : 'Unknown'}
                    </Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Account Status:</Text>
                    <TouchableOpacity
                      style={[
                        styles.statusToggle,
                        { backgroundColor: user.isActive ?? true ? '#4CAF50' : '#f44336' }
                      ]}
                      onPress={handleToggleUserStatus}
                    >
                      <Text style={styles.statusToggleText}>
                        {user.isActive ?? true ? 'Enabled' : 'Disabled'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalActionButton, styles.editActionButton]}
                      onPress={handleEdit}
                    >
                      <Text style={styles.modalActionButtonText}>Edit User</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.modalActionButton, styles.deleteActionButton]}
                      onPress={() => {
                        closeModal();
                        onDelete(user.id);
                      }}
                    >
                      <Text style={styles.modalActionButtonText}>Delete User</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const UsersScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // User creation states
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState('');
  const [createUserSuccess, setCreateUserSuccess] = useState('');
  
  // Request management states
  const [requests, setRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [updatingRequestId, setUpdatingRequestId] = useState(null);
  
  // User creation form data
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

  const MEMBERSHIP_TYPES = ["Catechumens", "Full Member"];
  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    fetchUsers();
    fetchRequests();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users from database...');
      const usersCollection = collection(db, "Users");
      const usersSnapshot = await getDocs(usersCollection);
      console.log('Users snapshot:', usersSnapshot.docs.length, 'documents');
      
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      console.log('Users list:', usersList);
      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    try {
      const userDocRef = doc(db, "Users", updatedUser.id);
      
      const updateData = { ...updatedUser };
      delete updateData.id;

      await updateDoc(userDocRef, updateData);
      
      setUsers(prev => 
        prev.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        )
      );
      
      Alert.alert('Success', 'User updated successfully!');
    } catch (error) {
      console.error("Error updating user:", error);
      Alert.alert('Error', 'Failed to update user.');
    }
  };

  const handleDeleteUser = async (userId) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userDocRef = doc(db, "Users", userId);
              await deleteDoc(userDocRef);
              
              setUsers(prev => prev.filter(user => user.id !== userId));
              setFilteredUsers(prev => prev.filter(user => user.id !== userId));
              
              Alert.alert('Success', 'User deleted successfully!');
            } catch (error) {
              console.error("Error deleting user:", error);
              Alert.alert('Error', 'Failed to delete user.');
            }
          }
        }
      ]
    );
  };

  const handleToggleUserStatus = async (userId, newStatus) => {
    try {
      const userDocRef = doc(db, "Users", userId);
      await updateDoc(userDocRef, {
        isActive: newStatus
      });
      
      setUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, isActive: newStatus } : user
        )
      );
      
      setFilteredUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, isActive: newStatus } : user
        )
      );
    } catch (error) {
      console.error("Error toggling user status:", error);
      throw error;
    }
  };

  // User Creation Functions
  const handleUserDataChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateUser = async () => {
    if (!userData.firstName || !userData.lastName || !userData.gender || 
        !userData.contact || !userData.email || !userData.password || 
        !userData.membership || !userData.role) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsCreatingUser(true);
    setCreateUserError('');
    setCreateUserSuccess('');

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

      setCreateUserSuccess('User created successfully!');
      setIsFormVisible(false);
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      setCreateUserError(error.message || 'Failed to create user. Please try again.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Request Management Functions
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
      setCreateUserError('Failed to fetch requests');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#ff9800';
      case 'RESOLVED': return '#4caf50';
      case 'REJECTED': return '#f44336';
      default: return '#9e9e9e';
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>User Management</Text>
            <Text style={styles.subtitle}>Manage users, create accounts & handle requests</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchUsers}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
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

      {/* Error/Success Messages */}
      {createUserError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{createUserError}</Text>
        </View>
      ) : null}

      {createUserSuccess ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{createUserSuccess}</Text>
        </View>
      ) : null}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search users..."
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {users.filter(user => user.isActive ?? true).length}
          </Text>
          <Text style={styles.statLabel}>Active Users</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {users.filter(user => !(user.isActive ?? true)).length}
          </Text>
          <Text style={styles.statLabel}>Disabled Users</Text>
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserCard 
            user={item} 
            onEdit={handleUpdateUser}
            onDelete={handleDeleteUser}
            onToggleStatus={handleToggleUserStatus}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No users found matching your search' : 'No users found. Add your first user!'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.usersList}
        showsVerticalScrollIndicator={false}
      />

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
                  onChangeText={(value) => handleUserDataChange('firstName', value)}
                  placeholder="Enter first name"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={userData.lastName}
                  onChangeText={(value) => handleUserDataChange('lastName', value)}
                  placeholder="Enter last name"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            <DropdownWithAdd
              label="Gender *"
              options={['Male', 'Female'].map(option => ({ value: option, label: option }))}
              value={userData.gender}
              onValueChange={(value) => handleUserDataChange('gender', value)}
              onAddOption={() => {}}
              placeholder="Select gender"
            />

            <Text style={styles.label}>Contact *</Text>
            <TextInput
              style={styles.input}
              value={userData.contact}
              onChangeText={(value) => handleUserDataChange('contact', value)}
              placeholder="Enter contact number"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={userData.email}
              onChangeText={(value) => handleUserDataChange('email', value)}
              placeholder="Enter email address"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              value={userData.password}
              onChangeText={(value) => handleUserDataChange('password', value)}
              placeholder="Enter password"
              placeholderTextColor={Colors.textSecondary}
              secureTextEntry
            />

            <DropdownWithAdd
              label="Membership Type *"
              options={MEMBERSHIP_TYPES.map(option => ({ value: option, label: option }))}
              value={userData.membership}
              onValueChange={(value) => handleUserDataChange('membership', value)}
              onAddOption={() => {}}
              placeholder="Select membership type"
            />

            <DropdownWithAdd
              label="Role *"
              options={Object.values(USER_ROLES).map(role => ({ value: role, label: role }))}
              value={userData.role}
              onValueChange={(value) => handleUserDataChange('role', value)}
              onAddOption={() => {}}
              placeholder="Select role"
            />

            <TouchableOpacity
              style={[styles.submitButton, isCreatingUser && styles.submitButtonDisabled]}
              onPress={handleCreateUser}
              disabled={isCreatingUser}
            >
              <Text style={styles.submitButtonText}>
                {isCreatingUser ? 'Creating User...' : 'Create User'}
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
  header: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: 'bold',
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
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  usersList: {
    padding: 16,
    paddingBottom: 32,
  },
  userCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  userRole: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  expandButton: {
    padding: 6,
  },
  expandButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  userDetails: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  editForm: {
    gap: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroup: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4caf50',
  },
  cancelButton: {
    backgroundColor: Colors.textSecondary,
  },
  editButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: 'bold',
  },
  userInfoGrid: {
    gap: 8,
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
  statusToggle: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusToggleText: {
    color: Colors.surface,
    fontSize: 12,
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
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    width: '95%',
    height: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  closeButtonContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    fontSize: 28,
    color: '#000',
    fontWeight: 'bold',
    lineHeight: 28,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  passwordToggleText: {
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 10,
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editActionButton: {
    backgroundColor: Colors.primary,
  },
  deleteActionButton: {
    backgroundColor: '#dc3545',
  },
  modalActionButtonText: {
    color: Colors.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // New styles for merged functionality
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
  resolveButton: {
    backgroundColor: '#4caf50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
});

export default UsersScreen;