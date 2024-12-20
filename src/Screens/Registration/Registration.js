import React, { useState } from 'react';
import { getFirestore, doc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import app from "../../Component/Config/Config";
import { v4 as uuidv4 } from 'uuid';
import "../../registration.css";

const Registration = () => {
  const db = getFirestore(app);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Predefined options
  const ORGANISATIONS = [
    "Mens Fellowship",
    "Choir",
    "Womens Christ Little Band", 
    "Singing Band", 
    "Guild",
    "Girls Fellowship", 
    "Youth Fellowship", 
    "Gospel Band"
  ];

  const ROLES = [
    "Class Leader",
    "Usher",
    "Leader",
    "Organisation Executive",
    "Assistant Class Leader",
    "Poor Fund Steward",
    "Lay Movement Executive"
  ];

  const MEMBERSHIP_TYPES = [
    "Catechumens",
    "Full Member"
  ];

  const CLASS_OPTIONS = [
    "Class 1",
    "Class 2", 
    "Class 3", 
    "Class 4", 
    "Class 5"
  ];

  const CLASS_LEADERS = [
    "Samuel Dadzie",
    "Naomi Eshun",
    "De-Graft Yamoah", 
    "J A Mensah",
    "Ben Appiah-Mends"
  ];

  const [formData, setFormData] = useState({
    title: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    contact: '',
    dob: '',
    age: '',
    gps: '',
    maritalStatus: '',
    employmentStatus: '',
    profession: '',
    homeRegion: '',
    homeTown: '',
    membership: '',
    class: '',
    role: '',
    organisations: '',
    assignClass: '',
    assignClassLeader: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Calculate age if DOB is updated
    if (name === 'dob') {
      const age = calculateAge(value);
      setFormData((prevData) => ({ ...prevData, age }));
    }
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate required fields
      const requiredFields = [
        'firstName', 'lastName', 'gender',
        'contact', 'dob', 'age', 'maritalStatus'
      ];

      const missingFields = requiredFields.filter(field => !formData[field]);

      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setIsLoading(false);
        return;
      }

      // Check if member with the same contact already exists
      const membersQuery = query(
        collection(db, "Members"),
        where("contact", "==", formData.contact)
      );
      const querySnapshot = await getDocs(membersQuery);

      if (!querySnapshot.empty) {
        setError("A member with this contact number is already registered.");
        setIsLoading(false);
        return;
      }

      // Generate a UUID for the document ID
      const documentId = uuidv4();

      // Prepare data for Firestore
      const submissionData = {
        ...formData,
        registrationDate: new Date().toISOString()
      };

      // Submit to Firestore using UUID as document ID
      await setDoc(doc(db, "Members", documentId), submissionData);

      // Reset form and show success message
      alert('Member registered successfully!');
      setFormData({
        title: '',
        firstName: '',
        middleName: '',
        lastName: '',
        gender: '',
        contact: '',
        dob: '',
        age: '',
        gps: '',
        maritalStatus: '',
        employmentStatus: '',
        profession: '',
        homeRegion: '',
        homeTown: '',
        membership: '',
        class: '',
        role: '',
        organisations: '',
        assignClass: '',
        assignClassLeader: ''
      });
    } catch (error) {
      console.error("Error submitting member data:", error);
      setError('Failed to register member. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registration-screen">
      <h2>Member Registration</h2>
      <form className="registration-form" onSubmit={handleSubmit}>
        {/* Previous form fields remain the same */}
        <div className="form-group">
          <label>Title:</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>First Name:</label>
          <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Middle Name:</label>
          <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Last Name:</label>
          <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Gender:</label>
          <select name="gender" value={formData.gender} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div className="form-group">
          <label>Date of Birth:</label>
          <input type="date" name="dob" value={formData.dob} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Age:</label>
          <input type="number" name="age" value={formData.age} readOnly />
        </div>

        <div className="form-group">
          <label>Contact:</label>
          <input type="text" name="contact" value={formData.contact} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>GPS Address:</label>
          <input type="text" name="gps" value={formData.gps} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Marital Status:</label>
          <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
        </div>

        <div className="form-group">
          <label>Employment Status:</label>
          <input type="text" name="employmentStatus" value={formData.employmentStatus} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Profession/Vocation:</label>
          <input type="text" name="profession" value={formData.profession} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Home Region:</label>
          <input type="text" name="homeRegion" value={formData.homeRegion} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Home Town:</label>
          <input type="text" name="homeTown" value={formData.homeTown} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Membership:</label>
          <select 
            name="membership" 
            value={formData.membership} 
            onChange={handleChange}
          >
            <option value="">Select Membership</option>
            {MEMBERSHIP_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Class:</label>
          <select
            name="class"
            value={formData.class}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div className="form-group">
          <label>Role:</label>
          <select 
            name="role" 
            value={formData.role} 
            onChange={handleChange}
          >
            <option value="">Select Role</option>
            {ROLES.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Organisations:</label>
          <select 
            name="organisations" 
            value={formData.organisations} 
            onChange={handleChange}
          >
            <option value="">Select Organisation</option>
            {ORGANISATIONS.map(org => (
              <option key={org} value={org}>{org}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Assign Class:</label>
          <select
            name="assignClass"
            value={formData.assignClass}
            onChange={handleChange}
          >
            <option value="">Select Class</option>
            {CLASS_OPTIONS.map(classOption => (
              <option key={classOption} value={classOption}>{classOption}</option>
            ))}
          </select>
        </div>

        {formData.assignClass && (
          <div className="form-group">
            <label>Assign Class Leader:</label>
            <select
              name="assignClassLeader"
              value={formData.assignClassLeader}
              onChange={handleChange}
            >
              <option value="">Select Class Leader</option>
              {CLASS_LEADERS.map(leader => (
                <option key={leader} value={leader}>{leader}</option>
              ))}
            </select>
          </div>
        )}

        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

        <button 
          type="submit" 
          className="submit-button" 
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default Registration;