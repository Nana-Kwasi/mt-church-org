import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import app from "../../Component/Config/Config";
import { v4 as uuidv4 } from 'uuid';
import "../../registration.css";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';


const Registration = () => {
  const db = getFirestore(app);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showChildModal, setShowChildModal] = useState(false);
  const [parentsList, setParentsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [childFormData, setChildFormData] = useState({
    name: '',
    dob: '',
    age: '',
    class: '',
    organisation: '',
    parentId: ''
  });

  const TITLES = [
    "Mr.",
    "Mrs.",
    "Miss",
    "Dr.",
    "Rev.",
    "Prof.",
    "Madam",
    "Nana"
  ];

  const EMPLOYMENT_STATUSES = [
    "Employed",
    "Self-Employed",
    "Unemployed",
    "Student",
    "Retired"
  ];

  const GHANA_REGIONS = [
    "Ahafo Region",
    "Ashanti Region",
    "Bono East Region",
    "Bono Region",
    "Central Region",
    "Eastern Region",
    "Greater Accra Region",
    "North East Region",
    "Northern Region",
    "Oti Region",
    "Savannah Region",
    "Upper East Region",
    "Upper West Region",
    "Volta Region",
    "Western North Region",
    "Western Region"
  ];

  const ORGANISATIONS = [
    "Mens Fellowship",
    "Choir",
    "Christ Little Band", 
    "Singing Band", 
    "Guild",
    "Girls Fellowship", 
    "Youth Fellowship", 
    "Gospel Band",
    "Women's Fellowship",
    "Brigade", 
    "Digital Team"
  ];

  const ROLES = [
    "Class Leader",
    "Usher",
    "Leader",
    "Organisation Executive",
    "Assistant Class Leader",
    "Poor Fund Steward",
    "Lay Movement Executive",
    "Church Member",
    "Care Taker",
    "Steward",
    "Chapel Steward"
  ];

  const MEMBERSHIP_TYPES = [
    "Catechumens",
    "Full Member",
    "Distance",
    "Invalid"
  ];

  const CLASS_OPTIONS = [
    "Class 1",
    "Class 2", 
    "Class 3", 
    "Class 4", 
    "Class 5"
  ];

  const CLASS_LEADERS = [
    "Naomi Eshun",
    "De-Graft Yamoah", 
    "Stephen Boadi",
    "Joel Yamoah",
    "Victoria Mensah",
  ];

  const ASSISTANT_CLASS_LEADERS = [
    "Esther Kottey",
    "Anabella Yamoah",
    "Mercy Arhur",
    "Beatrice Arhin",
    "Ebenezer Saah"
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
    organisations: [],
    assignClass: '',
    assignClassLeader: '',
    assignAssistantClassLeader: ''
  });
  const CHILD_CLASS_OPTIONS = [
    "Beginners",
    "Primary",
    "Timothy"
  ];

  const CHILD_ORGANISATIONS = [
    "MYF",
    "MGF",
    "Bridge",
    "Junior Choir"
  ];

  useEffect(() => {
    fetchParents();
  }, []);

  const fetchParents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Members"));
      const parents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: `${doc.data().firstName} ${doc.data().lastName}`,
        ...doc.data()
      }));
      setParentsList(parents);
    } catch (error) {
      console.error("Error fetching parents:", error);
    }
  };

  const handleChildChange = (e) => {
    const { name, value } = e.target;
    if (name === 'dob') {
      const age = calculateAge(value);
      setChildFormData(prev => ({ ...prev, [name]: value, age }));
    } else {
      setChildFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleChildSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedParent = parentsList.find(parent => parent.id === childFormData.parentId);
      const documentId = uuidv4();
      await setDoc(doc(db, "Children", documentId), {
        ...childFormData,
        parentName: selectedParent ? `${selectedParent.firstName} ${selectedParent.lastName}` : '',
        registrationDate: new Date().toISOString()
      });
      alert('Child registered successfully!');
      setChildFormData({
        name: '',
        dob: '',
        age: '',
        class: '',
        organisation: '',
        parentId: ''
      });
      setShowChildModal(false);
    } catch (error) {
      console.error("Error registering child:", error);
      alert('Failed to register child');
    }
  };
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const updatedOrganisations = [...formData.organisations];
      if (e.target.checked) {
        updatedOrganisations.push(value);
      } else {
        const index = updatedOrganisations.indexOf(value);
        if (index > -1) {
          updatedOrganisations.splice(index, 1);
        }
      }
      setFormData({
        ...formData,
        organisations: updatedOrganisations
      });
    } else {
      if (name === 'assignClassLeader') {
        setFormData({
          ...formData,
          [name]: value,
          assignAssistantClassLeader: ''
        });
      } else {
        setFormData({
          ...formData,
          [name]: value
        });
      }

      if (name === 'dob') {
        const age = calculateAge(value);
        setFormData((prevData) => ({ ...prevData, age }));
      }
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

      const documentId = uuidv4();
      const submissionData = {
        ...formData,
        registrationDate: new Date().toISOString()
      };

      await setDoc(doc(db, "Members", documentId), submissionData);

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
        organisations: [],
        assignClass: '',
        assignClassLeader: '',
        assignAssistantClassLeader: ''
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
      
      <div className="header-container">
        <h2>Member Registration</h2>
        <button
          className="add-child-button"
          onClick={() => setShowChildModal(true)}
        >
          Add Children
        </button>
      </div>

      {showChildModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register Child</h3>
              <button className="close-button" onClick={() => setShowChildModal(false)}>×</button>
            </div>
            <form onSubmit={handleChildSubmit}>
              <div className="child-form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={childFormData.name}
                  onChange={handleChildChange}
                  required
                />
              </div>

              <div className="child-form-group">
                <label>Date of Birth:</label>
                <input
                  type="date"
                  name="dob"
                  value={childFormData.dob}
                  onChange={handleChildChange}
                  required
                />
              </div>

              <div className="child-form-group">
                <label>Age:</label>
                <input
                  type="number"
                  name="age"
                  value={childFormData.age}
                  readOnly
                />
              </div>

              <div className="child-form-group">
                <label>Class:</label>
                <select
                  name="class"
                  value={childFormData.class}
                  onChange={handleChildChange}
                  required
                >
                  <option value="">Select Class</option>
                  {CHILD_CLASS_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="child-form-group">
                <label>Organisation:</label>
                <select
                  name="organisation"
                  value={childFormData.organisation}
                  onChange={handleChildChange}
                  required
                >
                  <option value="">Select Organisation</option>
                  {CHILD_ORGANISATIONS.map(org => (
                    <option key={org} value={org}>{org}</option>
                  ))}
                </select>
              </div>

              <div className="child-form-group">
                <label>Link Parent:</label>
                <div className="parent-search">
                  <input
                    type="text"
                    placeholder="Search parent..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <select
                    name="parentId"
                    value={childFormData.parentId}
                    onChange={handleChildChange}
                    required
                  >
                    <option value="">Select Parent</option>
                    {parentsList
                      .filter(parent => 
                        parent.name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map(parent => (
                        <option key={parent.id} value={parent.id}>
                          {parent.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <button 
  type="submit" 
  className="submit-child-button"
  disabled={isLoading}
>
  {isLoading ? (
    <>
      <span className="spinner"></span>
      <span>Registering...</span>
    </>
  ) : (
    'Register Child'
  )}
</button>
            </form>
          </div>
        </div>
      )}
      <form className="registration-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title:</label>
          <select name="title" value={formData.title} onChange={handleChange}>
            <option value="">Select Title</option>
            {TITLES.map(title => (
              <option key={title} value={title}>{title}</option>
            ))}
          </select>
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
          <PhoneInput
            country={'gh'}
            value={formData.contact}
            onChange={phone => setFormData(prev => ({ ...prev, contact: phone }))}
            inputProps={{
              required: true
            }}
          />
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
            <option value="Blessing">Blessing</option>
            <option value="Traditional Marriage">Traditional Marriage</option>
            <option value="Cohabiting">Cohabiting</option>
          </select>
        </div>

        <div className="form-group">
          <label>Employment Status:</label>
          <select name="employmentStatus" value={formData.employmentStatus} onChange={handleChange}>
            <option value="">Select Employment Status</option>
            {EMPLOYMENT_STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Profession/Vocation:</label>
          <input type="text" name="profession" value={formData.profession} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Home Region:</label>
          <select name="homeRegion" value={formData.homeRegion} onChange={handleChange}>
            <option value="">Select Region</option>
            {GHANA_REGIONS.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
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
          <div className="checkbox-group">
            {ORGANISATIONS.map(org => (
              <div key={org} className="checkbox-item">
                <input
                  type="checkbox"
                  id={org}
                  name="organisations"
                  value={org}
                  checked={formData.organisations.includes(org)}
                  onChange={handleChange}
                />
                <label htmlFor={org}>{org}</label>
              </div>
            ))}
          </div>
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

        {formData.assignClassLeader && (
          <div className="form-group">
            <label>Assign Assistant Class Leader:</label>
            <select
              name="assignAssistantClassLeader"
              value={formData.assignAssistantClassLeader}
              onChange={handleChange}
            >
              <option value="">Select Assistant Class Leader</option>
              {ASSISTANT_CLASS_LEADERS.map(assistant => (
  <option key={assistant} value={assistant}>{assistant}</option>
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