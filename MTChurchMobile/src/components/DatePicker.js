import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../constants/colors';

const DatePicker = ({ 
  value, 
  onValueChange, 
  placeholder = "Select date",
  label = "",
  style,
  disabled = false 
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      onValueChange(selectedDate);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.dateButton,
          disabled && styles.disabled
        ]}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.dateText,
          !value && styles.placeholderText,
          disabled && styles.disabledText
        ]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Text style={[styles.calendarIcon, disabled && styles.disabledText]}>📅</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
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
  dateButton: {
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
  dateText: {
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
  calendarIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
});

export default DatePicker;
