// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

// const WelcomeScreen = () => {
//   const navigate = useNavigate();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [isLoading, setIsLoading] = useState(false);

//   // Function to log user activity
//   const logUserActivity = async (userId, userName, userRole, actionType, status, details = '') => {
//     const db = getFirestore();
//     try {
//       await addDoc(collection(db, 'UsersActions'), {
//         userId: userId,
//         userName: userName,
//         userRole: userRole,
//         actionType: actionType,
//         status: status,
//         details: details,
//         timestamp: serverTimestamp(),
//         deviceInfo: {
//           userAgent: navigator.userAgent,
//           platform: navigator.platform,
//           language: navigator.language,
//           screenResolution: `${window.screen.width}x${window.screen.height}`,
//         },
//         ipAddress: 'Collected server-side',
//       });
//     } catch (error) {
//       console.error('Error logging user activity:', error);
//     }
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError('');

//     if (!email || !password) {
//       setError('Both fields are required!');
//       return;
//     }

//     try {
//       setIsLoading(true);

//       const db = getFirestore();
//       const userAccessRef = collection(db, 'Users');
//       const q = query(userAccessRef, where('email', '==', email.toLowerCase()));
//       const querySnapshot = await getDocs(q);

//       if (!querySnapshot.empty) {
//         const userDoc = querySnapshot.docs[0];
//         const userData = userDoc.data();

//         // Check if the account is active only if `isActive` exists in the document
//         if ('isActive' in userData && !userData.isActive) {
//           // Log failed login attempt - account inactive
//           await logUserActivity(
//             userDoc.id,
//             email,
//             userData.role || 'unknown',
//             'LOGIN',
//             'FAILED',
//             'Inactive account login attempt'
//           );
//           setError('Your account is disabled. Please contact Admin.');
//           return;
//         }

//         if (userData.password === password) {
//           // Log successful login
//           await logUserActivity(
//             userDoc.id,
//             userData.name || email,
//             userData.role,
//             'LOGIN',
//             'SUCCESS',
//             'User successfully logged in'
//           );

//           // Store user info in localStorage
//           localStorage.setItem('userRole', userData.role);
//           localStorage.setItem('userName', userData.name || email);
//           localStorage.setItem('userId', userDoc.id); // Store user ID for future activity logging

//           navigate('/dashboard');
//         } else {
//           // Log failed login attempt - incorrect password
//           await logUserActivity(
//             userDoc.id,
//             email,
//             'unknown',
//             'LOGIN',
//             'FAILED',
//             'Invalid password attempt'
//           );
//           setError('Invalid email or password!');
//         }
//       } else {
//         // Log failed login attempt - user not found
//         await logUserActivity(
//           'unknown',
//           email,
//           'unknown',
//           'LOGIN',
//           'FAILED',
//           'User not authorized/found'
//         );
//         setError('User not authorized!');
//       }
//     } catch (error) {
//       console.error('Login error:', error);
//       // Log system error
//       await logUserActivity(
//         'unknown',
//         email,
//         'unknown',
//         'LOGIN',
//         'ERROR',
//         `System error: ${error.message}`
//       );
//       setError('An error occurred during login. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Existing styles
//   const inputStyle = {
//     width: '100%',
//     padding: '12px',
//     borderRadius: '8px',
//     border: '1px solid #ccc',
//     fontSize: '16px',
//     outline: 'none',
//     transition: 'border-color 0.3s',
//     marginBottom: '15px',
//   };

//   const buttonStyle = {
//     width: '100%',
//     padding: '12px',
//     backgroundColor: '#002366',
//     color: '#FFFFFF',
//     border: 'none',
//     borderRadius: '8px',
//     fontSize: '16px',
//     fontWeight: 'bold',
//     cursor: 'pointer',
//     boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
//     transition: 'all 0.3s ease',
//   };
//   return (
//     <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
//       {/* Navbar */}
//       <nav style={{
//         width: '100%',
//         backgroundColor: '#f8f9fa',
//         padding: '10px 20px',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
//         position: 'fixed',
//         top: 0,
//         zIndex: 1000,
//       }}>
//         <div style={{ display: 'flex', alignItems: 'center' }}>
//           <img
//             src="/logo.jpg"
//             alt="Methodist Church Logo"
//             style={{ height: '80px', marginRight: '10px' }}
//           />
//           <h2 style={{ margin: 0, fontSize: '24px', color: '#002366' }}>
//             Methodist Church Of Ghana
//           </h2>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <main style={{
//         flex: 1,
//         backgroundImage: "url('/pack (1).jpg')",
//         backgroundSize: 'cover',
//         backgroundPosition: 'center',
//         backgroundRepeat: 'no-repeat',
//         display: 'flex',
//         flexDirection: 'column',
//         justifyContent: 'center',
//         alignItems: 'center',
//         padding: '20px',
//         marginTop: '100px',
//       }}>
//         <h1 style={{
//           color: 'white',
//           fontSize: '40px',
//           textAlign: 'center',
//           marginBottom: '40px',
//           textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
//         }}>
//           Welcome To Methodist Church Of Ghana Portal
//         </h1>

