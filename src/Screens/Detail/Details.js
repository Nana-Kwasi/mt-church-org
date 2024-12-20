// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { doc, getDoc, updateDoc } from "firebase/firestore";
// import { getFirestore } from "firebase/firestore";
// import app from "../../Component/Config/Config";
// import "../detail.css";

// const MemberDetails = () => {
//   const { memberId } = useParams();
//   const [member, setMember] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [showPayModal, setShowPayModal] = useState(false);
//   const [selectedOption, setSelectedOption] = useState("");
//   const [amount, setAmount] = useState("");
//   const navigate = useNavigate();
//   const db = getFirestore(app);

//   useEffect(() => {
//     const fetchMemberDetails = async () => {
//       try {
//         const docRef = doc(db, "Members", memberId);
//         const docSnap = await getDoc(docRef);

//         if (docSnap.exists()) {
//           setMember(docSnap.data());
//         } else {
//           setError("Member not found.");
//         }
//       } catch (error) {
//         console.error("Error fetching member details:", error);
//         setError("Error fetching member details. Please try again.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMemberDetails();
//   }, [db, memberId]);

//   // Function to handle the payment process
//   const handlePay = async () => {
//     if (!selectedOption || !amount) {
//       alert("Please select an option and enter an amount.");
//       return;
//     }

//     try {
//       const docRef = doc(db, "Members", memberId);
//       const updatedAmount =
//         (member[selectedOption] || 0) + parseFloat(amount);

//       await updateDoc(docRef, {
//         [selectedOption]: updatedAmount,
//       });

//       alert("Payment successful!");
//       setMember((prev) => ({
//         ...prev,
//         [selectedOption]: updatedAmount,
//       }));
//       setShowPayModal(false);
//       setSelectedOption("");
//       setAmount("");
//     } catch (error) {
//       console.error("Error updating payment:", error);
//       alert("Payment failed. Please try again.");
//     }
//   };

