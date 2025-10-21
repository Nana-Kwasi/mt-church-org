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
  FlatList,
} from 'react-native';
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { Colors } from '../constants/colors';

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    members: [],
    events: [],
    announcements: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [hasSearched, setHasSearched] = useState(false);

  const searchCollections = async (query) => {
    if (!query.trim()) {
      setSearchResults({ members: [], events: [], announcements: [] });
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      const db = getFirestore();
      const searchTerm = query.toLowerCase();

      // Search Members
      const membersRef = collection(db, 'Members');
      const membersSnapshot = await getDocs(membersRef);
      const members = membersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(member => 
          member.name?.toLowerCase().includes(searchTerm) ||
          member.email?.toLowerCase().includes(searchTerm) ||
          member.contact?.includes(query) ||
          member.address?.toLowerCase().includes(searchTerm)
        )
        .slice(0, 10); // Limit results

      // Search Events
      const eventsRef = collection(db, 'Events');
      const eventsSnapshot = await getDocs(eventsRef);
      const events = eventsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(event => 
          event.title?.toLowerCase().includes(searchTerm) ||
          event.description?.toLowerCase().includes(searchTerm) ||
          event.type?.toLowerCase().includes(searchTerm)
        )
        .slice(0, 10);

      // Search Announcements
      const announcementsRef = collection(db, 'Announcements');
      const announcementsSnapshot = await getDocs(announcementsRef);
      const announcements = announcementsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(announcement => 
          announcement.title?.toLowerCase().includes(searchTerm) ||
          announcement.content?.toLowerCase().includes(searchTerm)
        )
        .slice(0, 10);

      setSearchResults({
        members,
        events,
        announcements
      });
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchCollections(searchQuery);
  };

  const renderMemberItem = ({ item }) => (
    <TouchableOpacity style={styles.resultItem}>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle}>{item.name || 'No Name'}</Text>
        <Text style={styles.resultSubtitle}>{item.email || 'No Email'}</Text>
        <Text style={styles.resultDetails}>
          {item.contact ? `Contact: ${item.contact}` : 'No Contact'}
        </Text>
        {item.organization && (
          <Text style={styles.resultDetails}>Organization: {item.organization}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEventItem = ({ item }) => (
    <TouchableOpacity style={styles.resultItem}>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle}>{item.title || 'No Title'}</Text>
        <Text style={styles.resultSubtitle}>{item.type || 'No Type'}</Text>
        {item.date && (
          <Text style={styles.resultDetails}>
            Date: {new Date(item.date).toLocaleDateString()}
          </Text>
        )}
        {item.description && (
          <Text style={styles.resultDetails} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderAnnouncementItem = ({ item }) => (
    <TouchableOpacity style={styles.resultItem}>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle}>{item.title || 'No Title'}</Text>
        <Text style={styles.resultSubtitle}>
          Priority: {item.priority || 'Medium'}
        </Text>
        <Text style={styles.resultDetails} numberOfLines={2}>
          {item.content || 'No Content'}
        </Text>
        {item.createdAt && (
          <Text style={styles.resultDetails}>
            {item.createdAt.toDate?.() ? 
              item.createdAt.toDate().toLocaleDateString() : 
              'Unknown Date'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderResults = () => {
    if (!hasSearched) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Enter a search term to find members, events, and announcements</Text>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    const allResults = [
      ...searchResults.members.map(item => ({ ...item, type: 'member' })),
      ...searchResults.events.map(item => ({ ...item, type: 'event' })),
      ...searchResults.announcements.map(item => ({ ...item, type: 'announcement' }))
    ];

    if (allResults.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No results found for "{searchQuery}"</Text>
          <Text style={styles.emptyStateSubtext}>Try different keywords or check spelling</Text>
        </View>
      );
    }

    if (activeTab === 'all') {
      return (
        <FlatList
          data={allResults}
          renderItem={({ item }) => {
            switch (item.type) {
              case 'member':
                return renderMemberItem({ item });
              case 'event':
                return renderEventItem({ item });
              case 'announcement':
                return renderAnnouncementItem({ item });
              default:
                return null;
            }
          }}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (activeTab === 'members') {
      return (
        <FlatList
          data={searchResults.members}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item.id}
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (activeTab === 'events') {
      return (
        <FlatList
          data={searchResults.events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (activeTab === 'announcements') {
      return (
        <FlatList
          data={searchResults.announcements}
          renderItem={renderAnnouncementItem}
          keyExtractor={(item) => item.id}
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search members, events, announcements..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All ({searchResults.members.length + searchResults.events.length + searchResults.announcements.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.activeTab]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
            Members ({searchResults.members.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && styles.activeTab]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
            Events ({searchResults.events.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'announcements' && styles.activeTab]}
          onPress={() => setActiveTab('announcements')}
        >
          <Text style={[styles.tabText, activeTab === 'announcements' && styles.activeTabText]}>
            Announcements ({searchResults.announcements.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        {renderResults()}
      </View>
    </View>
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
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 12,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: Colors.surface,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.text,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  resultsList: {
    flex: 1,
    padding: 16,
  },
  resultItem: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
});

export default SearchScreen;
