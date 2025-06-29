 import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import app from '../../Component/Config/Config';
import "../../event.css";
import { useLocation } from 'react-router-dom';

// SMS Configuration
const SMS_CONFIG = {
  endpoint: 'https://smsc.hubtel.com/v1/messages/send',
  clientId: 'vxojxzbs',
  clientSecret: 'uznaitfd'
};

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

const Events = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [members, setMembers] = useState([]);
  const [eventTypes, setEventTypes] = useState(DEFAULT_EVENT_TYPES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groupType, setGroupType] = useState(''); // 'organization' or 'class'
const [selectedGroups, setSelectedGroups] = useState([]);
const [groupMembers, setGroupMembers] = useState({});
 

  const location = useLocation();
  const userDetails = location.state?.userDetails;
  
  // Loading states for form submissions
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isSubmittingAnnouncement, setIsSubmittingAnnouncement] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  
  // Event modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    eventType: DEFAULT_EVENT_TYPES[0],
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    organizer: '',
    maxAttendees: '',
    isRecurring: false,
    recurringPattern: 'weekly'
  });
  
  // Announcement modal states
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'medium',
    category: 'General',
    expiryDate: '',
    isActive: true
  });
const fetchMembersByGroups = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'Members'));
    const membersData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Group members by organization
    const membersByOrganization = {};
    ORGANIZATIONS.forEach(org => {
      membersByOrganization[org] = membersData.filter(member => 
        member.organisations && // Check if organisations field exists
        Array.isArray(member.organisations) && // Check if it's an array
        member.organisations.includes(org) && // Check if the organization is in the array
        member.contact && 
        member.contact.trim()
      );
    });

    // Group members by class
    const membersByClass = {};
    CLASSES.forEach(cls => {
      membersByClass[cls] = membersData.filter(member => 
        member.assignClass === cls && 
        member.contact && 
        member.contact.trim()
      );
    });

    setGroupMembers({
      organizations: membersByOrganization,
      classes: membersByClass
    });
    
    console.log('Members by organization:', membersByOrganization);
    console.log('Members by class:', membersByClass);
  } catch (error) {
    console.error('Error fetching members by groups:', error);
  }
};

//   const fetchMembersByGroups = async () => {
//   try {
//     const snapshot = await getDocs(collection(db, 'Members'));
//     const membersData = snapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data()
//     }));

//     // Group members by organization
//     const membersByOrganization = {};
//     ORGANIZATIONS.forEach(org => {
//       membersByOrganization[org] = membersData.filter(member => 
//         member.organisations === org && member.contact && member.contact.trim()
//       );
//     });

//     // Group members by class
//     const membersByClass = {};
//     CLASSES.forEach(cls => {
//       membersByClass[cls] = membersData.filter(member => 
//         member.assignClass === cls && member.contact && member.contact.trim()
//       );
//     });

//     setGroupMembers({
//       organizations: membersByOrganization,
//       classes: membersByClass
//     });
//   } catch (error) {
//     console.error('Error fetching members by groups:', error);
//   }
// };