//         {/* Login Card */}
//         <div style={{
//           backgroundColor: 'rgba(255, 255, 255, 0.95)',
//           padding: '30px',
//           borderRadius: '12px',
//           width: '100%',
//           maxWidth: '500px',
//           boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
//         }}>
//           <h2 style={{
//             color: '#002366',
//             marginBottom: '30px',
//             textAlign: 'center',
//             fontSize: '24px',
//           }}>
//             User Login
//           </h2>

//           {error && (
//             <div style={{
//               backgroundColor: '#ffebee',
//               color: '#c62828',
//               padding: '12px',
//               borderRadius: '6px',
//               marginBottom: '20px',
//               textAlign: 'center',
//               fontSize: '14px',
//             }}>
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleLogin}>
//             <div style={{ marginBottom: '20px' }}>
//               <input
//                 type="email"
//                 placeholder="Email Address"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value.toLowerCase())}
//                 style={inputStyle}
//                 autoComplete="email"
//               />
//             </div>

//             <div style={{ marginBottom: '25px' }}>
//               <input
//                 type="password"
//                 placeholder="Password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 style={inputStyle}
//                 autoComplete="current-password"
//               />
//             </div>

//             <button
//               type="submit"
//               style={buttonStyle}
//               disabled={isLoading}
//               onMouseEnter={(e) => {
//                 e.target.style.backgroundColor = '#1a3c7d';
//                 e.target.style.transform = 'translateY(-2px)';
//               }}
//               onMouseLeave={(e) => {
//                 e.target.style.backgroundColor = '#002366';
//                 e.target.style.transform = 'translateY(0)';
//               }}
//             >
//               {isLoading ? (
//                 <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                   <span style={{ marginRight: '10px' }}>Logging in...</span>
//                 </span>
//               ) : (
//                 'Login'
//               )}
//             </button>
//           </form>
//         </div>
//       </main>

//       {/* Footer */}
//       <footer style={{
//         backgroundColor: '#002366',
//         color: 'white',
//         textAlign: 'center',
//         padding: '15px 20px',
//         marginTop: 'auto',
//       }}>
//         <p style={{ margin: '5px', fontSize: '14px' }}>
//           &copy; {new Date().getFullYear()} Methodist Church Of Ghana. All rights reserved.
//         </p>
//         <p style={{ margin: '5px', fontSize: '14px' }}>
//           Contact Us: +233-24-123-4567 | Email: info@methodistghana.org
//         </p>
//       </footer>
//     </div>
//   );
// };

// export default WelcomeScreen;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [showResetOptions, setShowResetOptions] = useState(false);
  const [adminRequestModal, setAdminRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    name: '',
    email: '',
    phone: '',
    reason: '',
    description: ''
  });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

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

  // Captcha States
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: 0 });
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // Account Lockout States
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState(null);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Generate new captcha
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ num1, num2, answer: num1 + num2 });
    setCaptchaInput('');
    setCaptchaError('');
  };
