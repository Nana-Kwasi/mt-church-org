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
import * as XLSX from 'xlsx';

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
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  const db = getFirestore(app);


  const sortByDate = (logs) => {
    return [...logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };
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
          timestamp: date, // Keep the raw Date object for sorting
          formattedTimestamp, // Store formatted string separately
        };
      });
  
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
  
      const filtered = logsData.filter((log) => {
        return (
          log.timestamp &&
          log.timestamp >= start &&
          log.timestamp <= end &&
          (!paymentType || log.paymentType === paymentType)
        );
      });
  
      // Sort logs by date in ascending order
      const sortedLogs = filtered.sort((a, b) => a.timestamp - b.timestamp);
  
      setLogs(sortedLogs);
      setFilteredLogs(sortedLogs.map((log) => ({
        ...log,
        timestamp: log.formattedTimestamp, // Use formatted date for display
      })));
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

    // Sort the filtered logs by date in ascending order
    const sortedLogs = filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateA - dateB; // Sort in ascending order
    });

    setLogs(sortedLogs);
    setFilteredLogs(sortedLogs);
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
  // const generateExcel = () => {
  //   const workbook = XLSX.utils.book_new();
    
  //   // Prepare the data
  //   const excelData = filteredLogs.map((log, index) => ({
  //     "#": index + 1,
  //     "Member Name": log.memberName,
  //     "Payment Type": log.paymentType,
  //     "Amount": `${log.amount} ${log.currency}`,
  //     "Date": log.timestamp
  //   }));

  //   const worksheet = XLSX.utils.json_to_sheet(excelData);
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Report");
    
  //   // Generate & Save Excel File
  //   XLSX.writeFile(workbook, "Filtered_Financial_Report.xlsx");
  // };