// Add this function to handle group selection
const handleGroupSelect = (groupName) => {
  setSelectedGroups(prev => 
    prev.includes(groupName) 
      ? prev.filter(name => name !== groupName)
      : [...prev, groupName]
  );
};

  // SMS Modal states
  const [isSMSModalOpen, setIsSMSModalOpen] = useState(false);
  const [smsOption, setSmsOption] = useState(''); // 'all' or 'specify'
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  
  // Event Type Modal states
  const [isEventTypeModalOpen, setIsEventTypeModalOpen] = useState(false);
  const [newEventType, setNewEventType] = useState('');
  
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  
  const db = getFirestore(app);

  useEffect(() => {
    fetchEvents();
    fetchAnnouncements();
    fetchMembers();
    fetchEventTypes();
  }, []);

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
      setError('Error fetching events. Please try again.');
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
      setLoading(false);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('Error fetching announcements. Please try again.');
      setLoading(false);
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
        setEventTypes([...new Set(allTypes)]); // Remove duplicates
      }
    } catch (error) {
      console.error('Error fetching event types:', error);
    }
  };

  const handleAddEventType = async () => {
    if (!newEventType.trim()) return;
    
    try {
      // Check if event type already exists
      if (eventTypes.includes(newEventType.trim())) {
        alert('Event type already exists!');
        return;
      }
      
      // Add to Firestore
      await addDoc(collection(db, 'EventTypes'), {
        name: newEventType.trim(),
        createdAt: new Date()
      });
      
      // Update local state
      setEventTypes([...eventTypes, newEventType.trim()]);
      setNewEventType('');
      setIsEventTypeModalOpen(false);
      alert('Event type added successfully!');
    } catch (error) {
      console.error('Error adding event type:', error);
      alert('Error adding event type. Please try again.');
    }
  };

  const sendSMS = async (phoneNumbers, message) => {
    const credentials = btoa(`${SMS_CONFIG.clientId}:${SMS_CONFIG.clientSecret}`);
    
    try {
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

  // const handleSMSSend = async () => {
  //   if (!currentAnnouncement) return;
    
  //   setIsSendingSMS(true);
    
  //   try {
  //     let phoneNumbers = [];
      
  //     if (smsOption === 'all') {
  //       phoneNumbers = members
  //         .filter(member => member.contact && member.contact.trim())
  //         .map(member => member.contact.trim());
  //     } else if (smsOption === 'specify') {
  //       phoneNumbers = selectedMembers
  //         .filter(memberId => {
  //           const member = members.find(m => m.id === memberId);
  //           return member && member.contact && member.contact.trim();
  //         })
  //         .map(memberId => {
  //           const member = members.find(m => m.id === memberId);
  //           return member.contact.trim();
  //         });
  //     }
      
  //     if (phoneNumbers.length === 0) {
  //       alert('No valid phone numbers found for selected members.');
  //       return;
  //     }
      
  //     const message = `📢 ANNOUNCEMENT: ${currentAnnouncement.title}\n\n${currentAnnouncement.content}\n\n- Church Admin`;
      
  //     const result = await sendSMS(phoneNumbers, message);
      
  //     if (result.success) {
  //       alert(`SMS sent successfully to ${phoneNumbers.length} members!`);
  //     } else {
  //       alert(`Error sending SMS: ${result.error}`);
  //     }
      
  //   } catch (error) {
  //     console.error('Error sending SMS:', error);
  //     alert('Error sending SMS. Please try again.');
  //   } finally {
  //     setIsSendingSMS(false);
  //     setIsSMSModalOpen(false);
  //     setSmsOption('');
  //     setSelectedMembers([]);
  //     setCurrentAnnouncement(null);
  //   }
  // };
const handleSMSSendWithGroups = async () => {
  if (!currentAnnouncement) return;
  
  setIsSendingSMS(true);
  
  try {
    let phoneNumbers = [];
    
    if (smsOption === 'all') {
      phoneNumbers = members
        .filter(member => member.contact && member.contact.trim())
        .map(member => member.contact.trim());
    } else if (smsOption === 'specify') {
      // Get phone numbers from selected groups
      selectedGroups.forEach(groupName => {
        const groupType = ORGANIZATIONS.includes(groupName) ? 'organizations' : 'classes';
        const membersInGroup = groupMembers[groupType][groupName] || [];
        const groupPhoneNumbers = membersInGroup.map(member => member.contact.trim());
        phoneNumbers = [...phoneNumbers, ...groupPhoneNumbers];
      });
      
      // Remove duplicates
      phoneNumbers = [...new Set(phoneNumbers)];
    }
    
    if (phoneNumbers.length === 0) {
      alert('No valid phone numbers found for selected groups.');
      return;
    }
    
    const message = `📢 ANNOUNCEMENT: ${currentAnnouncement.title}\n\n${currentAnnouncement.content}\n\n- Church Admin`;
    
    const result = await sendSMS(phoneNumbers, message);
    
    if (result.success) {
      alert(`SMS sent successfully to ${phoneNumbers.length} members!`);
    } else {
      alert(`Error sending SMS: ${result.error}`);
    }
    
  } catch (error) {
    console.error('Error sending SMS:', error);
    alert('Error sending SMS. Please try again.');
  } finally {
    setIsSendingSMS(false);
    setIsSMSModalOpen(false);
    setSmsOption('');
    setSelectedGroups([]);
    setGroupType('');
    setCurrentAnnouncement(null);
  }
};
useEffect(() => {
  if (isSMSModalOpen && smsOption === 'specify') {
    fetchMembersByGroups();
  }
}, [isSMSModalOpen, smsOption]);



  // const handleAnnouncementSubmit = async (e) => {
  //   e.preventDefault();
  //   setIsSubmittingAnnouncement(true);
    
  //   try {
  //     const announcementData = {
  //       ...announcementForm,
  //       expiryDate: announcementForm.expiryDate ? new Date(announcementForm.expiryDate) : null,
        
  //       createdAt: new Date(),
  //       updatedAt: new Date()
  //     };

  //     let savedAnnouncement;
  //     if (editingAnnouncement) {
  //       await updateDoc(doc(db, 'Announcements', editingAnnouncement.id), {
  //         ...announcementData,
  //         updatedAt: new Date()
  //       });
  //       savedAnnouncement = { ...editingAnnouncement, ...announcementData };
  //       alert('Announcement updated successfully!');
  //     } else {
  //       const docRef = await addDoc(collection(db, 'Announcements'), announcementData);
  //       savedAnnouncement = { id: docRef.id, ...announcementData };
  //       alert('Announcement created successfully!');
  //     }

  //     setIsAnnouncementModalOpen(false);
  //     setEditingAnnouncement(null);
  //     resetAnnouncementForm();
  //     fetchAnnouncements();
      
  //     // Show SMS modal for new announcements
  //     if (!editingAnnouncement) {
  //       setCurrentAnnouncement(savedAnnouncement);
  //       setIsSMSModalOpen(true);
  //     }
  //   } catch (error) {
  //     console.error('Error saving announcement:', error);
  //     alert('Error saving announcement. Please try again.');
  //   } finally {
  //     setIsSubmittingAnnouncement(false);
  //   }
  // };


  const handleAnnouncementSubmit = async (e) => {
  e.preventDefault();
  setIsSubmittingAnnouncement(true);
  
  try {
    const announcementData = {
      ...announcementForm,
      expiryDate: announcementForm.expiryDate ? new Date(announcementForm.expiryDate) : null,
      createdBy: userDetails ? {
        id: userDetails.id,
        name: `${userDetails.firstName} ${userDetails.lastName}`,
        email: userDetails.email
      } : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let savedAnnouncement;
    if (editingAnnouncement) {
      await updateDoc(doc(db, 'Announcements', editingAnnouncement.id), {
        ...announcementData,
        updatedAt: new Date()
      });
      savedAnnouncement = { ...editingAnnouncement, ...announcementData };
      alert('Announcement updated successfully!');
    } else {
      const docRef = await addDoc(collection(db, 'Announcements'), announcementData);
      savedAnnouncement = { id: docRef.id, ...announcementData };
      alert('Announcement created successfully!');
    }

    setIsAnnouncementModalOpen(false);
    setEditingAnnouncement(null);
    resetAnnouncementForm();
    fetchAnnouncements();
    
    // Show SMS modal for new announcements
    if (!editingAnnouncement) {
      setCurrentAnnouncement(savedAnnouncement);
      setIsSMSModalOpen(true);
    }
  } catch (error) {
    console.error('Error saving announcement:', error);
    alert('Error saving announcement. Please try again.');
  } finally {
    setIsSubmittingAnnouncement(false);
  }
};
  // const handleEventSubmit = async (e) => {
  //   e.preventDefault();
  //   setIsSubmittingEvent(true);
    
  //   try {
  //     const eventData = {
  //       ...eventForm,
  //       date: new Date(eventForm.date + 'T' + eventForm.startTime),
  //       startTime: eventForm.startTime,
  //       endTime: eventForm.endTime,
  //       maxAttendees: eventForm.maxAttendees ? parseInt(eventForm.maxAttendees) : null,
  //       createdAt: new Date(),
  //       updatedAt: new Date()
  //     };

  //     if (editingEvent) {
  //       await updateDoc(doc(db, 'Events', editingEvent.id), {
  //         ...eventData,
  //         updatedAt: new Date()
  //       });
  //       alert('Event updated successfully!');
  //     } else {
  //       await addDoc(collection(db, 'Events'), eventData);
  //       alert('Event created successfully!');
  //     }

  //     setIsEventModalOpen(false);
  //     setEditingEvent(null);
  //     resetEventForm();
  //     fetchEvents();
  //   } catch (error) {
  //     console.error('Error saving event:', error);
  //     alert('Error saving event. Please try again.');
  //   } finally {
  //     setIsSubmittingEvent(false);
  //   }
  // };
const handleEventSubmit = async (e) => {
  e.preventDefault();
  setIsSubmittingEvent(true);
  
  try {
    const eventData = {
      ...eventForm,
      date: new Date(eventForm.date + 'T' + eventForm.startTime),
      startTime: eventForm.startTime,
      endTime: eventForm.endTime,
      maxAttendees: eventForm.maxAttendees ? parseInt(eventForm.maxAttendees) : null,
      createdBy: userDetails ? {
        id: userDetails.id,
        name: `${userDetails.firstName} ${userDetails.lastName}`,
        email: userDetails.email
      } : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (editingEvent) {
      await updateDoc(doc(db, 'Events', editingEvent.id), {
        ...eventData,
        updatedAt: new Date()
      });
      alert('Event updated successfully!');
    } else {
      await addDoc(collection(db, 'Events'), eventData);
      alert('Event created successfully!');
    }

    setIsEventModalOpen(false);
    setEditingEvent(null);
    resetEventForm();
    fetchEvents();
  } catch (error) {
    console.error('Error saving event:', error);
    alert('Error saving event. Please try again.');
  } finally {
    setIsSubmittingEvent(false);
  }
};



  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDoc(doc(db, 'Events', eventId));
        alert('Event deleted successfully!');
        fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event. Please try again.');
      }
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteDoc(doc(db, 'Announcements', announcementId));
        alert('Announcement deleted successfully!');
        fetchAnnouncements();
      } catch (error) {
        console.error('Error deleting announcement:', error);
        alert('Error deleting announcement. Please try again.');
      }
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      date: event.date.toISOString().split('T')[0],
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      organizer: event.organizer,
      maxAttendees: event.maxAttendees?.toString() || '',
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
      expiryDate: announcement.expiryDate ? announcement.expiryDate.toISOString().split('T')[0] : '',
      isActive: announcement.isActive
    });
    setIsAnnouncementModalOpen(true);
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      eventType: eventTypes[0] || DEFAULT_EVENT_TYPES[0],
      date: '',
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
      expiryDate: '',
      isActive: true
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPriorityColor = (priority) => {
    const priorityObj = PRIORITY_LEVELS.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : '#6b7280';
  };

  const isEventUpcoming = (eventDate) => {
    return new Date(eventDate) >= new Date();
  };

  const filteredMembers = members.filter(member => 
    member.firstName?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    member.lastName?.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  const handleMemberSelect = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Spinner component
  const Spinner = () => (
    <div className="spinner" style={{
      display: 'inline-block',
      width: '16px',
      height: '16px',
      border: '2px solid #ffffff',
      borderRadius: '50%',
      borderTopColor: 'transparent',
      animation: 'spin 1s ease-in-out infinite',
      marginRight: '8px'
    }}>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

   return (
    <div className="events-screen p-6">
      <div className="header mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">📅 Events & Announcements</h1>
        
        {/* Tab Navigation */}
        <div className="tab-navigation mb-6">
          <button 
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            🗓️ Events & Services
          </button>
          <button 
            className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => setActiveTab('announcements')}
          >
            💬 Announcements
          </button>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons mb-6">
          {activeTab === 'events' ? (
            <button 
              className="btn-primary"
              onClick={() => {
                resetEventForm();
                setEditingEvent(null);
                setIsEventModalOpen(true);
              }}
            >
              ➕ Create New Event
            </button>
          ) : (
            <button 
              className="btn-primary"
              onClick={() => {
                resetAnnouncementForm();
                setEditingAnnouncement(null);
                setIsAnnouncementModalOpen(true);
              }}
            >
              ➕ Create New Announcement
            </button>
          )}
        </div>
      </div>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="events-section">
          {events.length === 0 ? (
            <div className="empty-state">
              <p>No events scheduled yet. Create your first event!</p>
            </div>
          ) : (
            <div className="events-grid">
              {events.map(event => (
                <div key={event.id} className={`event-card ${isEventUpcoming(event.date) ? 'upcoming' : 'past'}`}>
                  <div className="event-header">
                    <h3 className="event-title">{event.title}</h3>
                    <span className="event-type">{event.eventType}</span>
                  </div>
                  
                  <div className="event-details">
                    <p className="event-date">📅 {formatDate(event.date)}</p>
                    <p className="event-time">🕐 {formatTime(event.startTime)} - {formatTime(event.endTime)}</p>
                    {event.location && <p className="event-location">📍 {event.location}</p>}
                    {event.organizer && <p className="event-organizer">👤 {event.organizer}</p>}
                    {event.maxAttendees && <p className="event-attendees">👥 Max: {event.maxAttendees} attendees</p>}
                  </div>
                  
                  {event.description && (
                    <p className="event-description">{event.description}</p>
                  )}
                  
                  {event.isRecurring && (
                    <span className="recurring-badge">🔄 Recurring ({event.recurringPattern})</span>
                  )}
                  
                  <div className="event-actions">
                    <button onClick={() => handleEditEvent(event)} className="btn-edit">✏️ Edit</button>
                    <button onClick={() => handleDeleteEvent(event.id)} className="btn-delete">🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="announcements-section">
          {announcements.length === 0 ? (
            <div className="empty-state">
              <p>No announcements yet. Create your first announcement!</p>
            </div>
          ) : (
            <div className="announcements-list">
              {announcements.map(announcement => (
                <div key={announcement.id} className={`announcement-card ${!announcement.isActive ? 'inactive' : ''}`}>
                  <div className="announcement-header">
                    <h3 className="announcement-title">{announcement.title}</h3>
                    <div className="announcement-meta">
                      <span 
                        className="priority-badge" 
                        style={{ backgroundColor: getPriorityColor(announcement.priority) }}
                      >
                        {announcement.priority.toUpperCase()}
                      </span>
                      <span className="category-badge">{announcement.category}</span>
                      {!announcement.isActive && <span className="inactive-badge">INACTIVE</span>}
                    </div>
                  </div>
                  
                  <div className="announcement-content">
                    <p>{announcement.content}</p>
                  </div>
                  
                  <div className="announcement-footer">
                    <div className="announcement-dates">
                      <small>Created: {announcement.createdAt.toLocaleDateString()}</small>
                      {announcement.expiryDate && (
                        <small>Expires: {announcement.expiryDate.toLocaleDateString()}</small>
                      )}
                    </div>
                    
                    <div className="announcement-actions">
                      <button onClick={() => handleEditAnnouncement(announcement)} className="btn-edit">✏️ Edit</button>
                      <button onClick={() => handleDeleteAnnouncement(announcement.id)} className="btn-delete">🗑️ Delete</button>
                      <button 
                        onClick={() => {
                          setCurrentAnnouncement(announcement);
                          setIsSMSModalOpen(true);
                        }} 
                        className="btn-sms"
                        style={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          padding: '5px 10px',
                          borderRadius: '5px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        📱 Send SMS
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Event Modal */}
      {isEventModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content event-modal">
            <div className="modal-header">
              <h2>{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
              <button onClick={() => setIsEventModalOpen(false)} className="close-btn">✕</button>
            </div>
            
            <form onSubmit={handleEventSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Event Title *</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                    required
                    placeholder="Enter event title"
                    disabled={isSubmittingEvent}
                  />
                </div>
                
                <div className="form-group">
                  <label>Event Type *</label>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <select
                      value={eventForm.eventType}
                      onChange={(e) => setEventForm({...eventForm, eventType: e.target.value})}
                      required
                      disabled={isSubmittingEvent}
                      style={{ flex: 1 }}
                    >
                      {eventTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsEventTypeModalOpen(true)}
                      style={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  placeholder="Enter event description"
                  rows="3"
                  disabled={isSubmittingEvent}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                    required
                    disabled={isSubmittingEvent}
                  />
                </div>
                
                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="time"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({...eventForm, startTime: e.target.value})}
                    required
                    disabled={isSubmittingEvent}
                  />
                </div>
                
                <div className="form-group">
                  <label>End Time *</label>
                  <input
                    type="time"
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm({...eventForm, endTime: e.target.value})}
                    required
                    disabled={isSubmittingEvent}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                    placeholder="Event location"
                    disabled={isSubmittingEvent}
                  />
                </div>
                
                <div className="form-group">
                  <label>Organizer</label>
                  <input
                    type="text"
                    value={eventForm.organizer}
                    onChange={(e) => setEventForm({...eventForm, organizer: e.target.value})}
                    placeholder="Event organizer"
                    disabled={isSubmittingEvent}
                  />
                </div>
                
                <div className="form-group">
                  <label>Max Attendees</label>
                  <input
                    type="number"
                    value={eventForm.maxAttendees}
                    onChange={(e) => setEventForm({...eventForm, maxAttendees: e.target.value})}
                    placeholder="Maximum attendees"
                    min="1"
                    disabled={isSubmittingEvent}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={eventForm.isRecurring}
                      onChange={(e) => setEventForm({...eventForm, isRecurring: e.target.checked})}
                      disabled={isSubmittingEvent}
                    />
                    Recurring Event
                  </label>
                </div>
                
                {eventForm.isRecurring && (
                  <div className="form-group">
                    <label>Recurring Pattern</label>
                    <select
                      value={eventForm.recurringPattern}
                      onChange={(e) => setEventForm({...eventForm, recurringPattern: e.target.value})}
                      disabled={isSubmittingEvent}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmittingEvent}
                  style={{ opacity: isSubmittingEvent ? 0.7 : 1 }}
                >
                  {isSubmittingEvent && <Spinner />}
                  {isSubmittingEvent 
                    ? (editingEvent ? 'Updating Event...' : 'Creating Event...') 
                    : (editingEvent ? 'Update Event' : 'Create Event')
                  }
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEventModalOpen(false)} 
                  className="btn-secondary"
                  disabled={isSubmittingEvent}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {isAnnouncementModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content announcement-modal">
            <div className="modal-header">
              <h2>{editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</h2>
              <button onClick={() => setIsAnnouncementModalOpen(false)} className="close-btn">✕</button>
            </div>
            
            <form onSubmit={handleAnnouncementSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                    required
                    placeholder="Enter announcement title"
                    disabled={isSubmittingAnnouncement}
                  />
                </div>
                
                <div className="form-group">
                  <label>Priority *</label>
                  <select
                    value={announcementForm.priority}
                    onChange={(e) => setAnnouncementForm({...announcementForm, priority: e.target.value})}
                    required
                    disabled={isSubmittingAnnouncement}
                  >
                    {PRIORITY_LEVELS.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Content *</label>
                <textarea
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                  required
                  placeholder="Enter announcement content"
                  rows="4"
                  disabled={isSubmittingAnnouncement}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={announcementForm.category}
                    onChange={(e) => setAnnouncementForm({...announcementForm, category: e.target.value})}
                    placeholder="e.g., General, Urgent, Fellowship"
                    disabled={isSubmittingAnnouncement}
                  />
                </div>
                
                <div className="form-group">
                  <label>Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={announcementForm.expiryDate}
                    onChange={(e) => setAnnouncementForm({...announcementForm, expiryDate: e.target.value})}
                    disabled={isSubmittingAnnouncement}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={announcementForm.isActive}
                    onChange={(e) => setAnnouncementForm({...announcementForm, isActive: e.target.checked})}
                    disabled={isSubmittingAnnouncement}
                  />
                  Active Announcement
                </label>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmittingAnnouncement}
                  style={{ opacity: isSubmittingAnnouncement ? 0.7 : 1 }}
                >
                  {isSubmittingAnnouncement && <Spinner />}
                  {isSubmittingAnnouncement 
                    ? (editingAnnouncement ? 'Updating Announcement...' : 'Creating Announcement...') 
                    : (editingAnnouncement ? 'Update Announcement' : 'Publish Announcement')
                  }
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsAnnouncementModalOpen(false)} 
                  className="btn-secondary"
                  disabled={isSubmittingAnnouncement}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMS Modal */}
   {isSMSModalOpen && (
  <div className="modal-overlay">
    <div className="modal-content sms-modal">
      <div className="modal-header">
        <h2>📱 Send SMS Notification</h2>
        <button onClick={() => setIsSMSModalOpen(false)} className="close-btn">✕</button>
      </div>
      
      <div className="sms-content">
        {currentAnnouncement && (
          <div className="announcement-preview">
            <h3>📢 {currentAnnouncement.title}</h3>
            <p>{currentAnnouncement.content}</p>
          </div>
        )}
        
        {!smsOption ? (
          <div className="sms-options">
            <p>Choose who to send this announcement to:</p>
            <div className="option-buttons">
              <button 
                className="option-btn"
                onClick={() => setSmsOption('all')}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '15px 30px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  margin: '10px',
                  fontSize: '16px'
                }}
              >
                📢 Send to All Members ({members.filter(m => m.contact).length})
              </button>
              <button 
                className="option-btn"
                onClick={() => setSmsOption('specify')}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  padding: '15px 30px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  margin: '10px',
                  fontSize: '16px'
                }}
              >
                🎯 Select Specific Groups
              </button>
            </div>
          </div>
        ) : (
          <div className="sms-confirmation">
            {smsOption === 'all' ? (
              <div className="all-members-confirm">
                <h3>Send to All Members</h3>
                <p>This will send the SMS to {members.filter(m => m.contact).length} members with valid phone numbers.</p>
                <div className="sms-actions">
                  <button 
                    onClick={handleSMSSendWithGroups}
                    disabled={isSendingSMS}
                    style={{
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      opacity: isSendingSMS ? 0.7 : 1
                    }}
                  >
                    {isSendingSMS && <Spinner />}
                    {isSendingSMS ? 'Sending SMS...' : '📤 Send SMS'}
                  </button>
                  <button 
                    onClick={() => setSmsOption('')}
                    disabled={isSendingSMS}
                    style={{
                      backgroundColor: '#f44336',
                      color: 'white',
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      marginLeft: '10px'
                    }}
                  >
                    ← Back
                  </button>
                </div>
              </div>
            ) : (
              <div className="select-groups">
                {!groupType ? (
                  <div className="group-type-selection">
                    <h3>Select Group Type:</h3>
                    <div className="group-type-buttons">
                      <button 
                        onClick={() => setGroupType('organization')}
                        style={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          padding: '15px 30px',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          margin: '10px',
                          fontSize: '16px'
                        }}
                      >
                        🏢 Organizations
                      </button>
                      <button 
                        onClick={() => setGroupType('class')}
                        style={{
                          backgroundColor: '#2196F3',
                          color: 'white',
                          padding: '15px 30px',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          margin: '10px',
                          fontSize: '16px'
                        }}
                      >
                        🎓 Classes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="group-selection">
                    <h3>Select {groupType === 'organization' ? 'Organizations' : 'Classes'}:</h3>
                    
                    <div className="groups-list" style={{
                      maxHeight: '400px',
                      overflowY: 'auto',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      padding: '10px'
                    }}>
                      {(groupType === 'organization' ? ORGANIZATIONS : CLASSES).map(groupName => {
                        const memberCount = groupMembers[groupType === 'organization' ? 'organizations' : 'classes']?.[groupName]?.length || 0;
                        
                        return (
                          <div 
                            key={groupName} 
                            className="group-item"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px',
                              borderBottom: '1px solid #eee',
                              cursor: 'pointer',
                              backgroundColor: selectedGroups.includes(groupName) ? '#e3f2fd' : 'white'
                            }}
                            onClick={() => handleGroupSelect(groupName)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <input
                                type="checkbox"
                                checked={selectedGroups.includes(groupName)}
                                onChange={() => handleGroupSelect(groupName)}
                                style={{ marginRight: '10px' }}
                              />
                              <div>
                                <strong>{groupName}</strong>
                                <br />
                                <small>{memberCount} members with valid phone numbers</small>
                              </div>
                            </div>
                            
                            {memberCount > 0 && (
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                <details>
                                  <summary>View Members</summary>
                                  <div style={{ marginTop: '5px', fontSize: '11px' }}>
                                    {groupMembers[groupType === 'organization' ? 'organizations' : 'classes'][groupName]?.map(member => (
                                      <div key={member.id}>
                                        {member.firstName} {member.lastName} - {member.contact}
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="selected-count" style={{
                      margin: '15px 0',
                      padding: '10px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '5px'
                    }}>
                      <strong>
                        Selected: {selectedGroups.length} {groupType === 'organization' ? 'organizations' : 'classes'}
                        {selectedGroups.length > 0 && (
                          <span> - Total members: {
                            selectedGroups.reduce((total, groupName) => {
                              return total + (groupMembers[groupType === 'organization' ? 'organizations' : 'classes'][groupName]?.length || 0);
                            }, 0)
                          }</span>
                        )}
                      </strong>
                    </div>
                    
                    <div className="sms-actions">
                      <button 
                        onClick={handleSMSSendWithGroups}
                        disabled={isSendingSMS || selectedGroups.length === 0}
                        style={{
                          backgroundColor: selectedGroups.length > 0 ? '#4CAF50' : '#ccc',
                          color: 'white',
                          padding: '10px 20px',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: selectedGroups.length > 0 ? 'pointer' : 'not-allowed',
                          opacity: isSendingSMS ? 0.7 : 1
                        }}
                      >
                        {isSendingSMS && <Spinner />}
                        {isSendingSMS ? 'Sending SMS...' : `📤 Send SMS to ${selectedGroups.length} ${groupType === 'organization' ? 'organizations' : 'classes'}`}
                      </button>
                      <button 
                        onClick={() => setGroupType('')}
                        disabled={isSendingSMS}
                        style={{
                          backgroundColor: '#f44336',
                          color: 'white',
                          padding: '10px 20px',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          marginLeft: '10px'
                        }}
                      >
                        ← Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
)}

      {/* Event Type Modal */}
      {isEventTypeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Add New Event Type</h2>
              <button onClick={() => setIsEventTypeModalOpen(false)} className="close-btn">✕</button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div className="form-group">
                <label>Event Type Name *</label>
                <input
                  type="text"
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value)}
                  placeholder="Enter new event type"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    marginBottom: '15px'
                  }}
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  onClick={handleAddEventType}
                  disabled={!newEventType.trim()}
                  style={{
                    backgroundColor: newEventType.trim() ? '#4CAF50' : '#ccc',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: newEventType.trim() ? 'pointer' : 'not-allowed',
                    marginRight: '10px'
                  }}
                >
                  Add Event Type
                </button>
                <button 
                  onClick={() => {
                    setIsEventTypeModalOpen(false);
                    setNewEventType('');
                  }}
                  style={{
                    backgroundColor: '#f44336',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;