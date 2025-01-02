// import React, { useState } from "react";
// import { collection, getDocs } from "firebase/firestore";
// import { getFirestore } from "firebase/firestore";
// import app from "../../Component/Config/Config";
// import jsPDF from "jspdf";
// import "jspdf-autotable";
// import "../Report.css";

// const Reports = () => {
//   const [logs, setLogs] = useState([]);
//   const [filteredLogs, setFilteredLogs] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [year, setYear] = useState("");
//   const [currencyTotals, setCurrencyTotals] = useState({});
//   const db = getFirestore(app);

//   const fetchLogs = async () => {
//     if (!startDate || !endDate) {
//       alert("Please select both start and end dates.");
//       return;
//     }

//     setLoading(true);
//     setError("");
//     try {
//       const snapshot = await getDocs(collection(db, "Money Collections"));
//       const currencyGroups = {};
//       const logsData = snapshot.docs.map((doc) => {
//         const data = doc.data();
//         const date = data.timestamp?.seconds
//           ? new Date(data.timestamp.seconds * 1000)
//           : null;
//         const formattedTimestamp = date
//           ? date.toLocaleDateString("en-US", {
//               year: "numeric",
//               month: "long",
//               day: "numeric",
//             })
//           : "---";

//         const currency = data.currency || "Unknown";
//         if (!currencyGroups[currency]) currencyGroups[currency] = 0;
//         currencyGroups[currency] += data.amount || 0;

//         return {
//           id: doc.id,
//           amount: data.amount || 0,
//           currency: data.currency || "Unknown",
//           memberId: data.memberId || "---",
//           memberName: data.memberName || "---",
//           paymentType: data.paymentType || "---",
//           timestamp: formattedTimestamp,
//         };
//       });

//       const start = new Date(startDate);
//       const end = new Date(endDate);
//       end.setHours(23, 59, 59, 999);

//       const filtered = logsData.filter((log) => {
//         const logDate = new Date(log.timestamp);
//         return logDate && logDate >= start && logDate <= end;
//       });

//       setLogs(filtered);
//       setFilteredLogs(filtered);
//       setCurrencyTotals(currencyGroups);
//     } catch (error) {
//       setError(`Failed to retrieve data: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchYearlyLogs = async () => {
//     if (!year) {
//       alert("Please select a year.");
//       return;
//     }

//     setLoading(true);
//     setError("");
//     try {
//       const snapshot = await getDocs(collection(db, "Money Collections"));
//       const currencyGroups = {};
//       const logsData = snapshot.docs.map((doc) => {
//         const data = doc.data();
//         const date = data.timestamp?.seconds
//           ? new Date(data.timestamp.seconds * 1000)
//           : null;
//         const formattedTimestamp = date
//           ? date.toLocaleDateString("en-US", {
//               year: "numeric",
//               month: "long",
//               day: "numeric",
//             })
//           : "---";

//         const currency = data.currency || "Unknown";
//         if (!currencyGroups[currency]) currencyGroups[currency] = 0;
//         currencyGroups[currency] += data.amount || 0;

//         return {
//           id: doc.id,
//           amount: data.amount || 0,
//           currency: data.currency || "Unknown",
//           memberId: data.memberId || "---",
//           memberName: data.memberName || "---",
//           paymentType: data.paymentType || "---",
//           timestamp: formattedTimestamp,
//         };
//       });

//       const filtered = logsData.filter((log) => {
//         const logDate = new Date(log.timestamp);
//         return logDate && logDate.getFullYear() === parseInt(year);
//       });

//       setLogs(filtered);
//       setFilteredLogs(filtered);
//       setCurrencyTotals(currencyGroups);
//     } catch (error) {
//       setError(`Failed to retrieve data: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const generatePDF = () => {
//     const doc = new jsPDF("landscape");
//     const currentDate = new Date().toLocaleString();

//     // Add table data
//     const tableData = filteredLogs.map((log, index) => [
//       index + 1,
//       log.memberName,
//       log.paymentType,
//       `${log.amount} ${log.currency}`,
//       log.timestamp,
//     ]);

