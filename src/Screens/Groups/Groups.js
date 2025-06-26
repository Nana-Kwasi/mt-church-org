// import React, { useState } from 'react';
// import { getFirestore, doc, setDoc } from "firebase/firestore";
// import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
// import app from "../../Component/Config/Config";
// import { v4 as uuidv4 } from 'uuid';
// import "../Group.css"
// import Users from '../Users/Users';

// const Groups = () => {
//   const db = getFirestore(app);
//   const auth = getAuth(app);

//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [isFormVisible, setIsFormVisible] = useState(false);

 

//   const ROLES = [
//     "Admin", "Support", "Finance", "View",
//   ];

//   const MEMBERSHIP_TYPES = ["Catechumens", "Full Member"];

//   const [userData, setUserData] = useState({
//     firstName: '', 
//     lastName: '', 
//     gender: '',
//     contact: '', 
//     email: '', 
//     password: '',
//     membership: '', 
//     role: '', 
//     // organisations: ''
//   });

//   // Handle input changes
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setUserData(prevData => ({
//       ...prevData,
//       [name]: value
//     }));
//   };

//   // Form submission handler
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError('');
//     setSuccess('');

//     try {
//       // Validate required fields
//       const requiredFields = [
//         'firstName', 'lastName', 'gender', 
//         'contact', 'email', 'password', 
//         'membership', 'role', 
//       ];

//       const missingFields = requiredFields.filter(field => !userData[field]);

//       if (missingFields.length > 0) {
//         setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
//         setIsLoading(false);
//         return;
//       }

//       // Create user in Firebase Authentication
//       const userCredential = await createUserWithEmailAndPassword(
//         auth, 
//         userData.email, 
//         userData.password
//       );

//       // Generate unique IDs for Firestore documents
//       const userDocumentId = uuidv4();
//       const authDocumentId = uuidv4();

//       // Prepare user data for Firestore
//       const userSubmissionData = {
//         ...userData,
//         registeredAt: new Date().toISOString(),
//         uid: userCredential.user.uid
//       };

//       // Prepare authentication data for separate collection
//       const authSubmissionData = {
//         email: userData.email,
//         role: userData.role,
//         uid: userCredential.user.uid,
//         createdAt: new Date().toISOString()
//       };

//       // Submit user data to Firestore
//       await setDoc(doc(db, "Users", userDocumentId), userSubmissionData);
//       await setDoc(doc(db, "UserAccess", authDocumentId), authSubmissionData);

//       // Reset form
//       setUserData({
//         firstName: '', 
//         lastName: '', 
//         gender: '',
//         contact: '', 
//         email: '', 
//         password: '',
//         membership: '', 
//         role: '', 
//         organisations: ''
//       });

//       setSuccess('User created successfully!');
//       setIsFormVisible(false);
//     } catch (error) {
//       console.error("Error creating user:", error);
//       setError(error.message || 'Failed to create user. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="container">
//       <div className="circles-container">
//         <div 
//           className="circle-button" 
//           onClick={() => setIsFormVisible(!isFormVisible)}
//         >
//           Create User
//         </div>
//       </div>
      
//       {/* Form Dropdown */}
//       {isFormVisible && (
//         <div className="form">
//           <h2 className="form-title">Admin User Creation</h2>
          
//           {/* Error Message */}
//           {error && (
//             <div className="error-message" style={{
//               color: 'red', 
//               marginBottom: '10px', 
//               padding: '10px', 
//               backgroundColor: '#ffeeee',
//               border: '1px solid red',
//               borderRadius: '5px'
//             }}>
//               {error}
//             </div>
//           )}

//           {/* Success Message */}
//           {success && (
//             <div className="success-message" style={{
//               color: 'green', 
//               marginBottom: '10px', 
//               padding: '10px', 
//               backgroundColor: '#eeffee',
//               border: '1px solid green',
//               borderRadius: '5px'
//             }}>
//               {success}
//             </div>
//           )}

//           <form onSubmit={handleSubmit}>
//             {/* First Name */}
//             <div>
//               <label>First Name</label>
//               <input 
//                 type="text"
//                 name="firstName"
//                 value={userData.firstName}
//                 onChange={handleChange}
//                 required
//               />
//             </div>

//             {/* Last Name */}
//             <div>
//               <label>Last Name</label>
//               <input 
//                 type="text"
//                 name="lastName"
//                 value={userData.lastName}
//                 onChange={handleChange}
//                 required
//               />
//             </div>

//             {/* Gender */}
//             <div>
//               <label>Gender</label>
//               <select
//                 name="gender"
//                 value={userData.gender}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="">Select Gender</option>
//                 <option value="Male">Male</option>
//                 <option value="Female">Female</option>
//               </select>
//             </div>

//             {/* Contact */}
//             <div>
//               <label>Contact</label>
//               <input 
//                 type="text"
//                 name="contact"
//                 value={userData.contact}
//                 onChange={handleChange}
//                 required
//               />
//             </div>

//             {/* Email */}
//             <div>
//               <label>Email</label>
//               <input 
//                 type="email"
//                 name="email"
//                 value={userData.email}
//                 onChange={handleChange}
//                 required
//               />
//             </div>

//             {/* Password */}
//             <div>
//               <label>Password</label>
//               <input 
//                 type="password"
//                 name="password"
//                 value={userData.password}
//                 onChange={handleChange}
//                 required
//               />
//             </div>

//             {/* Membership */}
//             <div>
//               <label>Membership</label>
//               <select
//                 name="membership"
//                 value={userData.membership}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="">Select Membership</option>
//                 {MEMBERSHIP_TYPES.map((type, index) => (
//                   <option key={index} value={type}>{type}</option>
//                 ))}
//               </select>
//             </div>

//             {/* Role */}
//             <div>
//               <label>Role</label>
//               <select
//                 name="role"
//                 value={userData.role}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="">Select Role</option>
//                 {ROLES.map((role, index) => (
//                   <option key={index} value={role}>{role}</option>
//                 ))}
//               </select>
//             </div>

          
//             <button type="submit" disabled={isLoading}>
//               {isLoading ? 'Creating User...' : 'Create User'}
//             </button>
//           </form>
//         </div>
//       )}
//         <Users/>
//     </div>
//   );
// };

// export default Groups;


 // Predefined options
  // const ORGANISATIONS = [
  //   "Mens Fellowship", "Choir", "Womens Christ Little Band", 
  //   "Singing Band", "Guild", "Girls Fellowship", 
  //   "Youth Fellowship", "Gospel Band"
  // ];


import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, collection, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
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
  const [requests, setRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [updatingRequestId, setUpdatingRequestId] = useState(null);

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
  });

  // Fetch requests from Firestore
  const fetchRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const requestsRef = collection(db, 'Request');
      const q = query(requestsRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const requestsData = [];
      querySnapshot.forEach((doc) => {
        requestsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to fetch requests');
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Update request status
  const updateRequestStatus = async (requestId, newStatus) => {
    setUpdatingRequestId(requestId);
    try {
      const requestRef = doc(db, 'Request', requestId);
      await updateDoc(requestRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      // Update local state
      setRequests(prevRequests => 
        prevRequests.map(request => 
          request.id === requestId 
            ? { ...request, status: newStatus, updatedAt: new Date().toISOString() }
            : request
        )
      );
      
      setSuccess(`Request status updated to ${newStatus}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating request status:', error);
      setError('Failed to update request status');
    } finally {
      setUpdatingRequestId(null);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate) {
      // Firestore timestamp
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      // ISO string
      date = new Date(timestamp);
    } else {
      return 'N/A';
    }
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-badge status-pending';
      case 'resolved':
        return 'status-badge status-resolved';
      case 'rejected':
        return 'status-badge status-rejected';
      default:
        return 'status-badge status-default';
    }
  };

  // Open modal and fetch requests
  const openRequestsModal = () => {
    setShowRequestsModal(true);
    fetchRequests();
  };

  // Close modal
  const closeRequestsModal = () => {
    setShowRequestsModal(false);
    setError('');
    setSuccess('');
  };

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
        
        <div 
          className="circle-button" 
          onClick={openRequestsModal}
          style={{ marginLeft: '15px' }}
        >
          View Requests
        </div>
      </div>
      
      {/* Form Dropdown */}
      {isFormVisible && (
        <div className="form">
          <h2 className="form-title">Admin User Creation</h2>
          
          {/* Error Message */}
          {error && !showRequestsModal && (
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
          {success && !showRequestsModal && (
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

      {/* Requests Modal */}
      {showRequestsModal && (
        <div className="modal-overlay" onClick={closeRequestsModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <h2 className="modal-title">Password Recovery Requests</h2>
              <div className="modal-header-actions">
                <button
                  className="refresh-btn"
                  onClick={fetchRequests}
                  disabled={isLoadingRequests}
                >
                  {isLoadingRequests ? 'Refreshing...' : 'Refresh'}
                </button>
                <button className="close-btn" onClick={closeRequestsModal}>
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {/* Error/Success Messages */}
              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success">
                  {success}
                </div>
              )}

              {/* Loading State */}
              {isLoadingRequests ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Loading requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="empty-state">
                  <h3>No Requests Found</h3>
                  <p>There are currently no password recovery requests.</p>
                </div>
              ) : (
                <div className="requests-container">
                  {/* Desktop Table View */}
                  <div className="desktop-view">
                    <table className="requests-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Reason</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map((request, index) => (
                          <tr key={request.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                            <td className="name-cell">{request.name || 'N/A'}</td>
                            <td className="email-cell">{request.email || 'N/A'}</td>
                            <td className="phone-cell">{request.phone || 'N/A'}</td>
                            <td className="reason-cell">{request.reason || 'N/A'}</td>
                            <td className="description-cell" title={request.description}>
                              {request.description || 'No description'}
                            </td>
                            <td className="status-cell">
                              <span className={getStatusBadgeClass(request.status)}>
                                {request.status || 'PENDING'}
                              </span>
                            </td>
                            <td className="date-cell">{formatTimestamp(request.timestamp)}</td>
                            <td className="actions-cell">
                              <div className="action-buttons">
                                {request.status !== 'RESOLVED' && (
                                  <button
                                    className="action-btn resolve-btn"
                                    onClick={() => updateRequestStatus(request.id, 'RESOLVED')}
                                    disabled={updatingRequestId === request.id}
                                  >
                                    {updatingRequestId === request.id ? '...' : 'Resolve'}
                                  </button>
                                )}
                                {request.status !== 'REJECTED' && (
                                  <button
                                    className="action-btn reject-btn"
                                    onClick={() => updateRequestStatus(request.id, 'REJECTED')}
                                    disabled={updatingRequestId === request.id}
                                  >
                                    {updatingRequestId === request.id ? '...' : 'Reject'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="mobile-view">
                    {requests.map((request) => (
                      <div key={request.id} className="request-card">
                        <div className="card-header">
                          <div className="card-name">{request.name || 'N/A'}</div>
                          <span className={getStatusBadgeClass(request.status)}>
                            {request.status || 'PENDING'}
                          </span>
                        </div>
                        
                        <div className="card-body">
                          <div className="card-row">
                            <span className="card-label">Email:</span>
                            <span className="card-value">{request.email || 'N/A'}</span>
                          </div>
                          <div className="card-row">
                            <span className="card-label">Phone:</span>
                            <span className="card-value">{request.phone || 'N/A'}</span>
                          </div>
                          <div className="card-row">
                            <span className="card-label">Reason:</span>
                            <span className="card-value">{request.reason || 'N/A'}</span>
                          </div>
                          <div className="card-row">
                            <span className="card-label">Description:</span>
                            <span className="card-value">{request.description || 'No description'}</span>
                          </div>
                          <div className="card-row">
                            <span className="card-label">Date:</span>
                            <span className="card-value">{formatTimestamp(request.timestamp)}</span>
                          </div>
                        </div>

                        <div className="card-actions">
                          {request.status !== 'RESOLVED' && (
                            <button
                              className="action-btn resolve-btn"
                              onClick={() => updateRequestStatus(request.id, 'RESOLVED')}
                              disabled={updatingRequestId === request.id}
                            >
                              {updatingRequestId === request.id ? '...' : 'Resolve'}
                            </button>
                          )}
                          {request.status !== 'REJECTED' && (
                            <button
                              className="action-btn reject-btn"
                              onClick={() => updateRequestStatus(request.id, 'REJECTED')}
                              disabled={updatingRequestId === request.id}
                            >
                              {updatingRequestId === request.id ? '...' : 'Reject'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Users/>
    </div>
  );
};

export default Groups;









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
