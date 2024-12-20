import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
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
  const db = getFirestore(app);

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

    fetchMembers();
  }, [db]);

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

  const handleRowClick = (member) => {
    setSelectedMember(member);
    setIsModalVisible(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedMember((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      const memberRef = doc(db, "Members", selectedMember.id);
      await updateDoc(memberRef, selectedMember);
      setMembers((prev) =>
        prev.map((member) =>
          member.id === selectedMember.id ? { ...selectedMember } : member
        )
      );
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error updating member:", error);
    }
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }
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
      </div>
  
      {filteredMembers.length === 0 ? (
        <div>No matching members found.</div>
      ) : (
        <div className="table-container">
          <table className="members-table">
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr
                  key={member.id}
                  onClick={() => handleRowClick(member)}
                  className="clickable-row"
                >
                  <td>{member.firstName || "N/A"}</td>
                  <td>{member.lastName || "N/A"}</td>
                  <td>{member.contact || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
  
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
  
              <label>Membership Fee</label>
              <input
                type="number"
                name="membershipFee"
                value={selectedMember.membershipFee || 0}
                onChange={handleInputChange}
              />
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
                onClick={() => setIsModalVisible(false)}
              >
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
