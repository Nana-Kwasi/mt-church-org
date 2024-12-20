import React, { useState } from 'react';
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import app from "../../Component/Config/Config";
import { v4 as uuidv4 } from 'uuid';
import "../Group.css"
import Users from '../Users/Users';

const Groups = () => {
  const db = getFirestore(app);
  const auth = getAuth(app);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);

 

  const ROLES = [
    "Admin", "Support", "Finance", "View",
  ];

  const MEMBERSHIP_TYPES = ["Catechumens", "Full Member"];

  const [userData, setUserData] = useState({
    firstName: '', 
    lastName: '', 
    gender: '',
    contact: '', 
    email: '', 
    password: '',
    membership: '', 
    role: '', 
    // organisations: ''
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      const requiredFields = [
        'firstName', 'lastName', 'gender', 
        'contact', 'email', 'password', 
        'membership', 'role', 
      ];

      const missingFields = requiredFields.filter(field => !userData[field]);

      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setIsLoading(false);
        return;
      }

      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );

      // Generate unique IDs for Firestore documents
      const userDocumentId = uuidv4();
      const authDocumentId = uuidv4();

      // Prepare user data for Firestore
      const userSubmissionData = {
        ...userData,
        registeredAt: new Date().toISOString(),
        uid: userCredential.user.uid
      };

      // Prepare authentication data for separate collection
      const authSubmissionData = {
        email: userData.email,
        role: userData.role,
        uid: userCredential.user.uid,
        createdAt: new Date().toISOString()
      };

      // Submit user data to Firestore
      await setDoc(doc(db, "Users", userDocumentId), userSubmissionData);
      await setDoc(doc(db, "UserAccess", authDocumentId), authSubmissionData);

      // Reset form
      setUserData({
        firstName: '', 
        lastName: '', 
        gender: '',
        contact: '', 
        email: '', 
        password: '',
        membership: '', 
        role: '', 
        organisations: ''
      });

      setSuccess('User created successfully!');
      setIsFormVisible(false);
    } catch (error) {
      console.error("Error creating user:", error);
      setError(error.message || 'Failed to create user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="circles-container">
        <div 
          className="circle-button" 
          onClick={() => setIsFormVisible(!isFormVisible)}
        >
          Create User
        </div>
      </div>
      
      {/* Form Dropdown */}
      {isFormVisible && (
        <div className="form">
          <h2 className="form-title">Admin User Creation</h2>
          
          {/* Error Message */}
          {error && (
            <div className="error-message" style={{
              color: 'red', 
              marginBottom: '10px', 
              padding: '10px', 
              backgroundColor: '#ffeeee',
              border: '1px solid red',
              borderRadius: '5px'
            }}>
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="success-message" style={{
              color: 'green', 
              marginBottom: '10px', 
              padding: '10px', 
              backgroundColor: '#eeffee',
              border: '1px solid green',
              borderRadius: '5px'
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* First Name */}
            <div>
              <label>First Name</label>
              <input 
                type="text"
                name="firstName"
                value={userData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label>Last Name</label>
              <input 
                type="text"
                name="lastName"
                value={userData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            {/* Gender */}
            <div>
              <label>Gender</label>
              <select
                name="gender"
                value={userData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Contact */}
            <div>
              <label>Contact</label>
              <input 
                type="text"
                name="contact"
                value={userData.contact}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label>Email</label>
              <input 
                type="email"
                name="email"
                value={userData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label>Password</label>
              <input 
                type="password"
                name="password"
                value={userData.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Membership */}
            <div>
              <label>Membership</label>
              <select
                name="membership"
                value={userData.membership}
                onChange={handleChange}
                required
              >
                <option value="">Select Membership</option>
                {MEMBERSHIP_TYPES.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Role */}
            <div>
              <label>Role</label>
              <select
                name="role"
                value={userData.role}
                onChange={handleChange}
                required
              >
                <option value="">Select Role</option>
                {ROLES.map((role, index) => (
                  <option key={index} value={role}>{role}</option>
                ))}
              </select>
            </div>

          
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating User...' : 'Create User'}
            </button>
          </form>
        </div>
      )}
        <Users/>
    </div>
  );
};

export default Groups;


 // Predefined options
  // const ORGANISATIONS = [
  //   "Mens Fellowship", "Choir", "Womens Christ Little Band", 
  //   "Singing Band", "Guild", "Girls Fellowship", 
  //   "Youth Fellowship", "Gospel Band"
  // ];


  /* Organisations
            <div>
              <label>Organisations</label>
              <select
                name="organisations"
                value={userData.organisations}
                onChange={handleChange}
                required
              >
                <option value="">Select Organisation</option>
                {ORGANISATIONS.map((org, index) => (
                  <option key={index} value={org}>{org}</option>
                ))}
              </select>
            </div> */
