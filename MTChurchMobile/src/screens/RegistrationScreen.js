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
  Image,
  Platform,
} from 'react-native';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import DropdownWithAdd from '../components/DropdownWithAdd';
import DatePicker from '../components/DatePicker';
import { Colors } from '../constants/colors';
import { 
  TITLES, 
  EMPLOYMENT_STATUSES, 
  GHANA_REGIONS, 
  ORGANIZATIONS, 
  MEMBERSHIP_TYPES, 
  CLASS_OPTIONS 
} from '../constants/constants';

const RegistrationScreen = ({ navigation }) => {
  // Initial form data
  const initialFormData = {
    title: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    contact: '',
    dob: null,
    age: '',
    gps: '',
    maritalStatus: '',
    employmentStatus: '',
    profession: '',
    homeRegion: '',
    homeTown: '',
    membership: '',
    class: '',
    role: '',
    organisations: [],
    assignClass: '',
    assignClassLeader: '',
    assignAssistantClassLeader: '',
    profileImage: '',
    address: '',
    email: '',
    emergencyContact: '',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [childFormData, setChildFormData] = useState({
    name: '',
    dob: null,
    age: '',
    class: '',
    organisation: '',
    parentId: ''
  });

  // Dynamic options state (like web version)
  const [dynamicOptions, setDynamicOptions] = useState({
    titles: TITLES,
    employmentStatuses: EMPLOYMENT_STATUSES,
    regions: GHANA_REGIONS,
    organisations: ORGANIZATIONS,
    membershipTypes: MEMBERSHIP_TYPES,
    classOptions: CLASS_OPTIONS
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showChildModal, setShowChildModal] = useState(false);
  const [isSubmittingChild, setIsSubmittingChild] = useState(false);
  const [parentsList, setParentsList] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Class leaders and assistant leaders (from web version)
  const CLASS_LEADERS = [
    "Naomi Eshun", "De-Graft Yamoah", "Stephen Boadi",
    "Joel Yamoah", "Victoria Mensah"
  ];

  const ASSISTANT_CLASS_LEADERS = [
    "Esther Kotey", "Anabella Yamoah"
  ];

  // Role options
  const ROLES = [
    "Class Leader", "Usher", "Leader", "Organisation Executive",
    "Assistant Class Leader", "Poor Fund Steward", "Lay Movement Executive",
    "Church Member", "Care Taker", "Steward", "Chapel Steward"
  ];

  useEffect(() => {
    fetchParents();
    requestImagePermission();
    fetchDynamicOptions();
  }, []);

  const requestImagePermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload images!');
      }
    }
  };

  const fetchParents = async () => {
    try {
      const db = getFirestore();
      const querySnapshot = await getDocs(collection(db, 'Members'));
      const parents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: `${doc.data().firstName || ''} ${doc.data().lastName || ''}`.trim(),
        ...doc.data()
      }));
      setParentsList(parents);
    } catch (error) {
      console.error('Error fetching parents:', error);
    }
  };

  const fetchDynamicOptions = async () => {
    try {
      const db = getFirestore();
      const categories = [
        'titles', 'employmentStatuses', 'regions', 
        'organisations', 'membershipTypes', 'classOptions'
      ];

      for (const category of categories) {
        const querySnapshot = await getDocs(collection(db, `options_${category}`));
        const options = querySnapshot.docs.map(doc => doc.data().value);
        
        if (options.length > 0) {
          setDynamicOptions(prev => ({
            ...prev,
            [category]: [...new Set([...prev[category], ...options])]
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-calculate age when DOB changes
    if (field === 'dob') {
      const age = calculateAge(value);
      setFormData(prev => ({
        ...prev,
        dob: value,
        age: age
      }));
    }

    // Reset class leader when class changes
    if (field === 'assignClass') {
      setFormData(prev => ({
        ...prev,
        assignClass: value,
        assignClassLeader: '',
        assignAssistantClassLeader: ''
      }));
    }

    // Reset assistant class leader when class leader changes
    if (field === 'assignClassLeader') {
    setFormData(prev => ({
      ...prev,
        assignClassLeader: value,
        assignAssistantClassLeader: ''
      }));
    }
  };

  const handleChildChange = (field, value) => {
    setChildFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'dob') {
      const age = calculateAge(value);
      setChildFormData(prev => ({
        ...prev,
        dob: value,
        age: age
      }));
    }
  };

  const handleAddOption = async (category, newOption) => {
    try {
      const db = getFirestore();
      await addDoc(collection(db, `options_${category}`), {
        value: newOption,
        timestamp: serverTimestamp()
      });

      setDynamicOptions(prev => ({
        ...prev,
        [category]: [...prev[category], newOption]
      }));

      Alert.alert('Success', `New ${category} option added successfully!`);
    } catch (error) {
      console.error(`Error adding ${category} option:`, error);
      Alert.alert('Error', `Failed to add new ${category} option`);
    }
  };

  const handleImageSelect = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setSelectedImage(asset);
        setImagePreview(asset.uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const uploadImageToFirebase = async () => {
    if (!selectedImage) return null;

    try {
      const response = await fetch(selectedImage.uri);
      const blob = await response.blob();
      
      const storage = getStorage();
      const imageRef = ref(storage, `member-images/new_${Date.now()}`);
      const snapshot = await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setChildFormData({
      name: '',
      dob: null,
      age: '',
      class: '',
      organisation: '',
      parentId: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.contact) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const db = getFirestore();
      
      // Check if member with same contact already exists
      const membersQuery = query(
        collection(db, "Members"),
        where("contact", "==", formData.contact)
      );
      const querySnapshot = await getDocs(membersQuery);

      if (!querySnapshot.empty) {
        setError("A member with this contact number is already registered.");
        setLoading(false);
        return;
      }

      // Upload image if selected
      let profileImageUrl = formData.profileImage;
      if (selectedImage) {
        profileImageUrl = await uploadImageToFirebase();
      }

      const memberData = {
        ...formData,
        profileImage: profileImageUrl,
        name: `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`.trim(),
        registrationDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'Members'), memberData);
      
      setSuccess('Member registered successfully!');
      resetForm();
      
      // Refresh parents list
      fetchParents();
      
    } catch (error) {
      console.error('Error registering member:', error);
      setError('Failed to register member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChildSubmit = async () => {
    if (!childFormData.name || !childFormData.dob || !childFormData.parentId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsSubmittingChild(true);
      
      const db = getFirestore();
      const childData = {
        ...childFormData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'Children'), childData);
      
      Alert.alert('Success', 'Child registered successfully!');
      setChildFormData({
        name: '',
        dob: null,
        age: '',
        class: '',
        organisation: '',
        parentId: ''
      });
      setShowChildModal(false);
      
    } catch (error) {
      console.error('Error registering child:', error);
      Alert.alert('Error', 'Failed to register child. Please try again.');
    } finally {
      setIsSubmittingChild(false);
    }
  };

  const renderFormField = (label, field, type = 'text', options = [], required = false, category = '') => {
    if (type === 'dropdown' && options.length > 0) {
      const dropdownOptions = options.map(option => ({
        value: option,
        label: option
      }));
      
      return (
        <DropdownWithAdd
          label={label}
          options={dropdownOptions}
          value={formData[field]}
          onValueChange={(value) => handleChange(field, value)}
          onAddOption={handleAddOption}
          placeholder={`Select ${label.toLowerCase()}`}
          category={category}
        />
      );
    }

    if (type === 'date') {
      return (
        <DatePicker
          label={label}
          value={formData[field]}
          onValueChange={(value) => handleChange(field, value)}
          placeholder={`Select ${label.toLowerCase()}`}
        />
      );
    }

    if (type === 'multiselect' && options.length > 0) {
      return (
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {label} {required && <Text style={styles.required}>*</Text>}
          </Text>
          <View style={styles.checkboxContainer}>
            {options.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.checkbox,
                  formData.organisations.includes(option) && styles.checkboxSelected
                ]}
                onPress={() => {
                  const updated = formData.organisations.includes(option)
                    ? formData.organisations.filter(org => org !== option)
                    : [...formData.organisations, option];
                  handleChange('organisations', updated);
                }}
              >
                <Text style={[
                  styles.checkboxText,
                  formData.organisations.includes(option) && styles.checkboxTextSelected
                ]}>
                  {option}
        </Text>
      </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <TextInput
          style={styles.input}
          value={formData[field]}
          onChangeText={(value) => handleChange(field, value)}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={Colors.textSecondary}
          keyboardType={type === 'number' ? 'numeric' : type === 'email' ? 'email-address' : 'default'}
          multiline={field === 'address' || field === 'notes'}
          numberOfLines={field === 'address' || field === 'notes' ? 3 : 1}
        />
    </View>
  );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Member Registration</Text>
        <TouchableOpacity
          style={styles.addChildButton}
          onPress={() => setShowChildModal(true)}
        >
          <Text style={styles.addChildButtonText}>Add Children</Text>
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

      <View style={styles.form}>
        {/* Profile Image Section */}
        <View style={styles.imageSection}>
          <Text style={styles.label}>Profile Image</Text>
          <View style={styles.imageContainer}>
            {imagePreview ? (
              <Image source={{ uri: imagePreview }} style={styles.imagePreview} />
            ) : formData.profileImage ? (
              <Image source={{ uri: formData.profileImage }} style={styles.imagePreview} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>No Image</Text>
          </View>
            )}
            <TouchableOpacity style={styles.imageButton} onPress={handleImageSelect}>
              <Text style={styles.imageButtonText}>
                {imagePreview ? 'Change Image' : 'Select Image'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Personal Information */}
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        {renderFormField('Title', 'title', 'dropdown', dynamicOptions.titles, true, 'titles')}
        {renderFormField('First Name', 'firstName', 'text', [], true)}
        {renderFormField('Middle Name', 'middleName')}
        {renderFormField('Last Name', 'lastName', 'text', [], true)}
        {renderFormField('Gender', 'gender', 'dropdown', ['Male', 'Female'], true)}
        {renderFormField('Contact', 'contact', 'text', [], true)}
        {renderFormField('Date of Birth', 'dob', 'date')}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={formData.age}
            editable={false}
            placeholder="Auto-calculated from date of birth"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
        {renderFormField('Marital Status', 'maritalStatus', 'dropdown', ['Single', 'Married', 'Divorced', 'Widowed'])}
        {renderFormField('Address', 'address')}
        {renderFormField('Email', 'email', 'email')}
        {renderFormField('Emergency Contact', 'emergencyContact')}

        {/* Employment Information */}
        <Text style={styles.sectionTitle}>Employment Information</Text>
        
        {renderFormField('Employment Status', 'employmentStatus', 'dropdown', dynamicOptions.employmentStatuses, false, 'employmentStatuses')}
        {renderFormField('Profession', 'profession')}

        {/* Location Information */}
        <Text style={styles.sectionTitle}>Location Information</Text>
        
        {renderFormField('GPS Address', 'gps')}
        {renderFormField('Home Region', 'homeRegion', 'dropdown', dynamicOptions.regions, false, 'regions')}
        {renderFormField('Home Town', 'homeTown')}

        {/* Church Information */}
        <Text style={styles.sectionTitle}>Church Information</Text>
        
        {renderFormField('Membership Type', 'membership', 'dropdown', dynamicOptions.membershipTypes, false, 'membershipTypes')}
        {renderFormField('Class', 'class', 'dropdown', dynamicOptions.classOptions, false, 'classOptions')}
        {renderFormField('Role', 'role', 'dropdown', ROLES)}
        {renderFormField('Organizations', 'organisations', 'multiselect', dynamicOptions.organisations)}

        {/* Class Assignment */}
        <Text style={styles.sectionTitle}>Class Assignment</Text>
        
        {renderFormField('Assign Class', 'assignClass', 'dropdown', dynamicOptions.classOptions, false, 'classOptions')}
        
        {formData.assignClass && (
          <>
            {renderFormField('Class Leader', 'assignClassLeader', 'dropdown', CLASS_LEADERS)}
            
            {formData.assignClassLeader && (
              renderFormField('Assistant Class Leader', 'assignAssistantClassLeader', 'dropdown', ASSISTANT_CLASS_LEADERS)
            )}
          </>
        )}

        {/* Additional Information */}
        <Text style={styles.sectionTitle}>Additional Information</Text>
        
        {renderFormField('Notes', 'notes')}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Registering...' : 'Register Member'}
          </Text>
        </TouchableOpacity>
        </View>

      {/* Child Registration Modal */}
      <Modal
        visible={showChildModal}
        animationType="slide"
        onRequestClose={() => setShowChildModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Register Child</Text>
            <TouchableOpacity onPress={() => setShowChildModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
        </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
                value={childFormData.name}
                onChangeText={(value) => handleChildChange('name', value)}
                placeholder="Enter child's name"
                placeholderTextColor={Colors.textSecondary}
          />
        </View>

            <DatePicker
              label="Date of Birth *"
              value={childFormData.dob}
              onValueChange={(value) => handleChildChange('dob', value)}
              placeholder="Select date of birth"
            />

            <View style={styles.formGroup}>
              <Text style={styles.label}>Age</Text>
          <TextInput
                style={[styles.input, styles.readOnlyInput]}
                value={childFormData.age}
                editable={false}
                placeholderTextColor={Colors.textSecondary}
          />
        </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Class</Text>
              <DropdownWithAdd
                label=""
                options={['Beginners', 'Primary', 'Timothy'].map(option => ({ value: option, label: option }))}
                value={childFormData.class}
                onValueChange={(value) => handleChildChange('class', value)}
                onAddOption={() => {}}
                placeholder="Select class"
          />
        </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Organization</Text>
              <DropdownWithAdd
                label=""
                options={['MYF', 'MGF', 'Bridge', 'Junior Choir'].map(option => ({ value: option, label: option }))}
                value={childFormData.organisation}
                onValueChange={(value) => handleChildChange('organisation', value)}
                onAddOption={() => {}}
          placeholder="Select organization"
        />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Parent *</Text>
              <DropdownWithAdd
                label=""
                options={parentsList.map(parent => ({ value: parent.id, label: parent.name }))}
                value={childFormData.parentId}
                onValueChange={(value) => handleChildChange('parentId', value)}
                onAddOption={() => {}}
                placeholder="Select parent"
              />
            </View>

        <TouchableOpacity
              style={[styles.submitButton, isSubmittingChild && styles.submitButtonDisabled]}
              onPress={handleChildSubmit}
              disabled={isSubmittingChild}
            >
              <Text style={styles.submitButtonText}>
                {isSubmittingChild ? 'Registering...' : 'Register Child'}
              </Text>
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  addChildButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addChildButtonText: {
    color: Colors.surface,
    fontWeight: 'bold',
    fontSize: 14,
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
  form: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  required: {
    color: '#dc2626',
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
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  readOnlyInput: {
    backgroundColor: Colors.background,
    color: Colors.textSecondary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkbox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  checkboxTextSelected: {
    color: Colors.surface,
  },
  imageSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  imageContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  placeholderText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  imageButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  imageButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
});

export default RegistrationScreen;
