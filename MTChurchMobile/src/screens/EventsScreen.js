import React, { useState, useEffect } from 'react';
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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import DatePicker from '../components/DatePicker';
import DropdownWithAdd from '../components/DropdownWithAdd';
import { Colors } from '../constants/colors';
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

const DEFAULT_EVENT_TYPES = [
  'Sunday Service',
  'Bible Study',
  'Prayer Meeting',
  'Youth Service',
  'Women\'s Fellowship',
  'Men\'s Fellowship',
  'Church Conference',
  'Baptism',
  'Wedding',
  'Funeral',
  'Community Outreach',
  'Special Event'
];

const ORGANIZATIONS = [
  'Mens Fellowship',
  'Choir',
  'Christ Little Band',
  'Singing Band',
  'Guild',
  'Girls Fellowship',
  'Youth Fellowship',
  'Gospel Band',
  'Women\'s Fellowship',
  'Brigade',
  'Digital Team'
];

const CLASSES = [
  'Class 1',
  'Class 2', 
  'Class 3',
  'Class 4',
  'Class 5'
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'urgent', label: 'Urgent', color: '#dc2626' }
];

const SMS_CONFIG = {
  endpoint: 'https://smsc.hubtel.com/v1/messages/send',
  clientId: 'vxojxzbs',
  clientSecret: 'uznaitfd'
};

