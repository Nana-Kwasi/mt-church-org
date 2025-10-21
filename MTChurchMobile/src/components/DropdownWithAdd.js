import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { Colors } from '../constants/colors';

const DropdownWithAdd = ({ 
  options, 
  value, 
  onValueChange, 
  onAddOption,
  placeholder = "Select an option",
  style,
  disabled = false,
  label = "",
  category = ""
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOption, setNewOption] = useState('');

  const handleSelect = (option) => {
    onValueChange(option);
    setIsVisible(false);
  };

  const handleAddNewOption = () => {
    if (!newOption.trim()) {
      Alert.alert('Error', 'Please enter a valid option');
      return;
    }
    
    onAddOption(category, newOption.trim());
    setNewOption('');
    setShowAddForm(false);
    setIsVisible(false);
  };

  const selectedOption = options.find(option => option.value === value);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={[
            styles.dropdown,
            disabled && styles.disabled
          ]}
          onPress={() => !disabled && setIsVisible(true)}
          disabled={disabled}
        >
          <Text style={[
            styles.dropdownText,
            !selectedOption && styles.placeholderText,
            disabled && styles.disabledText
          ]}>
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
          <Text style={[styles.arrow, disabled && styles.disabledText]}>▼</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
          disabled={disabled}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.value === value && styles.selectedOption
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text style={[
                    styles.optionText,
                    item.value === value && styles.selectedOptionText
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.optionsList}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showAddForm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddForm(false)}
      >
        <View style={styles.addModalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Add New {label}</Text>
              <TouchableOpacity onPress={() => setShowAddForm(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.addForm}>
              <TextInput
                style={styles.addInput}
                value={newOption}
                onChangeText={setNewOption}
                placeholder={`Enter new ${label.toLowerCase()}`}
                placeholderTextColor={Colors.textSecondary}
                autoFocus
              />
              
              <View style={styles.addButtons}>
                <TouchableOpacity
                  style={[styles.addButton, styles.cancelButton]}
                  onPress={() => setShowAddForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.addButton, styles.confirmButton]}
                  onPress={handleAddNewOption}
                >
                  <Text style={styles.confirmButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabled: {
    backgroundColor: Colors.background,
    opacity: 0.6,
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  disabledText: {
    color: Colors.textSecondary,
  },
  arrow: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addButtonText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    width: '100%',
    maxHeight: '70%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedOption: {
    backgroundColor: Colors.primary + '20',
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  addModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  addModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  addModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  addModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  addForm: {
    padding: 16,
  },
  addInput: {
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
  addButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: Colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    flex: 1,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DropdownWithAdd;