useEffect(() => {
  // Check for existing lockout in localStorage first (faster)
  const storedLockout = localStorage.getItem('accountLockout');
  if (storedLockout) {
    const lockoutData = JSON.parse(storedLockout);
    const lockoutEndTime = new Date(lockoutData.endTime);
    
    if (lockoutEndTime > new Date()) {
      // Lockout is still active
      const remainingTime = Math.floor((lockoutEndTime - new Date()) / 1000);
      setIsAccountLocked(true);
      setLockoutEndTime(lockoutEndTime);
      setLockoutTimer(remainingTime);
      setEmail(lockoutData.email); // Pre-fill the email
      setError(`Account is temporarily locked. Please try again in ${formatTime(remainingTime)}.`);
    } else {
      // Lockout has expired, clear localStorage
      localStorage.removeItem('accountLockout');
    }
  }
}, []);
  // Initialize captcha on component mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  // OTP Timer countdown
  useEffect(() => {
    let interval = null;
    if (showOtpModal && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(timer => {
          if (timer <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return timer - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, otpTimer]);

  // Account lockout timer
  useEffect(() => {
    let interval = null;
    if (isAccountLocked && lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer(timer => {
          if (timer <= 1) {
            setIsAccountLocked(false);
            setLockoutEndTime(null);
            return 0;
          }
          return timer - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAccountLocked, lockoutTimer]);

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
        },
        ipAddress: 'Collected server-side',
      });
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  };

  // Function to check and update failed login attempts
  // const updateFailedAttempts = async (userEmail, isSuccess = false) => {
  //   const db = getFirestore();
  //   try {
  //     const attemptsRef = collection(db, 'loginAttempts');
  //     const q = query(attemptsRef, where('email', '==', userEmail.toLowerCase()));
  //     const querySnapshot = await getDocs(q);

  //     if (querySnapshot.empty && !isSuccess) {
  //       // Create new record for failed attempt
  //       await addDoc(attemptsRef, {
  //         email: userEmail.toLowerCase(),
  //         failedAttempts: 1,
  //         lastAttempt: serverTimestamp(),
  //         lockedUntil: null
  //       });
  //       return 1;
  //     } else if (!querySnapshot.empty) {
  //       const attemptDoc = querySnapshot.docs[0];
  //       const attemptData = attemptDoc.data();

  //       if (isSuccess) {
  //         // Reset failed attempts on successful login
  //         await updateDoc(doc(db, 'loginAttempts', attemptDoc.id), {
  //           failedAttempts: 0,
  //           lastAttempt: serverTimestamp(),
  //           lockedUntil: null
  //         });
  //         return 0;
  //       } else {
  //         // Increment failed attempts
  //         const newFailedAttempts = (attemptData.failedAttempts || 0) + 1;
  //         const lockoutDuration = newFailedAttempts >= 5 ? 30 * 60 * 1000 : 0; // 30 minutes after 5 attempts
  //         const lockedUntil = lockoutDuration > 0 ? new Date(Date.now() + lockoutDuration) : null;

  //         await updateDoc(doc(db, 'loginAttempts', attemptDoc.id), {
  //           failedAttempts: newFailedAttempts,
  //           lastAttempt: serverTimestamp(),
  //           lockedUntil: lockedUntil
  //         });

  //         if (lockedUntil) {
  //           setIsAccountLocked(true);
  //           setLockoutEndTime(lockedUntil);
  //           setLockoutTimer(Math.floor(lockoutDuration / 1000));
  //         }

  //         return newFailedAttempts;
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error updating failed attempts:', error);
  //     return 0;
  //   }
  // };
// const updateFailedAttempts = async (userEmail, isSuccess = false) => {
//   const db = getFirestore();
//   try {
//     const attemptsRef = collection(db, 'loginAttempts');
//     const q = query(attemptsRef, where('email', '==', userEmail.toLowerCase()));
//     const querySnapshot = await getDocs(q);

//     if (querySnapshot.empty && !isSuccess) {
//       // Create new record for failed attempt
//       await addDoc(attemptsRef, {
//         email: userEmail.toLowerCase(),
//         failedAttempts: 1,
//         lastAttempt: serverTimestamp(),
//         lockedUntil: null
//       });
//       return 1;
//     } else if (!querySnapshot.empty) {
//       const attemptDoc = querySnapshot.docs[0];
//       const attemptData = attemptDoc.data();

//       if (isSuccess) {
//         // Reset failed attempts on successful login
//         await updateDoc(doc(db, 'loginAttempts', attemptDoc.id), {
//           failedAttempts: 0,
//           lastAttempt: serverTimestamp(),
//           lockedUntil: null
//         });
        
//         // Clear localStorage lockout data
//         localStorage.removeItem('accountLockout');
//         localStorage.removeItem('lastAttemptedEmail');
        
//         return 0;
//       } else {
//         // Increment failed attempts
//         const newFailedAttempts = (attemptData.failedAttempts || 0) + 1;
//         const lockoutDuration = newFailedAttempts >= 5 ? 30 * 60 * 1000 : 0; // 30 minutes after 5 attempts
//         const lockedUntil = lockoutDuration > 0 ? new Date(Date.now() + lockoutDuration) : null;

//         await updateDoc(doc(db, 'loginAttempts', attemptDoc.id), {
//           failedAttempts: newFailedAttempts,
//           lastAttempt: serverTimestamp(),
//           lockedUntil: lockedUntil
//         });

//         if (lockedUntil) {
//           setIsAccountLocked(true);
//           setLockoutEndTime(lockedUntil);
//           setLockoutTimer(Math.floor(lockoutDuration / 1000));
          
//           // Store lockout data in localStorage for persistence
//           localStorage.setItem('accountLockout', JSON.stringify({
//             email: userEmail.toLowerCase(),
//             endTime: lockedUntil.toISOString(),
//             failedAttempts: newFailedAttempts
//           }));
//         }

//         return newFailedAttempts;
//       }
//     }
//   } catch (error) {
//     console.error('Error updating failed attempts:', error);
//     return 0;
//   }
// };
const updateFailedAttempts = async (userEmail, isSuccess = false) => {
  const db = getFirestore();
  try {
    const attemptsRef = collection(db, 'loginAttempts');
    const q = query(attemptsRef, where('email', '==', userEmail.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty && !isSuccess) {
      // Create new record for failed attempt
      await addDoc(attemptsRef, {
        email: userEmail.toLowerCase(),
        failedAttempts: 1,
        lastAttempt: serverTimestamp(),
        lockedUntil: null
      });
      return 1;
    } else if (!querySnapshot.empty) {
      const attemptDoc = querySnapshot.docs[0];
      const attemptData = attemptDoc.data();

      if (isSuccess) {
        // Reset failed attempts on successful login
        await updateDoc(doc(db, 'loginAttempts', attemptDoc.id), {
          failedAttempts: 0,
          lastAttempt: serverTimestamp(),
          lockedUntil: null
        });
        
        // Clear localStorage lockout data
        localStorage.removeItem('accountLockout');
        localStorage.removeItem('lastAttemptedEmail');
        
        return 0;
      } else {
        // Increment failed attempts
        const newFailedAttempts = (attemptData.failedAttempts || 0) + 1;
        const lockoutDuration = newFailedAttempts >= 5 ? 5 * 60 * 1000 : 0; 
        const lockedUntil = lockoutDuration > 0 ? new Date(Date.now() + lockoutDuration) : null;

        await updateDoc(doc(db, 'loginAttempts', attemptDoc.id), {
          failedAttempts: newFailedAttempts,
          lastAttempt: serverTimestamp(),
          lockedUntil: lockedUntil
        });

        if (lockedUntil) {
          setIsAccountLocked(true);
          setLockoutEndTime(lockedUntil);
          setLockoutTimer(Math.floor(lockoutDuration / 1000));
          
          // Store lockout data in localStorage for persistence
          localStorage.setItem('accountLockout', JSON.stringify({
            email: userEmail.toLowerCase(),
            endTime: lockedUntil.toISOString(),
            failedAttempts: newFailedAttempts
          }));
        }

        return newFailedAttempts;
      }
    }
  } catch (error) {
    console.error('Error updating failed attempts:', error);
    return 0;
  }
};
// Enhanced account lockout timer with localStorage cleanup
useEffect(() => {
  let interval = null;
  if (isAccountLocked && lockoutTimer > 0) {
    interval = setInterval(() => {
      setLockoutTimer(timer => {
        if (timer <= 1) {
          setIsAccountLocked(false);
          setLockoutEndTime(null);
          setError('');
          
          // Clear localStorage when lockout expires
          localStorage.removeItem('accountLockout');
          
          return 0;
        }
        return timer - 1;
      });
    }, 1000);
  }
  return () => clearInterval(interval);
}, [isAccountLocked, lockoutTimer]);

  // Function to check if account is locked
  const checkAccountLockout = async (userEmail) => {
    const db = getFirestore();
    try {
      const attemptsRef = collection(db, 'loginAttempts');
      const q = query(attemptsRef, where('email', '==', userEmail.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const attemptData = querySnapshot.docs[0].data();
        if (attemptData.lockedUntil && attemptData.lockedUntil.toDate() > new Date()) {
          const remainingTime = Math.floor((attemptData.lockedUntil.toDate() - new Date()) / 1000);
          setIsAccountLocked(true);
          setLockoutEndTime(attemptData.lockedUntil.toDate());
          setLockoutTimer(remainingTime);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking account lockout:', error);
      return false;
    }
  };

  // Function to generate OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  };

  // Function to send SMS via Hubtel API
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

  // Function to save OTP to Firestore
  const saveOTPToFirestore = async (email, otp, phoneNumber) => {
    const db = getFirestore();
    try {
      const otpDoc = await addDoc(collection(db, 'otp'), {
        email: email.toLowerCase(),
        otp: otp,
        phoneNumber: phoneNumber,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
        used: false
      });
      return otpDoc.id;
    } catch (error) {
      console.error('Error saving OTP:', error);
      return null;
    }
  };

  // Function to send OTP
  const sendOTP = async (userData, userDocId) => {
    setIsSendingOtp(true);
    setOtpMessage('');

    try {
      const otp = generateOTP();
      const phoneNumber = userData.contact;

      if (!phoneNumber) {
        setOtpMessage('No phone number found in your profile. Please contact admin.');
        setIsSendingOtp(false);
        return;
      }

      // Save OTP to Firestore
      const otpId = await saveOTPToFirestore(email, otp, phoneNumber);
      if (!otpId) {
        setOtpMessage('Failed to generate OTP. Please try again.');
        setIsSendingOtp(false);
        return;
      }

      // Send SMS
      const smsMessage = `Your Methodist Church System login verification code is: ${otp}. This code will expire in 5 minutes.`;
      const smsSent = await sendSMS(phoneNumber, smsMessage);

      if (smsSent) {
        setGeneratedOtpId(otpId);
        setUserDataForLogin({ ...userData, userDocId });
        setShowOtpModal(true);
        setOtpTimer(300); // 5 minutes
        setCanResendOtp(false);
        setOtpMessage('OTP sent successfully to your phone number.');

        // Log OTP sent activity
        await logUserActivity(
          userDocId,
          userData.name || email,
          userData.role,
          'OTP_SENT',
          'SUCCESS',
          'OTP sent for 2FA verification'
        );
      } else {
        setOtpMessage('Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setOtpMessage('Error sending OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Function to verify OTP
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

      querySnapshot.docs.forEach(async (otpDoc) => {
        const otpData = otpDoc.data();
        if (otpData.otp === otpCode && !otpData.used) {
          const now = new Date();
          const expiresAt = otpData.expiresAt.toDate();

          if (now <= expiresAt) {
            otpFound = true;
            otpValid = true;

            // Mark OTP as used
            await updateDoc(doc(db, 'otp', otpDoc.id), {
              used: true,
              usedAt: serverTimestamp()
            });

            // Complete login process
            await updateFailedAttempts(email, true); // Reset failed attempts

            // Log successful 2FA verification
            await logUserActivity(
              userDataForLogin.userDocId,
              userDataForLogin.name || email,
              userDataForLogin.role,
              'OTP_VERIFIED',
              'SUCCESS',
              '2FA verification successful'
            );

            // Store user info in localStorage
            localStorage.setItem('userRole', userDataForLogin.role);
            localStorage.setItem('userName', userDataForLogin.name || email);
            localStorage.setItem('userId', userDataForLogin.userDocId);

            // Log successful login
            await logUserActivity(
              userDataForLogin.userDocId,
              userDataForLogin.name || email,
              userDataForLogin.role,
              'LOGIN',
              'SUCCESS',
              'User successfully logged in with 2FA'
            );

            setOtpMessage('Login successful! Redirecting...');
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          } else {
            otpFound = true;
            setOtpMessage('OTP has expired. Please request a new one.');
          }
        }
      });

      if (!otpFound) {
        setOtpMessage('Invalid OTP code. Please try again.');
        
        // Log failed OTP verification
        await logUserActivity(
          userDataForLogin?.userDocId || 'unknown',
          userDataForLogin?.name || email,
          userDataForLogin?.role || 'unknown',
          'OTP_VERIFICATION',
          'FAILED',
          'Invalid OTP entered'
        );
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setOtpMessage('Error verifying OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Function to resend OTP
  const resendOTP = async () => {
    if (userDataForLogin) {
      setOtpTimer(300);
      setCanResendOtp(false);
      await sendOTP(userDataForLogin, userDataForLogin.userDocId);
    }
  };
const createCaptchaImage = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 120;
  canvas.height = 40;

  // Background with gradient
  const gradient = ctx.createLinearGradient(0, 0, 120, 40);
  gradient.addColorStop(0, '#f0f0f0');
  gradient.addColorStop(1, '#e0e0e0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 120, 40);

  // Add noise lines
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 120, Math.random() * 40);
    ctx.lineTo(Math.random() * 120, Math.random() * 40);
    ctx.stroke();
  }

  // Add noise dots
  ctx.fillStyle = '#ddd';
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 120, Math.random() * 40, 1, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Draw captcha text
  ctx.font = 'bold 18px Arial';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const text = `${captcha.num1} + ${captcha.num2} = ?`;
  ctx.fillText(text, 60, 20);

  return canvas.toDataURL();
};
  // Validate captcha
  // const validateCaptcha = () => {
  //   if (parseInt(captchaInput) !== captcha.answer) {
  //     setCaptchaError('Incorrect captcha. Please try again.');
  //     generateCaptcha();
  //     return false;
  //   }
  //   setCaptchaError('');
  //   return true;
  // };
const validateCaptcha = () => {
  if (!captchaInput) {
    setCaptchaError('Please solve the captcha');
    return false;
  }
  
  if (parseInt(captchaInput) !== captcha.answer) {
    setCaptchaError('Incorrect captcha. Please try again.');
    generateCaptcha();
    return false;
  }
  
  setCaptchaError('');
  return true;
};
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Both fields are required!');
      return;
    }

    // Validate captcha
    if (!validateCaptcha()) {
      return;
    }

    // Check if account is locked
    const isLocked = await checkAccountLockout(email);
    if (isLocked) {
      setError(`Account is temporarily locked. Please try again in ${formatTime(lockoutTimer)}.`);
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

        // Check if the account is active only if `isActive` exists in the document
        if ('isActive' in userData && !userData.isActive) {
          // Log failed login attempt - account inactive
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
          generateCaptcha(); // Generate new captcha after failed attempt
          return;
        }

        if (userData.password === password) {
          // Password is correct, proceed with 2FA
          generateCaptcha(); // Generate new captcha for next attempt
          await sendOTP(userData, userDoc.id);
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
            setError(`Too many failed attempts. Account locked for 5 minutes.`);
          } else {
            setError(`Invalid email or password! ${5 - failedAttempts} attempts remaining.`);
          }
          generateCaptcha(); // Generate new captcha after failed attempt
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
        generateCaptcha(); // Generate new captcha after failed attempt
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
      generateCaptcha(); // Generate new captcha after error
    } finally {
      setIsLoading(false);
    }
  };

  // Handle admin request submission
  const handleAdminRequest = async () => {
    if (!requestForm.name || !requestForm.email || !requestForm.reason) {
      setRequestMessage('Please fill in all required fields (Name, Email, and Reason)');
      return;
    }

    setIsSubmittingRequest(true);
    setRequestMessage('');

    try {
      const db = getFirestore();
      await addDoc(collection(db, 'Request'), {
        name: requestForm.name,
        email: requestForm.email.toLowerCase(),
        phone: requestForm.phone,
        reason: requestForm.reason,
        description: requestForm.description,
        requestType: 'PASSWORD_RECOVERY',
        status: 'PENDING',
        timestamp: serverTimestamp(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
        }
      });

      // Log the admin request activity
      await logUserActivity(
        'unknown',
        requestForm.name,
        'unknown',
        'ADMIN_REQUEST',
        'SUCCESS',
        'Password recovery request submitted to admin'
      );

      setRequestMessage('Your request has been submitted successfully! An admin will contact you soon.');
      
      // Clear form and close modal after 3 seconds
      setTimeout(() => {
        setAdminRequestModal(false);
        setRequestForm({
          name: '',
          email: '',
          phone: '',
          reason: '',
          description: ''
        });
        setRequestMessage('');
        setShowResetOptions(false);
        setModalVisible(false);
      }, 3000);

    } catch (error) {
      console.error('Error submitting admin request:', error);
      
      // Log error
      await logUserActivity(
        'unknown',
        requestForm.name,
        'unknown',
        'ADMIN_REQUEST',
        'FAILED',
        `Admin request failed: ${error.message}`
      );

      setRequestMessage('Failed to submit request. Please try again.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Password reset function
  const handlePasswordReset = async () => {
    if (!resetEmail) {
      setResetMessage('Please enter your email address');
      return;
    }

    setIsResettingPassword(true);
    setResetMessage('');

    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, resetEmail.toLowerCase());
      
      // Log password reset activity
      await logUserActivity(
        'unknown',
        resetEmail,
        'unknown',
        'PASSWORD_RESET',
        'SUCCESS',
        'Password reset email sent'
      );

      setResetMessage('Password reset email sent successfully! Check your inbox or Spam.');
      setTimeout(() => {
        setModalVisible(false);
        setResetMessage('');
        setResetEmail('');
        setShowResetOptions(false);
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      
      // Log password reset error
      await logUserActivity(
        'unknown',
        resetEmail,
        'unknown',
        'PASSWORD_RESET',
        'FAILED',
        `Password reset failed: ${error.message}`
      );

      let errorMessage = 'Failed to send reset email. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      setResetMessage(errorMessage);
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Handle form input changes
  const handleRequestFormChange = (field, value) => {
    setRequestForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Existing styles
  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.3s',
    marginBottom: '15px',
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#002366',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s ease',
  };

  // Modal styles
  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
    position: 'relative',
    maxHeight: '80vh',
    overflowY: 'auto',
  };

  const forgotPasswordStyle = {
    textAlign: 'center',
    marginTop: '15px',
    cursor: 'pointer',
    color: 'black',
    textDecoration: 'underline',
    fontSize: '16px',
  };

  const optionButtonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    color: '#002366',
    border: '2px solid #002366',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '10px',
    transition: 'all 0.3s ease',
  };

  const captchaStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
  };

  const captchaBoxStyle = {
    padding: '10px',
    backgroundColor: '#f8f9fa',
    border: '2px solid #002366',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#002366',
    minWidth: '120px',
    textAlign: 'center',
  };

  const refreshButtonStyle = {
    padding: '8px 12px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{
        width: '100%',
        backgroundColor: '#f8f9fa',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        position: 'fixed',
        top: 0,
        zIndex: 1000,
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="/logo.jpg"
            alt="Methodist Church Logo"
            style={{ height: '80px', marginRight: '10px' }}
          />
          <h2 style={{ margin: 0, fontSize: '24px', color: '#002366' }}>
            Methodist Church Of Ghana
          </h2>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        flex: 1,
        backgroundImage: "url('/pack (1).jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        marginTop: '100px',
      }}>
        <h1 style={{
          color: 'white',
          fontSize: '40px',
          textAlign: 'center',
          marginBottom: '40px',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        }}>
          Welcome To Methodist Church Of Ghana Portal
        </h1>

        {/* Login Card */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '30px',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
        }}>
          <h2 style={{
            color: '#002366',
            marginBottom: '30px',
            textAlign: 'center',
            fontSize: '24px',
          }}>
            User Login
          </h2>

          {error && (
            <div style={{
              backgroundColor: '#ffebee',
              color: '#c62828',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              textAlign: 'center',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          {isAccountLocked && (
            <div style={{
              backgroundColor: '#fff3cd',
              color: '#856404',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              textAlign: 'center',
              fontSize: '14px',
            }}>
              🔒 Account locked for {formatTime(lockoutTimer)}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                style={inputStyle}
                autoComplete="email"
                disabled={isAccountLocked}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                autoComplete="current-password"
                disabled={isAccountLocked}
              />
            </div>

            {/* Captcha Section */}
           <div style={captchaStyle}>
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  }}>
    <div style={{
      border: '2px solid #ddd',
      borderRadius: '6px',
      backgroundColor: '#f9f9f9',
      minHeight: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: '1',
      minWidth: '120px'
    }}>
      <img 
        src={createCaptchaImage()} 
        alt="Captcha" 
        style={{ borderRadius: '4px' }}
        key={captcha.answer} // Force re-render when captcha changes
      />
    </div>
    
    <input
      type="number"
      placeholder="Answer"
      value={captchaInput}
      onChange={(e) => {
        setCaptchaInput(e.target.value);
        if (captchaError) {
          setCaptchaError('');
        }
      }}
      style={{
        ...inputStyle,
        marginBottom: '0',
        width: '80px',
        borderColor: captchaError ? '#dc3545' : '#ddd'
      }}
      disabled={isAccountLocked}
    />
    
    <button
      type="button"
      onClick={generateCaptcha}
      style={refreshButtonStyle}
      disabled={isAccountLocked}
    >
      ↻
    </button>
  </div>
  
  {captchaError && (
    <div style={{
      color: '#dc3545',
      fontSize: '14px',
      marginTop: '5px',
      fontWeight: '500'
    }}>
      {captchaError}
    </div>
  )}
</div>
            <button
              type="submit"
              style={buttonStyle}
              disabled={isLoading || isAccountLocked}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div
            style={forgotPasswordStyle}
            onClick={() => setModalVisible(true)}
          >
            Forgot Password?
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#002366',
        color: 'white',
        textAlign: 'center',
        padding: '20px',
        fontSize: '14px',
      }}>
        © 2024 Methodist Church Of Ghana. All rights reserved.
      </footer>

      {/* Password Reset Modal */}
      {modalVisible && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <button
              style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
              }}
              onClick={() => {
                setModalVisible(false);
                setShowResetOptions(false);
                setResetMessage('');
                setRequestMessage('');
              }}
            >
              ×
            </button>

            <h3 style={{ marginBottom: '20px', color: '#002366', textAlign: 'center' }}>
              Password Recovery
            </h3>

            {!showResetOptions ? (
              <div>
                <p style={{ marginBottom: '20px', textAlign: 'center', color: '#666' }}>
                  Choose how you would like to recover your password:
                </p>

                <button
                  style={optionButtonStyle}
                  onClick={() => setShowResetOptions(true)}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#002366';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                    e.target.style.color = '#002366';
                  }}
                >
                  📧 Email Reset Link
                </button>

                <button
                  style={optionButtonStyle}
                  onClick={() => setAdminRequestModal(true)}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#002366';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                    e.target.style.color = '#002366';
                  }}
                >
                  👤 Request Admin Help
                </button>
              </div>
            ) : (
              <div>
                <p style={{ marginBottom: '20px', textAlign: 'center', color: '#666' }}>
                  Enter your email address to receive a password reset link:
                </p>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value.toLowerCase())}
                  style={inputStyle}
                />

                {resetMessage && (
                  <div style={{
                    backgroundColor: resetMessage.includes('successfully') ? '#e8f5e8' : '#ffebee',
                    color: resetMessage.includes('successfully') ? '#2e7d32' : '#c62828',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '15px',
                    textAlign: 'center',
                    fontSize: '14px',
                  }}>
                    {resetMessage}
                  </div>
                )}

                <button
                  onClick={handlePasswordReset}
                  style={{
                    ...buttonStyle,
                    marginBottom: '10px',
                  }}
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? 'Sending...' : 'Send Reset Link'}
                </button>

                <button
                  onClick={() => setShowResetOptions(false)}
                  style={{
                    ...buttonStyle,
                    backgroundColor: '#6c757d',
                  }}
                >
                  Back to Options
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Request Modal */}
      {adminRequestModal && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <button
              style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
              }}
              onClick={() => {
                setAdminRequestModal(false);
                setRequestMessage('');
                setRequestForm({
                  name: '',
                  email: '',
                  phone: '',
                  reason: '',
                  description: ''
                });
              }}
            >
              ×
            </button>

            <h3 style={{ marginBottom: '20px', color: '#002366', textAlign: 'center' }}>
              Request Admin Help
            </h3>

            <p style={{ marginBottom: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
              Fill out this form and an admin will contact you to help recover your account.
            </p>

            <input
              type="text"
              placeholder="Full Name *"
              value={requestForm.name}
              onChange={(e) => handleRequestFormChange('name', e.target.value)}
              style={inputStyle}
            />

            <input
              type="email"
              placeholder="Email Address *"
              value={requestForm.email}
              onChange={(e) => handleRequestFormChange('email', e.target.value.toLowerCase())}
              style={inputStyle}
            />

            <input
              type="tel"
              placeholder="Phone Number"
              value={requestForm.phone}
              onChange={(e) => handleRequestFormChange('phone', e.target.value)}
              style={inputStyle}
            />

            <select
              value={requestForm.reason}
              onChange={(e) => handleRequestFormChange('reason', e.target.value)}
              style={inputStyle}
            >
              <option value="">Select Reason *</option>
              <option value="FORGOT_PASSWORD">Forgot Password</option>
              <option value="ACCOUNT_LOCKED">Account Locked</option>
              <option value="EMAIL_CHANGED">Email Address Changed</option>
              <option value="NO_ACCESS">Lost Access to Account</option>
              <option value="OTHER">Other</option>
            </select>

            <textarea
              placeholder="Additional Details (Optional)"
              value={requestForm.description}
              onChange={(e) => handleRequestFormChange('description', e.target.value)}
              style={{
                ...inputStyle,
                minHeight: '80px',
                resize: 'vertical',
              }}
            />

            {requestMessage && (
              <div style={{
                backgroundColor: requestMessage.includes('successfully') ? '#e8f5e8' : '#ffebee',
                color: requestMessage.includes('successfully') ? '#2e7d32' : '#c62828',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '15px',
                textAlign: 'center',
                fontSize: '14px',
              }}>
                {requestMessage}
              </div>
            )}

            <button
              onClick={handleAdminRequest}
              style={{
                ...buttonStyle,
                marginBottom: '10px',
              }}
              disabled={isSubmittingRequest}
            >
              {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
            </button>

            <button
              onClick={() => {
                setAdminRequestModal(false);
                setRequestMessage('');
                setRequestForm({
                  name: '',
                  email: '',
                  phone: '',
                  reason: '',
                  description: ''
                });
              }}
              style={{
                ...buttonStyle,
                backgroundColor: '#6c757d',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ marginBottom: '20px', color: '#002366', textAlign: 'center' }}>
              🔐 Two-Factor Authentication
            </h3>

            <p style={{ marginBottom: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
              We've sent a 6-digit verification code to your registered phone number.
              Please enter it below to complete your login.
            </p>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                fontSize: '18px',
                color: '#002366',
                marginBottom: '10px'
              }}>
                Time remaining: {formatTime(otpTimer)}
              </div>
            </div>

            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{
                ...inputStyle,
                textAlign: 'center',
                fontSize: '20px',
                letterSpacing: '3px',
              }}
              maxLength="6"
              autoComplete="one-time-code"
            />

            {otpMessage && (
              <div style={{
                backgroundColor: otpMessage.includes('successful') ? '#e8f5e8' : '#ffebee',
                color: otpMessage.includes('successful') ? '#2e7d32' : '#c62828',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '15px',
                textAlign: 'center',
                fontSize: '14px',
              }}>
                {otpMessage}
              </div>
            )}

            <button
              onClick={verifyOTP}
              style={{
                ...buttonStyle,
                marginBottom: '10px',
              }}
              disabled={isVerifyingOtp || otpCode.length !== 6}
            >
              {isVerifyingOtp ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              onClick={resendOTP}
              style={{
                ...buttonStyle,
                backgroundColor: canResendOtp ? '#28a745' : '#6c757d',
                marginBottom: '10px',
              }}
              disabled={!canResendOtp || isSendingOtp}
            >
              {isSendingOtp ? 'Sending...' : canResendOtp ? 'Resend Code' : `Resend in ${formatTime(otpTimer)}`}
            </button>

            <button
              onClick={() => {
                setShowOtpModal(false);
                setOtpCode('');
                setOtpMessage('');
                setUserDataForLogin(null);
                setGeneratedOtpId('');
              }}
              style={{
                ...buttonStyle,
                backgroundColor: '#6c757d',
              }}
            >
              Cancel Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomeScreen;