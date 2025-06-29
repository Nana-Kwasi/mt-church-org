import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, addDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, getStorage } from "firebase/storage"; 
import app from "../../Component/Config/Config";
import "../../donation.css";
import "../modal.css"



const AssignMember = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isBirthdayModalVisible, setIsBirthdayModalVisible] = useState(false);
  const [birthdayMembers, setBirthdayMembers] = useState({ today: [], upcoming: [] });
  const [paymentData, setPaymentData] = useState({});
  const [selectedPaymentAmount, setSelectedPaymentAmount] = useState("");
  const [children, setChildren] = useState([]);
  const [isChildFieldVisible, setIsChildFieldVisible] = useState(false);
  const [selectedChild, setSelectedChild] = useState("");
   const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);






  const db = getFirestore(app);
  const storage = getStorage(app); // Initialize storage here

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

const [smsSentToday, setSmsSentToday] = useState(() => {
  const saved = localStorage.getItem('smsSentToday');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Convert back to Set and filter out old dates
      const today = new Date().toDateString();
      const validKeys = Object.keys(parsed).filter(key => key.endsWith(today));
      return new Set(validKeys);
    } catch (error) {
      console.error('Error parsing SMS tracking data:', error);
      return new Set();
    }
  }
  return new Set();
});

const [adminSmsSentToday, setAdminSmsSentToday] = useState(() => {
  const saved = localStorage.getItem('adminSmsSentToday');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Convert back to Set and filter out old dates
      const today = new Date().toDateString();
      const validKeys = Object.keys(parsed).filter(key => key.endsWith(today));
      return new Set(validKeys);
    } catch (error) {
      console.error('Error parsing admin SMS tracking data:', error);
      return new Set();
    }
  }
  return new Set();
});



const hasAdminSmsSentToday = (memberId) => {
  const today = new Date().toDateString();
  const key = `admin-${memberId}-${today}`;
  return adminSmsSentToday.has(key);
};
const cleanupOldSMSData = () => {
  const today = new Date().toDateString();
  
  // Clean up regular SMS tracking
  const savedSMS = localStorage.getItem('smsSentToday');
  if (savedSMS) {
    try {
      const parsed = JSON.parse(savedSMS);
      const validKeys = Object.keys(parsed).filter(key => key.endsWith(today));
      const cleanedData = {};
      validKeys.forEach(key => {
        cleanedData[key] = true;
      });
      localStorage.setItem('smsSentToday', JSON.stringify(cleanedData));
      setSmsSentToday(new Set(validKeys));
    } catch (error) {
      console.error('Error cleaning SMS data:', error);
    }
  }
  
  // Clean up admin SMS tracking
  const savedAdminSMS = localStorage.getItem('adminSmsSentToday');
  if (savedAdminSMS) {
    try {
      const parsed = JSON.parse(savedAdminSMS);
      const validKeys = Object.keys(parsed).filter(key => key.endsWith(today));
      const cleanedData = {};
      validKeys.forEach(key => {
        cleanedData[key] = true;
      });
      localStorage.setItem('adminSmsSentToday', JSON.stringify(cleanedData));
      setAdminSmsSentToday(new Set(validKeys));
    } catch (error) {
      console.error('Error cleaning admin SMS data:', error);
    }
  }
};

// Add this useEffect to clean up old data on component mount
useEffect(() => {
  cleanupOldSMSData();
}, []);


// Mark admin SMS as sent for today for a specific member
const markAdminSmsSent = (memberId) => {
  const today = new Date().toDateString();
  const key = `admin-${memberId}-${today}`;
  
  setAdminSmsSentToday(prev => {
    const newSet = new Set([...prev, key]);
    // Save to localStorage
    const dataToSave = {};
    newSet.forEach(item => {
      dataToSave[item] = true;
    });
    localStorage.setItem('adminSmsSentToday', JSON.stringify(dataToSave));
    return newSet;
  });
};
const handleManualBirthdaySMS = async () => {
  const membersNeedingSMS = birthdayMembers.today.filter(member => 
    member.contact && !hasSmsSentToday(member.id)
  );

  if (membersNeedingSMS.length === 0) {
    alert('All members with valid phone numbers have already received birthday SMS today!');
    return;
  }

  const confirmSend = window.confirm(
    `Send birthday SMS to ${membersNeedingSMS.length} member(s) who haven't received it yet?`
  );

  if (confirmSend) {
    try {
      const results = await sendBirthdaySMSToAll(membersNeedingSMS);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      alert(`SMS Results:\n✅ Successfully sent: ${successCount}\n❌ Failed: ${failCount}\nAdmin notifications sent for all members.`);
      
      // Force re-render to update SMS status indicators
      setBirthdayMembers(getBirthdayMembers());
    } catch (error) {
      console.error('Error sending manual birthday SMS:', error);
      alert('Error sending SMS. Please try again.');
    }
  }
};
const sendBirthdayNotificationToAdmin = async (memberName, memberAge, memberPhone, memberId) => {
  // Check if admin notification was already sent today for this member
  if (hasAdminSmsSentToday(memberId)) {
    console.log(`ℹ️  Admin notification already sent today for ${memberName}`);
    return { success: true, message: 'Admin notification already sent today' };
  }

  try {
    const adminPhone = "233244536389"; // Admin number
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
    
    // Try alternative methods if first fails
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
      // Mark admin SMS as sent for this member today
      markAdminSmsSent(memberId);
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
const sendBirthdaySMS = async (phoneNumber, memberName, age) => {
  try {
    console.log("==== BIRTHDAY SMS SENDING DEBUG START ====");
    
    // Updated endpoint - use the correct Hubtel SMS API endpoint
    const hubtelEndpoint = 'https://smsc.hubtel.com/v1/messages/send';
    const clientId = 'vxojxzbs';
    const clientSecret = 'uznaitfd';
    
    // Format phone number - ensure it starts with country code
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    
    // Add Ghana country code if not present
    if (!formattedPhone.startsWith('233')) {
      // Remove leading zero if present and add 233
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '233' + formattedPhone.substring(1);
      } else {
        formattedPhone = '233' + formattedPhone;
      }
    }
    
    // Select random birthday message
    const randomMessage = BIRTHDAY_MESSAGES[Math.floor(Math.random() * BIRTHDAY_MESSAGES.length)];
    const personalizedMessage = `Dear ${memberName}, ${randomMessage.message}`;
    
    console.log("Sending birthday SMS to:", formattedPhone);
    console.log("Message:", personalizedMessage);
    
    // METHOD 1: Basic Authentication (Recommended by Hubtel)
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
    
    // METHOD 2: If Basic Auth fails, try form parameters with credentials
    if (!response.ok && response.status === 401) {
      console.log("Basic Auth failed, trying form parameters...");
      
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
    
    // METHOD 3: Alternative endpoint if main one fails
    if (!response.ok && (response.status === 404 || response.status === 400)) {
      console.log("Trying alternative endpoint...");
      
      const altEndpoint = 'https://api.hubtel.com/v1/messages/send';
      const credentials = btoa(`${clientId}:${clientSecret}`);
      
      response = await fetch(altEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          From: 'MtZionMeth',
          To: formattedPhone,
          Content: personalizedMessage
        })
      });
    }
    
    const result = await response.json();
    console.log("Birthday SMS Response:", result);
    console.log("Response Status:", response.status);
    console.log("Response Headers:", [...response.headers.entries()]);
    
    if (response.ok) {
      console.log(`✅ Birthday SMS sent successfully to ${memberName} (${formattedPhone})`);
      return { success: true, message: 'Birthday SMS sent successfully', result };
    } else {
      console.error("❌ Failed to send birthday SMS:", result);
      
      // Handle specific error cases
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

// Test function to verify API credentials and connection

// Enhanced function with better error handling and retry logic

const sendBirthdaySMSWithRetry = async (phoneNumber, memberName, age, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`📱 Attempt ${attempt}/${maxRetries} - Sending SMS to ${memberName}`);
    
    const result = await sendBirthdaySMS(phoneNumber, memberName, age);
    
    if (result.success) {
      return result;
    }
    
    // Don't retry for authentication or credit issues
    if (result.result?.status === 100 || result.result?.status === 101) {
      console.log("❌ Not retrying due to authentication/credit issue");
      return result;
    }
    
    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  return { success: false, message: `Failed after ${maxRetries} attempts` };
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
      
      // Send admin notification even if member has no contact (with member ID)
      await sendBirthdayNotificationToAdmin(
        `${member.firstName} ${member.lastName}`,
        member.age,
        'No contact available',
        member.id // Pass member ID for tracking
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
      const result = await sendBirthdaySMSWithRetry(
        member.contact, 
        `${member.firstName} ${member.lastName}`, 
        member.age
      );
      
      if (result.success) {
        markSmsSent(member.id);
        successCount++;
        console.log(`✅ Success: ${member.firstName} ${member.lastName}`);
        
        // Send admin notification after successful SMS (with member ID)
        setTimeout(async () => {
          await sendBirthdayNotificationToAdmin(
            `${member.firstName} ${member.lastName}`,
            member.age,
            member.contact,
            member.id // Pass member ID for tracking
          );
        }, 2000); // 2 second delay to avoid rate limiting
        
      } else {
        failCount++;
        console.log(`❌ Failed: ${member.firstName} ${member.lastName} - ${result.message}`);
        
        // Send admin notification even if SMS failed (with member ID)
        setTimeout(async () => {
          await sendBirthdayNotificationToAdmin(
            `${member.firstName} ${member.lastName}`,
            member.age,
            member.contact,
            member.id // Pass member ID for tracking
          );
        }, 2000);
      }
      
      results.push({
        member: `${member.firstName} ${member.lastName}`,
        phone: member.contact,
        ...result
      });
      
      // Add delay between SMS to avoid rate limiting
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
      
      // Send admin notification for error cases too (with member ID)
      setTimeout(async () => {
        await sendBirthdayNotificationToAdmin(
          `${member.firstName} ${member.lastName}`,
          member.age,
          member.contact,
          member.id // Pass member ID for tracking
        );
      }, 2000);
    }
  }
  
  console.log(`📊 Bulk SMS Results: ✅ ${successCount} successful, ❌ ${failCount} failed`);
  return results;
};
// SMS sending function for birthdays
// Fixed SMS sending function for birthdays

