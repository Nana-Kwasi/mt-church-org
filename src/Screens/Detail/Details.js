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
import { doc, getDoc, addDoc, collection, getDocs } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";
import app from "../../Component/Config/Config";
import "../detail.css";
import * as XLSX from 'xlsx';
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
  const [showReportModal, setShowReportModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [comment, setComment] = useState("");
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [currencyTotals, setCurrencyTotals] = useState({});
  const navigate = useNavigate();
  const db = getFirestore(app);
  const [showTransactionTable, setShowTransactionTable] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [reportDateRange, setReportDateRange] = useState({ start: null, end: null });
  const [apiError, setApiError] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState("all");
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);



  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('233') ? cleaned : `233${cleaned.startsWith('0') ? cleaned.slice(1) : cleaned}`;
  };

  const sendPaymentSMS = async (phoneNumber, message) => {
    try {
      console.log("==== SMS SENDING DEBUG START ====");
      
      const hubtelEndpoint = 'https://smsc.hubtel.com/v1/messages/send';
      const clientId = 'vxojxzbs';
      const clientSecret = 'szojhvcz';
      
      // Ensure phone number is properly formatted
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      
      const params = new URLSearchParams({
        clientid: clientId,
        clientsecret: clientSecret,
        from: 'MtZionMeth',
        to: formattedPhone,
        content: message
      });
  
      const url = `${hubtelEndpoint}?${params.toString()}`;
      
      console.log("Sending SMS to:", formattedPhone);
      console.log("Message content:", message);
  
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
  
      const responseData = await response.json();
      console.log("Hubtel API Response:", responseData);
  
      if (responseData.status === 0) {
        console.log("SMS sent successfully");
        return responseData;
      } else {
        throw new Error(responseData.statusDescription || 'SMS sending failed');
      }
  
    } catch (error) {
      console.error("SMS Sending Error:", {
        error: error.message,
        phoneNumber,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  };
  
  const handlePay = async () => {
    if (!selectedOption || !selectedCurrency || !amount) {
      alert("Please select a payment type, currency, and enter an amount.");
      return;
    }
  
    setIsProcessing(true);
    setApiError("");
  
    try {
      // Save payment to Firestore
      const paymentData = {
        memberId: memberId,
        memberName: getFullName(),
        paymentType: selectedOption,
        currency: selectedCurrency,
        amount: parseFloat(amount),
        timestamp: new Date(),
        comment: selectedOption === "Funeral Contributions" ? comment : ""
      };
  
      // Save to Firestore
      const moneyCollectionsRef = collection(db, "Money Collections");
      const docRef = await addDoc(moneyCollectionsRef, paymentData);
      console.log("Payment saved with ID:", docRef.id);
  
      // Handle SMS
      if (member.contact) {
        const message = `Payment Confirmation from Mt Zion Methodist Church\nType: ${selectedOption}\nAmount: ${selectedCurrency} ${amount}\nDate: ${new Date().toLocaleDateString()}\nThank you for your payment.`;
        
        try {
          const smsResult = await sendPaymentSMS(member.contact, message);
          if (smsResult) {
            console.log("SMS sent successfully:", smsResult);
            alert("Payment recorded and SMS confirmation sent successfully!");
          }
        } catch (smsError) {
          console.error("SMS Error:", smsError);
          alert(`Payment successful! However, SMS notification failed: ${smsError.message}`);
        }
      } else {
        alert("Payment successful! (No SMS sent - no contact number found)");
      }
  
      // Clear form on success
      setShowPayModal(false);
      setSelectedOption("");
      setSelectedCurrency("");
      setAmount("");
      setComment("");
  
    } catch (error) {
      console.error("Payment Processing Error:", error);
      setApiError(error.message);
      alert("Error processing payment: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

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

 
   const generateReport = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    setIsProcessing(true);
    try {
      console.log("Fetching transactions...");
      const moneyCollectionsRef = collection(db, "Money Collections");
      const snapshot = await getDocs(moneyCollectionsRef);
      console.log("Total documents fetched:", snapshot.size);

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      setReportDateRange({ start, end });

      const transactions = [];
      const currencyGroups = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate?.() || new Date(data.timestamp);

        if (
          data.memberId === memberId &&
          timestamp >= start &&
          timestamp <= end &&
          (selectedPaymentType === "all" || data.paymentType === selectedPaymentType)
        ) {
          const transaction = {
            id: doc.id,
            amount: parseFloat(data.amount) || 0,
            currency: data.currency || "Unknown",
            memberId: data.memberId,
            memberName: data.memberName || "Unknown",
            paymentType: data.paymentType || "Unknown",
            timestamp: timestamp,
            formattedDate: timestamp.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            comment: data.comment || "",
          };

          transactions.push(transaction);

          if (!currencyGroups[transaction.currency]) {
            currencyGroups[transaction.currency] = 0;
          }
          currencyGroups[transaction.currency] += transaction.amount;
        }
      });

      setTransactions(transactions);
      setCurrencyTotals(currencyGroups);
      setShowTransactionTable(true);
      setShowReportModal(false);

      if (transactions.length === 0) {
        alert("No transactions found for the selected date range and payment type.");
      }
    } catch (error) {
      console.error("Detailed error in generateReport:", error);
      alert("Error generating report. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

   const downloadPDF = () => {
    try {
      const doc = new jsPDF("landscape");
      const currentDate = new Date().toLocaleString();

      doc.setFontSize(16);
      doc.text(`Financial Report for ${getFullName()}`, 20, 20);
      doc.setFontSize(12);
      doc.text(
        `Period: ${reportDateRange.start.toLocaleDateString()} to ${reportDateRange.end.toLocaleDateString()}`,
        20,
        30
      );
      doc.text(`Generated on: ${currentDate}`, 20, 40);
      if (selectedPaymentType !== "all") {
        doc.text(`Payment Type: ${selectedPaymentType}`, 20, 50);
      }

      const tableData = transactions.map((transaction, index) => [
        index + 1,
        transaction.memberName,
        transaction.paymentType,
        `${transaction.amount.toFixed(2)} ${transaction.currency}`,
        transaction.formattedDate,
        transaction.comment || "---"
      ]);

      doc.autoTable({
        head: [["#", "Member Name", "Payment Type", "Amount", "Date", "Comment"]],
        body: tableData,
        startY: selectedPaymentType !== "all" ? 60 : 50,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] },
      });

      let yPos = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(14);
      doc.text("Summary by Currency:", 20, yPos);
      doc.setFontSize(12);
      Object.entries(currencyTotals).forEach(([currency, total], index) => {
        yPos += 10;
        doc.text(`${currency}: ${total.toFixed(2)}`, 20, yPos);
      });

      doc.save(`${getFullName()}_Financial_Report.pdf`);
    } catch (error) {
      console.error("Error in PDF generation:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  const downloadExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Prepare data for Excel
      const excelData = transactions.map((transaction, index) => ({
        "#": index + 1,
        "Member Name": transaction.memberName,
        "Payment Type": transaction.paymentType,
        "Amount": transaction.amount,
        "Currency": transaction.currency,
        "Date": transaction.formattedDate,
        "Comment": transaction.comment || "---"
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Add summary section
      const summaryData = [
        ["Summary by Currency"],
        ["Currency", "Total"],
        ...Object.entries(currencyTotals).map(([currency, total]) => [
          currency,
          total.toFixed(2)
        ])
      ];

      // Add empty row and summary
      XLSX.utils.sheet_add_aoa(worksheet, [[""], ["Report Summary"]], {
        origin: -1
      });
      XLSX.utils.sheet_add_aoa(worksheet, summaryData, { origin: -1 });

      // Add to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Report");

      // Save file
      XLSX.writeFile(workbook, `${getFullName()}_Financial_Report.xlsx`);
    } catch (error) {
      console.error("Error in Excel generation:", error);
      alert("Error generating Excel file. Please try again.");
    }
  };

  const getFullName = () => {
    if (!member) return "N/A";
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

  const renderTransactionTable = () => {
    if (!showTransactionTable) return null;

    return (
      <div className="transaction-report-container">
        <div className="report-header">
          <h2 className="text-2xl font-bold mb-4">Transaction Report</h2>
          <div className="report-info">
            <p>Period: {reportDateRange.start?.toLocaleDateString()} to {reportDateRange.end?.toLocaleDateString()}</p>
            <div style={{ position: 'relative', display: 'inline-block' }}>
  <button
    onClick={() => setShowDownloadOptions(!showDownloadOptions)}
    className="download-button"
    style={{
      padding: '8px 12px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    }}
  >
    Download ▼
  </button>
  {showDownloadOptions && (
    <div
      className="download-dropdown"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)', // Positions the dropdown slightly below the button
        right: 0,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000,
        minWidth: '150px', // Ensures the dropdown has a good width
        padding: '8px 0',
      }}
    >
      <button
        onClick={() => {
          downloadPDF();
          setShowDownloadOptions(false);
        }}
        className="dropdown-item"
        style={{
          display: 'block',
          width: '100%',
          padding: '8px 12px',
          textAlign: 'left',
          backgroundColor: 'salmon',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Download as PDF
      </button>
      <button
        onClick={() => {
          downloadExcel();
          setShowDownloadOptions(false);
        }}
        className="dropdown-item"
        style={{
          display: 'block',
          width: '100%',
          padding: '8px 12px',
          textAlign: 'left',
          backgroundColor: 'gray',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Download as Excel
      </button>
    </div>
  )}
</div>

         
        
          </div>
        </div>

        <div className="currency-summary">
          <h3 className="text-xl font-semibold mb-2">Summary by Currency</h3>
          <div className="currency-totals">
            {Object.entries(currencyTotals).map(([currency, total]) => (
              <div key={currency} className="currency-total-item">
                <span className="currency">{currency}:</span>
                <span className="amount">{total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="transaction-table-wrapper">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Member Name</th>
                <th>Payment Type</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr key={transaction.id}>
                  <td>{index + 1}</td>
                  <td>{transaction.memberName}</td>
                  <td>{transaction.paymentType}</td>
                  <td>{transaction.amount.toFixed(2)} {transaction.currency}</td>
                  <td>{transaction.formattedDate}</td>
                  <td>{transaction.comment || "---"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="member-details">
      <div className="row-container">
        <button onClick={() => navigate(-1)} className="back-button">
          Back
        </button>
        <h3 className="dashboard-title">{getFullName()} Dashboard</h3>
      </div>
      
      <div className="button-container">
        <button
          className="pay-button"
          style={{ backgroundColor: "#007bff" }}
          onClick={() => setShowPayModal(true)}
        >
          Pay
        </button>
        <button
          className="generate-button"
          style={{ backgroundColor: "#ff4b5c" }}
          onClick={() => setShowReportModal(true)}
        >
          Generate Report
        </button>
      </div>

      <table className="member-details-table">
        <tbody>
          <tr>
            <th>Age</th>
            <td>{member.age || "Not Available"}</td>
            <th>Contact</th>
            <td>{member.contact || "Not Available"}</td>
          </tr>
          <tr>
            <th>Gender</th>
            <td>{member.gender || "Not Available"}</td>
            <th>Class</th>
            <td>{member.assignClass || "Not Available"}</td>
            <th>Class Leader</th>
            <td>{member.assignClassLeader || "Not Available"}</td>
          </tr>
          <tr>
            <th>Date of Birth</th>
            <td>{member.dob || "Not Available"}</td>
            <th>Employment Status</th>
            <td>{member.employmentStatus || "Not Available"}</td>
            <th>GPS</th>
            <td>{member.gps || "Not Available"}</td>
          </tr>
          <tr>
            <th>Home Region</th>
            <td>{member.homeRegion || "Not Available"}</td>
            <th>Home Town</th>
            <td>{member.homeTown || "Not Available"}</td>
            <th>Marital Status</th>
            <td>{member.maritalStatus || "Not Available"}</td>
          </tr>
          <tr>
            <th>Membership</th>
            <td>{member.membership || "Not Available"}</td>
            <th>Profession</th>
            <td>{member.profession || "Not Available"}</td>
            <th>Role</th>
            <td>{member.role || "Not Available"}</td>
          </tr>
        </tbody>
      </table>

      {renderTransactionTable()}
      
      <div className="financial-section mt-6">
        <h2 className="text-2xl font-bold mb-4">Financial Overview</h2>
        <MemberFinancialDashboard memberId={memberId} />
      </div>

      {showPayModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Make a Payment</h2>
            {apiError && <div className="error-message">{apiError}</div>}
            <select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="form-select"
            >
              <option value="">Select Payment Type</option>
              <option value="Tithe">Tithe</option>
              <option value="Welfare">Welfare</option>
              <option value="Funeral Contributions">Funeral Contributions</option>
              <option value="Special Offerings">Special Offerings</option>
            </select>
            
            {selectedOption && (
              <>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="form-select"
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
                  className="form-input"
                />
                
                {selectedOption === "Funeral Contributions" && (
                  <textarea
                    placeholder="Add a comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="form-textarea"
                  />
                )}
                
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

      {showReportModal && (
         <div className="modal">
         <div className="modal-content">
           <h2>Generate Report</h2>
           <div className="date-inputs">
             <div className="input-group">
               <label>Start Date:</label>
               <input
                 type="date"
                 value={startDate}
                 onChange={(e) => setStartDate(e.target.value)}
                 className="form-input"
               />
             </div>
             <div className="input-group">
               <label>End Date:</label>
               <input
                 type="date"
                 value={endDate}
                 onChange={(e) => setEndDate(e.target.value)}
                 className="form-input"
               />
             </div>
             <div className="input-group">
               <label>Payment Type:</label>
               <select
                 value={selectedPaymentType}
                 onChange={(e) => setSelectedPaymentType(e.target.value)}
                 className="form-select"
               >
                 <option value="all">All Payment Types</option>
                 <option value="Tithe">Tithe</option>
                 <option value="Welfare">Welfare</option>
                 <option value="Funeral Contributions">Funeral Contributions</option>
                 <option value="Special Offerings">Special Offerings</option>
               </select>
             </div>
           </div>
           
           <button
             onClick={generateReport}
             className="modal-generate-button"
             disabled={isProcessing}
           >
             {isProcessing ? "Generating..." : "Generate Report"}
           </button>
           
           <button
             onClick={() => setShowReportModal(false)}
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