//     doc.text("Financial Reports", 70, 20);
//     doc.text(`Year: ${year || `${startDate} to ${endDate}`}`, 70, 30);
//     doc.text(`Generated on: ${currentDate}`, 70, 40);

//     doc.autoTable({
//       head: [["#", "Member Name", "Payment Type", "Amount", "Date"]],
//       body: tableData,
//       startY: 50,
//     });

//     doc.save("Yearly_Financial_Report.pdf");
//   };

//   return (
//     <div className="reports-screen">
//       <h2>Financial Reports</h2>

//       <div className="filter-section">
//         <h3>Filter by Date Range</h3>
//         <label>
//           Start Date
//           <input
//             type="date"
//             value={startDate}
//             onChange={(e) => setStartDate(e.target.value)}
//           />
//         </label>
//         <label>
//           End Date
//           <input
//             type="date"
//             value={endDate}
//             onChange={(e) => setEndDate(e.target.value)}
//           />
//         </label>
//         <button onClick={fetchLogs} className="fetch-btn">
//           Fetch Transactions
//         </button>
//       </div>

//       <div className="filter-section">
//         <h3>Filter by Year</h3>
//         <label>
//           Year
//           <input
//             type="number"
//             value={year}
//             onChange={(e) => setYear(e.target.value)}
//             placeholder="YYYY"
//           />
//         </label>
//         <button onClick={fetchYearlyLogs} className="fetch-btn">
//           Fetch Yearly Transactions
//         </button>
//       </div>

//       {loading ? (
//         <p>Loading...</p>
//       ) : error ? (
//         <p className="error">{error}</p>
//       ) : filteredLogs.length === 0 ? (
//         <p>No transactions found for the selected period.</p>
//       ) : (
//         <>
//           <div className="summary-section">
//             <h3>Summary by Currency</h3>
//             {Object.keys(currencyTotals).map((currency) => (
//               <p key={currency}>
//                 {currency}: {currencyTotals[currency].toFixed(2)}
//               </p>
//             ))}
//           </div>

//           <div className="table-container">
//             <table className="transaction-table">
//               <thead>
//                 <tr>
//                 <th style={{color:"whitesmoke"}}>#</th>
//                   <th style={{color:"whitesmoke"}}>Member Name</th>
//                   <th style={{color:"whitesmoke"}}>Payment Type</th>
//                   <th style={{color:"whitesmoke"}}>Amount</th>
//                   <th style={{color:"whitesmoke"}}>Date</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredLogs.map((log, index) => (
//                   <tr key={log.id}>
//                     <td>{index + 1}</td>
//                     <td>{log.memberName}</td>
//                     <td>{log.paymentType}</td>
//                     <td>
//                       {log.amount} {log.currency}
//                     </td>
//                     <td>{log.timestamp}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           <button onClick={generatePDF} className="download-btn">
//             Download PDF Report
//           </button>
//         </>
//       )}
//     </div>
//   );
// };
// export default Reports;