//   // Combine the full name from the member details
//   const getFullName = () => {
//     const nameParts = [];
//     if (member.title) nameParts.push(member.title);
//     if (member.firstName) nameParts.push(member.firstName);
//     if (member.lastName) nameParts.push(member.lastName);
//     return nameParts.join(" ") || "N/A";
//   };

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (error) {
//     return <div className="error">{error}</div>;
//   }

//   if (!member) {
//     return <div>Member details not available.</div>;
//   }

//   return (
//     <div className="member-details">
//       {/* <h1>Member Details</h1> */}
//       <button onClick={() => navigate(-1)} className="back-button">
//         Back
//       </button>
//       <button
//         className="pay-button"
//         onClick={() => setShowPayModal(true)}
//       >
//         Pay
//       </button>

//       <table className="member-details-table">
        // <tbody>
        //   <tr>
        //     <th>Full Name</th>
        //     <td>{getFullName()}</td>
        //     <th>Age</th>
        //     <td>{member.age || "N/A"}</td>
        //     <th>Contact</th>
        //     <td>{member.contact || "N/A"}</td>
        //   </tr>
        //   <tr>
        //     <th>Gender</th>
        //     <td>{member.gender || "N/A"}</td>
        //     <th>Class</th>
        //     <td>{member.assignClass || "N/A"}</td>
        //     <th>Class Leader</th>
        //     <td>{member.assignClassLeader || "N/A"}</td>
        //   </tr>
        //   <tr>
        //     <th>Date of Birth</th>
        //     <td>{member.dob || "N/A"}</td>
        //     <th>Employment Status</th>
        //     <td>{member.employmentStatus || "N/A"}</td>
        //     <th>GPS</th>
        //     <td>{member.gps || "N/A"}</td>
        //   </tr>
        //   <tr>
        //     <th>Home Region</th>
        //     <td>{member.homeRegion || "N/A"}</td>
        //     <th>Home Town</th>
        //     <td>{member.homeTown || "N/A"}</td>
        //     <th>Marital Status</th>
        //     <td>{member.maritalStatus || "N/A"}</td>
        //   </tr>
        //   <tr>
        //     <th>Membership</th>
        //     <td>{member.membership || "N/A"}</td>
        //     <th>Profession</th>
        //     <td>{member.profession || "N/A"}</td>
        //     <th>Role</th>
        //     <td>{member.role || "N/A"}</td>
        //   </tr>
        // </tbody>
//       </table>

//       {showPayModal && (
//         <div className="modal">
//           <div className="modal-content">
//             <h2>Make a Payment</h2>
//             <select
//               value={selectedOption}
//               onChange={(e) => setSelectedOption(e.target.value)}
//             >
//               <option value="">Select Payment Type</option>
//               <option value="Tithe">Membership Fee</option>
//               <option value="Welfare">Donation</option>
//               <option value="Funeral Contributions">Funeral Contributions</option>
//               <option value="Special Offerings">Special Offerings</option>
//             </select>
//             {selectedOption && (
//               <>
//                 <input
//                   type="number"
//                   placeholder="Enter Amount"
//                   value={amount}
//                   onChange={(e) => setAmount(e.target.value)}
//                 />
//                 <button onClick={handlePay} className="modal-pay-button">
//                   Pay
//                 </button>
//               </>
//             )}
//             <button
//               onClick={() => setShowPayModal(false)}
//               className="modal-close-button"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MemberDetails;


import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import app from "../../Component/Config/Config";
import "../detail.css";
import MemberFinancialDashboard from "../../Component/Memberdashboard/memberdashboard";

const MemberDetails = () => {
  const { memberId } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const db = getFirestore(app);

  useEffect(() => {
    const fetchMemberDetails = async () => {
      try {
        const docRef = doc(db, "Members", memberId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setMember(docSnap.data());
        } else {
          setError("Member not found.");
        }
      } catch (error) {
        console.error("Error fetching member details:", error);
        setError("Error fetching member details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMemberDetails();
  }, [db, memberId]);

  const handlePay = async () => {
    if (!selectedOption || !selectedCurrency || !amount) {
      alert("Please select a payment type, currency, and enter an amount.");
      return;
    }

    setIsProcessing(true);

    try {
      // Create a new document in the Money Collections
      const moneyCollectionsRef = collection(db, "Money Collections");
      await addDoc(moneyCollectionsRef, {
        memberId: memberId,
        memberName: getFullName(),
        paymentType: selectedOption,
        currency: selectedCurrency,
        amount: parseFloat(amount),
        timestamp: new Date(),
      });

      alert("Payment recorded successfully!");
      setShowPayModal(false);
      setSelectedOption("");
      setSelectedCurrency("");
      setAmount("");
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("Payment recording failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getFullName = () => {
    const nameParts = [];
    if (member.title) nameParts.push(member.title);
    if (member.firstName) nameParts.push(member.firstName);
    if (member.lastName) nameParts.push(member.lastName);
    return nameParts.join(" ") || "N/A";
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!member) {
    return <div>Member details not available.</div>;
  }

  return (
    <div className="member-details">
    <div className="row-container">
  <button onClick={() => navigate(-1)} className="back-button">
    Back
  </button>
  <h3 className="dashboard-title">{getFullName()} Dashboard</h3>
 
</div>
<button
    className="pay-button"
    onClick={() => setShowPayModal(true)}
  >
    Pay
  </button>
     
      <table className="member-details-table">
      <tbody>
          <tr>
            {/* <th>Full Name</th>
            <td>{getFullName()}</td> */}
            <th>Age</th>
            <td>{member.age || "N/A"}</td>
            <th>Contact</th>
            <td>{member.contact || "N/A"}</td>
          </tr>
          <tr>
            <th>Gender</th>
            <td>{member.gender || "N/A"}</td>
            <th>Class</th>
            <td>{member.assignClass || "N/A"}</td>
            <th>Class Leader</th>
            <td>{member.assignClassLeader || "N/A"}</td>
          </tr>
          <tr>
            <th>Date of Birth</th>
            <td>{member.dob || "N/A"}</td>
            <th>Employment Status</th>
            <td>{member.employmentStatus || "N/A"}</td>
            <th>GPS</th>
            <td>{member.gps || "N/A"}</td>
          </tr>
          <tr>
            <th>Home Region</th>
            <td>{member.homeRegion || "N/A"}</td>
            <th>Home Town</th>
            <td>{member.homeTown || "N/A"}</td>
            <th>Marital Status</th>
            <td>{member.maritalStatus || "N/A"}</td>
          </tr>
          <tr>
            <th>Membership</th>
            <td>{member.membership || "N/A"}</td>
            <th>Profession</th>
            <td>{member.profession || "N/A"}</td>
            <th>Role</th>
            <td>{member.role || "N/A"}</td>
          </tr>
        </tbody>
      </table>
      <div className="financial-section mt-6">
        <h2 className="text-2xl font-bold mb-4">Financial Overview</h2>
        <MemberFinancialDashboard memberId={memberId} />
      </div>
      {showPayModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Make a Payment</h2>
            <select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
            >
              <option value="">Select Payment Type</option>
              <option value="Tithe">Membership Fee</option>
              <option value="Welfare">Donation</option>
              <option value="Funeral Contributions">Funeral Contributions</option>
              <option value="Special Offerings">Special Offerings</option>
            </select>
            {selectedOption && (
              <>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                >
                  <option value="">Select Currency</option>
                  <option value="USD">USD</option>
                  <option value="GHS">GHS</option>
                  <option value="EUR">EUR</option>
                </select>
                <input
                  type="number"
                  placeholder="Enter Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <button
                  onClick={handlePay}
                  className="modal-pay-button"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Pay"}
                </button>
              </>
            )}
            <button
              onClick={() => setShowPayModal(false)}
              className="modal-close-button"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDetails;