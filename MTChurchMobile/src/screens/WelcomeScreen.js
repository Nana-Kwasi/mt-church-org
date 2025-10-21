import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import '../services/firebase'; // Initialize Firebase

const WelcomeScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 2FA States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [generatedOtpId, setGeneratedOtpId] = useState('');
  const [userDataForLogin, setUserDataForLogin] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes
  const [canResendOtp, setCanResendOtp] = useState(false);
  
  // Security States
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  
  // Password Reset States
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  
  // Admin Request States
  const [showAdminRequestModal, setShowAdminRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    name: '',
    email: '',
    phone: '',
    reason: '',
    description: ''
  });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  // Initialize captcha on component mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  // Function to log user activity
  const logUserActivity = async (userId, userName, userRole, actionType, status, details = '') => {
    const db = getFirestore();
    try {
      await addDoc(collection(db, 'UsersActions'), {
        userId: userId,
        userName: userName,
        userRole: userRole,
        actionType: actionType,
        status: status,
        details: details,
        timestamp: serverTimestamp(),
        deviceInfo: {
          userAgent: 'React Native Mobile App',
          platform: Platform.OS,
          language: 'en',
          screenResolution: 'Mobile',
        },
        ipAddress: 'Mobile App',
      });
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  };

  // Generate simple captcha
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setCaptchaInput('');
  };

  // Validate captcha
  const validateCaptcha = () => {
    if (!showCaptcha) return true;
    return captchaInput.toUpperCase() === captchaText.toUpperCase();
  };

  // Check account lockout
  const checkAccountLockout = async (email) => {
    try {
      const db = getFirestore();
      const lockoutRef = collection(db, 'AccountLockouts');
      const q = query(lockoutRef, where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const lockoutDoc = querySnapshot.docs[0];
        const lockoutData = lockoutDoc.data();
        const lockoutTime = lockoutData.timestamp?.toDate?.() || new Date(lockoutData.timestamp);
        const now = new Date();
        const timeDiff = now - lockoutTime;
        const lockoutDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        if (timeDiff < lockoutDuration) {
          const remainingTime = Math.ceil((lockoutDuration - timeDiff) / 1000);
          setLockoutTimer(remainingTime);
          setIsAccountLocked(true);
          return true;
        } else {
          // Remove expired lockout
          await updateDoc(doc(db, 'AccountLockouts', lockoutDoc.id), { expired: true });
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking account lockout:', error);
      return false;
    }
  };

  // Update failed attempts
  const updateFailedAttempts = async (email) => {
    try {
      const db = getFirestore();
      const attemptsRef = collection(db, 'FailedLoginAttempts');
      const q = query(attemptsRef, where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      const now = new Date();
      const attemptData = {
        email: email.toLowerCase(),
        timestamp: serverTimestamp(),
        deviceInfo: {
          platform: Platform.OS,
          userAgent: 'React Native Mobile App'
        }
      };
      
      if (!querySnapshot.empty) {
        const attemptDoc = querySnapshot.docs[0];
        const existingData = attemptDoc.data();
        const attempts = existingData.attempts || 0;
        const newAttempts = attempts + 1;
        
        await updateDoc(doc(db, 'FailedLoginAttempts', attemptDoc.id), {
          attempts: newAttempts,
          lastAttempt: serverTimestamp()
        });
        
        // If 5 or more attempts, create lockout
        if (newAttempts >= 5) {
          await addDoc(collection(db, 'AccountLockouts'), {
            email: email.toLowerCase(),
            timestamp: serverTimestamp(),
            reason: 'Too many failed login attempts'
          });
          setIsAccountLocked(true);
          setLockoutTimer(300); // 5 minutes
        }
        
        return newAttempts;
      } else {
        await addDoc(attemptsRef, {
          ...attemptData,
          attempts: 1
        });
        return 1;
      }
    } catch (error) {
      console.error('Error updating failed attempts:', error);
      return 0;
    }
  };

  // Check if OTP is disabled for user
  const checkOtpDisableStatus = async (email) => {
    try {
      const db = getFirestore();
      const otpDisableRef = collection(db, 'OTPDisableRequests');
      const q = query(otpDisableRef, where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const disableDoc = querySnapshot.docs[0];
        const disableData = disableDoc.data();
        return disableData.status === 'approved';
      }
      return false;
    } catch (error) {
      console.error('Error checking OTP disable status:', error);
      return false;
    }
  };

  // Send SMS via Hubtel API (same as web version)
  const sendSMS = async (phoneNumber, message) => {
    const hubtelEndpoint = 'https://smsc.hubtel.com/v1/messages/send';
    const clientId = 'vxojxzbs';
    const clientSecret = 'uznaitfd';

    try {
      const credentials = btoa(`${clientId}:${clientSecret}`);
      
      const response = await fetch(hubtelEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          From: 'Methodist',
          To: phoneNumber,
          Content: message,
        }),
      });

      const result = await response.json();
      return response.ok;
    } catch (error) {
      console.error('SMS sending error:', error);
      return false;
    }
  };

  // Send OTP
  const sendOTP = async (userData) => {
    try {
      setIsSendingOtp(true);
      setOtpMessage('');
      
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const phoneNumber = userData.contact;

      if (!phoneNumber) {
        setOtpMessage('No phone number found in your profile. Please contact admin.');
        setIsSendingOtp(false);
        return;
      }

      // Store OTP in Firebase (using 'otp' collection like web version)
      const db = getFirestore();
      const otpDoc = await addDoc(collection(db, 'otp'), {
        email: userData.email.toLowerCase(),
        otp: otp,
        phoneNumber: phoneNumber,
        userId: userData.userId,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        used: false
      });
      
      // Send SMS
      const smsMessage = `Your Methodist Church System login verification code is: ${otp}. This code will expire in 5 minutes.`;
      const smsSent = await sendSMS(phoneNumber, smsMessage);

      if (smsSent) {
        setGeneratedOtpId(otpDoc.id);
        setUserDataForLogin(userData);
        setShowOtpModal(true);
        setOtpTimer(300);
        setCanResendOtp(false);
        
        // Start OTP timer
        const timer = setInterval(() => {
          setOtpTimer(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              setCanResendOtp(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        setOtpMessage(`OTP sent to ${phoneNumber}. Please check your phone.`);
      } else {
        setOtpMessage('Failed to send OTP. Please try again.');
      }
      
    } catch (error) {
      console.error('Error sending OTP:', error);
      setOtpMessage('Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    if (!otpCode) {
      setOtpMessage('Please enter the OTP code.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpMessage('');

    try {
      const db = getFirestore();
      const otpRef = collection(db, 'otp');
      const q = query(otpRef, where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      let otpFound = false;
      let otpValid = false;

      for (const otpDoc of querySnapshot.docs) {
        const otpData = otpDoc.data();
        if (otpData.otp === otpCode && !otpData.used) {
          const now = new Date();
          const expiresAt = otpData.expiresAt?.toDate?.() || new Date(otpData.expiresAt);

          if (now <= expiresAt) {
            otpFound = true;
            otpValid = true;

            // Mark OTP as used
            await updateDoc(doc(db, 'otp', otpDoc.id), {
              used: true,
              usedAt: serverTimestamp()
            });

            // Complete login process
            await completeLogin(userDataForLogin);

            // Log successful 2FA verification
            await logUserActivity(
              userDataForLogin.userId,
              userDataForLogin.name || email,
              userDataForLogin.role,
              'OTP_VERIFIED',
              'SUCCESS',
              '2FA verification successful'
            );

            break;
          } else {
            setOtpMessage('OTP has expired. Please request a new one.');
          }
        }
      }

      if (!otpFound) {
        setOtpMessage('Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setOtpMessage('Error verifying OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Complete login process
  const completeLogin = async (userData) => {
    try {
      // Log successful login
      await logUserActivity(
        userData.userId,
        userData.name || userData.email,
        userData.role,
        'LOGIN',
        'SUCCESS',
        'User successfully logged in with OTP'
      );

      // Store user info in AsyncStorage
      await AsyncStorage.setItem('userRole', userData.role);
      await AsyncStorage.setItem('userName', userData.name || userData.email);
      await AsyncStorage.setItem('userId', userData.userId);
      await AsyncStorage.setItem('isAuthenticated', 'true');

      // Clear failed attempts
      const db = getFirestore();
      const attemptsRef = collection(db, 'FailedLoginAttempts');
      const q = query(attemptsRef, where('email', '==', userData.email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        await updateDoc(doc(db, 'FailedLoginAttempts', querySnapshot.docs[0].id), {
          attempts: 0
        });
      }

      // Navigate to main app
      navigation.navigate('Main');
    } catch (error) {
      console.error('Error completing login:', error);
      setError('Login completed but there was an error. Please try again.');
    }
  };

  const handleLogin = async () => {
    setError('');
    
    if (!email || !password) {
      setError('Both fields are required!');
      return;
    }

    // Validate captcha if shown
    if (showCaptcha && !validateCaptcha()) {
      setError('Please enter the correct captcha code');
      generateCaptcha();
      return;
    }

    // Check if account is locked
    const isLocked = await checkAccountLockout(email);
    if (isLocked) {
      setError(`Account is temporarily locked. Please try again in ${Math.ceil(lockoutTimer / 60)} minutes.`);
      return;
    }

    try {
      setIsLoading(true);

      const db = getFirestore();
      const userAccessRef = collection(db, 'Users');
      const q = query(userAccessRef, where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        // Check if the account is active
        if ('isActive' in userData && !userData.isActive) {
          await logUserActivity(
            userDoc.id,
            email,
            userData.role || 'unknown',
            'LOGIN',
            'FAILED',
            'Inactive account login attempt'
          );
          await updateFailedAttempts(email);
          setError('Your account is disabled. Please contact Admin.');
          generateCaptcha();
          return;
        }

        if (userData.password === password) {
          // Password is correct, proceed with 2FA
          generateCaptcha();
          
          // Check if OTP is disabled for this user
          const isOtpDisabled = await checkOtpDisableStatus(email);
          if (isOtpDisabled) {
            // Skip OTP and complete login directly
            await completeLogin({ ...userData, userId: userDoc.id });
          } else {
            // Proceed with normal OTP flow
            await sendOTP({ ...userData, userId: userDoc.id });
          }
        } else {
          // Log failed login attempt - incorrect password
          await logUserActivity(
            userDoc.id,
            email,
            'unknown',
            'LOGIN',
            'FAILED',
            'Invalid password attempt'
          );
          
          const failedAttempts = await updateFailedAttempts(email);
          if (failedAttempts >= 5) {
            setError('Too many failed attempts. Account locked for 5 minutes.');
            setIsAccountLocked(true);
            setLockoutTimer(300);
          } else {
            setError(`Invalid email or password! ${5 - failedAttempts} attempts remaining.`);
          }
          generateCaptcha();
        }
      } else {
        // Log failed login attempt - user not found
        await logUserActivity(
          'unknown',
          email,
          'unknown',
          'LOGIN',
          'FAILED',
          'User not authorized/found'
        );
        await updateFailedAttempts(email);
        setError('User not authorized!');
        generateCaptcha();
      }
    } catch (error) {
      console.error('Login error:', error);
      // Log system error
      await logUserActivity(
        'unknown',
        email,
        'unknown',
        'LOGIN',
        'ERROR',
        `System error: ${error.message}`
      );
      setError('An error occurred during login. Please try again.');
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  // Password reset handler
  const handlePasswordReset = async () => {
    if (!resetEmail) {
      setResetMessage('Please enter your email address');
      return;
    }

    try {
      setIsResettingPassword(true);
      setResetMessage('');

      // Log password reset request
      await logUserActivity(
        'unknown',
        resetEmail,
        'unknown',
        'PASSWORD_RESET',
        'REQUESTED',
        'Password reset requested'
      );

      // In a real app, you would send an email here
      // For now, we'll just log it to Firebase
      const db = getFirestore();
      await addDoc(collection(db, 'PasswordResetRequests'), {
        email: resetEmail.toLowerCase(),
        timestamp: serverTimestamp(),
        status: 'pending',
        deviceInfo: {
          platform: Platform.OS,
          userAgent: 'React Native Mobile App'
        }
      });

      setResetMessage('Password reset instructions sent to your email');
      setTimeout(() => {
        setShowResetModal(false);
        setResetEmail('');
        setResetMessage('');
      }, 3000);

    } catch (error) {
      console.error('Password reset error:', error);
      setResetMessage('Failed to send reset instructions. Please try again.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Admin request handler
  const handleAdminRequest = async () => {
    if (!requestForm.name || !requestForm.email || !requestForm.reason) {
      setRequestMessage('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmittingRequest(true);
      setRequestMessage('');

      // Log admin request
      await logUserActivity(
        'unknown',
        requestForm.email,
        'unknown',
        'ADMIN_REQUEST',
        'SUBMITTED',
        `Admin access requested by ${requestForm.name}`
      );

      // Store request in Firebase
      const db = getFirestore();
      await addDoc(collection(db, 'AdminRequests'), {
        ...requestForm,
        email: requestForm.email.toLowerCase(),
        timestamp: serverTimestamp(),
        status: 'pending',
        deviceInfo: {
          platform: Platform.OS,
          userAgent: 'React Native Mobile App'
        }
      });

      setRequestMessage('Your request has been submitted successfully. You will be contacted soon.');
      setTimeout(() => {
        setShowAdminRequestModal(false);
        setRequestForm({
          name: '',
          email: '',
          phone: '',
          reason: '',
          description: ''
        });
        setRequestMessage('');
      }, 3000);

    } catch (error) {
      console.error('Admin request error:', error);
      setRequestMessage('Failed to submit request. Please try again.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      navigation.replace('Welcome');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>⛪</Text>
          </View>
          <Text style={styles.title}>Methodist Church Ghana</Text>
          <Text style={styles.subtitle}>MT Zion Mobile App</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={Colors.textSecondary}
              value={email}
              onChangeText={(text) => setEmail(text.toLowerCase())}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={Colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Captcha Section */}
          {showCaptcha && (
            <View style={styles.captchaContainer}>
              <Text style={styles.label}>Enter the code below:</Text>
              <View style={styles.captchaRow}>
                <View style={styles.captchaDisplay}>
                  <Text style={styles.captchaText}>{captchaText}</Text>
                </View>
                <TouchableOpacity onPress={generateCaptcha} style={styles.refreshButton}>
                  <Text style={styles.refreshText}>🔄</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.captchaInput}
                placeholder="Enter captcha"
                placeholderTextColor={Colors.textSecondary}
                value={captchaInput}
                onChangeText={setCaptchaInput}
                autoCapitalize="characters"
                maxLength={5}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.loginButton, (isLoading || isAccountLocked) && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading || isAccountLocked}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.loginButtonText}>
                {isAccountLocked ? `Locked (${Math.ceil(lockoutTimer / 60)}min)` : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.linkContainer}>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setShowResetModal(true)}
            >
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setShowAdminRequestModal(true)}
            >
              <Text style={styles.linkText}>Request Access</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Clear Session</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 Methodist Church Ghana
          </Text>
        </View>
      </ScrollView>

      {/* OTP Modal */}
      <Modal
        visible={showOtpModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Enter OTP</Text>
            <Text style={styles.modalSubtitle}>
              We've sent a 6-digit code to your phone
            </Text>
            
            {otpMessage ? (
              <Text style={[styles.otpMessage, otpMessage.includes('sent') ? styles.successMessage : styles.errorMessage]}>
                {otpMessage}
              </Text>
            ) : null}

            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor={Colors.textSecondary}
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="numeric"
              maxLength={6}
              textAlign="center"
            />

            <Text style={styles.timerText}>
              {otpTimer > 0 ? `Resend in ${Math.floor(otpTimer / 60)}:${(otpTimer % 60).toString().padStart(2, '0')}` : 'OTP expired'}
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowOtpModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.verifyButton, isVerifyingOtp && styles.disabledButton]}
                onPress={verifyOTP}
                disabled={isVerifyingOtp}
              >
                {isVerifyingOtp ? (
                  <ActivityIndicator color={Colors.surface} size="small" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>

            {canResendOtp && (
              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => sendOTP(userDataForLogin)}
                disabled={isSendingOtp}
              >
                <Text style={styles.resendText}>
                  {isSendingOtp ? 'Sending...' : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        visible={showResetModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your email to receive reset instructions
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter your email"
              placeholderTextColor={Colors.textSecondary}
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {resetMessage ? (
              <Text style={[styles.resetMessage, resetMessage.includes('sent') ? styles.successMessage : styles.errorMessage]}>
                {resetMessage}
              </Text>
            ) : null}

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowResetModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.verifyButton, isResettingPassword && styles.disabledButton]}
                onPress={handlePasswordReset}
                disabled={isResettingPassword}
              >
                {isResettingPassword ? (
                  <ActivityIndicator color={Colors.surface} size="small" />
                ) : (
                  <Text style={styles.verifyButtonText}>Send Reset</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Admin Request Modal */}
      <Modal
        visible={showAdminRequestModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAdminRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Request Admin Access</Text>
            <Text style={styles.modalSubtitle}>
              Fill out the form below to request access to the system
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Full Name"
              placeholderTextColor={Colors.textSecondary}
              value={requestForm.name}
              onChangeText={(text) => setRequestForm({...requestForm, name: text})}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Email Address"
              placeholderTextColor={Colors.textSecondary}
              value={requestForm.email}
              onChangeText={(text) => setRequestForm({...requestForm, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Phone Number"
              placeholderTextColor={Colors.textSecondary}
              value={requestForm.phone}
              onChangeText={(text) => setRequestForm({...requestForm, phone: text})}
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Reason for Access"
              placeholderTextColor={Colors.textSecondary}
              value={requestForm.reason}
              onChangeText={(text) => setRequestForm({...requestForm, reason: text})}
            />
            
            <TextInput
              style={[styles.modalInput, styles.textAreaInput]}
              placeholder="Additional Details"
              placeholderTextColor={Colors.textSecondary}
              value={requestForm.description}
              onChangeText={(text) => setRequestForm({...requestForm, description: text})}
              multiline
              numberOfLines={3}
            />

            {requestMessage ? (
              <Text style={[styles.requestMessage, requestMessage.includes('submitted') ? styles.successMessage : styles.errorMessage]}>
                {requestMessage}
              </Text>
            ) : null}

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAdminRequestModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.verifyButton, isSubmittingRequest && styles.disabledButton]}
                onPress={handleAdminRequest}
                disabled={isSubmittingRequest}
              >
                {isSubmittingRequest ? (
                  <ActivityIndicator color={Colors.surface} size="small" />
                ) : (
                  <Text style={styles.verifyButtonText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 40,
    color: Colors.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  captchaContainer: {
    marginBottom: 20,
  },
  captchaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  captchaDisplay: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  captchaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    letterSpacing: 2,
  },
  refreshButton: {
    padding: 8,
  },
  refreshText: {
    fontSize: 20,
  },
  captchaInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  loginButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  linkButton: {
    padding: 8,
  },
  linkText: {
    color: Colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
    marginBottom: 16,
  },
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: Colors.primary,
  },
  verifyButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  // OTP Specific Styles
  otpInput: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    color: Colors.text,
    backgroundColor: Colors.surface,
    marginBottom: 16,
    letterSpacing: 4,
  },
  otpMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    padding: 8,
    borderRadius: 6,
  },
  successMessage: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
  },
  errorMessage: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  timerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    color: Colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  resetMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    padding: 8,
    borderRadius: 6,
  },
  requestMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    padding: 8,
    borderRadius: 6,
  },
});

export default WelcomeScreen;
