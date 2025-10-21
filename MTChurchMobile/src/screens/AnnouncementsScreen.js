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
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Colors } from '../constants/colors';

const AnnouncementsScreen = ({ navigation }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium',
    targetAudience: 'all'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      const announcementsRef = collection(db, 'Announcements');
      const querySnapshot = await getDocs(announcementsRef);
      
      const announcementsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by priority and date
      announcementsData.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 2;
        const bPriority = priorityOrder[b.priority] || 2;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return new Date(b.createdAt?.toDate?.() || b.createdAt) - 
               new Date(a.createdAt?.toDate?.() || a.createdAt);
      });
      
      setAnnouncements(announcementsData);
      setError('');
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnouncement = () => {
    setNewAnnouncement({
      title: '',
      content: '',
      priority: 'medium',
      targetAudience: 'all'
    });
    setIsModalVisible(true);
  };

  const handleSubmitAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const db = getFirestore();
      
      await addDoc(collection(db, 'Announcements'), {
        title: newAnnouncement.title.trim(),
        content: newAnnouncement.content.trim(),
        priority: newAnnouncement.priority,
        targetAudience: newAnnouncement.targetAudience,
        createdAt: serverTimestamp(),
        createdBy: 'Admin', // In real app, get from user context
        status: 'active'
      });

      Alert.alert('Success', 'Announcement created successfully');
      setIsModalVisible(false);
      setNewAnnouncement({
        title: '',
        content: '',
        priority: 'medium',
        targetAudience: 'all'
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', 'Failed to create announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#dc2626';
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return Colors.textSecondary;
    }
  };

  const getPriorityText = (priority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const renderAnnouncementItem = ({ item }) => (
    <View style={[styles.announcementItem, { borderLeftColor: getPriorityColor(item.priority) }]}>
      <View style={styles.announcementHeader}>
        <Text style={styles.announcementTitle}>{item.title}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{getPriorityText(item.priority)}</Text>
        </View>
      </View>
      
      <Text style={styles.announcementContent}>{item.content}</Text>
      
      <View style={styles.announcementFooter}>
        <Text style={styles.announcementDate}>
          {item.createdAt?.toDate?.() ? 
            item.createdAt.toDate().toLocaleDateString() : 
            'Unknown Date'}
        </Text>
        <Text style={styles.announcementAudience}>
          For: {item.targetAudience || 'All'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading announcements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Announcements</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddAnnouncement}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAnnouncements}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : announcements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No announcements yet</Text>
          <TouchableOpacity style={styles.addFirstButton} onPress={handleAddAnnouncement}>
            <Text style={styles.addFirstButtonText}>Create First Announcement</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={announcements}
          renderItem={renderAnnouncementItem}
          keyExtractor={(item) => item.id}
          style={styles.announcementsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Add Announcement Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Announcement</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter announcement title"
              placeholderTextColor={Colors.textSecondary}
              value={newAnnouncement.title}
              onChangeText={(text) => setNewAnnouncement({...newAnnouncement, title: text})}
            />

            <Text style={styles.inputLabel}>Content *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Enter announcement content"
              placeholderTextColor={Colors.textSecondary}
              value={newAnnouncement.content}
              onChangeText={(text) => setNewAnnouncement({...newAnnouncement, content: text})}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityContainer}>
              {['low', 'medium', 'high', 'urgent'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityOption,
                    newAnnouncement.priority === priority && styles.priorityOptionSelected
                  ]}
                  onPress={() => setNewAnnouncement({...newAnnouncement, priority})}
                >
                  <Text style={[
                    styles.priorityOptionText,
                    newAnnouncement.priority === priority && styles.priorityOptionTextSelected
                  ]}>
                    {getPriorityText(priority)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Target Audience</Text>
            <View style={styles.audienceContainer}>
              {['all', 'members', 'leaders', 'youth', 'children'].map((audience) => (
                <TouchableOpacity
                  key={audience}
                  style={[
                    styles.audienceOption,
                    newAnnouncement.targetAudience === audience && styles.audienceOptionSelected
                  ]}
                  onPress={() => setNewAnnouncement({...newAnnouncement, targetAudience: audience})}
                >
                  <Text style={[
                    styles.audienceOptionText,
                    newAnnouncement.targetAudience === audience && styles.audienceOptionTextSelected
                  ]}>
                    {audience.charAt(0).toUpperCase() + audience.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmitAnnouncement}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Creating...' : 'Create Announcement'}
              </Text>
            </TouchableOpacity>
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
    marginTop: 10,
    color: Colors.text,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: Colors.surface,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.surface,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  addFirstButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: Colors.surface,
    fontWeight: 'bold',
  },
  announcementsList: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  announcementItem: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  announcementContent: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  announcementDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  announcementAudience: {
    fontSize: 12,
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
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  priorityOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  priorityOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  priorityOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  priorityOptionTextSelected: {
    color: Colors.surface,
  },
  audienceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  audienceOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  audienceOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  audienceOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  audienceOptionTextSelected: {
    color: Colors.surface,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  submitButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AnnouncementsScreen;
