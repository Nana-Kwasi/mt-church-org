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
  Dimensions,
} from 'react-native';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const AssignMemberScreen = ({ navigation }) => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isBirthdayModalVisible, setIsBirthdayModalVisible] = useState(false);
  const [birthdayMembers, setBirthdayMembers] = useState({ today: [], upcoming: [] });
  const [paymentData, setPaymentData] = useState({});
  const [selectedPaymentAmount, setSelectedPaymentAmount] = useState('');
  const [children, setChildren] = useState([]);
  const [isChildFieldVisible, setIsChildFieldVisible] = useState(false);
  const [selectedChild, setSelectedChild] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [smsSentToday, setSmsSentToday] = useState(new Set());
  const [adminSmsSentToday, setAdminSmsSentToday] = useState(new Set());
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [smsStatus, setSmsStatus] = useState('');

  const db = getFirestore();
  const storage = getStorage();

  const BIRTHDAY_MESSAGES = [
    {
      message: "🎉 Happy Birthday! 🎂 May God bless you with many more years of joy, peace, and prosperity. 'For I know the plans I have for you,' declares the Lord, 'plans to prosper you and not to harm you, to give you hope and a future.' - Jeremiah 29:11. Mt Zion Methodist Church family celebrates with you today!",
      verse: "Jeremiah 29:11"
    },
    {
      message: "🎂 Blessed Birthday! 🎉 On this special day, we thank God for your life and pray that His grace continues to shine upon you. 'The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.' - Numbers 6:24-25. Enjoy your special day! - Mt Zion Methodist Church",
      verse: "Numbers 6:24-25"
    },
    {
      message: "🎉 Happy Birthday dear member! 🎂 May this new year of your life be filled with God's abundant blessings. 'This is the day the Lord has made; let us rejoice and be glad in it.' - Psalm 118:24. Mt Zion Methodist Church wishes you a wonderful celebration!",
      verse: "Psalm 118:24"
    },
    {
      message: "🎂 Celebrating you today! 🎉 May God's love surround you on your birthday and always. 'And we know that in all things God works for the good of those who love him.' - Romans 8:28. Have a blessed birthday! - Mt Zion Methodist Church Family",
      verse: "Romans 8:28"
    },
    {
      message: "🎉 Happy Birthday! 🎂 Another year of God's faithfulness in your life! 'Every good and perfect gift is from above, coming down from the Father of the heavenly lights.' - James 1:17. May your day be filled with joy and laughter! Mt Zion Methodist Church celebrates you!",
      verse: "James 1:17"
    }
  ];

  // SMS tracking functions
  const hasSmsSentToday = (memberId) => {
    const today = new Date().toDateString();
    const key = `${memberId}-${today}`;
    return smsSentToday.has(key);
  };

  const hasAdminSmsSentToday = (memberId) => {
    const today = new Date().toDateString();
    const key = `admin-${memberId}-${today}`;
    return adminSmsSentToday.has(key);
  };

  const markSmsSent = async (memberId) => {
    const today = new Date().toDateString();
    const key = `${memberId}-${today}`;
    
    setSmsSentToday(prev => {
      const newSet = new Set([...prev, key]);
      const dataToSave = {};
      newSet.forEach(item => {
        dataToSave[item] = true;
      });
      AsyncStorage.setItem('smsSentToday', JSON.stringify(dataToSave));
      return newSet;
    });
  };

  const markAdminSmsSent = async (memberId) => {
    const today = new Date().toDateString();
    const key = `admin-${memberId}-${today}`;
    
    setAdminSmsSentToday(prev => {
      const newSet = new Set([...prev, key]);
      const dataToSave = {};
      newSet.forEach(item => {
        dataToSave[item] = true;
      });
      AsyncStorage.setItem('adminSmsSentToday', JSON.stringify(dataToSave));
      return newSet;
    });
  };

  // SMS sending functions
  const sendBirthdaySMS = async (phoneNumber, memberName, age) => {
    try {
      console.log("==== BIRTHDAY SMS SENDING DEBUG START ====");
      
      const hubtelEndpoint = 'https://smsc.hubtel.com/v1/messages/send';
      const clientId = 'vxojxzbs';
      const clientSecret = 'uznaitfd';
      
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      
      if (!formattedPhone.startsWith('233')) {
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '233' + formattedPhone.substring(1);
        } else {
          formattedPhone = '233' + formattedPhone;
        }
      }
      
      const randomMessage = BIRTHDAY_MESSAGES[Math.floor(Math.random() * BIRTHDAY_MESSAGES.length)];
      const personalizedMessage = `Dear ${memberName}, ${randomMessage.message}`;
      
      console.log("Sending birthday SMS to:", formattedPhone);
      console.log("Message:", personalizedMessage);
      
      const credentials = btoa(`${clientId}:${clientSecret}`);
      
      const payload = {
        From: 'MtZionMeth',
        To: formattedPhone,
        Content: personalizedMessage
      };
      
      let response = await fetch(hubtelEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok && response.status === 401) {
        const formData = new URLSearchParams({
          clientid: clientId,
          clientsecret: clientSecret,
          from: 'MtZionMeth',
          to: formattedPhone,
          content: personalizedMessage
        });
        
        response = await fetch(hubtelEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: formData
        });
      }
      
      const result = await response.json();
      console.log("Birthday SMS Response:", result);
      
      if (response.ok) {
        console.log(`✅ Birthday SMS sent successfully to ${memberName} (${formattedPhone})`);
        return { success: true, message: 'Birthday SMS sent successfully', result };
      } else {
        console.error("❌ Failed to send birthday SMS:", result);
        let errorMessage = result.statusDescription || result.message || 'Unknown error';
        
        if (result.status === 100) {
          errorMessage = "Invalid authentication - Check your API credentials";
        } else if (result.status === 101) {
          errorMessage = "Insufficient credit - Please fund your SMS API account";
        } else if (result.status === 102) {
          errorMessage = "Invalid phone number format";
        }
        
        return { 
          success: false, 
          message: `Failed to send birthday SMS: ${errorMessage}`,
          result
        };
      }
      
    } catch (error) {
      console.error("❌ Error sending birthday SMS:", error);
      return { success: false, message: error.message };
    }
  };

  const sendBirthdayNotificationToAdmin = async (memberName, memberAge, memberPhone, memberId) => {
    if (hasAdminSmsSentToday(memberId)) {
      console.log(`ℹ️  Admin notification already sent today for ${memberName}`);
      return { success: true, message: 'Admin notification already sent today' };
    }

    try {
      const adminPhone = "233244536389";
      const notificationMessage = `🎂 BIRTHDAY ALERT: ${memberName} (Age: ${memberAge}) is celebrating their birthday today! Contact: ${memberPhone || 'Not available'}. Birthday SMS has been sent automatically. - Mt Zion Methodist Church System`;
      
      console.log("Sending birthday notification to admin:", adminPhone);
      console.log("Admin notification message:", notificationMessage);
      
      const hubtelEndpoint = 'https://smsc.hubtel.com/v1/messages/send';
      const clientId = 'vxojxzbs';
      const clientSecret = 'uznaitfd';
      
      const credentials = btoa(`${clientId}:${clientSecret}`);
      
      const payload = {
        From: 'MtZionMeth',
        To: adminPhone,
        Content: notificationMessage
      };
      
      let response = await fetch(hubtelEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok && response.status === 401) {
        const formData = new URLSearchParams({
          clientid: clientId,
          clientsecret: clientSecret,
          from: 'MtZionMeth',
          to: adminPhone,
          content: notificationMessage
        });
        
        response = await fetch(hubtelEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: formData
        });
      }
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Birthday notification sent to admin successfully for ${memberName}`);
        await markAdminSmsSent(memberId);
        return { success: true, message: 'Admin notification sent successfully' };
      } else {
        console.error("❌ Failed to send admin notification:", result);
        return { success: false, message: `Failed to send admin notification: ${result.message || 'Unknown error'}` };
      }
      
    } catch (error) {
      console.error("❌ Error sending admin notification:", error);
      return { success: false, message: error.message };
    }
  };

  const sendBirthdaySMSToAll = async (birthdayMembers) => {
    console.log(`📱 Starting bulk SMS send to ${birthdayMembers.length} members...`);
    
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    for (const [index, member] of birthdayMembers.entries()) {
      console.log(`📤 Processing ${index + 1}/${birthdayMembers.length}: ${member.firstName} ${member.lastName}`);
      
      if (!member.contact) {
        console.log(`⚠️  No contact number for ${member.firstName} ${member.lastName}`);
        results.push({
          member: `${member.firstName} ${member.lastName}`,
          phone: 'No contact',
          success: false,
          message: 'No contact number available'
        });
        failCount++;
        
        await sendBirthdayNotificationToAdmin(
          `${member.firstName} ${member.lastName}`,
          member.age,
          'No contact available',
          member.id
        );
        
        continue;
      }
      
      if (hasSmsSentToday(member.id)) {
        console.log(`ℹ️  SMS already sent today for ${member.firstName} ${member.lastName}`);
        results.push({
          member: `${member.firstName} ${member.lastName}`,
          phone: member.contact,
          success: true,
          message: 'SMS already sent today'
        });
        successCount++;
        continue;
      }
      
      try {
        const result = await sendBirthdaySMS(
          member.contact, 
          `${member.firstName} ${member.lastName}`, 
          member.age
        );
        
        if (result.success) {
          await markSmsSent(member.id);
          successCount++;
          console.log(`✅ Success: ${member.firstName} ${member.lastName}`);
          
          setTimeout(async () => {
            await sendBirthdayNotificationToAdmin(
              `${member.firstName} ${member.lastName}`,
              member.age,
            member.contact, 
            member.id
          );
          }, 2000);
          
        } else {
          failCount++;
          console.log(`❌ Failed: ${member.firstName} ${member.lastName} - ${result.message}`);
          
          setTimeout(async () => {
            await sendBirthdayNotificationToAdmin(
              `${member.firstName} ${member.lastName}`,
              member.age,
              member.contact,
              member.id
            );
          }, 2000);
        }
          
          results.push({
          member: `${member.firstName} ${member.lastName}`,
          phone: member.contact,
          ...result
        });
        
        if (index < birthdayMembers.length - 1) {
          console.log("⏳ Waiting 15 seconds to avoid rate limiting...");
          await new Promise(resolve => setTimeout(resolve, 15000));
        }
        
        } catch (error) {
        console.error(`💥 Error sending SMS to ${member.firstName} ${member.lastName}:`, error);
          results.push({
          member: `${member.firstName} ${member.lastName}`,
          phone: member.contact,
            success: false,
          message: error.message
        });
        failCount++;
        
        setTimeout(async () => {
          await sendBirthdayNotificationToAdmin(
            `${member.firstName} ${member.lastName}`,
            member.age,
            member.contact,
            member.id
          );
        }, 2000);
      }
    }
    
    console.log(`📊 Bulk SMS Results: ✅ ${successCount} successful, ❌ ${failCount} failed`);
    return results;
  };

  const handleManualBirthdaySMS = async () => {
    const membersNeedingSMS = birthdayMembers.today.filter(member => 
      member.contact && !hasSmsSentToday(member.id)
    );

    if (membersNeedingSMS.length === 0) {
      Alert.alert('Info', 'All members with valid phone numbers have already received birthday SMS today!');
      return;
    }

    Alert.alert(
      'Send Birthday SMS',
      `Send birthday SMS to ${membersNeedingSMS.length} member(s) who haven't received it yet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setIsSendingSMS(true);
            setSmsStatus('Sending SMS...');
            
            try {
              const results = await sendBirthdaySMSToAll(membersNeedingSMS);
              const successCount = results.filter(r => r.success).length;
              const failCount = results.length - successCount;
              
              setSmsStatus(`SMS Results: ✅ Sent: ${successCount}, ❌ Failed: ${failCount}`);
              
              Alert.alert(
                'SMS Results',
                `✅ Successfully sent: ${successCount}\n❌ Failed: ${failCount}\nAdmin notifications sent for all members.`
              );
              
              const birthdayData = getBirthdayMembers();
              setBirthdayMembers(birthdayData);
            } catch (error) {
              console.error('Error sending manual birthday SMS:', error);
              Alert.alert('Error', 'Error sending SMS. Please try again.');
            } finally {
              setIsSendingSMS(false);
            }
          }
        }
      ]
    );
  };

  const loadSMSTracking = async () => {
    try {
      const savedSMS = await AsyncStorage.getItem('smsSentToday');
      const savedAdminSMS = await AsyncStorage.getItem('adminSmsSentToday');
      
      if (savedSMS) {
        const parsed = JSON.parse(savedSMS);
        const today = new Date().toDateString();
        const validKeys = Object.keys(parsed).filter(key => key.endsWith(today));
        setSmsSentToday(new Set(validKeys));
      }
      
      if (savedAdminSMS) {
        const parsed = JSON.parse(savedAdminSMS);
        const today = new Date().toDateString();
        const validKeys = Object.keys(parsed).filter(key => key.endsWith(today));
        setAdminSmsSentToday(new Set(validKeys));
      }
    } catch (error) {
      console.error('Error loading SMS tracking:', error);
    }
  };

  // Birthday functions
  const getBirthdayMembers = () => {
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    
    const todayBirthdays = [];
    const upcomingBirthdays = [];
    
    members.forEach(member => {
      if (member.dob) {
        const dobParts = member.dob.split('-');
        if (dobParts.length === 3) {
          const birthMonth = parseInt(dobParts[1]);
          const birthDay = parseInt(dobParts[2]);
          const birthYear = parseInt(dobParts[0]);
          
          let age = today.getFullYear() - birthYear;
          if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
            age--;
          }
          
          if (birthMonth === todayMonth && birthDay === todayDay) {
            todayBirthdays.push({
              ...member,
              age: age + 1,
              birthdayDate: `${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`
            });
          } else {
            const thisYearBirthday = new Date(today.getFullYear(), birthMonth - 1, birthDay);
            let nextBirthday = thisYearBirthday;
            
            if (thisYearBirthday < today) {
              nextBirthday = new Date(today.getFullYear() + 1, birthMonth - 1, birthDay);
            }
            
            const daysUntilBirthday = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntilBirthday > 0 && daysUntilBirthday <= 30) {
              upcomingBirthdays.push({
                ...member,
                age: nextBirthday.getFullYear() - birthYear,
                daysUntil: daysUntilBirthday,
                birthdayDate: `${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`
              });
            }
          }
        }
      }
    });
    
    upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);
    
    return { today: todayBirthdays, upcoming: upcomingBirthdays };
  };

  const checkBirthdays = () => {
    const birthdayData = getBirthdayMembers();
    setBirthdayMembers(birthdayData);
  };

  const handleBirthdayButtonClick = () => {
    const birthdayData = getBirthdayMembers();
    setBirthdayMembers(birthdayData);
    setIsBirthdayModalVisible(true);
  };

  // Image upload functions
  const handleImageSelect = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset);
        setImagePreview(asset.uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage || !selectedMember.id) {
      Alert.alert('Error', 'Please select an image and ensure member is selected.');
      return;
    }

      setUploadingImage(true);
    
    try {
      const response = await fetch(selectedImage.uri);
      const blob = await response.blob();
      
      const imageRef = ref(storage, `member-images/${selectedMember.id}_${Date.now()}`);
      
      const snapshot = await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setSelectedMember(prev => ({
        ...prev,
        profileImage: downloadURL
      }));
      
      setSelectedImage(null);
      setImagePreview(null);
      
      Alert.alert('Success', 'Image uploaded successfully!');
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setSelectedMember(prev => ({
      ...prev,
      profileImage: null
    }));
    setSelectedImage(null);
    setImagePreview(null);
  };

  const fetchMembers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "Members"));
      const membersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMembers(membersData);
      setFilteredMembers(membersData);
    } catch (error) {
      console.error("Error fetching members:", error);
      setError("Error fetching members. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async () => {
    try {
      const childrenSnapshot = await getDocs(collection(db, "Children"));
      const childrenData = childrenSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        fullName: `${doc.data().firstName || ''} ${doc.data().lastName || ''}`.trim()
      }));
      setChildren(childrenData);
    } catch (error) {
      console.error("Error fetching children:", error);
    }
  };

  const fetchPaymentData = async (memberId) => {
    try {
      const paymentsRef = collection(db, "Money Collections");
      const q = query(paymentsRef, where("memberId", "==", memberId));
      const snapshot = await getDocs(q);
      const payments = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        payments[data.paymentType] = data.amount;
      });
      setPaymentData(payments);
      return payments;
    } catch (error) {
      console.error("Error fetching payment data:", error);
      return {};
    }
  };

  const filterMembers = () => {
    if (searchQuery.trim() === '') {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(member =>
        member.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.contact?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMembers(filtered);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const handleRowClick = async (member) => {
    const payments = await fetchPaymentData(member.id);
    setSelectedMember(member);
    setSelectedPaymentAmount(payments[member.membershipFee] || "");
    setIsModalVisible(true);
  };

  const handleInputChange = (field, value) => {
    if (field === "membershipFee") {
      setSelectedPaymentAmount(paymentData[value] || "");
      setSelectedMember(prev => ({
        ...prev,
        [field]: value,
        paymentAmount: paymentData[value] || ""
      }));
    } else if (field === "paymentAmount") {
      setSelectedPaymentAmount(value);
      setSelectedMember(prev => ({
        ...prev,
        paymentAmount: value
      }));
    } else {
      setSelectedMember(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleChildSelect = (childId) => {
    setSelectedChild(childId);
    
    setSelectedMember(prev => {
      const updatedChildren = prev.children || [];
      if (childId && !updatedChildren.includes(childId)) {
        return {
          ...prev,
          children: [...updatedChildren, childId]
        };
      }
      return prev;
    });
  };

  const handleSaveChanges = async () => {
    try {
      const childrenWithNames = selectedMember.children?.map(childId => {
        const child = children.find(c => c.id === childId);
        return {
          id: childId,
          name: child ? (child.name || `${child.firstName} ${child.lastName}`) : '',
        };
      }) || [];

      const updateData = {
        ...selectedMember,
        children: childrenWithNames,
        profileImage: selectedMember.profileImage || null
      };

      const memberRef = doc(db, "Members", selectedMember.id);
      await updateDoc(memberRef, updateData);
      
      if (selectedMember.membershipFee && selectedPaymentAmount) {
        const paymentsRef = collection(db, "Money Collections");
        const q = query(
          paymentsRef, 
          where("memberId", "==", selectedMember.id),
          where("paymentType", "==", selectedMember.membershipFee)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const paymentDocRef = snapshot.docs[0].ref;
          await updateDoc(paymentDocRef, {
            amount: Number(selectedPaymentAmount)
          });
        } else {
          await addDoc(paymentsRef, {
            memberId: selectedMember.id,
            paymentType: selectedMember.membershipFee,
            amount: Number(selectedPaymentAmount)
          });
        }
      }

      setMembers(prev => 
        prev.map(member => 
          member.id === selectedMember.id ? updateData : member
        )
      );
      
      setSelectedImage(null);
      setImagePreview(null);
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error updating member:", error);
      Alert.alert('Error', 'Failed to update member');
    }
  };

  const handleDeleteMember = async () => {
    Alert.alert(
      'Delete Member',
      'Are you sure you want to delete this member? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const memberRef = doc(db, "Members", selectedMember.id);
              await deleteDoc(memberRef);
              setMembers((prev) => prev.filter((member) => member.id !== selectedMember.id));
              setIsModalVisible(false);
              Alert.alert('Success', 'Member deleted successfully');
            } catch (error) {
              console.error("Error deleting member:", error);
              Alert.alert('Error', 'Failed to delete member');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    fetchMembers();
    fetchChildren();
    loadSMSTracking();
    checkBirthdays();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, members]);

  // Automatic birthday SMS sending
  useEffect(() => {
    const sendAutomaticBirthdaySMS = async () => {
      if (members.length === 0) return;

      const birthdayData = getBirthdayMembers();
      const todaysBirthdays = birthdayData.today;

      if (todaysBirthdays.length > 0) {
        const membersNeedingSMS = todaysBirthdays.filter(member => 
          member.contact && !hasSmsSentToday(member.id)
        );
        
        const membersNeedingAdminSMS = todaysBirthdays.filter(member => 
          !hasAdminSmsSentToday(member.id)
        );

        if (membersNeedingSMS.length > 0 || membersNeedingAdminSMS.length > 0) {
          console.log(`Found ${membersNeedingSMS.length} members needing SMS and ${membersNeedingAdminSMS.length} needing admin notification`);
          
          const results = await sendBirthdaySMSToAll(todaysBirthdays);
          
          const successCount = results.filter(r => r.success).length;
          const failCount = results.length - successCount;
          
          console.log(`📱 Birthday SMS Results: ✅ Sent: ${successCount}, ❌ Failed: ${failCount}`);
                          } else {
          console.log('All birthday members have already received SMS and admin notifications today');
        }
      }
    };

    if (members.length > 0) {
      sendAutomaticBirthdaySMS();
    }
  }, [members]);

  // Optional: Set up interval to check every hour for new birthdays
  useEffect(() => {
    const checkBirthdaysInterval = setInterval(async () => {
      if (members.length > 0) {
        const birthdayData = getBirthdayMembers();
        const todaysBirthdays = birthdayData.today;
        
        const membersNeedingSMS = todaysBirthdays.filter(member => 
          member.contact && !hasSmsSentToday(member.id)
        );
        
        if (membersNeedingSMS.length > 0) {
          console.log(`Hourly check: Found ${membersNeedingSMS.length} new birthday member(s) needing SMS`);
          
          const results = await sendBirthdaySMSToAll(membersNeedingSMS);
          
          const successCount = results.filter(r => r.success).length;
          console.log(`📱 Hourly SMS Results: ✅ Sent: ${successCount} new birthday messages`);
        }
      }
    }, 3600000); // Check every hour (3600000 ms)

    return () => clearInterval(checkBirthdaysInterval);
  }, [members]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading members...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMembers}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Members</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
            placeholder="Search by Name or Contact..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
            onChangeText={handleSearch}
          />
          
          <TouchableOpacity 
            style={styles.birthdayButton}
            onPress={handleBirthdayButtonClick}
          >
            <Text style={styles.birthdayButtonText}>🎂 View Birthdays</Text>
          </TouchableOpacity>
        </View>
      </View>

      {filteredMembers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No matching members found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.memberCard}
              onPress={() => handleRowClick(item)}
            >
              <View style={styles.memberInfo}>
                <View style={styles.profileContainer}>
                  {item.profileImage ? (
                    <Image 
                      source={{ uri: item.profileImage }} 
                      style={styles.profileImage}
                    />
                  ) : (
                    <View style={styles.profilePlaceholder}>
                      <Text style={styles.profileInitials}>
                        {item.firstName ? item.firstName.charAt(0).toUpperCase() : '?'}
                        {item.lastName ? item.lastName.charAt(0).toUpperCase() : ''}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>
                    {item.firstName || "N/A"} {item.lastName || "N/A"}
                  </Text>
                  <Text style={styles.memberContact}>{item.contact || "N/A"}</Text>
                  <Text style={styles.memberAge}>Age: {item.age || "N/A"}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Birthday Modal */}
      <Modal
        visible={isBirthdayModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsBirthdayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.birthdayModalContainer}>
            <View style={styles.birthdayModalHeader}>
              <Text style={styles.birthdayModalTitle}>🎂 Birthday Celebrations</Text>
              <TouchableOpacity
                style={styles.birthdayModalClose}
                onPress={() => setIsBirthdayModalVisible(false)}
              >
                <Text style={styles.birthdayModalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.birthdayModalContent}>
              <View style={styles.birthdaySection}>
                <Text style={styles.birthdaySectionTitle}>
                  🎉 Today's Birthdays ({birthdayMembers.today.length})
                </Text>
                
                {birthdayMembers.today.length > 0 && (
                  <View style={styles.smsStatusContainer}>
                    <Text style={styles.smsStatusText}>
                      <Text style={styles.boldText}>SMS Status Summary:</Text>{' '}
                      {birthdayMembers.today.filter(m => hasSmsSentToday(m.id)).length} sent, {' '}
                      {birthdayMembers.today.filter(m => !hasSmsSentToday(m.id) && m.contact).length} pending, {' '}
                      {birthdayMembers.today.filter(m => !m.contact).length} no contact
                    </Text>
                  </View>
                )}

                {birthdayMembers.today.length > 0 ? (
                  <View style={styles.birthdayList}>
                    {birthdayMembers.today.map((member) => (
                      <View key={member.id} style={styles.birthdayCard}>
                        <Text style={styles.birthdayCardTitle}>
                          {member.firstName} {member.lastName}
                          <Text style={[
                            styles.smsStatusBadge,
                            { backgroundColor: hasSmsSentToday(member.id) ? '#28a745' : '#dc3545' }
                          ]}>
                            {hasSmsSentToday(member.id) ? '✅ SMS Sent' : '❌ SMS Not Sent'}
                          </Text>
                        </Text>
                        <Text style={styles.birthdayCardText}>
                          <Text style={styles.boldText}>Turning:</Text> {member.age} years old
                        </Text>
                        <Text style={styles.birthdayCardText}>
                          <Text style={styles.boldText}>Contact:</Text> {member.contact || 'N/A'}
                        </Text>
                        <Text style={styles.birthdayCardText}>
                          <Text style={styles.boldText}>Class:</Text> {member.class || 'N/A'}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noBirthdaysText}>No birthdays today.</Text>
                )}

                {birthdayMembers.today.length > 0 && (
                  <View style={styles.smsActionContainer}>
                    <TouchableOpacity
                      style={[styles.smsActionButton, isSendingSMS && styles.disabledButton]}
                      onPress={handleManualBirthdaySMS}
                      disabled={isSendingSMS}
                    >
                      {isSendingSMS ? (
                        <ActivityIndicator color={Colors.surface} size="small" />
                      ) : (
                        <Text style={styles.smsActionButtonText}>
                          📱 Send Birthday SMS to Pending Members
                        </Text>
                      )}
                    </TouchableOpacity>
                    <Text style={styles.smsActionNote}>
                      Only sends to members who haven't received SMS today
                    </Text>
                    {smsStatus ? (
                      <Text style={styles.smsStatus}>{smsStatus}</Text>
                    ) : null}
                  </View>
                )}
              </View>

              <View style={styles.birthdaySection}>
                <Text style={styles.birthdaySectionTitle}>
                  📅 Upcoming Birthdays (Next 30 Days) ({birthdayMembers.upcoming.length})
                </Text>
                
                {birthdayMembers.upcoming.length > 0 ? (
                  <View style={styles.birthdayList}>
                    {birthdayMembers.upcoming.map((member) => (
                      <View key={member.id} style={styles.upcomingBirthdayCard}>
                        <Text style={styles.birthdayCardTitle}>
                          {member.firstName} {member.lastName}
                        </Text>
                        <Text style={styles.birthdayCardText}>
                          <Text style={styles.boldText}>Days Until Birthday:</Text> {member.daysUntil} days
                        </Text>
                        <Text style={styles.birthdayCardText}>
                          <Text style={styles.boldText}>Turning:</Text> {member.age} years old
                        </Text>
                        <Text style={styles.birthdayCardText}>
                          <Text style={styles.boldText}>Birthday:</Text> {member.birthdayDate}
                        </Text>
                        <Text style={styles.birthdayCardText}>
                          <Text style={styles.boldText}>Contact:</Text> {member.contact || 'N/A'}
                        </Text>
                        <Text style={styles.birthdayCardText}>
                          <Text style={styles.boldText}>Class:</Text> {member.class || 'N/A'}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noBirthdaysText}>No upcoming birthdays in the next 30 days.</Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.birthdayModalFooter}>
              <TouchableOpacity
                style={styles.birthdayModalCloseButton}
                onPress={() => setIsBirthdayModalVisible(false)}
              >
                <Text style={styles.birthdayModalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Member Details Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Member Details</Text>
            <TouchableOpacity 
              style={styles.closeButtonContainer}
              onPress={() => setIsModalVisible(false)}
            >
                <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>
          
            <ScrollView style={styles.modalContent}>
              {selectedMember ? (
                <View>
                  <Text style={styles.debugText}>Debug: Member loaded - {selectedMember.firstName}</Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.debugText}>Debug: No member selected</Text>
                </View>
              )}
              
              <View style={styles.imageSection}>
                <View style={styles.imageContainer}>
                  {selectedMember?.profileImage ? (
                    <Image 
                      source={{ uri: selectedMember.profileImage }} 
                      style={styles.imagePreview}
                    />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Text style={styles.placeholderText}>No Image</Text>
                    </View>
                  )}
                  
                  <View style={styles.imageButtons}>
                    <TouchableOpacity
                      style={styles.imageButton}
                      onPress={handleImageSelect}
                    >
                      <Text style={styles.imageButtonText}>Select Image</Text>
                  </TouchableOpacity>
                    
                    {imagePreview && (
                      <TouchableOpacity
                        style={[styles.imageButton, styles.uploadButton]}
                        onPress={handleImageUpload}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? (
                          <ActivityIndicator color={Colors.surface} size="small" />
                        ) : (
                          <Text style={styles.imageButtonText}>Upload</Text>
                        )}
                      </TouchableOpacity>
                    )}
                    
                    {selectedMember?.profileImage && (
                      <TouchableOpacity
                        style={[styles.imageButton, styles.removeButton]}
                        onPress={removeImage}
                      >
                        <Text style={styles.imageButtonText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Title</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.title || ''}
                  onChangeText={(value) => handleInputChange('title', value)}
                  placeholder="Title (Mr., Mrs., etc.)"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>First Name</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.firstName || ''}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                  placeholder="First name"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Name</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.lastName || ''}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                  placeholder="Last name"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Middle Name</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.middleName || ''}
                  onChangeText={(value) => handleInputChange('middleName', value)}
                  placeholder="Middle name"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.contact || ''}
                  onChangeText={(value) => handleInputChange('contact', value)}
                  placeholder="Contact number"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Gender</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.gender || ''}
                  onChangeText={(value) => handleInputChange('gender', value)}
                  placeholder="Gender"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date of Birth</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.dob || ''}
                  onChangeText={(value) => handleInputChange('dob', value)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Age</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.age || ''}
                  onChangeText={(value) => handleInputChange('age', value)}
                  placeholder="Age"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Membership</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.membership || ''}
                  onChangeText={(value) => handleInputChange('membership', value)}
                  placeholder="Membership type"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Class</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.class || ''}
                  onChangeText={(value) => handleInputChange('class', value)}
                  placeholder="Class"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assign Class Leader</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.assignClassLeader || ''}
                  onChangeText={(value) => handleInputChange('assignClassLeader', value)}
                  placeholder="Class leader"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Home Town</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.homeTown || ''}
                  onChangeText={(value) => handleInputChange('homeTown', value)}
                  placeholder="Home town"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Home Region</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.homeRegion || ''}
                  onChangeText={(value) => handleInputChange('homeRegion', value)}
                  placeholder="Home region"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>GPS</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.gps || ''}
                  onChangeText={(value) => handleInputChange('gps', value)}
                  placeholder="GPS coordinates"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Profession</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.profession || ''}
                  onChangeText={(value) => handleInputChange('profession', value)}
                  placeholder="Profession"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Employment Status</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.employmentStatus || ''}
                  onChangeText={(value) => handleInputChange('employmentStatus', value)}
                  placeholder="Employment status"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Marital Status</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.maritalStatus || ''}
                  onChangeText={(value) => handleInputChange('maritalStatus', value)}
                  placeholder="Marital status"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Organisations</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.organisations || ''}
                  onChangeText={(value) => handleInputChange('organisations', value)}
                  placeholder="Organisations"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Role</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedMember?.role || ''}
                  onChangeText={(value) => handleInputChange('role', value)}
                  placeholder="Role"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <Text style={styles.sectionTitle}>Payment Information</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Membership Fee Type</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => {
                      Alert.alert(
                        'Select Payment Type',
                        'Choose a payment type:',
                        [
                          { text: 'Tithe', onPress: () => handleInputChange('membershipFee', 'Tithe') },
                          { text: 'Welfare', onPress: () => handleInputChange('membershipFee', 'Welfare') },
                          { text: 'Funeral Contributions', onPress: () => handleInputChange('membershipFee', 'Funeral Contributions') },
                          { text: 'Special Offerings', onPress: () => handleInputChange('membershipFee', 'Special Offerings') },
                          { text: 'Cancel', style: 'cancel' }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.dropdownButtonText}>
                      {selectedMember?.membershipFee || 'Select Payment Type'}
                      </Text>
                  </TouchableOpacity>
                    </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Amount</Text>
                <TextInput
                  style={styles.detailInput}
                  value={selectedPaymentAmount}
                  onChangeText={(value) => handleInputChange('paymentAmount', value)}
                  placeholder="Payment amount"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.sectionTitle}>Children Assignment</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assign Child</Text>
                <TouchableOpacity
                  style={styles.childSelectButton}
                  onPress={() => setIsChildFieldVisible(!isChildFieldVisible)}
                >
                  <Text style={styles.childSelectButtonText}>
                    {isChildFieldVisible ? 'Hide Children' : 'Show Children'}
                  </Text>
                </TouchableOpacity>
              </View>
                
              {isChildFieldVisible && (
                <View style={styles.childrenList}>
                  {children.map((child) => (
                <TouchableOpacity
                      key={child.id}
                      style={[
                        styles.childItem,
                        selectedMember?.children?.includes(child.id) && styles.selectedChildItem
                      ]}
                      onPress={() => handleChildSelect(child.id)}
                    >
                      <Text style={styles.childItemText}>
                        {child.fullName || `${child.firstName} ${child.lastName}`}
                      </Text>
                </TouchableOpacity>
                  ))}
              </View>
              )}

              <View style={styles.actionButtons}>
            <TouchableOpacity 
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={handleSaveChanges}
            >
                  <Text style={styles.actionButtonText}>Save Changes</Text>
            </TouchableOpacity>
          
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDeleteMember}
                >
                  <Text style={styles.actionButtonText}>Delete Member</Text>
                </TouchableOpacity>
            </View>
          </ScrollView>
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
  header: {
    backgroundColor: Colors.surface,
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  birthdayButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  birthdayButtonText: {
    color: Colors.surface,
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  memberCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  profilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  profileInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  memberContact: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  memberAge: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  birthdayModalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  birthdayModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  birthdayModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  birthdayModalClose: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  birthdayModalCloseText: {
    fontSize: 20,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  birthdayModalContent: {
    flex: 1,
    padding: 16,
  },
  birthdaySection: {
    marginBottom: 24,
  },
  birthdaySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: 8,
  },
  birthdayList: {
    marginBottom: 15,
  },
  birthdayCard: {
    backgroundColor: '#fff5f5',
    borderWidth: 2,
    borderColor: '#ff6b6b',
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
  },
  upcomingBirthdayCard: {
    backgroundColor: '#f0fffe',
    borderWidth: 2,
    borderColor: '#4ecdc4',
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
  },
  birthdayCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  birthdayCardText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
  noBirthdaysText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  smsStatusContainer: {
    backgroundColor: '#e9ecef',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  smsStatusText: {
    fontSize: 14,
    color: Colors.text,
  },
  smsStatusBadge: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    color: Colors.surface,
    marginLeft: 10,
  },
  smsActionContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  smsActionButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  disabledButton: {
    backgroundColor: Colors.textSecondary,
  },
  smsActionButtonText: {
    color: Colors.surface,
    fontWeight: 'bold',
    fontSize: 14,
  },
  smsActionNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  smsStatus: {
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  birthdayModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  birthdayModalCloseButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  birthdayModalCloseButtonText: {
    color: Colors.surface,
    fontWeight: 'bold',
    fontSize: 16,
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButtonContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: 8,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
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
  imageButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  imageButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadButton: {
    backgroundColor: '#28a745',
  },
  removeButton: {
    backgroundColor: '#dc3545',
  },
  imageButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  detailInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  childSelectButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  childSelectButtonText: {
    color: Colors.surface,
    fontWeight: 'bold',
  },
  childrenList: {
    marginTop: 10,
  },
  childItem: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedChildItem: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  childItemText: {
    color: Colors.text,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 32,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: Colors.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownButton: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  debugText: {
    fontSize: 14,
    color: Colors.error,
    backgroundColor: '#ffebee',
    padding: 8,
    marginBottom: 10,
    borderRadius: 4,
  },
});

export default AssignMemberScreen;