const generateExcel = () => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Determine report type and period
    const reportType = year ? "Yearly Report" : "Date Range Report";
    const reportPeriod = year ? `Year: ${year}` : `Period: ${startDate} to ${endDate}`;
    
    // Create report header information with better spacing
    const reportInfo = [
      [`Mt Zion Methodist Church - Financial Reports`],
      [], // Empty row for spacing
      [reportType],
      [reportPeriod],
      [`Payment Type Filter: ${paymentType || "All Payment Types"}`],
      [`Generated on: ${new Date().toLocaleString()}`],
      [`Total Transactions: ${filteredLogs.length}`],
      [], // Empty row for spacing
      [], // Additional spacing before table
    ];

    // Prepare transaction data with proper headers
    const transactionData = [
      ["No.", "Member Name", "Payment Type", "Amount", "Currency", "Date"]
    ];
    
    filteredLogs.forEach((log, index) => {
      transactionData.push([
        index + 1,
        log.memberName,
        log.paymentType,
        parseFloat(log.amount).toFixed(2),
        log.currency,
        new Date(log.timestamp).toLocaleDateString()
      ]);
    });

    // Add spacing after transaction table
    transactionData.push([]);
    transactionData.push([]);
    transactionData.push([]);

    // Calculate currency totals from filtered logs only
    const filteredCurrencyTotals = {};
    filteredLogs.forEach(log => {
      const currency = log.currency;
      if (!filteredCurrencyTotals[currency]) {
        filteredCurrencyTotals[currency] = 0;
      }
      filteredCurrencyTotals[currency] += parseFloat(log.amount) || 0;
    });

    // Create summary section with better formatting
    let summarySection = [
      ["FINANCIAL SUMMARY"],
      [], // Empty row
      ["Currency Breakdown:"],
      ["Currency", "Total Amount", "Transaction Count", "Percentage"]
    ];

    let overallTransactionCount = 0;
    let grandTotal = 0;

    // Calculate grand total for percentage calculation
    Object.entries(filteredCurrencyTotals).forEach(([currency, total]) => {
      grandTotal += total;
    });

    Object.entries(filteredCurrencyTotals).forEach(([currency, total]) => {
      const currencyTransactionCount = filteredLogs.filter(log => log.currency === currency).length;
      const percentage = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : 0;
      overallTransactionCount += currencyTransactionCount;
      
      summarySection.push([
        currency,
        total.toFixed(2),
        currencyTransactionCount,
        `${percentage}%`
      ]);
    });

    // Add grand total with better formatting
    summarySection.push([]);
    summarySection.push(["GRAND TOTAL", grandTotal.toFixed(2), overallTransactionCount, "100%"]);
    summarySection.push([]);
    summarySection.push([]);

    // Add payment type breakdown if "All" is selected
    if (!paymentType || paymentType === "") {
      summarySection.push(["Payment Type Breakdown:"]);
      summarySection.push(["Payment Type", "Total Amount", "Transaction Count", "Average per Transaction"]);
      
      const paymentTypeBreakdown = {};
      filteredLogs.forEach(log => {
        const type = log.paymentType;
        if (!paymentTypeBreakdown[type]) {
          paymentTypeBreakdown[type] = { total: 0, count: 0 };
        }
        paymentTypeBreakdown[type].total += parseFloat(log.amount) || 0;
        paymentTypeBreakdown[type].count += 1;
      });

      Object.entries(paymentTypeBreakdown).forEach(([type, data]) => {
        const average = data.count > 0 ? (data.total / data.count).toFixed(2) : "0.00";
        summarySection.push([
          type,
          data.total.toFixed(2),
          data.count,
          average
        ]);
      });
      
      summarySection.push([]);
      summarySection.push([]);
    }

    // Add monthly breakdown for yearly reports
    if (year) {
      summarySection.push(["Monthly Breakdown:"]);
      summarySection.push(["Month", "Total Amount", "Transaction Count", "Average per Transaction"]);
      
      const monthlyBreakdown = {};
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      
      // Initialize all months
      months.forEach(month => {
        monthlyBreakdown[month] = { total: 0, count: 0 };
      });
      
      filteredLogs.forEach(log => {
        const logDate = new Date(log.timestamp);
        if (!isNaN(logDate.getTime())) {
          const monthName = months[logDate.getMonth()];
          monthlyBreakdown[monthName].total += parseFloat(log.amount) || 0;
          monthlyBreakdown[monthName].count += 1;
        }
      });

      months.forEach(month => {
        const data = monthlyBreakdown[month];
        if (data.count > 0) {
          const average = (data.total / data.count).toFixed(2);
          summarySection.push([
            month,
            data.total.toFixed(2),
            data.count,
            average
          ]);
        }
      });
    }

    // Combine all data
    const allData = [
      ...reportInfo,
      ...transactionData,
      ...summarySection
    ];

    // Create worksheet from the combined data
    const worksheet = XLSX.utils.aoa_to_sheet(allData);

    // Set column widths for better presentation
    const columnWidths = [
      { wch: 8 },   // No. column
      { wch: 30 },  // Member Name
      { wch: 20 },  // Payment Type
      { wch: 15 },  // Amount
      { wch: 12 },  // Currency
      { wch: 18 }   // Date
    ];
    worksheet['!cols'] = columnWidths;

    // Enhanced styling
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Style main title (first row)
    if (worksheet['A1']) {
      worksheet['A1'].s = {
        font: { bold: true, sz: 18, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: "1F4E79" } },
        border: {
          top: { style: 'thick', color: { rgb: "000000" } },
          bottom: { style: 'thick', color: { rgb: "000000" } },
          left: { style: 'thick', color: { rgb: "000000" } },
          right: { style: 'thick', color: { rgb: "000000" } }
        }
      };
    }

    // Find and style the transaction table headers
    let headerRowIndex = -1;
    for (let i = 0; i <= range.e.r; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 });
      if (worksheet[cellRef] && worksheet[cellRef].v === "No.") {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex !== -1) {
      // Style transaction table header row
      for (let col = 0; col <= 5; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = {
            font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'medium', color: { rgb: "000000" } },
              bottom: { style: 'medium', color: { rgb: "000000" } },
              left: { style: 'thin', color: { rgb: "000000" } },
              right: { style: 'thin', color: { rgb: "000000" } }
            }
          };
        }
      }

      // Style transaction data rows
      filteredLogs.forEach((_, index) => {
        const dataRowIndex = headerRowIndex + 1 + index;
        for (let col = 0; col <= 5; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: dataRowIndex, c: col });
          if (worksheet[cellRef]) {
            worksheet[cellRef].s = {
              alignment: { 
                horizontal: col === 0 ? 'center' : col === 3 ? 'right' : col === 4 ? 'center' : 'left',
                vertical: 'center'
              },
              border: {
                top: { style: 'thin', color: { rgb: "CCCCCC" } },
                bottom: { style: 'thin', color: { rgb: "CCCCCC" } },
                left: { style: 'thin', color: { rgb: "CCCCCC" } },
                right: { style: 'thin', color: { rgb: "CCCCCC" } }
              },
              fill: { fgColor: { rgb: index % 2 === 0 ? "F8F9FA" : "FFFFFF" } }
            };
          }
        }
      });
    }

    // Style summary section headers
    const summaryHeaders = [
      "FINANCIAL SUMMARY",
      "Currency Breakdown:",
      "GRAND TOTAL", 
      "Payment Type Breakdown:",
      "Monthly Breakdown:"
    ];
    
    for (let i = 0; i <= range.e.r; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 });
      if (worksheet[cellRef] && summaryHeaders.includes(worksheet[cellRef].v)) {
        const isMainHeader = worksheet[cellRef].v === "FINANCIAL SUMMARY";
        worksheet[cellRef].s = {
          font: { 
            bold: true, 
            sz: isMainHeader ? 16 : 12, 
            color: { rgb: isMainHeader ? "FFFFFF" : "1F4E79" } 
          },
          fill: { fgColor: { rgb: isMainHeader ? "1F4E79" : "D9E2F3" } },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: isMainHeader ? {
            top: { style: 'medium', color: { rgb: "000000" } },
            bottom: { style: 'medium', color: { rgb: "000000" } },
            left: { style: 'medium', color: { rgb: "000000" } },
            right: { style: 'medium', color: { rgb: "000000" } }
          } : undefined
        };
      }
    }

    // Format amount columns as currency
    for (let i = 0; i <= range.e.r; i++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: i, c: col });
        if (worksheet[cellRef] && typeof worksheet[cellRef].v === 'string') {
          const cellValue = worksheet[cellRef].v;
          // Check if it's a number that should be formatted as currency
          if (!isNaN(parseFloat(cellValue)) && cellValue.includes('.') && 
              (col === 3 || (col === 1 && i > headerRowIndex + filteredLogs.length + 5))) {
            worksheet[cellRef].t = 'n';
            worksheet[cellRef].v = parseFloat(cellValue);
            worksheet[cellRef].z = '#,##0.00';
          }
        }
      }
    }

    // Style sub-headers in summary sections
    const subHeaders = ["Currency", "Payment Type", "Month"];
    for (let i = 0; i <= range.e.r; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: i, c: 0 });
      if (worksheet[cellRef] && subHeaders.includes(worksheet[cellRef].v)) {
        // Style the entire row
        for (let col = 0; col <= 5; col++) {
          const subHeaderCellRef = XLSX.utils.encode_cell({ r: i, c: col });
          if (worksheet[subHeaderCellRef]) {
            worksheet[subHeaderCellRef].s = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "70AD47" } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'medium', color: { rgb: "000000" } },
                bottom: { style: 'medium', color: { rgb: "000000" } },
                left: { style: 'thin', color: { rgb: "000000" } },
                right: { style: 'thin', color: { rgb: "000000" } }
              }
            };
          }
        }
      }
    }

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Report");

    // Generate filename with timestamp and report type
    const timestamp = new Date().toISOString().split('T')[0];
    const reportSuffix = year ? `Year_${year}` : `${startDate}_to_${endDate}`;
    const paymentSuffix = paymentType ? `_${paymentType.replace(/\s+/g, '_')}` : "_All_Types";
    const filename = `Financial_Report_${reportSuffix}${paymentSuffix}_${timestamp}.xlsx`;
    
    // Save file
    XLSX.writeFile(workbook, filename);
    
    // Show success message
    alert(`Professional Excel report downloaded successfully as ${filename}`);
    
  } catch (error) {
    console.error("Error in Excel generation:", error);
    alert("Error generating Excel file. Please try again.");
  }
};
  return (
    <div className="reports-screen">
      <h2>Financial Reports</h2>
  
      <div className="filter-section">
        {/* <h3>Filter by Date Range</h3> */}
        <label>
          Start Date
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
            <option value="Welfare">Welfare</option>
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
                  <th style={{ color: "salmon" }}>#</th>
                  <th style={{ color: "salmon" }}>Member Name</th>
                  <th style={{ color: "salmon" }}>Payment Type</th>
                  <th style={{ color: "salmon" }}>Amount</th>
                  <th style={{ color: "salmon" }}>Date</th>
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
  
          <div className="download-buttons">
            <div className="dropdown">
              <button
                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                className="download-btn dropdown-toggle"
              >
                Download ▼
              </button>
              {showDownloadOptions && (
                <div className="dropdown-menu">
                  <button
                    onClick={() => {
                      generatePDF();
                      setShowDownloadOptions(false);
                    }}
                    className="dropdown-item"
                  >
                    Download as PDF
                  </button>
                  <button
                    onClick={() => {
                      generateExcel();
                      setShowDownloadOptions(false);
                    }}
                    className="dropdown-item"
                  >
                    Download as Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}  
export default Reports;
