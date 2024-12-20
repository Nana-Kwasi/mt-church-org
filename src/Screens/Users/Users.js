import React, { useEffect, useState } from 'react';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  X,
  ToggleLeft,
  ToggleRight 
} from 'lucide-react';
import app from "../../Component/Config/Config";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

import "../Users.css";

const UserCard = ({ user, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  const [showPassword, setShowPassword] = useState(false);
  const db = getFirestore(app);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsExpanded(true);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    onEdit(editedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser({ ...user });
    setIsEditing(false);
  };

  const handleToggleUserStatus = async () => {
    try {
      const userDocRef = doc(db, "Users", user.id);
      const newStatus = !(user.isActive ?? true); // If isActive is undefined, assume user is active
      
      await updateDoc(userDocRef, {
        isActive: newStatus
      });
      
      // Update the local state through the parent's onEdit handler
      onEdit({
        ...user,
        isActive: newStatus
      });
      
      alert(`User account ${newStatus ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error("Error toggling user status:", error);
      alert('Failed to update user status.');
    }
  };

  return (
    <div className="user-list-item">
      <div className="user-list-header">
        <div className="user-name">
          {user.firstName} {user.lastName}
        </div>
        <div className="user-actions">
          <button 
            onClick={handleEdit} 
            className="action-btn edit-btn"
            title="Edit User"
          >
            <Edit2 size={20} />
          </button>
          <button 
            onClick={() => onDelete(user.id)} 
            className="action-btn delete-btn"
            title="Delete User"
          >
            <Trash2 size={20} />
          </button>
          <button 
            onClick={toggleExpand} 
            className="expand-btn"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="user-details">
          {isEditing ? (
            <div className="user-edit-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input 
                    type="text" 
                    name="firstName"
                    value={editedUser.firstName}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input 
                    type="text" 
                    name="lastName"
                    value={editedUser.lastName}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    name="email"
                    value={editedUser.email}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password"
                      value={editedUser.password}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                    <button 
                      type="button" 
                      onClick={togglePasswordVisibility} 
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      title={showPassword ? "Hide Password" : "Show Password"}
                    >
                      {showPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Contact</label>
                  <input 
                    type="text" 
                    name="contact"
                    value={editedUser.contact}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select 
                    name="gender"
                    value={editedUser.gender}
                    onChange={handleInputChange}
                    className="form-control"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select 
                    name="role"
                    value={editedUser.role}
                    onChange={handleInputChange}
                    className="form-control"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Support 1">Support 1</option>
                    <option value="Support 2">Support 2</option>
                    <option value="Support 3">Support 3</option>
                    <option value="Support 4">Support 4</option>
                  </select>
                </div>
              </div>
              <div className="edit-form-actions">
                <button 
                  onClick={handleSave} 
                  className="save-btn"
                >
                  <Save size={20} /> Save
                </button>
                <button 
                  onClick={handleCancel} 
                  className="cancel-btn"
                >
                  <X size={20} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="user-info-grid">
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Contact:</strong> {user.contact}</div>
              <div><strong>Gender:</strong> {user.gender}</div>
              <div><strong>Role:</strong> {user.role}</div>
              <div><strong>Registered:</strong> {new Date(user.registeredAt).toLocaleDateString()}</div>
              <div>
                <strong>Account Status:</strong> 
                <button
                  onClick={handleToggleUserStatus}
                  className={`status-toggle-btn ${user.isActive ?? true ? 'active' : 'inactive'}`}
                  style={{
                    marginLeft: '10px',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: user.isActive ?? true ? '#4CAF50' : '#f44336',
                    color: 'white',
                    transition: 'background-color 0.3s ease'
                  }}
                >
                  {user.isActive ?? true ? (
                    <>
                      <ToggleRight size={16} />
                      Enabled
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={16} />
                      Disabled
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Users = () => {
  const db = getFirestore(app);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "Users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [db]);

  const handleUpdateUser = async (updatedUser) => {
    try {
      const userDocRef = doc(db, "Users", updatedUser.id);
      
      const updateData = { ...updatedUser };
      delete updateData.id;

      await updateDoc(userDocRef, updateData);
      
      setUsers(prev => 
        prev.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        )
      );
      
      alert('User updated successfully!');
    } catch (error) {
      console.error("Error updating user:", error);
      alert('Failed to update user.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const userDocRef = doc(db, "Users", userId);
      await deleteDoc(userDocRef);
      
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      alert('User deleted successfully!');
    } catch (error) {
      console.error("Error deleting user:", error);
      alert('Failed to delete user.');
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader-spinner"></div>
        <p className="loader-text">Loading Users...</p>
      </div>
    );
  }

  return (
    <div className="users-management-container">
      <header>
        {/* <h1>User Management</h1> */}
      </header>
      
      <div className="users-list">
        {users.length > 0 ? (
          users.map((user) => (
            <UserCard 
              key={user.id} 
              user={user} 
              onEdit={handleUpdateUser}
              onDelete={handleDeleteUser}
            />
          ))
        ) : (
          <div className="no-users-message">
            <p>No users found. Add your first user!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