// Alternative function if the above doesn't work - try Basic Auth
const sendBirthdaySMSWithAuth = async (phoneNumber, memberName, age) => {
  try {
    console.log("==== TRYING BASIC AUTH METHOD ====");
    
    const hubtelEndpoint = 'https://smsc.hubtel.com/v1/messages/send';
    const clientId = 'vxojxzbs';
    const clientSecret = 'uznaitfd';
    
    // Format phone number
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
    
    // Create Basic Auth header
    const credentials = btoa(`${clientId}:${clientSecret}`);
    
    const payload = {
      From: 'MtZionMeth',
      To: formattedPhone,
      Content: personalizedMessage
    };
    
    const response = await fetch(hubtelEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.text();
    console.log("Basic Auth SMS Response:", result);
    
    if (response.ok) {
      return { success: true, message: 'Birthday SMS sent successfully' };
    } else {
      return { 
        success: false, 
        message: `Failed: ${response.status} - ${result}` 
      };
    }
    
  } catch (error) {
    console.error("Error with Basic Auth SMS:", error);
    return { success: false, message: error.message };
  }
};

// Test function to debug the API

// Function to send SMS to all today's birthday members


// Add state for SMS tracking (add to your useState declarations)

// Function to check if SMS was already sent today
const hasSmsSentToday = (memberId) => {
  const today = new Date().toDateString();
  const key = `${memberId}-${today}`;
  return smsSentToday.has(key);
};


// Mark SMS as sent for today
const markSmsSent = (memberId) => {
  const today = new Date().toDateString();
  const key = `${memberId}-${today}`;
  
  setSmsSentToday(prev => {
    const newSet = new Set([...prev, key]);
    // Save to localStorage
    const dataToSave = {};
    newSet.forEach(item => {
      dataToSave[item] = true;
    });
    localStorage.setItem('smsSentToday', JSON.stringify(dataToSave));
    return newSet;
  });
};

// Automatic birthday SMS sending - add this useEffect
useEffect(() => {
  const sendAutomaticBirthdaySMS = async () => {
    if (members.length === 0) return;

    const birthdayData = getBirthdayMembers();
    const todaysBirthdays = birthdayData.today;

    if (todaysBirthdays.length > 0) {
      // Filter members who haven't received SMS today
      const membersNeedingSMS = todaysBirthdays.filter(member => 
        member.contact && !hasSmsSentToday(member.id)
      );
      
      const membersNeedingAdminSMS = todaysBirthdays.filter(member => 
        !hasAdminSmsSentToday(member.id)
      );

      if (membersNeedingSMS.length > 0 || membersNeedingAdminSMS.length > 0) {
        console.log(`Found ${membersNeedingSMS.length} members needing SMS and ${membersNeedingAdminSMS.length} needing admin notification`);
        
        // Use the sendBirthdaySMSToAll function
        const results = await sendBirthdaySMSToAll(todaysBirthdays);
        
        // Log results
        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;
        
        console.log(`📱 Birthday SMS Results: ✅ Sent: ${successCount}, ❌ Failed: ${failCount}`);
      } else {
        console.log('All birthday members have already received SMS and admin notifications today');
      }
    }
  };

  // Send SMS automatically when component loads and members are fetched
  if (members.length > 0) {
    sendAutomaticBirthdaySMS();
  }
}, [members]);

// Optional: Add a function to manually reset SMS tracking (for testing)
const resetSMSTracking = () => {
  localStorage.removeItem('smsSentToday');
  localStorage.removeItem('adminSmsSentToday');
  setSmsSentToday(new Set());
  setAdminSmsSentToday(new Set());
  console.log('SMS tracking reset');
};
// Optional: Set up interval to check every hour for new birthdays
useEffect(() => {
  const checkBirthdaysInterval = setInterval(async () => {
    if (members.length > 0) {
      const birthdayData = getBirthdayMembers();
      const todaysBirthdays = birthdayData.today;
      
      // Filter members who haven't received SMS today
      const membersNeedingSMS = todaysBirthdays.filter(member => 
        member.contact && !hasSmsSentToday(member.id)
      );
      
      if (membersNeedingSMS.length > 0) {
        console.log(`Hourly check: Found ${membersNeedingSMS.length} new birthday member(s) needing SMS`);
        
        // Use the sendBirthdaySMSToAll function for new members
        const results = await sendBirthdaySMSToAll(membersNeedingSMS);
        
        const successCount = results.filter(r => r.success).length;
        console.log(`📱 Hourly SMS Results: ✅ Sent: ${successCount} new birthday messages`);
      }
    }
  }, 3600000); // Check every hour (3600000 ms)

  return () => clearInterval(checkBirthdaysInterval);
}, [members]);

// Optional: Add SMS status indicator in birthday modal
{birthdayMembers.today.length > 0 && (
  <div style={{ 
    marginTop: '15px', 
    padding: '10px', 
    backgroundColor: '#e8f5e8', 
    borderRadius: '5px',
    fontSize: '14px',
    color: '#155724'
  }}>
    📱 Birthday SMS automatically sent to members with valid phone numbers
  </div>
)}




// const handleImageUpload = async () => {
//   if (!selectedImage || !selectedMember.id) return;
  
//   setUploadingImage(true);
//   try {
//     // Create a reference to the image in Firebase Storage
//     const imageRef = ref(storage, `member-images/${selectedMember.id}_${Date.now()}`);
    
//     // Upload the image
//     const snapshot = await uploadBytes(imageRef, selectedImage);
    
//     // Get the download URL
//     const downloadURL = await getDownloadURL(snapshot.ref);
    
//     // Update the selected member with the image URL
//     setSelectedMember(prev => ({
//       ...prev,
//       profileImage: downloadURL
//     }));
    
//     // Clear the selected image and preview
//     setSelectedImage(null);
//     setImagePreview(null);
    
//     alert("Image uploaded successfully!");
//   } catch (error) {
//     console.error("Error uploading image:", error);
//     alert("Error uploading image. Please try again.");
//   } finally {
//     setUploadingImage(false);
//   }
// };

const handleImageSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }
    
    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.');
      return;
    }
    
    setSelectedImage(file);
    // Create preview URL
    const previewURL = URL.createObjectURL(file);
    setImagePreview(previewURL);
  }
};
const handleImageUpload = async () => {
  if (!selectedImage || !selectedMember.id) {
    alert("Please select an image and ensure member is selected.");
    return;
  }
  
  // Check if user is authenticated using your custom auth system
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  const userRole = localStorage.getItem('userRole');
  
  if (!userId || !userName || !userRole) {
    alert("You must be logged in to upload images. Please login again.");
    // Redirect to login if not authenticated
    window.location.href = '/'; // or use navigate('/') if you have access to useNavigate
    return;
  }
  
  setUploadingImage(true);
  try {
    console.log("Starting upload for member:", selectedMember.id);
    console.log("Authenticated user:", { userId, userName, userRole });
    console.log("File details:", {
      name: selectedImage.name,
      size: selectedImage.size,
      type: selectedImage.type
    });
    
    // Create a reference to the image in Firebase Storage
    const imageRef = ref(storage, `member-images/${selectedMember.id}_${Date.now()}`);
    
    // Upload the image
    console.log("Uploading to:", imageRef.fullPath);
    const snapshot = await uploadBytes(imageRef, selectedImage);
    console.log("Upload successful:", snapshot);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("Download URL:", downloadURL);
    
    // Update the selected member with the image URL
    setSelectedMember(prev => ({
      ...prev,
      profileImage: downloadURL
    }));
    
    // Clear the selected image and preview
    setSelectedImage(null);
    setImagePreview(null);
    
    alert("Image uploaded successfully!");
  } catch (error) {
    console.error("Detailed error uploading image:", {
      code: error.code,
      message: error.message,
      details: error
    });
    
    // More specific error messages
    let errorMessage = "Error uploading image. ";
    if (error.code === 'storage/unauthorized') {
      errorMessage += "Permission denied. Please check your login status and try again.";
    } else if (error.code === 'storage/invalid-format') {
      errorMessage += "Invalid file format. Please use JPG, PNG, or GIF.";
    } else if (error.code === 'storage/quota-exceeded') {
      errorMessage += "Storage quota exceeded.";
    } else {
      errorMessage += `${error.message}`;
    }
    
    alert(errorMessage);
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

  useEffect(() => {
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
        console.log("Fetched children:", childrenData);  // Debug log
        setChildren(childrenData);
      } catch (error) {
        console.error("Error fetching children:", error);
      }
    };

    fetchMembers();
    fetchChildren();
  }, [db]);

  // Function to get today's birthdays and upcoming birthdays
  const getBirthdayMembers = () => {
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
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
          
          // Calculate age
          let age = today.getFullYear() - birthYear;
          if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
            age--;
          }
          
          // Check if birthday is today
          if (birthMonth === todayMonth && birthDay === todayDay) {
            todayBirthdays.push({
              ...member,
              age: age + 1, // Age they're turning today
              birthdayDate: `${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`
            });
          } else {
            // Check for upcoming birthdays (next 30 days)
            const thisYearBirthday = new Date(today.getFullYear(), birthMonth - 1, birthDay);
            let nextBirthday = thisYearBirthday;
            
            // If birthday has passed this year, check next year
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
    
    // Sort upcoming birthdays by days until birthday
    upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);
    
    return { today: todayBirthdays, upcoming: upcomingBirthdays };
  };

  const handleBirthdayButtonClick = () => {
    const birthdayData = getBirthdayMembers();
    setBirthdayMembers(birthdayData);
    setIsBirthdayModalVisible(true);
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

  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredMembers(
      members.filter(
        (member) =>
          member.firstName?.toLowerCase().includes(query) ||
          member.lastName?.toLowerCase().includes(query) ||
          member.contact?.toLowerCase().includes(query)
      )
    );
  };

  const handleRowClick = async (member) => {
    const payments = await fetchPaymentData(member.id);
    setSelectedMember(member);
    setSelectedPaymentAmount(payments[member.membershipFee] || "");
    setIsModalVisible(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "membershipFee") {
      setSelectedPaymentAmount(paymentData[value] || "");
      setSelectedMember(prev => ({
        ...prev,
        [name]: value,
        paymentAmount: paymentData[value] || ""
      }));
    } else if (name === "paymentAmount") {
      setSelectedPaymentAmount(value);
      setSelectedMember(prev => ({
        ...prev,
        paymentAmount: value
      }));
    } else {
      setSelectedMember(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveChanges = async () => {
    try {
      // Create an array of child objects with both ID and name
      const childrenWithNames = selectedMember.children?.map(childId => {
        const child = children.find(c => c.id === childId);
        return {
          id: childId,
          name: child ? (child.name || `${child.firstName} ${child.lastName}`) : '',
        };
      }) || [];
  
      // Prepare the update data
      const updateData = {
        ...selectedMember,
        children: childrenWithNames,
          profileImage: selectedMember.profileImage || null  // Add this line

      };
  
      console.log("Saving member with data:", updateData);
      const memberRef = doc(db, "Members", selectedMember.id);
      
      // Update the Members collection
      await updateDoc(memberRef, updateData);
  
      // Update the Money Collections collection
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
  
      // Update local state
      setMembers(prev =>
        prev.map(member =>
          member.id === selectedMember.id ? updateData : member
        )
      );
  
      cleanupImagePreview();
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error updating member:", error);
    }
  };
const cleanupImagePreview = () => {
  if (imagePreview) {
    URL.revokeObjectURL(imagePreview);
  }
  setSelectedImage(null);
  setImagePreview(null);
};
    const handleChildSelect = (e) => {
    const childId = e.target.value;
    console.log("Selected child ID:", childId);  // Debug log
    setSelectedChild(childId);
    
    // Update selectedMember with the new child
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

  const handleDeleteMember = async () => {
    try {
      const memberRef = doc(db, "Members", selectedMember.id);
      await deleteDoc(memberRef);
      setMembers((prev) => prev.filter((member) => member.id !== selectedMember.id));
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;




return (
  <div className="members">
    <h1>Manage Members</h1>
    <div className="search-bar-container">
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearch}
        placeholder="Search by Name or Contact..."
        className="search-bar"
      />
      <button 
        className="birthday-button"
        onClick={handleBirthdayButtonClick}
        style={{
          marginLeft: '10px',
          padding: '10px 15px',
          backgroundColor: '#ff6b6b',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        🎂 View Birthdays
      </button>
    </div>

    {filteredMembers.length === 0 ? (
      <div>No matching members found.</div>
    ) : (
      <div className="table-container">
        <table className="members-table">
          <thead>
            <tr>
              <th>Profile</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Contact</th>
              <th>Age</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr
                key={member.id}
                onClick={() => handleRowClick(member)}
                className="clickable-row"
              >
                <td>
                  {member.profileImage ? (
                    <img 
                      src={member.profileImage} 
                      alt={`${member.firstName} ${member.lastName}`}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #ddd'
                      }}
                    />
                  ) : (
                    <div 
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #ddd',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#666'
                      }}
                    >
                      {member.firstName ? member.firstName.charAt(0).toUpperCase() : '?'}
                      {member.lastName ? member.lastName.charAt(0).toUpperCase() : ''}
                    </div>
                  )}
                </td>
                <td>{member.firstName || "N/A"}</td>
                <td>{member.lastName || "N/A"}</td>
                <td>{member.contact || "N/A"}</td>
                <td>{member.age || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* Birthday Modal */}
    {isBirthdayModalVisible && (
      <div className="custom-modal-overlay">
        <div className="custom-modal-content" style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
          <div className="custom-modal-header">
            <h2>🎂 Birthday Celebrations</h2>
            <button
              className="custom-modal-close"
              onClick={() => setIsBirthdayModalVisible(false)}
            >
              &times;
            </button>
          </div>

          <div className="birthday-content">
            {/* Today's Birthdays */}
            <div className="birthday-section">
              <h3 style={{ color: '#ff6b6b', marginBottom: '15px' }}>
                🎉 Today's Birthdays ({birthdayMembers.today.length})
              </h3>
{birthdayMembers.today.length > 0 && (
<div style={{ 
  marginBottom: '15px', 
  padding: '10px', 
  backgroundColor: '#e9ecef', 
  borderRadius: '5px',
  fontSize: '14px'
}}>
  <strong>SMS Status Summary:</strong> {' '}
  {birthdayMembers.today.filter(m => hasSmsSentToday(m.id)).length} sent, {' '}
  {birthdayMembers.today.filter(m => !hasSmsSentToday(m.id) && m.contact).length} pending, {' '}
  {birthdayMembers.today.filter(m => !m.contact).length} no contact
</div>
)}
              {birthdayMembers.today.length > 0 ? (
                <div className="birthday-list">
               {birthdayMembers.today.map((member) => (
   <div 
  key={member.id} 
  className="birthday-card"
  style={{
    border: '2px solid #ff6b6b',
    borderRadius: '10px',
    padding: '15px',
    margin: '10px 0',
    backgroundColor: '#fff5f5',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }}
>
  <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
    {member.firstName} {member.lastName}
    {/* SMS Status Indicator */}
    <span style={{ 
      marginLeft: '10px', 
      fontSize: '12px', 
      padding: '2px 6px', 
      borderRadius: '10px',
      backgroundColor: hasSmsSentToday(member.id) ? '#28a745' : '#dc3545',
      color: 'white'
    }}>
      {hasSmsSentToday(member.id) ? '✅ SMS Sent' : '❌ SMS Not Sent'}
    </span>
  </h4>
  <p style={{ margin: '5px 0', color: '#666' }}>
    <strong>Turning:</strong> {member.age} years old
  </p>
  <p style={{ margin: '5px 0', color: '#666' }}>
    <strong>Contact:</strong> {member.contact || 'N/A'}
  </p>
  <p style={{ margin: '5px 0', color: '#666' }}>
    <strong>Class:</strong> {member.class || 'N/A'}
  </p>
</div>
))}
                </div>
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                  No birthdays today.
                </p>
              )}
            </div>
    {birthdayMembers.today.length > 0 && (
<div style={{ 
  marginTop: '15px', 
  padding: '15px', 
  backgroundColor: '#f8f9fa', 
  borderRadius: '5px',
  textAlign: 'center'
}}>
  <button
    onClick={handleManualBirthdaySMS}
    style={{
      padding: '10px 20px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '14px'
    }}
  >
    📱 Send Birthday SMS to Pending Members
  </button>
  <p style={{ 
    fontSize: '12px', 
    color: '#666', 
    marginTop: '8px',
    marginBottom: '0'
  }}>
    Only sends to members who haven't received SMS today
  </p>
</div>
)}
            {/* Upcoming Birthdays */}
            <div className="birthday-section" style={{ marginTop: '30px' }}>
              <h3 style={{ color: '#4ecdc4', marginBottom: '15px' }}>
                📅 Upcoming Birthdays (Next 30 Days) ({birthdayMembers.upcoming.length})
              </h3>
              {birthdayMembers.upcoming.length > 0 ? (
                <div className="birthday-list">
                  {birthdayMembers.upcoming.map((member) => (
                    <div 
                      key={member.id} 
                      className="birthday-card"
                      style={{
                        border: '2px solid #4ecdc4',
                        borderRadius: '10px',
                        padding: '15px',
                        margin: '10px 0',
                        backgroundColor: '#f0fffe',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
                        {member.firstName} {member.lastName}
                      </h4>
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>Days Until Birthday:</strong> {member.daysUntil} days
                      </p>
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>Turning:</strong> {member.age} years old
                      </p>
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>Birthday:</strong> {member.birthdayDate}
                      </p>
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>Contact:</strong> {member.contact || 'N/A'}
                      </p>
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>Class:</strong> {member.class || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                  No upcoming birthdays in the next 30 days.
                </p>
              )}
            </div>
          </div>

          <div className="custom-modal-buttons">
            <button
              className="cancel-button"
              onClick={() => setIsBirthdayModalVisible(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Regular Member Edit Modal */}
    {isModalVisible && (
      <div className="custom-modal-overlay">
        <div className="custom-modal-content">
          <div className="custom-modal-header">
            <h2>Edit Member Details</h2>
            <button
              className="custom-modal-close"
              onClick={() => setIsModalVisible(false)}
            >
              &times;
            </button>
          </div>

          <form className="custom-modal-form">
            <label>Title</label>
            <input
              type="text"
              name="title"
              value={selectedMember.title || ""}
              onChange={handleInputChange}
            />
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              value={selectedMember.firstName || ""}
              onChange={handleInputChange}
            />
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={selectedMember.lastName || ""}
              onChange={handleInputChange}
            />
            <label>Middle Name</label>
            <input
              type="text"
              name="middleName"
              value={selectedMember.middleName || ""}
              onChange={handleInputChange}
            />
             <label>Children</label>
            <div className="children-list">
              {selectedMember.children && selectedMember.children.map((child, index) => (
                <div key={index} className="child-entry">
                  <input
                    type="text"
                    value={child.name || ''}
                    onChange={(e) => {
                      const updatedChildren = [...selectedMember.children];
                      updatedChildren[index] = {
                        ...updatedChildren[index],
                        name: e.target.value
                      };
                      setSelectedMember(prev => ({
                        ...prev,
                        children: updatedChildren
                      }));
                    }}
                    placeholder="Child's name"
                  />
                </div>
              ))}
            </div>
            <label>Contact</label>
            <input
              type="text"
              name="contact"
              value={selectedMember.contact || ""}
              onChange={handleInputChange}
            />
            <label>Gender</label>
            <input
              type="text"
              name="gender"
              value={selectedMember.gender || ""}
              onChange={handleInputChange}
            />
            <label>Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={selectedMember.dob || ""}
              onChange={handleInputChange}
            />
            <label>Membership</label>
            <input
              type="text"
              name="membership"
              value={selectedMember.membership || ""}
              onChange={handleInputChange}
            />
            <label>Class</label>
            <input
              type="text"
              name="class"
              value={selectedMember.class || ""}
              onChange={handleInputChange}
            />
            <label>Assign Class Leader</label>
            <input
              type="text"
              name="assignClassLeader"
              value={selectedMember.assignClassLeader || ""}
              onChange={handleInputChange}
            />
            <label>Home Town</label>
            <input
              type="text"
              name="homeTown"
              value={selectedMember.homeTown || ""}
              onChange={handleInputChange}
            />
            <label>Home Region</label>
            <input
              type="text"
              name="homeRegion"
              value={selectedMember.homeRegion || ""}
              onChange={handleInputChange}
            />
            <label>GPS</label>
            <input
              type="text"
              name="gps"
              value={selectedMember.gps || ""}
              onChange={handleInputChange}
            />
            <label>Profession</label>
            <input
              type="text"
              name="profession"
              value={selectedMember.profession || ""}
              onChange={handleInputChange}
            />
            <label>Employment Status</label>
            <input
              type="text"
              name="employmentStatus"
              value={selectedMember.employmentStatus || ""}
              onChange={handleInputChange}
            />
            <label>Marital Status</label>
            <input
              type="text"
              name="maritalStatus"
              value={selectedMember.maritalStatus || ""}
              onChange={handleInputChange}
            />
            <label>Organisations</label>
            <input
              type="text"
              name="organisations"
              value={selectedMember.organisations || ""}
              onChange={handleInputChange}
            />
            <label>Role</label>
            <input
              type="text"
              name="role"
              value={selectedMember.role || ""}
              onChange={handleInputChange}
            />
            <div className="image-section">
<label>Profile Image</label>

{/* Current image display */}
{selectedMember.profileImage && !imagePreview && (
  <div className="current-image">
    <img 
      src={selectedMember.profileImage} 
      alt="Current profile" 
      style={{
        width: '100px', 
        height: '100px', 
        objectFit: 'cover', 
        borderRadius: '8px',
        marginBottom: '10px'
      }}
    />
    <button 
      type="button" 
      onClick={removeImage}
      style={{
        display: 'block',
        padding: '5px 10px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px'
      }}
    >
      Remove Image
    </button>
  </div>
)}

{/* Image preview */}
{imagePreview && (
  <div className="image-preview">
    <img 
      src={imagePreview} 
      alt="Preview" 
      style={{
        width: '100px', 
        height: '100px', 
        objectFit: 'cover', 
        borderRadius: '8px',
        marginBottom: '10px'
      }}
    />
  </div>
)}

{/* File input and upload button */}
<div className="image-upload-controls">
  <input
    type="file"
    accept="image/*"
    onChange={handleImageSelect}
    style={{ marginBottom: '10px' }}
  />
  
  {selectedImage && (
    <button
      type="button"
      onClick={handleImageUpload}
      disabled={uploadingImage}
      style={{
        padding: '8px 15px',
        backgroundColor: uploadingImage ? '#6c757d' : '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: uploadingImage ? 'not-allowed' : 'pointer',
        marginLeft: '10px'
      }}
    >
      {uploadingImage ? 'Uploading...' : 'Upload Image'}
    </button>
  )}
</div>
</div>
            
            <label>Membership Fee Type</label>
            <select
              name="membershipFee"
              value={selectedMember.membershipFee || ""}
              onChange={handleInputChange}
            >
              <option value="">Select Payment Type</option>
              <option value="Tithe">Tithe</option>
              <option value="Welfare">Welfare</option>
              <option value="Funeral Contributions">Funeral Contributions</option>
              <option value="Special Offerings">Special Offerings</option>
            </select>
            {selectedMember.membershipFee && (
              <>
                <label>Payment Amount</label>
                <input
                  type="number"
                  name="paymentAmount"
                  value={selectedPaymentAmount}
                  onChange={handleInputChange}
                />
              </>
            )}
<div className="child-section">
<button 
  type="button"
  className="add-child-button"
  onClick={() => setIsChildFieldVisible(!isChildFieldVisible)}
>
  {isChildFieldVisible ? 'Hide Child Selection' : 'Add a Child'}
</button>

{isChildFieldVisible && (
  <div className="child-select-container">
    <label className="child-select-label">Select Child</label>
    <div className="child-search">
      <select
        value={selectedChild}
        onChange={handleChildSelect}
        className="child-select"
      >
        <option value="">Select a child</option>
        {children
          .filter(child => 
            !selectedMember?.children?.includes(child.id)
          )
          .map((child) => (
            <option key={child.id} value={child.id}>
              {child.name || `${child.firstName} ${child.lastName}`}
            </option>
        ))}
      </select>
    </div>
  </div>
)}

{selectedMember?.children?.length > 0 && (
<div className="added-children-container">
  <label>Added Children:</label>
  <ul className="added-children-list">
    {selectedMember.children.map((childId) => {
      const child = children.find((c) => c.id === childId);
      return child ? (
        <li key={childId} className="added-child-item">
          <input
            type="text"
            value={child.name || `${child.firstName} ${child.lastName}`}
            onChange={(e) => {
              const updatedChildren = children.map(c => 
                c.id === childId ? {...c, name: e.target.value} : c
              );
              setChildren(updatedChildren);
            }}
          />
          <span 
            className="remove-child"
            onClick={() => {
              setSelectedMember(prev => ({
                ...prev,
                children: prev.children.filter(id => id !== childId)
              }));
            }}
            style={{ 
              marginLeft: '10px', 
              cursor: 'pointer',
              color: 'red',
              fontWeight: 'bold'
            }}
          >
            ×
          </span>
        </li>
      ) : null;
    })}
  </ul>
</div>
)}
</div>
 </form>

          <div className="custom-modal-buttons">
            <button className="save-button" onClick={handleSaveChanges}>
              Save Changes
            </button>
            <button className="delete-button" onClick={handleDeleteMember}>
              Delete Member
            </button>
            <button
              className="cancel-button"
            onClick={() => { cleanupImagePreview(); setIsModalVisible(false); }}              >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}

export default AssignMember;









// import React, { useState, useEffect } from "react";
// import { collection, getDocs, doc, updateDoc, deleteDoc, query, where,addDoc } from "firebase/firestore";
// import { getFirestore } from "firebase/firestore";
// import app from "../../Component/Config/Config";
// import "../../donation.css";
// import "../modal.css"

// const AssignMember = () => {
//   const [members, setMembers] = useState([]);
//   const [filteredMembers, setFilteredMembers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedMember, setSelectedMember] = useState(null);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [isBirthdayModalVisible, setIsBirthdayModalVisible] = useState(false);
//   const [birthdayMembers, setBirthdayMembers] = useState({ today: [], upcoming: [] });
//   const [paymentData, setPaymentData] = useState({});
//   const [selectedPaymentAmount, setSelectedPaymentAmount] = useState("");
//   const [children, setChildren] = useState([]);
//   const [isChildFieldVisible, setIsChildFieldVisible] = useState(false);
//   const [selectedChild, setSelectedChild] = useState("");
//   const [adminCopySentToday, setAdminCopySentToday] = useState(new Set());

//   const db = getFirestore(app);

// const BIRTHDAY_MESSAGES = [
//   {
//     message: "🎉 Happy Birthday! 🎂 May God bless you with many more years of joy, peace, and prosperity. 'For I know the plans I have for you,' declares the Lord, 'plans to prosper you and not to harm you, to give you hope and a future.' - Jeremiah 29:11. Mt Zion Methodist Church family celebrates with you today!",
//     verse: "Jeremiah 29:11"
//   },
//   {
//     message: "🎂 Blessed Birthday! 🎉 On this special day, we thank God for your life and pray that His grace continues to shine upon you. 'The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.' - Numbers 6:24-25. Enjoy your special day! - Mt Zion Methodist Church",
//     verse: "Numbers 6:24-25"
//   },
//   {
//     message: "🎉 Happy Birthday dear member! 🎂 May this new year of your life be filled with God's abundant blessings. 'This is the day the Lord has made; let us rejoice and be glad in it.' - Psalm 118:24. Mt Zion Methodist Church wishes you a wonderful celebration!",
//     verse: "Psalm 118:24"
//   },
//   {
//     message: "🎂 Celebrating you today! 🎉 May God's love surround you on your birthday and always. 'And we know that in all things God works for the good of those who love him.' - Romans 8:28. Have a blessed birthday! - Mt Zion Methodist Church Family",
//     verse: "Romans 8:28"
//   },
//   {
//     message: "🎉 Happy Birthday! 🎂 Another year of God's faithfulness in your life! 'Every good and perfect gift is from above, coming down from the Father of the heavenly lights.' - James 1:17. May your day be filled with joy and laughter! Mt Zion Methodist Church celebrates you!",
//     verse: "James 1:17"
//   }
// ];

// const hasAdminCopySmsSentToday = (memberId) => {
//   const today = new Date().toDateString();
//   const key = `admin-copy-${memberId}-${today}`;
//   return adminCopySentToday.has(key);
// };

// // Mark admin copy SMS as sent for today for a specific member
// const markAdminCopySmsSent = (memberId) => {
//   const today = new Date().toDateString();
//   const key = `admin-copy-${memberId}-${today}`;
//   setAdminCopySentToday(prev => new Set([...prev, key]));
// };
// const sendAdminCopyMessage = async (memberName, memberAge, memberContact) => {
//   try {
//     const adminPhone = "233592486117";
//     const copyMessage = `🎂 BIRTHDAY NOTIFICATION: ${memberName} is celebrating their ${memberAge}th birthday today! Contact: ${memberContact || 'N/A'}. Birthday SMS has been sent to the member. - Mt Zion Methodist Church`;
    
//     console.log(`📧 Sending admin copy for ${memberName} to ${adminPhone}`);
    
//     const result = await sendBirthdaySMS(adminPhone, "Admin", 0, copyMessage);
    
//     if (result.success) {
//       console.log(`✅ Admin copy sent successfully for ${memberName}`);
//     } else {
//       console.error(`❌ Failed to send admin copy for ${memberName}:`, result.message);
//     }
    
//     return result;
    
//   } catch (error) {
//     console.error("❌ Error sending admin copy message:", error);
//     return { success: false, message: error.message };
//   }
// };








// const handleManualBirthdaySMS = async () => {
//   const membersNeedingSMS = birthdayMembers.today.filter(member => 
//     member.contact && !hasSmsSentToday(member.id)
//   );

//   if (membersNeedingSMS.length === 0) {
//     alert('All members with valid phone numbers have already received birthday SMS today!');
//     return;
//   }

//   const confirmSend = window.confirm(
//     `Send birthday SMS to ${membersNeedingSMS.length} member(s) who haven't received it yet?`
//   );

//   if (confirmSend) {
//     try {
//       const results = await sendBirthdaySMSToAll(membersNeedingSMS);
//       const successCount = results.filter(r => r.success).length;
//       const failCount = results.length - successCount;
      
//       alert(`SMS Results:\n✅ Successfully sent: ${successCount}\n❌ Failed: ${failCount}\n📧 Admin copies sent automatically`);
      
//       // Force re-render to update SMS status indicators
//       setBirthdayMembers(getBirthdayMembers());
//     } catch (error) {
//       console.error('Error sending manual birthday SMS:', error);
//       alert('Error sending SMS. Please try again.');
//     }
//   }
// };






// const sendBirthdaySMS = async (phoneNumber, memberName, age, customMessage = null) => {
//   try {
//     console.log("==== BIRTHDAY SMS SENDING DEBUG START ====");
    
//     // Updated endpoint - use the correct Hubtel SMS API endpoint
//     const hubtelEndpoint = 'https://smsc.hubtel.com/v1/messages/send';
//     const clientId = 'vxojxzbs';
//     const clientSecret = 'uznaitfd';
    
//     // Format phone number - ensure it starts with country code
//     let formattedPhone = phoneNumber.replace(/\D/g, '');
    
//     // Add Ghana country code if not present
//     if (!formattedPhone.startsWith('233')) {
//       // Remove leading zero if present and add 233
//       if (formattedPhone.startsWith('0')) {
//         formattedPhone = '233' + formattedPhone.substring(1);
//       } else {
//         formattedPhone = '233' + formattedPhone;
//       }
//     }
    
//     // Use custom message if provided, otherwise use random birthday message
//     let personalizedMessage;
//     if (customMessage) {
//       personalizedMessage = customMessage;
//     } else {
//       const randomMessage = BIRTHDAY_MESSAGES[Math.floor(Math.random() * BIRTHDAY_MESSAGES.length)];
//       personalizedMessage = `Dear ${memberName}, ${randomMessage.message}`;
//     }
    
//     console.log("Sending birthday SMS to:", formattedPhone);
//     console.log("Message:", personalizedMessage);
    
//     // METHOD 1: Basic Authentication (Recommended by Hubtel)
//     const credentials = btoa(`${clientId}:${clientSecret}`);
    
//     const payload = {
//       From: 'MtZionMeth',
//       To: formattedPhone,
//       Content: personalizedMessage
//     };
    
//     let response = await fetch(hubtelEndpoint, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Basic ${credentials}`,
//         'Accept': 'application/json'
//       },
//       body: JSON.stringify(payload)
//     });
    
//     // METHOD 2: If Basic Auth fails, try form parameters with credentials
//     if (!response.ok && response.status === 401) {
//       console.log("Basic Auth failed, trying form parameters...");
      
//       const formData = new URLSearchParams({
//         clientid: clientId,
//         clientsecret: clientSecret,
//         from: 'MtZionMeth',
//         to: formattedPhone,
//         content: personalizedMessage
//       });
      
//       response = await fetch(hubtelEndpoint, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//           'Accept': 'application/json'
//         },
//         body: formData
//       });
//     }
    
//     // METHOD 3: Alternative endpoint if main one fails
//     if (!response.ok && (response.status === 404 || response.status === 400)) {
//       console.log("Trying alternative endpoint...");
      
//       const altEndpoint = 'https://api.hubtel.com/v1/messages/send';
//       const credentials = btoa(`${clientId}:${clientSecret}`);
      
//       response = await fetch(altEndpoint, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Basic ${credentials}`,
//           'Accept': 'application/json'
//         },
//         body: JSON.stringify({
//           From: 'MtZionMeth',
//           To: formattedPhone,
//           Content: personalizedMessage
//         })
//       });
//     }
    
//     const result = await response.json();
//     console.log("Birthday SMS Response:", result);
//     console.log("Response Status:", response.status);
//     console.log("Response Headers:", [...response.headers.entries()]);
    
//     if (response.ok) {
//       console.log(`✅ Birthday SMS sent successfully to ${memberName} (${formattedPhone})`);
//       return { success: true, message: 'Birthday SMS sent successfully', result };
//     } else {
//       console.error("❌ Failed to send birthday SMS:", result);
      
//       // Handle specific error cases
//       let errorMessage = result.statusDescription || result.message || 'Unknown error';
      
//       if (result.status === 100) {
//         errorMessage = "Invalid authentication - Check your API credentials";
//       } else if (result.status === 101) {
//         errorMessage = "Insufficient credit - Please fund your SMS API account";
//       } else if (result.status === 102) {
//         errorMessage = "Invalid phone number format";
//       }
      
//       return { 
//         success: false, 
//         message: `Failed to send birthday SMS: ${errorMessage}`,
//         result
//       };
//     }
    
//   } catch (error) {
//     console.error("❌ Error sending birthday SMS:", error);
//     return { success: false, message: error.message };
//   }
// };

// // Test function to verify API credentials and connection
// const testHubtelConnection = async () => {
//   const testPhone = "233244536389"; // Your test number
//   const testName = "Test User";
  
//   console.log("🧪 Testing Hubtel API Connection...");
  
//   try {
//     const result = await sendBirthdaySMS(testPhone, testName, 25);
    
//     if (result.success) {
//       console.log("✅ Test successful! SMS API is working correctly.");
//       return true;
//     } else {
//       console.log("❌ Test failed:", result.message);
      
//       // Provide troubleshooting guidance
//       if (result.result?.status === 100) {
//         console.log("🔧 Troubleshooting: Invalid authentication");
//         console.log("   - Verify your clientId and clientSecret are correct");
//         console.log("   - Check if your API keys are active");
//         console.log("   - Ensure you're using the right credentials for your account");
//       } else if (result.result?.status === 101) {
//         console.log("🔧 Troubleshooting: Insufficient credit");
//         console.log("   - Fund your SMS API account through Hubtel dashboard");
//         console.log("   - Go to Messaging > Manage > Programmable SMS");
//       }
      
//       return false;
//     }
//   } catch (error) {
//     console.log("❌ Test error:", error.message);
//     return false;
//   }
// };

// // Enhanced function with better error handling and retry logic
// const sendBirthdaySMSWithRetry = async (phoneNumber, memberName, age, maxRetries = 3) => {
//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     console.log(`📱 Attempt ${attempt}/${maxRetries} - Sending SMS to ${memberName}`);
    
//     const result = await sendBirthdaySMS(phoneNumber, memberName, age);
    
//     if (result.success) {
//       return result;
//     }
    
//     // Don't retry for authentication or credit issues
//     if (result.result?.status === 100 || result.result?.status === 101) {
//       console.log("❌ Not retrying due to authentication/credit issue");
//       return result;
//     }
    
//     // Wait before retry (exponential backoff)
//     if (attempt < maxRetries) {
//       const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
//       console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
//       await new Promise(resolve => setTimeout(resolve, waitTime));
//     }
//   }
  
//   return { success: false, message: `Failed after ${maxRetries} attempts` };
// };

// // Updated bulk SMS function with better error handling
// const sendBirthdaySMSToAll = async (birthdayMembers) => {
//   console.log(`📱 Starting bulk SMS send to ${birthdayMembers.length} members...`);
  
//   const results = [];
//   let successCount = 0;
//   let failCount = 0;
  
//   for (const [index, member] of birthdayMembers.entries()) {
//     console.log(`📤 Processing ${index + 1}/${birthdayMembers.length}: ${member.firstName} ${member.lastName}`);
    
//     if (!member.contact) {
//       console.log(`⚠️  No contact number for ${member.firstName} ${member.lastName}`);
//       results.push({
//         member: `${member.firstName} ${member.lastName}`,
//         phone: 'No contact',
//         success: false,
//         message: 'No contact number available'
//       });
//       failCount++;
//       continue;
//     }
    
//     if (hasSmsSentToday(member.id)) {
//       console.log(`ℹ️  SMS already sent today for ${member.firstName} ${member.lastName}`);
//       results.push({
//         member: `${member.firstName} ${member.lastName}`,
//         phone: member.contact,
//         success: true,
//         message: 'SMS already sent today'
//       });
//       successCount++;
//       continue;
//     }
    
//     try {
//       const result = await sendBirthdaySMSWithRetry(
//         member.contact, 
//         `${member.firstName} ${member.lastName}`, 
//         member.age
//       );
      
//       if (result.success) {
//         markSmsSent(member.id);
//         successCount++;
//         console.log(`✅ Success: ${member.firstName} ${member.lastName}`);
        
//         // Send admin copy message if member SMS was successful and admin copy not sent yet
//         if (!hasAdminCopySmsSentToday(member.id)) {
//           console.log(`📧 Sending admin copy for ${member.firstName} ${member.lastName}...`);
          
//           const adminCopyResult = await sendAdminCopyMessage(
//             `${member.firstName} ${member.lastName}`,
//             member.age,
//             member.contact
//           );
          
//           if (adminCopyResult.success) {
//             markAdminCopySmsSent(member.id);
//             console.log(`✅ Admin copy sent successfully for ${member.firstName} ${member.lastName}`);
//           } else {
//             console.error(`❌ Failed to send admin copy for ${member.firstName} ${member.lastName}:`, adminCopyResult.message);
//           }
          
//           // Add delay between admin copy to avoid rate limiting
//           await new Promise(resolve => setTimeout(resolve, 5000));
//         }
        
//       } else {
//         failCount++;
//         console.log(`❌ Failed: ${member.firstName} ${member.lastName} - ${result.message}`);
//       }
      
//       results.push({
//         member: `${member.firstName} ${member.lastName}`,
//         phone: member.contact,
//         ...result
//       });
      
//       // Add delay between SMS to avoid rate limiting (Hubtel allows 5 requests per minute)
//       if (index < birthdayMembers.length - 1) {
//         console.log("⏳ Waiting 15 seconds to avoid rate limiting...");
//         await new Promise(resolve => setTimeout(resolve, 15000));
//       }
      
//     } catch (error) {
//       console.error(`💥 Error sending SMS to ${member.firstName} ${member.lastName}:`, error);
//       results.push({
//         member: `${member.firstName} ${member.lastName}`,
//         phone: member.contact,
//         success: false,
//         message: error.message
//       });
//       failCount++;
//     }
//   }
  
//   console.log(`📊 Bulk SMS Results: ✅ ${successCount} successful, ❌ ${failCount} failed`);
//   return results;
// };



// // SMS sending function for birthdays
// // Fixed SMS sending function for birthdays

// // Alternative function if the above doesn't work - try Basic Auth
// const sendBirthdaySMSWithAuth = async (phoneNumber, memberName, age) => {
//   try {
//     console.log("==== TRYING BASIC AUTH METHOD ====");
    
//     const hubtelEndpoint = 'https://smsc.hubtel.com/v1/messages/send';
//     const clientId = 'vxojxzbs';
//     const clientSecret = 'uznaitfd';
    
//     // Format phone number
//     let formattedPhone = phoneNumber.replace(/\D/g, '');
//     if (!formattedPhone.startsWith('233')) {
//       if (formattedPhone.startsWith('0')) {
//         formattedPhone = '233' + formattedPhone.substring(1);
//       } else {
//         formattedPhone = '233' + formattedPhone;
//       }
//     }
    
//     const randomMessage = BIRTHDAY_MESSAGES[Math.floor(Math.random() * BIRTHDAY_MESSAGES.length)];
//     const personalizedMessage = `Dear ${memberName}, ${randomMessage.message}`;
    
//     // Create Basic Auth header
//     const credentials = btoa(`${clientId}:${clientSecret}`);
    
//     const payload = {
//       From: 'MtZionMeth',
//       To: formattedPhone,
//       Content: personalizedMessage
//     };
    
//     const response = await fetch(hubtelEndpoint, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Basic ${credentials}`,
//         'Accept': 'application/json'
//       },
//       body: JSON.stringify(payload)
//     });
    
//     const result = await response.text();
//     console.log("Basic Auth SMS Response:", result);
    
//     if (response.ok) {
//       return { success: true, message: 'Birthday SMS sent successfully' };
//     } else {
//       return { 
//         success: false, 
//         message: `Failed: ${response.status} - ${result}` 
//       };
//     }
    
//   } catch (error) {
//     console.error("Error with Basic Auth SMS:", error);
//     return { success: false, message: error.message };
//   }
// };

// // Test function to debug the API
// const testHubtelAPI = async () => {
//   const testPhone = "233244536389"; // Use the same number from your log
//   const testName = "Test User";
  
//   console.log("=== TESTING HUBTEL API ===");
  
//   // Test 1: Original method
//   console.log("Test 1: JSON format");
//   const result1 = await sendBirthdaySMS(testPhone, testName, 25);
//   console.log("Result 1:", result1);
  
//   // Test 2: Basic Auth method
//   console.log("Test 2: Basic Auth");
//   const result2 = await sendBirthdaySMSWithAuth(testPhone, testName, 25);
//   console.log("Result 2:", result2);
  
//   return { result1, result2 };
// };
// // Function to send SMS to all today's birthday members


// // Add state for SMS tracking (add to your useState declarations)
// const [smsSentToday, setSmsSentToday] = useState(new Set());

// // Function to check if SMS was already sent today
// const hasSmsSentToday = (memberId) => {
//   const today = new Date().toDateString();
//   const key = `${memberId}-${today}`;
//   return smsSentToday.has(key);
// };

// // Mark SMS as sent for today
// const markSmsSent = (memberId) => {
//   const today = new Date().toDateString();
//   const key = `${memberId}-${today}`;
//   setSmsSentToday(prev => new Set([...prev, key]));
// };

// // Automatic birthday SMS sending - add this useEffect
// useEffect(() => {
//   const sendAutomaticBirthdaySMS = async () => {
//     if (members.length === 0) return;

//     const birthdayData = getBirthdayMembers();
//     const todaysBirthdays = birthdayData.today;

//     if (todaysBirthdays.length > 0) {
//       console.log(`Found ${todaysBirthdays.length} birthday(s) today. Sending SMS automatically...`);
      
//       // Use the sendBirthdaySMSToAll function
//       const results = await sendBirthdaySMSToAll(todaysBirthdays);
      
//       // Log results
//       const successCount = results.filter(r => r.success).length;
//       const failCount = results.length - successCount;
      
//       console.log(`📱 Birthday SMS Results: ✅ Sent: ${successCount}, ❌ Failed: ${failCount}`);
//     }
//   };

//   // Send SMS automatically when component loads and members are fetched
//   if (members.length > 0) {
//     sendAutomaticBirthdaySMS();
//   }
// }, [members]); // Trigger when members are loaded

// // Optional: Set up interval to check every hour for new birthdays
// useEffect(() => {
//   const checkBirthdaysInterval = setInterval(async () => {
//     if (members.length > 0) {
//       const birthdayData = getBirthdayMembers();
//       const todaysBirthdays = birthdayData.today;
      
//       // Filter members who haven't received SMS today
//       const membersNeedingSMS = todaysBirthdays.filter(member => 
//         member.contact && !hasSmsSentToday(member.id)
//       );
      
//       if (membersNeedingSMS.length > 0) {
//         console.log(`Hourly check: Found ${membersNeedingSMS.length} new birthday member(s) needing SMS`);
        
//         // Use the sendBirthdaySMSToAll function for new members
//         const results = await sendBirthdaySMSToAll(membersNeedingSMS);
        
//         const successCount = results.filter(r => r.success).length;
//         console.log(`📱 Hourly SMS Results: ✅ Sent: ${successCount} new birthday messages`);
//       }
//     }
//   }, 3600000); // Check every hour (3600000 ms)

//   return () => clearInterval(checkBirthdaysInterval);
// }, [members]);

// // Optional: Add SMS status indicator in birthday modal
// {birthdayMembers.today.length > 0 && (
//   <div style={{ 
//     marginTop: '15px', 
//     padding: '10px', 
//     backgroundColor: '#e8f5e8', 
//     borderRadius: '5px',
//     fontSize: '14px',
//     color: '#155724'
//   }}>
//     📱 Birthday SMS automatically sent to members with valid phone numbers
//   </div>
// )}
//   useEffect(() => {
//     const fetchMembers = async () => {
//       try {
//         const snapshot = await getDocs(collection(db, "Members"));
//         const membersData = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
          
//         }));
//         setMembers(membersData);
//         setFilteredMembers(membersData);
//       } catch (error) {
//         console.error("Error fetching members:", error);
//         setError("Error fetching members. Please try again.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     const fetchChildren = async () => {
//       try {
//         const childrenSnapshot = await getDocs(collection(db, "Children"));
//         const childrenData = childrenSnapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//           fullName: `${doc.data().firstName || ''} ${doc.data().lastName || ''}`.trim()
//         }));
//         console.log("Fetched children:", childrenData);  // Debug log
//         setChildren(childrenData);
//       } catch (error) {
//         console.error("Error fetching children:", error);
//       }
//     };

//     fetchMembers();
//     fetchChildren();
//   }, [db]);

//   // Function to get today's birthdays and upcoming birthdays
//   const getBirthdayMembers = () => {
//     const today = new Date();
//     const todayMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
//     const todayDay = today.getDate();
    
//     const todayBirthdays = [];
//     const upcomingBirthdays = [];
    
//     members.forEach(member => {
//       if (member.dob) {
//         const dobParts = member.dob.split('-');
//         if (dobParts.length === 3) {
//           const birthMonth = parseInt(dobParts[1]);
//           const birthDay = parseInt(dobParts[2]);
//           const birthYear = parseInt(dobParts[0]);
          
//           // Calculate age
//           let age = today.getFullYear() - birthYear;
//           if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
//             age--;
//           }
          
//           // Check if birthday is today
//           if (birthMonth === todayMonth && birthDay === todayDay) {
//             todayBirthdays.push({
//               ...member,
//               age: age + 1, // Age they're turning today
//               birthdayDate: `${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`
//             });
//           } else {
//             // Check for upcoming birthdays (next 30 days)
//             const thisYearBirthday = new Date(today.getFullYear(), birthMonth - 1, birthDay);
//             let nextBirthday = thisYearBirthday;
            
//             // If birthday has passed this year, check next year
//             if (thisYearBirthday < today) {
//               nextBirthday = new Date(today.getFullYear() + 1, birthMonth - 1, birthDay);
//             }
            
//             const daysUntilBirthday = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
            
//             if (daysUntilBirthday > 0 && daysUntilBirthday <= 30) {
//               upcomingBirthdays.push({
//                 ...member,
//                 age: nextBirthday.getFullYear() - birthYear,
//                 daysUntil: daysUntilBirthday,
//                 birthdayDate: `${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`
//               });
//             }
//           }
//         }
//       }
//     });
    
//     // Sort upcoming birthdays by days until birthday
//     upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);
    
//     return { today: todayBirthdays, upcoming: upcomingBirthdays };
//   };

//   const handleBirthdayButtonClick = () => {
//     const birthdayData = getBirthdayMembers();
//     setBirthdayMembers(birthdayData);
//     setIsBirthdayModalVisible(true);
//   };

//   const fetchPaymentData = async (memberId) => {
//     try {
//       const paymentsRef = collection(db, "Money Collections");
//       const q = query(paymentsRef, where("memberId", "==", memberId));
//       const snapshot = await getDocs(q);
//       const payments = {};
//       snapshot.docs.forEach(doc => {
//         const data = doc.data();
//         payments[data.paymentType] = data.amount;
//       });
//       setPaymentData(payments);
//       return payments;
//     } catch (error) {
//       console.error("Error fetching payment data:", error);
//       return {};
//     }
//   };

//   const handleSearch = (event) => {
//     const query = event.target.value.toLowerCase();
//     setSearchQuery(query);
//     setFilteredMembers(
//       members.filter(
//         (member) =>
//           member.firstName?.toLowerCase().includes(query) ||
//           member.lastName?.toLowerCase().includes(query) ||
//           member.contact?.toLowerCase().includes(query)
//       )
//     );
//   };

//   const handleRowClick = async (member) => {
//     const payments = await fetchPaymentData(member.id);
//     setSelectedMember(member);
//     setSelectedPaymentAmount(payments[member.membershipFee] || "");
//     setIsModalVisible(true);
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     if (name === "membershipFee") {
//       setSelectedPaymentAmount(paymentData[value] || "");
//       setSelectedMember(prev => ({
//         ...prev,
//         [name]: value,
//         paymentAmount: paymentData[value] || ""
//       }));
//     } else if (name === "paymentAmount") {
//       setSelectedPaymentAmount(value);
//       setSelectedMember(prev => ({
//         ...prev,
//         paymentAmount: value
//       }));
//     } else {
//       setSelectedMember(prev => ({ ...prev, [name]: value }));
//     }
//   };

//   const handleSaveChanges = async () => {
//     try {
//       // Create an array of child objects with both ID and name
//       const childrenWithNames = selectedMember.children?.map(childId => {
//         const child = children.find(c => c.id === childId);
//         return {
//           id: childId,
//           name: child ? (child.name || `${child.firstName} ${child.lastName}`) : '',
//         };
//       }) || [];
  
//       // Prepare the update data
//       const updateData = {
//         ...selectedMember,
//         children: childrenWithNames  // Now contains array of objects with id and name
//       };
  
//       console.log("Saving member with data:", updateData);
//       const memberRef = doc(db, "Members", selectedMember.id);
      
//       // Update the Members collection
//       await updateDoc(memberRef, updateData);
  
//       // Update the Money Collections collection
//       if (selectedMember.membershipFee && selectedPaymentAmount) {
//         const paymentsRef = collection(db, "Money Collections");
//         const q = query(
//           paymentsRef, 
//           where("memberId", "==", selectedMember.id),
//           where("paymentType", "==", selectedMember.membershipFee)
//         );
//         const snapshot = await getDocs(q);
  
//         if (!snapshot.empty) {
//           const paymentDocRef = snapshot.docs[0].ref;
//           await updateDoc(paymentDocRef, {
//             amount: Number(selectedPaymentAmount)
//           });
//         } else {
//           await addDoc(paymentsRef, {
//             memberId: selectedMember.id,
//             paymentType: selectedMember.membershipFee,
//             amount: Number(selectedPaymentAmount)
//           });
//         }
//       }
  
//       // Update local state
//       setMembers(prev =>
//         prev.map(member =>
//           member.id === selectedMember.id ? updateData : member
//         )
//       );
  
//       setIsModalVisible(false);
//     } catch (error) {
//       console.error("Error updating member:", error);
//     }
//   };

//     const handleChildSelect = (e) => {
//     const childId = e.target.value;
//     console.log("Selected child ID:", childId);  // Debug log
//     setSelectedChild(childId);
    
//     // Update selectedMember with the new child
//     setSelectedMember(prev => {
//       const updatedChildren = prev.children || [];
//       if (childId && !updatedChildren.includes(childId)) {
//         return {
//           ...prev,
//           children: [...updatedChildren, childId]
//         };
//       }
//       return prev;
//     });
//   };

//   const handleDeleteMember = async () => {
//     try {
//       const memberRef = doc(db, "Members", selectedMember.id);
//       await deleteDoc(memberRef);
//       setMembers((prev) => prev.filter((member) => member.id !== selectedMember.id));
//       setIsModalVisible(false);
//     } catch (error) {
//       console.error("Error deleting member:", error);
//     }
//   };

//   if (loading) return <div>Loading...</div>;
//   if (error) return <div className="error">{error}</div>;




//   return (
//     <div className="members">
//       <h1>Manage Members</h1>
//       <div className="search-bar-container">
//         <input
//           type="text"
//           value={searchQuery}
//           onChange={handleSearch}
//           placeholder="Search by Name or Contact..."
//           className="search-bar"
//         />
//         <button 
//           className="birthday-button"
//           onClick={handleBirthdayButtonClick}
//           style={{
//             marginLeft: '10px',
//             padding: '10px 15px',
//             backgroundColor: '#ff6b6b',
//             color: 'white',
//             border: 'none',
//             borderRadius: '5px',
//             cursor: 'pointer',
//             fontWeight: 'bold'
//           }}
//         >
//           🎂 View Birthdays
//         </button>
//       </div>

//       {filteredMembers.length === 0 ? (
//         <div>No matching members found.</div>
//       ) : (
//         <div className="table-container">
//           <table className="members-table">
//             <thead>
//               <tr>
//                 <th>First Name</th>
//                 <th>Last Name</th>
//                 <th>Contact</th>
//                 <th>Age</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredMembers.map((member) => (
//                 <tr
//                   key={member.id}
//                   onClick={() => handleRowClick(member)}
//                   className="clickable-row"
//                 >
//                   <td>{member.firstName || "N/A"}</td>
//                   <td>{member.lastName || "N/A"}</td>
//                   <td>{member.contact || "N/A"}</td>
//                   <td>{member.age || "N/A"}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Birthday Modal */}
//       {isBirthdayModalVisible && (
//         <div className="custom-modal-overlay">
//           <div className="custom-modal-content" style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
//             <div className="custom-modal-header">
//               <h2>🎂 Birthday Celebrations</h2>
//               <button
//                 className="custom-modal-close"
//                 onClick={() => setIsBirthdayModalVisible(false)}
//               >
//                 &times;
//               </button>
//             </div>

//             <div className="birthday-content">
//               {/* Today's Birthdays */}
//               <div className="birthday-section">
//                 <h3 style={{ color: '#ff6b6b', marginBottom: '15px' }}>
//                   🎉 Today's Birthdays ({birthdayMembers.today.length})
//                 </h3>
// {birthdayMembers.today.length > 0 && (
//   <div style={{ 
//     marginBottom: '15px', 
//     padding: '10px', 
//     backgroundColor: '#e9ecef', 
//     borderRadius: '5px',
//     fontSize: '14px'
//   }}>
//     <strong>SMS Status Summary:</strong> {' '}
//     {birthdayMembers.today.filter(m => hasSmsSentToday(m.id)).length} sent, {' '}
//     {birthdayMembers.today.filter(m => !hasSmsSentToday(m.id) && m.contact).length} pending, {' '}
//     {birthdayMembers.today.filter(m => !m.contact).length} no contact
//   </div>
// )}
//                 {birthdayMembers.today.length > 0 ? (
//                   <div className="birthday-list">
//                  {birthdayMembers.today.map((member) => (
//      <div 
//     key={member.id} 
//     className="birthday-card"
//     style={{
//       border: '2px solid #ff6b6b',
//       borderRadius: '10px',
//       padding: '15px',
//       margin: '10px 0',
//       backgroundColor: '#fff5f5',
//       boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
//     }}
//   >
//     <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
//       {member.firstName} {member.lastName}
//       {/* SMS Status Indicator */}
//       <span style={{ 
//         marginLeft: '10px', 
//         fontSize: '12px', 
//         padding: '2px 6px', 
//         borderRadius: '10px',
//         backgroundColor: hasSmsSentToday(member.id) ? '#28a745' : '#dc3545',
//         color: 'white'
//       }}>
//         {hasSmsSentToday(member.id) ? '✅ SMS Sent' : '❌ SMS Not Sent'}
//       </span>
//     </h4>
//     <p style={{ margin: '5px 0', color: '#666' }}>
//       <strong>Turning:</strong> {member.age} years old
//     </p>
//     <p style={{ margin: '5px 0', color: '#666' }}>
//       <strong>Contact:</strong> {member.contact || 'N/A'}
//     </p>
//     <p style={{ margin: '5px 0', color: '#666' }}>
//       <strong>Class:</strong> {member.class || 'N/A'}
//     </p>
//   </div>
// ))}
//                   </div>
//                 ) : (
//                   <p style={{ color: '#666', fontStyle: 'italic' }}>
//                     No birthdays today.
//                   </p>
//                 )}
//               </div>
//       {birthdayMembers.today.length > 0 && (
//   <div style={{ 
//     marginTop: '15px', 
//     padding: '15px', 
//     backgroundColor: '#f8f9fa', 
//     borderRadius: '5px',
//     textAlign: 'center'
//   }}>
//     <button
//       onClick={handleManualBirthdaySMS}
//       style={{
//         padding: '10px 20px',
//         backgroundColor: '#007bff',
//         color: 'white',
//         border: 'none',
//         borderRadius: '5px',
//         cursor: 'pointer',
//         fontWeight: 'bold',
//         fontSize: '14px'
//       }}
//     >
//       📱 Send Birthday SMS to Pending Members
//     </button>
//     <p style={{ 
//       fontSize: '12px', 
//       color: '#666', 
//       marginTop: '8px',
//       marginBottom: '0'
//     }}>
//       Only sends to members who haven't received SMS today
//     </p>
//   </div>
// )}
//               {/* Upcoming Birthdays */}
//               <div className="birthday-section" style={{ marginTop: '30px' }}>
//                 <h3 style={{ color: '#4ecdc4', marginBottom: '15px' }}>
//                   📅 Upcoming Birthdays (Next 30 Days) ({birthdayMembers.upcoming.length})
//                 </h3>
//                 {birthdayMembers.upcoming.length > 0 ? (
//                   <div className="birthday-list">
//                     {birthdayMembers.upcoming.map((member) => (
//                       <div 
//                         key={member.id} 
//                         className="birthday-card"
//                         style={{
//                           border: '2px solid #4ecdc4',
//                           borderRadius: '10px',
//                           padding: '15px',
//                           margin: '10px 0',
//                           backgroundColor: '#f0fffe',
//                           boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
//                         }}
//                       >
//                         <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
//                           {member.firstName} {member.lastName}
//                         </h4>
//                         <p style={{ margin: '5px 0', color: '#666' }}>
//                           <strong>Days Until Birthday:</strong> {member.daysUntil} days
//                         </p>
//                         <p style={{ margin: '5px 0', color: '#666' }}>
//                           <strong>Turning:</strong> {member.age} years old
//                         </p>
//                         <p style={{ margin: '5px 0', color: '#666' }}>
//                           <strong>Birthday:</strong> {member.birthdayDate}
//                         </p>
//                         <p style={{ margin: '5px 0', color: '#666' }}>
//                           <strong>Contact:</strong> {member.contact || 'N/A'}
//                         </p>
//                         <p style={{ margin: '5px 0', color: '#666' }}>
//                           <strong>Class:</strong> {member.class || 'N/A'}
//                         </p>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <p style={{ color: '#666', fontStyle: 'italic' }}>
//                     No upcoming birthdays in the next 30 days.
//                   </p>
//                 )}
//               </div>
//             </div>

//             <div className="custom-modal-buttons">
//               <button
//                 className="cancel-button"
//                 onClick={() => setIsBirthdayModalVisible(false)}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Regular Member Edit Modal */}
//       {isModalVisible && (
//         <div className="custom-modal-overlay">
//           <div className="custom-modal-content">
//             <div className="custom-modal-header">
//               <h2>Edit Member Details</h2>
//               <button
//                 className="custom-modal-close"
//                 onClick={() => setIsModalVisible(false)}
//               >
//                 &times;
//               </button>
//             </div>

//             <form className="custom-modal-form">
//               <label>Title</label>
//               <input
//                 type="text"
//                 name="title"
//                 value={selectedMember.title || ""}
//                 onChange={handleInputChange}
//               />
//               <label>First Name</label>
//               <input
//                 type="text"
//                 name="firstName"
//                 value={selectedMember.firstName || ""}
//                 onChange={handleInputChange}
//               />
//               <label>Last Name</label>
//               <input
//                 type="text"
//                 name="lastName"
//                 value={selectedMember.lastName || ""}
//                 onChange={handleInputChange}
//               />
//               <label>Middle Name</label>
//               <input
//                 type="text"
//                 name="middleName"
//                 value={selectedMember.middleName || ""}
//                 onChange={handleInputChange}
//               />
//                <label>Children</label>
//               <div className="children-list">
//                 {selectedMember.children && selectedMember.children.map((child, index) => (
//                   <div key={index} className="child-entry">
//                     <input
//                       type="text"
//                       value={child.name || ''}
//                       onChange={(e) => {
//                         const updatedChildren = [...selectedMember.children];
//                         updatedChildren[index] = {
//                           ...updatedChildren[index],
//                           name: e.target.value
//                         };
//                         setSelectedMember(prev => ({
//                           ...prev,
//                           children: updatedChildren
//                         }));
//                       }}
//                       placeholder="Child's name"
//                     />
//                   </div>
//                 ))}
//               </div>
//               <label>Contact</label>
//               <input
//                 type="text"
//                 name="contact"
//                 value={selectedMember.contact || ""}
//                 onChange={handleInputChange}
//               />
//               <label>Gender</label>
//               <input
//                 type="text"
//                 name="gender"
//                 value={selectedMember.gender || ""}
//                 onChange={handleInputChange}
//               />
//               <label>Date of Birth</label>
//               <input
//                 type="date"
//                 name="dob"
//                 value={selectedMember.dob || ""}
//                 onChange={handleInputChange}
//               />
//               <label>Membership</label>
//               <input
//                 type="text"
//                 name="membership"
//                 value={selectedMember.membership || ""}
//                 onChange={handleInputChange}
//               />
//               <label>Class</label>
//               <input
//                 type="text"
//                 name="class"
//                 value={selectedMember.class || ""}
//                 onChange={handleInputChange}
//               />
//               <label>Assign Class Leader</label>
//               <input
//                 type="text"
//                 name="assignClassLeader"
//                 value={selectedMember.assignClassLeader || ""}
//                 onChange={handleInputChange}
//               />
//               <label>Home Town</label>
//               <input
//                 type="text"
//                 name="homeTown"
//                 value={selectedMember.homeTown || ""}
//                 onChange={handleInputChange}
//               />
//               <label>Home Region</label>
//               <input
//                 type="text"
//                 name="homeRegion"
//                 value={selectedMember.homeRegion || ""}
//                 onChange={handleInputChange}
//               />
//               <label>GPS</label>
//               <input
//                 type="text"
//                 name="gps"
//                 value={selectedMember.gps || ""}
//                 onChange={handleInputChange}
//               />
//               <label>Profession</label>
//               <input
//                 type="text"
//                 name="profession"
//                 value={selectedMember.profession || ""}
//                 onChange={handleInputChange}
//               />
//               <label>Employment Status</label>
//               <input
//                 type="text"
//                 name="employmentStatus"
//                 value={selectedMember.employmentStatus || ""}
//                 onChange={handleInputChange}
//               />
//               <label>Marital Status</label>
//               <input
//                 type="text"
//                 name="maritalStatus"
//                 value={selectedMember.maritalStatus || ""}
//                 onChange={handleInputChange}
//               />
//               <label>Organisations</label>
//               <input
//                 type="text"
//                 name="organisations"
//                 value={selectedMember.organisations || ""}
//                 onChange={handleInputChange}
//               />
//               <label>Role</label>
//               <input
//                 type="text"
//                 name="role"
//                 value={selectedMember.role || ""}
//                 onChange={handleInputChange}
//               />
              
//               <label>Membership Fee Type</label>
//               <select
//                 name="membershipFee"
//                 value={selectedMember.membershipFee || ""}
//                 onChange={handleInputChange}
//               >
//                 <option value="">Select Payment Type</option>
//                 <option value="Tithe">Tithe</option>
//                 <option value="Welfare">Welfare</option>
//                 <option value="Funeral Contributions">Funeral Contributions</option>
//                 <option value="Special Offerings">Special Offerings</option>
//               </select>
//               {selectedMember.membershipFee && (
//                 <>
//                   <label>Payment Amount</label>
//                   <input
//                     type="number"
//                     name="paymentAmount"
//                     value={selectedPaymentAmount}
//                     onChange={handleInputChange}
//                   />
//                 </>
//               )}
// <div className="child-section">
//   <button 
//     type="button"
//     className="add-child-button"
//     onClick={() => setIsChildFieldVisible(!isChildFieldVisible)}
//   >
//     {isChildFieldVisible ? 'Hide Child Selection' : 'Add a Child'}
//   </button>
  
//   {isChildFieldVisible && (
//     <div className="child-select-container">
//       <label className="child-select-label">Select Child</label>
//       <div className="child-search">
//         <select
//           value={selectedChild}
//           onChange={handleChildSelect}
//           className="child-select"
//         >
//           <option value="">Select a child</option>
//           {children
//             .filter(child => 
//               !selectedMember?.children?.includes(child.id)
//             )
//             .map((child) => (
//               <option key={child.id} value={child.id}>
//                 {child.name || `${child.firstName} ${child.lastName}`}
//               </option>
//           ))}
//         </select>
//       </div>
//     </div>
//   )}

//   {selectedMember?.children?.length > 0 && (
//   <div className="added-children-container">
//     <label>Added Children:</label>
//     <ul className="added-children-list">
//       {selectedMember.children.map((childId) => {
//         const child = children.find((c) => c.id === childId);
//         return child ? (
//           <li key={childId} className="added-child-item">
//             <input
//               type="text"
//               value={child.name || `${child.firstName} ${child.lastName}`}
//               onChange={(e) => {
//                 const updatedChildren = children.map(c => 
//                   c.id === childId ? {...c, name: e.target.value} : c
//                 );
//                 setChildren(updatedChildren);
//               }}
//             />
//             <span 
//               className="remove-child"
//               onClick={() => {
//                 setSelectedMember(prev => ({
//                   ...prev,
//                   children: prev.children.filter(id => id !== childId)
//                 }));
//               }}
//               style={{ 
//                 marginLeft: '10px', 
//                 cursor: 'pointer',
//                 color: 'red',
//                 fontWeight: 'bold'
//               }}
//             >
//               ×
//             </span>
//           </li>
//         ) : null;
//       })}
//     </ul>
//   </div>
// )}
// </div>
//    </form>

//             <div className="custom-modal-buttons">
//               <button className="save-button" onClick={handleSaveChanges}>
//                 Save Changes
//               </button>
//               <button className="delete-button" onClick={handleDeleteMember}>
//                 Delete Member
//               </button>
//               <button
//                 className="cancel-button"
//                 onClick={() => setIsModalVisible(false)}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default AssignMember;