const EventsScreen = () => {
  // Main state
  const [activeTab, setActiveTab] = useState('events');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data state
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [members, setMembers] = useState([]);
  const [eventTypes, setEventTypes] = useState(DEFAULT_EVENT_TYPES);
  const [groupMembers, setGroupMembers] = useState({});

  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isSMSModalOpen, setIsSMSModalOpen] = useState(false);
  const [isEventTypeModalOpen, setIsEventTypeModalOpen] = useState(false);

  // Form states
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    eventType: DEFAULT_EVENT_TYPES[0],
    date: null,
    startTime: '',
    endTime: '',
    location: '',
    organizer: '',
    maxAttendees: '',
    isRecurring: false,
    recurringPattern: 'weekly'
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'medium',
    category: 'General',
    expiryDate: null,
    isActive: true
  });

  // SMS states
  const [smsOption, setSmsOption] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [groupType, setGroupType] = useState('');
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);

  // Edit states
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  // Loading states
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isSubmittingAnnouncement, setIsSubmittingAnnouncement] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);

  // New event type
  const [newEventType, setNewEventType] = useState('');

  const db = getFirestore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEvents(),
        fetchAnnouncements(),
        fetchMembers(),
        fetchEventTypes()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error loading data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'Events'));
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt)
      }));
      setEvents(eventsData.sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'Announcements'));
      const announcementsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
        expiryDate: doc.data().expiryDate ? (doc.data().expiryDate?.toDate ? doc.data().expiryDate.toDate() : new Date(doc.data().expiryDate)) : null
      }));
      setAnnouncements(announcementsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'Members'));
      const membersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchEventTypes = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'EventTypes'));
      if (!snapshot.empty) {
        const customTypes = snapshot.docs.map(doc => doc.data().name);
        const allTypes = [...DEFAULT_EVENT_TYPES, ...customTypes];
        setEventTypes([...new Set(allTypes)]);
      }
    } catch (error) {
      console.error('Error fetching event types:', error);
    }
  };

  const fetchMembersByGroups = async () => {
    try {
      // Group members by organization
      const membersByOrganization = {};
      ORGANIZATIONS.forEach(org => {
        membersByOrganization[org] = members.filter(member => 
          member.organisations && 
          Array.isArray(member.organisations) && 
          member.organisations.includes(org) && 
          member.contact && 
          member.contact.trim()
        );
      });

      // Group members by class
      const membersByClass = {};
      CLASSES.forEach(cls => {
        membersByClass[cls] = members.filter(member => 
          member.assignClass === cls && 
          member.contact && 
          member.contact.trim()
        );
      });

      setGroupMembers({
        organizations: membersByOrganization,
        classes: membersByClass
      });
    } catch (error) {
      console.error('Error fetching members by groups:', error);
    }
  };

  const handleAddEventType = async () => {
    if (!newEventType.trim()) return;
    
    try {
      if (eventTypes.includes(newEventType.trim())) {
        Alert.alert('Error', 'Event type already exists!');
        return;
      }
      
      await addDoc(collection(db, 'EventTypes'), {
        name: newEventType.trim(),
        createdAt: serverTimestamp()
      });
      
      setEventTypes([...eventTypes, newEventType.trim()]);
      setNewEventType('');
      setIsEventTypeModalOpen(false);
      Alert.alert('Success', 'Event type added successfully!');
    } catch (error) {
      console.error('Error adding event type:', error);
      Alert.alert('Error', 'Error adding event type. Please try again.');
    }
  };

  const sendSMS = async (phoneNumbers, message) => {
    try {
      const credentials = btoa(`${SMS_CONFIG.clientId}:${SMS_CONFIG.clientSecret}`);
      
      const promises = phoneNumbers.map(async (phone) => {
        const response = await fetch(SMS_CONFIG.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            From: 'Church Admin',
            To: phone,
            Content: message,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to send SMS to ${phone}`);
        }
        
        return response.json();
      });
      
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error('SMS sending error:', error);
      return { success: false, error: error.message };
    }
  };

  const handleSMSSend = async () => {
    if (!currentAnnouncement) return;
    
    setIsSendingSMS(true);
    
    try {
      let phoneNumbers = [];
      
      if (smsOption === 'all') {
        phoneNumbers = members
          .filter(member => member.contact && member.contact.trim())
          .map(member => member.contact.trim());
      } else if (smsOption === 'specify') {
        selectedGroups.forEach(groupName => {
          const groupType = ORGANIZATIONS.includes(groupName) ? 'organizations' : 'classes';
          const membersInGroup = groupMembers[groupType][groupName] || [];
          const groupPhoneNumbers = membersInGroup.map(member => member.contact.trim());
          phoneNumbers = [...phoneNumbers, ...groupPhoneNumbers];
        });
        
        phoneNumbers = [...new Set(phoneNumbers)];
      }
      
      if (phoneNumbers.length === 0) {
        Alert.alert('Error', 'No valid phone numbers found for selected groups.');
        return;
      }
      
      const message = `📢 ANNOUNCEMENT: ${currentAnnouncement.title}\n\n${currentAnnouncement.content}\n\n- Church Admin`;
      
      const result = await sendSMS(phoneNumbers, message);
      
      if (result.success) {
        Alert.alert('Success', `SMS sent successfully to ${phoneNumbers.length} members!`);
      } else {
        Alert.alert('Error', `Error sending SMS: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Error sending SMS:', error);
      Alert.alert('Error', 'Error sending SMS. Please try again.');
    } finally {
      setIsSendingSMS(false);
      setIsSMSModalOpen(false);
      setSmsOption('');
      setSelectedGroups([]);
      setGroupType('');
      setCurrentAnnouncement(null);
    }
  };

  const handleEventSubmit = async () => {
    if (!eventForm.title || !eventForm.eventType || !eventForm.date) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    setIsSubmittingEvent(true);
    
    try {
      const eventData = {
        ...eventForm,
        date: eventForm.date,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (editingEvent) {
        await updateDoc(doc(db, 'Events', editingEvent.id), {
          ...eventData,
          updatedAt: serverTimestamp()
        });
        Alert.alert('Success', 'Event updated successfully!');
      } else {
        await addDoc(collection(db, 'Events'), eventData);
        Alert.alert('Success', 'Event created successfully!');
      }

      setIsEventModalOpen(false);
      setEditingEvent(null);
      resetEventForm();
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Error saving event. Please try again.');
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleAnnouncementSubmit = async () => {
    if (!announcementForm.title || !announcementForm.content) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    setIsSubmittingAnnouncement(true);
    
    try {
      const announcementData = {
        ...announcementForm,
        expiryDate: announcementForm.expiryDate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (editingAnnouncement) {
        await updateDoc(doc(db, 'Announcements', editingAnnouncement.id), {
          ...announcementData,
          updatedAt: serverTimestamp()
        });
        Alert.alert('Success', 'Announcement updated successfully!');
      } else {
        const docRef = await addDoc(collection(db, 'Announcements'), announcementData);
        const savedAnnouncement = { id: docRef.id, ...announcementData };
        
        Alert.alert('Success', 'Announcement created successfully!');
        
        // Show SMS modal for new announcements
        if (!editingAnnouncement) {
          setCurrentAnnouncement(savedAnnouncement);
          setIsSMSModalOpen(true);
        }
      }

      setIsAnnouncementModalOpen(false);
      setEditingAnnouncement(null);
      resetAnnouncementForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      Alert.alert('Error', 'Error saving announcement. Please try again.');
    } finally {
      setIsSubmittingAnnouncement(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'Events', eventId));
              setEvents(prev => prev.filter(event => event.id !== eventId));
              Alert.alert('Success', 'Event deleted successfully!');
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Error deleting event. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to delete this announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'Announcements', announcementId));
              setAnnouncements(prev => prev.filter(announcement => announcement.id !== announcementId));
              Alert.alert('Success', 'Announcement deleted successfully!');
            } catch (error) {
              console.error('Error deleting announcement:', error);
              Alert.alert('Error', 'Error deleting announcement. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      eventType: event.eventType,
      date: event.date,
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      location: event.location || '',
      organizer: event.organizer || '',
      maxAttendees: event.maxAttendees || '',
      isRecurring: event.isRecurring || false,
      recurringPattern: event.recurringPattern || 'weekly'
    });
    setIsEventModalOpen(true);
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      category: announcement.category,
      expiryDate: announcement.expiryDate,
      isActive: announcement.isActive
    });
    setIsAnnouncementModalOpen(true);
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      eventType: DEFAULT_EVENT_TYPES[0],
      date: null,
      startTime: '',
      endTime: '',
      location: '',
      organizer: '',
      maxAttendees: '',
      isRecurring: false,
      recurringPattern: 'weekly'
    });
  };

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      title: '',
      content: '',
      priority: 'medium',
      category: 'General',
      expiryDate: null,
      isActive: true
    });
  };

  const handleGroupSelect = (groupName) => {
    setSelectedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    );
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time;
  };

  const isEventUpcoming = (date) => {
    return new Date(date) >= new Date();
  };

  const getPriorityColor = (priority) => {
    const level = PRIORITY_LEVELS.find(p => p.value === priority);
    return level ? level.color : '#6b7280';
  };

  const renderEventCard = ({ item }) => (
    <View style={[styles.eventCard, !isEventUpcoming(item.date) && styles.pastEvent]}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventType}>{item.eventType}</Text>
      </View>
      
      <View style={styles.eventDetails}>
        <Text style={styles.eventDetail}>📅 {formatDate(item.date)}</Text>
        {item.startTime && item.endTime && (
          <Text style={styles.eventDetail}>🕐 {formatTime(item.startTime)} - {formatTime(item.endTime)}</Text>
        )}
        {item.location && <Text style={styles.eventDetail}>📍 {item.location}</Text>}
        {item.organizer && <Text style={styles.eventDetail}>👤 {item.organizer}</Text>}
        {item.maxAttendees && <Text style={styles.eventDetail}>👥 Max: {item.maxAttendees} attendees</Text>}
      </View>
      
      {item.description && (
        <Text style={styles.eventDescription}>{item.description}</Text>
      )}
      
      {item.isRecurring && (
        <Text style={styles.recurringBadge}>🔄 Recurring ({item.recurringPattern})</Text>
      )}
      
      <View style={styles.eventActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditEvent(item)}
        >
          <Text style={styles.actionButtonText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteEvent(item.id)}
        >
          <Text style={styles.actionButtonText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAnnouncementCard = ({ item }) => (
    <View style={[styles.announcementCard, !item.isActive && styles.inactiveAnnouncement]}>
      <View style={styles.announcementHeader}>
        <Text style={styles.announcementTitle}>{item.title}</Text>
        <View style={styles.announcementMeta}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
          </View>
          <Text style={styles.categoryBadge}>{item.category}</Text>
          {!item.isActive && <Text style={styles.inactiveBadge}>INACTIVE</Text>}
        </View>
      </View>
      
      <Text style={styles.announcementContent}>{item.content}</Text>
      
      <View style={styles.announcementFooter}>
        <View style={styles.announcementDates}>
          <Text style={styles.dateText}>Created: {formatDate(item.createdAt)}</Text>
          {item.expiryDate && (
            <Text style={styles.dateText}>Expires: {formatDate(item.expiryDate)}</Text>
          )}
        </View>
        
        <View style={styles.announcementActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditAnnouncement(item)}
          >
            <Text style={styles.actionButtonText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteAnnouncement(item.id)}
          >
            <Text style={styles.actionButtonText}>🗑️ Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.smsButton]}
            onPress={() => {
              setCurrentAnnouncement(item);
              setIsSMSModalOpen(true);
            }}
          >
            <Text style={styles.actionButtonText}>📱 SMS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading events and announcements...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Events & Announcements</Text>
        <Text style={styles.subtitle}>Manage church events and announcements</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && styles.activeTab]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
            Events
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'announcements' && styles.activeTab]}
          onPress={() => setActiveTab('announcements')}
        >
          <Text style={[styles.tabText, activeTab === 'announcements' && styles.activeTabText]}>
            Announcements
          </Text>
        </TouchableOpacity>
      </View>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Events</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                resetEventForm();
                setEditingEvent(null);
                setIsEventModalOpen(true);
              }}
            >
              <Text style={styles.addButtonText}>➕ Create Event</Text>
            </TouchableOpacity>
          </View>

          {events.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No events scheduled yet. Create your first event!</Text>
            </View>
          ) : (
            <FlatList
              data={events}
              keyExtractor={(item) => item.id}
              renderItem={renderEventCard}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Announcements</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                resetAnnouncementForm();
                setEditingAnnouncement(null);
                setIsAnnouncementModalOpen(true);
              }}
            >
              <Text style={styles.addButtonText}>➕ Create Announcement</Text>
            </TouchableOpacity>
          </View>

          {announcements.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No announcements yet. Create your first announcement!</Text>
            </View>
          ) : (
            <FlatList
              data={announcements}
              keyExtractor={(item) => item.id}
              renderItem={renderAnnouncementCard}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}

      {/* Event Modal */}
      <Modal
        visible={isEventModalOpen}
        animationType="slide"
        onRequestClose={() => setIsEventModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </Text>
            <TouchableOpacity onPress={() => setIsEventModalOpen(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={styles.input}
              value={eventForm.title}
              onChangeText={(value) => setEventForm({...eventForm, title: value})}
              placeholder="Enter event title"
              placeholderTextColor={Colors.textSecondary}
            />

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Event Type *</Text>
                <DropdownWithAdd
                  options={eventTypes.map(type => ({ value: type, label: type }))}
                  value={eventForm.eventType}
                  onValueChange={(value) => setEventForm({...eventForm, eventType: value})}
                  onAddOption={() => setIsEventTypeModalOpen(true)}
                  placeholder="Select event type"
                />
              </View>
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={eventForm.description}
              onChangeText={(value) => setEventForm({...eventForm, description: value})}
              placeholder="Enter event description"
              multiline
              numberOfLines={3}
              placeholderTextColor={Colors.textSecondary}
            />

            <DatePicker
              label="Date *"
              value={eventForm.date}
              onValueChange={(value) => setEventForm({...eventForm, date: value})}
              placeholder="Select event date"
            />

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Start Time</Text>
                <TextInput
                  style={styles.input}
                  value={eventForm.startTime}
                  onChangeText={(value) => setEventForm({...eventForm, startTime: value})}
                  placeholder="HH:MM"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>End Time</Text>
                <TextInput
                  style={styles.input}
                  value={eventForm.endTime}
                  onChangeText={(value) => setEventForm({...eventForm, endTime: value})}
                  placeholder="HH:MM"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={eventForm.location}
              onChangeText={(value) => setEventForm({...eventForm, location: value})}
              placeholder="Enter event location"
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={styles.label}>Organizer</Text>
            <TextInput
              style={styles.input}
              value={eventForm.organizer}
              onChangeText={(value) => setEventForm({...eventForm, organizer: value})}
              placeholder="Enter organizer name"
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={styles.label}>Max Attendees</Text>
            <TextInput
              style={styles.input}
              value={eventForm.maxAttendees}
              onChangeText={(value) => setEventForm({...eventForm, maxAttendees: value})}
              placeholder="Enter maximum attendees"
              keyboardType="numeric"
              placeholderTextColor={Colors.textSecondary}
            />

            <TouchableOpacity
              style={[styles.submitButton, isSubmittingEvent && styles.submitButtonDisabled]}
              onPress={handleEventSubmit}
              disabled={isSubmittingEvent}
            >
              <Text style={styles.submitButtonText}>
                {isSubmittingEvent ? 'Saving...' : (editingEvent ? 'Update Event' : 'Create Event')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Announcement Modal */}
      <Modal
        visible={isAnnouncementModalOpen}
        animationType="slide"
        onRequestClose={() => setIsAnnouncementModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
            </Text>
            <TouchableOpacity onPress={() => setIsAnnouncementModalOpen(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={announcementForm.title}
              onChangeText={(value) => setAnnouncementForm({...announcementForm, title: value})}
              placeholder="Enter announcement title"
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={styles.label}>Content *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={announcementForm.content}
              onChangeText={(value) => setAnnouncementForm({...announcementForm, content: value})}
              placeholder="Enter announcement content"
              multiline
              numberOfLines={4}
              placeholderTextColor={Colors.textSecondary}
            />

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Priority</Text>
                <DropdownWithAdd
                  options={PRIORITY_LEVELS.map(level => ({ value: level.value, label: level.label }))}
                  value={announcementForm.priority}
                  onValueChange={(value) => setAnnouncementForm({...announcementForm, priority: value})}
                  onAddOption={() => {}}
                  placeholder="Select priority"
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>Category</Text>
                <TextInput
                  style={styles.input}
                  value={announcementForm.category}
                  onChangeText={(value) => setAnnouncementForm({...announcementForm, category: value})}
                  placeholder="Enter category"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            <DatePicker
              label="Expiry Date"
              value={announcementForm.expiryDate}
              onValueChange={(value) => setAnnouncementForm({...announcementForm, expiryDate: value})}
              placeholder="Select expiry date (optional)"
            />

            <TouchableOpacity
              style={[styles.submitButton, isSubmittingAnnouncement && styles.submitButtonDisabled]}
              onPress={handleAnnouncementSubmit}
              disabled={isSubmittingAnnouncement}
            >
              <Text style={styles.submitButtonText}>
                {isSubmittingAnnouncement ? 'Saving...' : (editingAnnouncement ? 'Update Announcement' : 'Create Announcement')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* SMS Modal */}
      <Modal
        visible={isSMSModalOpen}
        animationType="slide"
        onRequestClose={() => setIsSMSModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send SMS Notification</Text>
            <TouchableOpacity onPress={() => setIsSMSModalOpen(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Send to:</Text>
            
            <TouchableOpacity
              style={[styles.optionButton, smsOption === 'all' && styles.selectedOption]}
              onPress={() => setSmsOption('all')}
            >
              <Text style={[styles.optionText, smsOption === 'all' && styles.selectedOptionText]}>
                All Members
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionButton, smsOption === 'specify' && styles.selectedOption]}
              onPress={() => {
                setSmsOption('specify');
                fetchMembersByGroups();
              }}
            >
              <Text style={[styles.optionText, smsOption === 'specify' && styles.selectedOptionText]}>
                Specific Groups
              </Text>
            </TouchableOpacity>

            {smsOption === 'specify' && (
              <View style={styles.groupsContainer}>
                <Text style={styles.label}>Select Groups:</Text>
                
                <Text style={styles.groupSectionTitle}>Organizations:</Text>
                {ORGANIZATIONS.map(org => (
                  <TouchableOpacity
                    key={org}
                    style={[styles.groupButton, selectedGroups.includes(org) && styles.selectedGroup]}
                    onPress={() => handleGroupSelect(org)}
                  >
                    <Text style={[styles.groupText, selectedGroups.includes(org) && styles.selectedGroupText]}>
                      {org} ({groupMembers.organizations?.[org]?.length || 0} members)
                    </Text>
                  </TouchableOpacity>
                ))}

                <Text style={styles.groupSectionTitle}>Classes:</Text>
                {CLASSES.map(cls => (
                  <TouchableOpacity
                    key={cls}
                    style={[styles.groupButton, selectedGroups.includes(cls) && styles.selectedGroup]}
                    onPress={() => handleGroupSelect(cls)}
                  >
                    <Text style={[styles.groupText, selectedGroups.includes(cls) && styles.selectedGroupText]}>
                      {cls} ({groupMembers.classes?.[cls]?.length || 0} members)
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, isSendingSMS && styles.submitButtonDisabled]}
              onPress={handleSMSSend}
              disabled={isSendingSMS || (smsOption === 'specify' && selectedGroups.length === 0)}
            >
              <Text style={styles.submitButtonText}>
                {isSendingSMS ? 'Sending...' : 'Send SMS'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Event Type Modal */}
      <Modal
        visible={isEventTypeModalOpen}
        animationType="slide"
        onRequestClose={() => setIsEventTypeModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Event Type</Text>
            <TouchableOpacity onPress={() => setIsEventTypeModalOpen(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.label}>Event Type Name</Text>
            <TextInput
              style={styles.input}
              value={newEventType}
              onChangeText={setNewEventType}
              placeholder="Enter new event type"
              placeholderTextColor={Colors.textSecondary}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddEventType}
            >
              <Text style={styles.submitButtonText}>Add Event Type</Text>
            </TouchableOpacity>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.surface,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  eventCard: {
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
  pastEvent: {
    opacity: 0.6,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  eventType: {
    fontSize: 12,
    color: Colors.primary,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  eventDetails: {
    marginBottom: 8,
  },
  eventDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  recurringBadge: {
    fontSize: 12,
    color: Colors.primary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  smsButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  announcementCard: {
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
  inactiveAnnouncement: {
    opacity: 0.6,
  },
  announcementHeader: {
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  announcementMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    color: Colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryBadge: {
    backgroundColor: Colors.background,
    color: Colors.textSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
  },
  inactiveBadge: {
    backgroundColor: '#ef4444',
    color: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  announcementContent: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
  },
  announcementFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  announcementDates: {
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  announcementActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
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
    marginRight: 40,
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
  row: {
    flexDirection: 'row',
  },
  inputContainer: {
    marginBottom: 16,
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
  optionButton: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  selectedOption: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  selectedOptionText: {
    color: Colors.surface,
  },
  groupsContainer: {
    marginTop: 16,
  },
  groupSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  groupButton: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  selectedGroup: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  groupText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedGroupText: {
    color: Colors.surface,
  },
});

export default EventsScreen;