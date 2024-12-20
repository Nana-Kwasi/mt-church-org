import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
          setError('Your account is disabled. Please contact Admin.');
          return;
        }

        if (userData.password === password) {
          // Log successful login
          await logUserActivity(
            userDoc.id,
            userData.name || email,
            userData.role,
            'LOGIN',
            'SUCCESS',
            'User successfully logged in'
          );

          // Store user info in localStorage
          localStorage.setItem('userRole', userData.role);
          localStorage.setItem('userName', userData.name || email);
          localStorage.setItem('userId', userDoc.id); // Store user ID for future activity logging

          navigate('/dashboard');
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
          setError('Invalid email or password!');
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
        setError('User not authorized!');
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
    } finally {
      setIsLoading(false);
    }
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
          maxWidth: '500px',
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
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ marginRight: '10px' }}>Logging in...</span>
                </span>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
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