import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where,addDoc } from "firebase/firestore";
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
  const [paymentData, setPaymentData] = useState({});
  const [selectedPaymentAmount, setSelectedPaymentAmount] = useState("");
  const [children, setChildren] = useState([]);
  const [isChildFieldVisible, setIsChildFieldVisible] = useState(false);
  const [selectedChild, setSelectedChild] = useState("");
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

    const fetchChildren = async () => {
      try {
        const childrenSnapshot = await getDocs(collection(db, "Children"));
        const childrenData = childrenSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          fullName: `${doc.data().firstName || ''} ${doc.data().lastName || ''}`.trim()
        }));
        console.log("Fetched children:", childrenData);  // Debug log
        setChildren(childrenData);
      } catch (error) {
        console.error("Error fetching children:", error);
      }
    };

    fetchMembers();
    fetchChildren();
  }, [db]);


  const fetchPaymentData = async (memberId) => {
    try {
      const paymentsRef = collection(db, "Money Collections");
      const q = query(paymentsRef, where("memberId", "==", memberId));
      const snapshot = await getDocs(q);
      const payments = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        payments[data.paymentType] = data.amount;
      });
      setPaymentData(payments);
      return payments;
    } catch (error) {
      console.error("Error fetching payment data:", error);
      return {};
    }
  };

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

  const handleRowClick = async (member) => {
    const payments = await fetchPaymentData(member.id);
    setSelectedMember(member);
    setSelectedPaymentAmount(payments[member.membershipFee] || "");
    setIsModalVisible(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "membershipFee") {
      setSelectedPaymentAmount(paymentData[value] || "");
      setSelectedMember(prev => ({
        ...prev,
        [name]: value,
        paymentAmount: paymentData[value] || ""
      }));
    } else if (name === "paymentAmount") {
      setSelectedPaymentAmount(value);
      setSelectedMember(prev => ({
        ...prev,
        paymentAmount: value
      }));
    } else {
      setSelectedMember(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveChanges = async () => {
    try {
      // Create an array of child objects with both ID and name
      const childrenWithNames = selectedMember.children?.map(childId => {
        const child = children.find(c => c.id === childId);
        return {
          id: childId,
          name: child ? (child.name || `${child.firstName} ${child.lastName}`) : '',
        };
      }) || [];
  
      // Prepare the update data
      const updateData = {
        ...selectedMember,
        children: childrenWithNames  // Now contains array of objects with id and name
      };
  
      console.log("Saving member with data:", updateData);
      const memberRef = doc(db, "Members", selectedMember.id);
      
      // Update the Members collection
      await updateDoc(memberRef, updateData);
  
      // Update the Money Collections collection
      if (selectedMember.membershipFee && selectedPaymentAmount) {
        const paymentsRef = collection(db, "Money Collections");
        const q = query(
          paymentsRef, 
          where("memberId", "==", selectedMember.id),
          where("paymentType", "==", selectedMember.membershipFee)
        );
        const snapshot = await getDocs(q);
  
        if (!snapshot.empty) {
          const paymentDocRef = snapshot.docs[0].ref;
          await updateDoc(paymentDocRef, {
            amount: Number(selectedPaymentAmount)
          });
        } else {
          await addDoc(paymentsRef, {
            memberId: selectedMember.id,
            paymentType: selectedMember.membershipFee,
            amount: Number(selectedPaymentAmount)
          });
        }
      }
  
      // Update local state
      setMembers(prev =>
        prev.map(member =>
          member.id === selectedMember.id ? updateData : member
        )
      );
  
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error updating member:", error);
    }
  };

    const handleChildSelect = (e) => {
    const childId = e.target.value;
    console.log("Selected child ID:", childId);  // Debug log
    setSelectedChild(childId);
    
    // Update selectedMember with the new child
    setSelectedMember(prev => {
      const updatedChildren = prev.children || [];
      if (childId && !updatedChildren.includes(childId)) {
        return {
          ...prev,
          children: [...updatedChildren, childId]
        };
      }
      return prev;
    });
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
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
                <th>Age</th>
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
                  <td>{member.age || "N/A"}</td>
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
               <label>Children</label>
              <div className="children-list">
                {selectedMember.children && selectedMember.children.map((child, index) => (
                  <div key={index} className="child-entry">
                    <input
                      type="text"
                      value={child.name || ''}
                      onChange={(e) => {
                        const updatedChildren = [...selectedMember.children];
                        updatedChildren[index] = {
                          ...updatedChildren[index],
                          name: e.target.value
                        };
                        setSelectedMember(prev => ({
                          ...prev,
                          children: updatedChildren
                        }));
                      }}
                      placeholder="Child's name"
                    />
                  </div>
                ))}
              </div>
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
              
              <label>Membership Fee Type</label>
              <select
                name="membershipFee"
                value={selectedMember.membershipFee || ""}
                onChange={handleInputChange}
              >
                <option value="">Select Payment Type</option>
                <option value="Tithe">Tithe</option>
                <option value="Welfare">Welfare</option>
                <option value="Funeral Contributions">Funeral Contributions</option>
                <option value="Special Offerings">Special Offerings</option>
              </select>
              {selectedMember.membershipFee && (
                <>
                  <label>Payment Amount</label>
                  <input
                    type="number"
                    name="paymentAmount"
                    value={selectedPaymentAmount}
                    onChange={handleInputChange}
                  />
                </>
              )}
<div className="child-section">
  <button 
    type="button"
    className="add-child-button"
    onClick={() => setIsChildFieldVisible(!isChildFieldVisible)}
  >
    {isChildFieldVisible ? 'Hide Child Selection' : 'Add a Child'}
  </button>
  
  {isChildFieldVisible && (
    <div className="child-select-container">
      <label className="child-select-label">Select Child</label>
      <div className="child-search">
        <select
          value={selectedChild}
          onChange={handleChildSelect}
          className="child-select"
        >
          <option value="">Select a child</option>
          {children
            .filter(child => 
              !selectedMember?.children?.includes(child.id)
            )
            .map((child) => (
              <option key={child.id} value={child.id}>
                {child.name || `${child.firstName} ${child.lastName}`}
              </option>
          ))}
        </select>
      </div>
    </div>
  )}

  {selectedMember?.children?.length > 0 && (
  <div className="added-children-container">
    <label>Added Children:</label>
    <ul className="added-children-list">
      {selectedMember.children.map((childId) => {
        const child = children.find((c) => c.id === childId);
        return child ? (
          <li key={childId} className="added-child-item">
            <input
              type="text"
              value={child.name || `${child.firstName} ${child.lastName}`}
              onChange={(e) => {
                const updatedChildren = children.map(c => 
                  c.id === childId ? {...c, name: e.target.value} : c
                );
                setChildren(updatedChildren);
              }}
            />
            <span 
              className="remove-child"
              onClick={() => {
                setSelectedMember(prev => ({
                  ...prev,
                  children: prev.children.filter(id => id !== childId)
                }));
              }}
              style={{ 
                marginLeft: '10px', 
                cursor: 'pointer',
                color: 'red',
                fontWeight: 'bold'
              }}
            >
              ×
            </span>
          </li>
        ) : null;
      })}
    </ul>
  </div>
)}
</div>
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