import React, { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import app from "../../Component/Config/Config";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "../Report.css";

const Reports = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [year, setYear] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [currencyTotals, setCurrencyTotals] = useState({});
  const db = getFirestore(app);

  const fetchLogs = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const snapshot = await getDocs(collection(db, "Money Collections"));
      const currencyGroups = {};
      const logsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.timestamp?.seconds
          ? new Date(data.timestamp.seconds * 1000)
          : null;
        const formattedTimestamp = date
          ? date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "---";

        const currency = data.currency || "Unknown";
        if (!currencyGroups[currency]) currencyGroups[currency] = 0;
        currencyGroups[currency] += data.amount || 0;

        return {
          id: doc.id,
          amount: data.amount || 0,
          currency: data.currency || "Unknown",
          memberId: data.memberId || "---",
          memberName: data.memberName || "---",
          paymentType: data.paymentType || "---",
          timestamp: formattedTimestamp,
        };
      });

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const filtered = logsData.filter((log) => {
        const logDate = new Date(log.timestamp);
        return (
          logDate &&
          logDate >= start &&
          logDate <= end &&
          (!paymentType || log.paymentType === paymentType)
        );
      });

      setLogs(filtered);
      setFilteredLogs(filtered);
      setCurrencyTotals(currencyGroups);
    } catch (error) {
      setError(`Failed to retrieve data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchYearlyLogs = async () => {
    if (!year) {
      alert("Please select a year.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const snapshot = await getDocs(collection(db, "Money Collections"));
      const currencyGroups = {};
      const logsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.timestamp?.seconds
          ? new Date(data.timestamp.seconds * 1000)
          : null;
        const formattedTimestamp = date
          ? date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "---";

        const currency = data.currency || "Unknown";
        if (!currencyGroups[currency]) currencyGroups[currency] = 0;
        currencyGroups[currency] += data.amount || 0;

        return {
          id: doc.id,
          amount: data.amount || 0,
          currency: data.currency || "Unknown",
          memberId: data.memberId || "---",
          memberName: data.memberName || "---",
          paymentType: data.paymentType || "---",
          timestamp: formattedTimestamp,
        };
      });

      const filtered = logsData.filter((log) => {
        const logDate = new Date(log.timestamp);
        return (
          logDate &&
          logDate.getFullYear() === parseInt(year) &&
          (!paymentType || log.paymentType === paymentType)
        );
      });

      setLogs(filtered);
      setFilteredLogs(filtered);
      setCurrencyTotals(currencyGroups);
    } catch (error) {
      setError(`Failed to retrieve data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF("landscape");
    const currentDate = new Date().toLocaleString();

    // Add table data
    const tableData = filteredLogs.map((log, index) => [
      index + 1,
      log.memberName,
      log.paymentType,
      `${log.amount} ${log.currency}`,
      log.timestamp,
    ]);

    doc.text("Financial Reports", 70, 20);
    doc.text(`Year: ${year || `${startDate} to ${endDate}`}`, 70, 30);
    doc.text(`Payment Type: ${paymentType || "All"}`, 70, 40);
    doc.text(`Generated on: ${currentDate}`, 70, 50);

    doc.autoTable({
      head: [["#", "Member Name", "Payment Type", "Amount", "Date"]],
      body: tableData,
      startY: 60,
    });

    doc.save("Filtered_Financial_Report.pdf");
  };

  return (
    <div className="reports-screen">
      <h2>Financial Reports</h2>

      <div className="filter-section">
        {/* <h3>Filter by Date Range</h3> */}
        <label >
          Start Dat
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          End Date
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <label>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
          >
            <option value="">Select Payment Type</option>
            <option value="Tithe">Tithe</option>
            <option value="Donation">Donation</option>
            <option value="Funeral Contributions">Funeral Contributions</option>
            <option value="Special Offerings">Special Offerings</option>
          </select>
        </label>
        <button onClick={fetchLogs} className="fetch-btn">
          Fetch Transactions
        </button>
      </div>

      <div className="filter-section">
        <h3>Filter by Year</h3>
        <label>
          Year
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="YYYY"
          />
        </label>
        <button onClick={fetchYearlyLogs} className="fetch-btn">
          Fetch Yearly Transactions
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : filteredLogs.length === 0 ? (
        <p>No transactions found for the selected criteria.</p>
      ) : (
        <>
          <div className="summary-section">
            <h3>Summary by Currency</h3>
            {Object.keys(currencyTotals).map((currency) => (
              <p key={currency}>
                {currency}: {currencyTotals[currency].toFixed(2)}
              </p>
            ))}
          </div>

          <div className="table-container">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th style={{color:"salmon"}}>#</th>
                  <th style={{color:"salmon"}}>Member Name</th>
                  <th style={{color:"salmon"}}>Payment Type</th>
                  <th style={{color:"salmon"}}>Amount</th>
                  <th style={{color:"salmon"}}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr key={log.id}>
                    <td>{index + 1}</td>
                    <td>{log.memberName}</td>
                    <td>{log.paymentType}</td>
                    <td>
                      {log.amount} {log.currency}
                    </td>
                    <td>{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={generatePDF} className="download-btn">
            Download PDF Report
          </button>
        </>
      )}
    </div>
  );
};

export default Reports;
