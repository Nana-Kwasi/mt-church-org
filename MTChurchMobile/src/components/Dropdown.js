import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Colors } from '../constants/colors';

const Dropdown = ({ 
  options, 
  value, 
  onValueChange, 
  placeholder = "Select an option",
  style,
  disabled = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleSelect = (option) => {
    onValueChange(option);
    setIsVisible(false);
  };

  const selectedOption = options.find(option => option.value === value);

  return (
    <View style={[styles.container, style]}>
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
              <Text style={styles.modalTitle}>Select Option</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  dropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
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
});

export default Dropdown;
