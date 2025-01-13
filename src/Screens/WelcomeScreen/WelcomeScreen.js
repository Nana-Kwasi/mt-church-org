import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTempForm, setShowTempForm] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [tempFormError, setTempFormError] = useState('');

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

  const handleCreateTempUser = async (e) => {
    e.preventDefault();
    setTempFormError('');

    if (!tempEmail || !tempPassword || !tempPhone) {
      setTempFormError('All fields are required!');
      return;
    }

    try {
      setIsLoading(true);
      const db = getFirestore();

      // Check if email already exists in temporary users
      const existingUserQuery = query(
        collection(db, 'Users'),
        where('email', '==', tempEmail)  // Remove toLowerCase()
      );
      const existingUserSnapshot = await getDocs(existingUserQuery);

      if (!existingUserSnapshot.empty) {
        setTempFormError('This email has already been used for temporary access.');
        return;
      }

      // Calculate expiration time (24 hours from now)
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 24);

      // Create temporary user
      await addDoc(collection(db, 'Users'), {
        email: tempEmail,  // Store email as-is without toLowerCase()
        password: tempPassword,
        phone: tempPhone,
        role: 'Admin', // Giving full access
        isTemporary: true,
        expirationTime: expirationTime.toISOString(),
        createdAt: serverTimestamp(),
        isActive: true
      });

      await logUserActivity(
        'system',
        'System',
        'System',
        'CREATE_TEMP_USER',
        'SUCCESS',
        `Temporary user created: ${tempEmail}`
      );

      setTempFormError('');
      setShowTempForm(false);
      setTempEmail('');
      setTempPassword('');
      setTempPhone('');
      alert('Temporary account created successfully! Valid for 24 hours.');
    } catch (error) {
      console.error('Error creating temporary user:', error);
      setTempFormError('An error occurred while creating the temporary account.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Both fields are required!');
      return;
    }

    try {
      setIsLoading(true);

      const db = getFirestore();
      const userAccessRef = collection(db, 'Users');
      // Use case-sensitive email comparison
      const q = query(userAccessRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        // Check if account is temporary and expired
        if (userData.isTemporary) {
          const expirationTime = new Date(userData.expirationTime);
          if (new Date() > expirationTime) {
            await logUserActivity(
              userDoc.id,
              email,
              userData.role,
              'LOGIN',
              'FAILED',
              'Temporary account expired'
            );
            setError('This temporary account has expired.');
            return;
          }
        }

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
          setError('Your account is disabled. Please contact Admin.');
          return;
        }

        // Compare passwords directly without toLowerCase()
        if (userData.password === password) {
          await logUserActivity(
            userDoc.id,
            userData.name || email,
            userData.role,
            'LOGIN',
            'SUCCESS',
            'User successfully logged in'
          );

          localStorage.setItem('userRole', userData.role);
          localStorage.setItem('userName', userData.name || email);
          localStorage.setItem('userId', userDoc.id);

          navigate('/dashboard');
        } else {
          await logUserActivity(
            userDoc.id,
            email,
            'unknown',
            'LOGIN',
            'FAILED',
            'Invalid password attempt'
          );
          setError('Invalid email or password!');
        }
      } else {
        await logUserActivity(
          'unknown',
          email,
          'unknown',
          'LOGIN',
          'FAILED',
          'User not authorized/found'
        );
        setError('User not authorized!');
      }
    } catch (error) {
      console.error('Login error:', error);
      await logUserActivity(
        'unknown',
        email,
        'unknown',
        'LOGIN',
        'ERROR',
        `System error: ${error.message}`
      );
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
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

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#4a5568',
    marginTop: '10px',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '30px',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
        }}>
          {!showTempForm ? (
            <>
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

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    style={inputStyle}
                    autoComplete="email"
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
                  />
                </div>

                <button
                  type="submit"
                  style={buttonStyle}
                  disabled={isLoading}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#1a3c7d';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#002366';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>

                <button
                  type="button"
                  style={secondaryButtonStyle}
                  onClick={() => setShowTempForm(true)}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#2d3748';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#4a5568';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Create Temporal Default Login
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 style={{
                color: '#002366',
                marginBottom: '30px',
                textAlign: 'center',
                fontSize: '24px',
              }}>
                Create Temporary Login
              </h2>

              {tempFormError && (
                <div style={{
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  textAlign: 'center',
                  fontSize: '14px',
                }}>
                  {tempFormError}
                </div>
              )}

              <form onSubmit={handleCreateTempUser}>
                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value.toLowerCase())}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="password"
                    placeholder="Password"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={tempPhone}
                    onChange={(e) => setTempPhone(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <button
                  type="submit"
                  style={buttonStyle}
                  disabled={isLoading}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#1a3c7d';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#002366';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  {isLoading ? 'Creating...' : 'Create Temporary Login'}
                </button>

                <button
                  type="button"
                  style={secondaryButtonStyle}
                  onClick={() => {
                    setShowTempForm(false);
                    setTempEmail('');
                    setTempPassword('');
                    setTempPhone('');
                    setTempFormError('');
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#2d3748';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#4a5568';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Back to Login
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <footer style={{
        backgroundColor: '#002366',
        color: 'white',
        textAlign: 'center',
        padding: '15px',
        backgroundColor: '#002366',
        color: 'white',
        textAlign: 'center',
        padding: '15px 20px',
        marginTop: 'auto',
      }}>
        <p style={{ margin: '5px', fontSize: '14px' }}>
          &copy; {new Date().getFullYear()} Methodist Church Of Ghana. All rights reserved.
        </p>
        <p style={{ margin: '5px', fontSize: '14px' }}>
          Contact Us: +233-24-123-4567 | Email: info@methodistghana.org
        </p>
      </footer>
    </div>
  );
};

export default WelcomeScreen;