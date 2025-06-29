import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, collection, getDocs } from "firebase/firestore";
import app from "../../Component/Config/Config";
import { v4 as uuidv4 } from 'uuid';
import jsPDF from "jspdf";
import "jspdf-autotable";
import "../attendance.css"
import * as XLSX from 'xlsx';

const Attendance = () => {
  const db = getFirestore(app);

  // State for controlling form visibility
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isReportsVisible, setIsReportsVisible] = useState(false);

  // State for form data
  const [attendanceData, setAttendanceData] = useState({
    date: '',
    attendanceType: '',
    // For Adults
    numberOfMen: '',
    numberOfWomen: '',
    // For Children
    numberOfBoys: '',
    numberOfGirls: ''
  });

  // State for attendance reports
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAttendanceType, setSelectedAttendanceType] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [yearlyReports, setYearlyReports] = useState([]);
  const [yearlyReportLoading, setYearlyReportLoading] = useState(false);
  const [yearlyReportError, setYearlyReportError] = useState('');
  const [yearlyReportSummary, setYearlyReportSummary] = useState(null);

  // State for form submission status
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');

  // Predefined attendance types
  const ATTENDANCE_TYPES = ["Children", "Adult"];

  // Handle input changes for form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAttendanceData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Calculate total people based on attendance type
  const calculateTotalPeople = () => {
    if (attendanceData.attendanceType === 'Adult') {
      return (parseInt(attendanceData.numberOfMen) || 0) + (parseInt(attendanceData.numberOfWomen) || 0);
    } else if (attendanceData.attendanceType === 'Children') {
      return (parseInt(attendanceData.numberOfBoys) || 0) + (parseInt(attendanceData.numberOfGirls) || 0);
    }
    return 0;
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitLoading(true);
    setSubmitError('');
    setSuccess('');

    try {
      // Validate required fields based on attendance type
      if (!attendanceData.date || !attendanceData.attendanceType) {
        setSubmitError('Please fill in date and attendance type');
        setIsSubmitLoading(false);
        return;
      }

      // Validate gender-specific fields
      if (attendanceData.attendanceType === 'Adult') {
        if (!attendanceData.numberOfMen && !attendanceData.numberOfWomen) {
          setSubmitError('Please enter number of men and/or women');
          setIsSubmitLoading(false);
          return;
        }
      } else if (attendanceData.attendanceType === 'Children') {
        if (!attendanceData.numberOfBoys && !attendanceData.numberOfGirls) {
          setSubmitError('Please enter number of boys and/or girls');
          setIsSubmitLoading(false);
          return;
        }
      }

      // Generate unique ID for Firestore document
      const attendanceDocumentId = uuidv4();

      // Calculate total people
      const totalPeople = calculateTotalPeople();

      // Prepare attendance data for Firestore
      const attendanceSubmissionData = {
        date: attendanceData.date,
        attendanceType: attendanceData.attendanceType,
        numberOfMen: parseInt(attendanceData.numberOfMen) || 0,
        numberOfWomen: parseInt(attendanceData.numberOfWomen) || 0,
        numberOfBoys: parseInt(attendanceData.numberOfBoys) || 0,
        numberOfGirls: parseInt(attendanceData.numberOfGirls) || 0,
        totalPeople: totalPeople,
        submittedAt: new Date().toISOString()
      };

      // Submit attendance data to Firestore
      await setDoc(doc(db, "Attendance", attendanceDocumentId), attendanceSubmissionData);

      // Reset form
      setAttendanceData({
        date: '',
        attendanceType: '',
        numberOfMen: '',
        numberOfWomen: '',
        numberOfBoys: '',
        numberOfGirls: ''
      });

      setSuccess('Attendance recorded successfully!');
      setIsFormVisible(false);
    } catch (error) {
      console.error("Error recording attendance:", error);
      setSubmitError(error.message || 'Failed to record attendance. Please try again.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Fetch attendance logs
  const fetchAttendanceLogs = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const snapshot = await getDocs(collection(db, "Attendance"));
      const logsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          attendanceType: data.attendanceType || "Unknown",
          numberOfMen: data.numberOfMen || 0,
          numberOfWomen: data.numberOfWomen || 0,
          numberOfBoys: data.numberOfBoys || 0,
          numberOfGirls: data.numberOfGirls || 0,
          totalPeople: data.totalPeople || (data.numberOfPeople || 0),
          date: data.date || "---",
          submittedAt: data.submittedAt || "---"
        };
      });

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const filtered = logsData.filter((log) => {
        const logDate = new Date(log.date);
        return (
          logDate &&
          logDate >= start &&
          logDate <= end &&
          (!selectedAttendanceType || log.attendanceType === selectedAttendanceType)
        );
      });

      setAttendanceLogs(logsData);
      setFilteredLogs(filtered);
    } catch (error) {
      setError(`Failed to retrieve data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF report
  const generatePDF = () => {
    const doc = new jsPDF("landscape");
    const currentDate = new Date().toLocaleString();

    // Add table data with gender breakdown
    const tableData = filteredLogs.map((log, index) => [
      index + 1,
      log.attendanceType,
      log.attendanceType === 'Adult' ? log.numberOfMen : log.numberOfBoys,
      log.attendanceType === 'Adult' ? log.numberOfWomen : log.numberOfGirls,
      log.totalPeople,
      log.date
    ]);

    doc.text("Attendance Reports", 100, 20);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 100, 30);
    doc.text(`Attendance Type: ${selectedAttendanceType || "All"}`, 100, 40);
    doc.text(`Generated on: ${currentDate}`, 100, 50);

    const headers = selectedAttendanceType === 'Adult' 
      ? ["#", "Type", "Men", "Women", "Total", "Date"]
      : selectedAttendanceType === 'Children'
      ? ["#", "Type", "Boys", "Girls", "Total", "Date"]
      : ["#", "Type", "Male/Boys", "Female/Girls", "Total", "Date"];

    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 60,
    });

    doc.save("Filtered_Attendance_Report.pdf");
  };

  const generateYearlyReport = async () => {
    if (!selectedYear) {
      alert("Please select a year for the report.");
      return;
    }

    setYearlyReportLoading(true);
    setYearlyReportError('');
    setYearlyReports([]);
    setYearlyReportSummary(null);

    try {
      // Fetch all attendance logs
      const snapshot = await getDocs(collection(db, "Attendance"));
      const allLogs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          attendanceType: data.attendanceType || "Unknown",
          numberOfMen: data.numberOfMen || 0,
          numberOfWomen: data.numberOfWomen || 0,
          numberOfBoys: data.numberOfBoys || 0,
          numberOfGirls: data.numberOfGirls || 0,
          totalPeople: data.totalPeople || (data.numberOfPeople || 0),
          date: data.date || "---"
        };
      });

      // Filter logs for the selected year
      const yearStart = new Date(`${selectedYear}-01-01`);
      const yearEnd = new Date(`${selectedYear}-12-31`);

      const filteredYearlyLogs = allLogs.filter((log) => {
        const logDate = new Date(log.date);
        return logDate >= yearStart && logDate <= yearEnd;
      });

      // Group logs by month and attendance type with gender breakdown
      const monthlyBreakdown = {};
      const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
      ];

      monthNames.forEach(month => {
        monthlyBreakdown[month] = {
          Men: 0,
          Women: 0,
          Boys: 0,
          Girls: 0,
          AdultTotal: 0,
          ChildrenTotal: 0,
          Total: 0
        };
      });

      filteredYearlyLogs.forEach(log => {
        const logDate = new Date(log.date);
        const monthName = monthNames[logDate.getMonth()];
        
        monthlyBreakdown[monthName].Men += log.numberOfMen;
        monthlyBreakdown[monthName].Women += log.numberOfWomen;
        monthlyBreakdown[monthName].Boys += log.numberOfBoys;
        monthlyBreakdown[monthName].Girls += log.numberOfGirls;
        monthlyBreakdown[monthName].AdultTotal += (log.numberOfMen + log.numberOfWomen);
        monthlyBreakdown[monthName].ChildrenTotal += (log.numberOfBoys + log.numberOfGirls);
        monthlyBreakdown[monthName].Total += log.totalPeople;
      });

      // Calculate yearly totals
      const yearlyTotals = {
        Men: Object.values(monthlyBreakdown).reduce((sum, month) => sum + month.Men, 0),
        Women: Object.values(monthlyBreakdown).reduce((sum, month) => sum + month.Women, 0),
        Boys: Object.values(monthlyBreakdown).reduce((sum, month) => sum + month.Boys, 0),
        Girls: Object.values(monthlyBreakdown).reduce((sum, month) => sum + month.Girls, 0),
        AdultTotal: Object.values(monthlyBreakdown).reduce((sum, month) => sum + month.AdultTotal, 0),
        ChildrenTotal: Object.values(monthlyBreakdown).reduce((sum, month) => sum + month.ChildrenTotal, 0),
        Total: Object.values(monthlyBreakdown).reduce((sum, month) => sum + month.Total, 0)
      };

      // Prepare summary for display
      const monthlyReportData = monthNames.map(month => ({
        month,
        men: monthlyBreakdown[month].Men,
        women: monthlyBreakdown[month].Women,
        boys: monthlyBreakdown[month].Boys,
        girls: monthlyBreakdown[month].Girls,
        adultTotal: monthlyBreakdown[month].AdultTotal,
        childrenTotal: monthlyBreakdown[month].ChildrenTotal,
        total: monthlyBreakdown[month].Total
      }));

      setYearlyReports(monthlyReportData);
      setYearlyReportSummary({
        yearlyTotals,
        selectedYear
      });
    } catch (error) {
      console.error("Error generating yearly report:", error);
      setYearlyReportError(`Failed to generate report: ${error.message}`);
    } finally {
      setYearlyReportLoading(false);
    }
  };

  // PDF Generation for Yearly Report
  const generateYearlyPDF = () => {
    if (!yearlyReportSummary) return;

    const doc = new jsPDF("landscape");
    const currentDateTime = new Date().toLocaleString();

    // Title and metadata
    doc.text(`Yearly Attendance Report - ${yearlyReportSummary.selectedYear}`, 70, 20);
    doc.text(`Generated on: ${currentDateTime}`, 70, 30);

    // Prepare table data
    const tableData = yearlyReports.map(report => [
      report.month,
      report.men,
      report.women,
      report.adultTotal,
      report.boys,
      report.girls,
      report.childrenTotal,
      report.total
    ]);

    // Add table
    doc.autoTable({
      head: [["Month", "Men", "Women", "Adult Total", "Boys", "Girls", "Children Total", "Grand Total"]],
      body: [
        ...tableData,
        [
          "YEARLY TOTAL", 
          yearlyReportSummary.yearlyTotals.Men,
          yearlyReportSummary.yearlyTotals.Women,
          yearlyReportSummary.yearlyTotals.AdultTotal,
          yearlyReportSummary.yearlyTotals.Boys,
          yearlyReportSummary.yearlyTotals.Girls,
          yearlyReportSummary.yearlyTotals.ChildrenTotal,
          yearlyReportSummary.yearlyTotals.Total
        ]
      ],
      startY: 40,
    });

    // Save PDF
    doc.save(`Yearly_Attendance_Report_${yearlyReportSummary.selectedYear}.pdf`);
  };

  // Generate years for dropdown (current year and past 5 years)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => currentYear - i);
  };

  // Excel export functions
  const generateExcel = () => {
    // Create worksheet data with proper formatting
    const wsData = [
      // Header row
      ['Attendance Report'],
      [`Date Range: ${startDate} to ${endDate}`],
      [`Attendance Type: ${selectedAttendanceType || "All"}`],
      [`Generated on: ${new Date().toLocaleString()}`],
      [], // Empty row for spacing
      // Table headers
      ['#', 'Type', 'Men/Boys', 'Women/Girls', 'Total', 'Date'],
      // Table data
      ...filteredLogs.map((log, index) => [
        index + 1,
        log.attendanceType,
        log.attendanceType === 'Adult' ? log.numberOfMen : log.numberOfBoys,
        log.attendanceType === 'Adult' ? log.numberOfWomen : log.numberOfGirls,
        log.totalPeople,
        new Date(log.date).toLocaleDateString()
      ]),
      [], // Empty row before summary
      [`Total Attendance: ${filteredLogs.reduce((sum, log) => sum + log.totalPeople, 0)}`]
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const cols = [
      { wch: 5 },  // #
      { wch: 15 }, // Type
      { wch: 15 }, // Men/Boys
      { wch: 15 }, // Women/Girls
      { wch: 10 }, // Total
      { wch: 15 }, // Date
    ];
    ws['!cols'] = cols;

    // Merge cells for header
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Date Range
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }, // Attendance Type
      { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } }, // Generated Date
      { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 5 } } // Total
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
    XLSX.writeFile(wb, `Filtered_Attendance_Report.xlsx`);
  };

  const generateYearlyExcel = () => {
    if (!yearlyReportSummary) return;

    // Create worksheet data with proper formatting
    const wsData = [
      // Header rows
      [`Yearly Attendance Report - ${yearlyReportSummary.selectedYear}`],
      [`Generated on: ${new Date().toLocaleString()}`],
      [], // Empty row for spacing
      // Table headers
      ['Month', 'Men', 'Women', 'Adult Total', 'Boys', 'Girls', 'Children Total', 'Grand Total'],
      // Monthly data
      ...yearlyReports.map(report => [
        report.month,
        report.men,
        report.women,
        report.adultTotal,
        report.boys,
        report.girls,
        report.childrenTotal,
        report.total
      ]),
      [], // Empty row before totals
      // Yearly totals with proper formatting
      ['YEARLY TOTAL',
        yearlyReportSummary.yearlyTotals.Men,
        yearlyReportSummary.yearlyTotals.Women,
        yearlyReportSummary.yearlyTotals.AdultTotal,
        yearlyReportSummary.yearlyTotals.Boys,
        yearlyReportSummary.yearlyTotals.Girls,
        yearlyReportSummary.yearlyTotals.ChildrenTotal,
        yearlyReportSummary.yearlyTotals.Total
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const cols = [
      { wch: 12 }, // Month
      { wch: 8 },  // Men
      { wch: 8 },  // Women
      { wch: 12 }, // Adult Total
      { wch: 8 },  // Boys
      { wch: 8 },  // Girls
      { wch: 12 }, // Children Total
      { wch: 12 }, // Grand Total
    ];
    ws['!cols'] = cols;

    // Merge cells for header
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // Generated Date
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Yearly Report');
    XLSX.writeFile(wb, `Yearly_Attendance_Report_${yearlyReportSummary.selectedYear}.xlsx`);
  };

  return (
    <div className="container">
      <div className="button-container">
        <div 
          className="attendance-button record-button"
          onClick={() => {
            setIsFormVisible(!isFormVisible);
            setIsReportsVisible(false);
            // Reset form when opening
            setAttendanceData({
              date: '',
              attendanceType: '',
              numberOfMen: '',
              numberOfWomen: '',
              numberOfBoys: '',
              numberOfGirls: ''
            });
          }}
        >
          Record Attendance
        </div>

        <div 
          className="attendance-button report-button"
          onClick={() => {
            setIsReportsVisible(!isReportsVisible);
            setIsFormVisible(false);
          }}
        >
          Generate Monthly Attendance Reports
        </div>
      </div>
      
      {/* Attendance Form */}
      {isFormVisible && (
        <div className='container-formss'>
          <div className="form">
            <h2 className="form-title">Attendance Record</h2>
            
            {/* Error Message */}
            {submitError && (
              <div className="error-message" style={{
                color: 'red', 
                marginBottom: '10px', 
                padding: '10px', 
                backgroundColor: '#ffeeee',
                border: '1px solid red',
                borderRadius: '5px'
              }}>
                {submitError}
              </div>
            )}

            {/* Success Message */}
            {success && (
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
              {/* Attendance Type */}
              <div>
                <label>Attendance Type</label>
                <select
                  name="attendanceType"
                  value={attendanceData.attendanceType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Attendance Type</option>
                  {ATTENDANCE_TYPES.map((attendanceType, index) => (
                    <option key={index} value={attendanceType}>{attendanceType}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label>Date</label>
                <input 
                  type="date"
                  name="date"
                  value={attendanceData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Gender-specific fields based on attendance type */}
              {attendanceData.attendanceType === 'Adult' && (
                <>
                  <div>
                    <label>Number of Men</label>
                    <input 
                      type="number"
                      name="numberOfMen"
                      value={attendanceData.numberOfMen}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                  <div>
                    <label>Number of Women</label>
                    <input 
                      type="number"
                      name="numberOfWomen"
                      value={attendanceData.numberOfWomen}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </>
              )}

              {attendanceData.attendanceType === 'Children' && (
                <>
                  <div>
                    <label>Number of Boys</label>
                    <input 
                      type="number"
                      name="numberOfBoys"
                      value={attendanceData.numberOfBoys}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                  <div>
                    <label>Number of Girls</label>
                    <input 
                      type="number"
                      name="numberOfGirls"
                      value={attendanceData.numberOfGirls}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </>
              )}

              {/* Display total */}
              {attendanceData.attendanceType && (
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                  <strong>Total People: {calculateTotalPeople()}</strong>
                </div>
              )}

              <button type="submit" disabled={isSubmitLoading}>
                {isSubmitLoading ? 'Recording Attendance...' : 'Record Attendance'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Reports Section */}
      {isReportsVisible && (
        <div className="reports-section">
          <h2>Attendance Reports</h2>

          <div className="filter-section">
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
                value={selectedAttendanceType}
                onChange={(e) => setSelectedAttendanceType(e.target.value)}
              >
                <option value="">Select Attendance Type</option>
                {ATTENDANCE_TYPES.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
            </label>
            <button onClick={fetchAttendanceLogs} className="fetch-btn">
              Generate
            </button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : filteredLogs.length === 0 ? (
            <p></p>
          ) : (
            <>
              <div className="summary-section">
                <h3>Summary</h3>
                <p>Total Attendance Records: {filteredLogs.length}</p>
                <p>Total People: {filteredLogs.reduce((sum, log) => sum + log.totalPeople, 0)}</p>
                {selectedAttendanceType === 'Adult' && (
                  <>
                    <p>Total Men: {filteredLogs.reduce((sum, log) => sum + log.numberOfMen, 0)}</p>
                    <p>Total Women: {filteredLogs.reduce((sum, log) => sum + log.numberOfWomen, 0)}</p>
                  </>
                )}
                {selectedAttendanceType === 'Children' && (
                  <>
                    <p>Total Boys: {filteredLogs.reduce((sum, log) => sum + log.numberOfBoys, 0)}</p>
                    <p>Total Girls: {filteredLogs.reduce((sum, log) => sum + log.numberOfGirls, 0)}</p>
                  </>
                )}
                {!selectedAttendanceType && (
                  <>
                    <p>Total Men: {filteredLogs.reduce((sum, log) => sum + log.numberOfMen, 0)}</p>
                    <p>Total Women: {filteredLogs.reduce((sum, log) => sum + log.numberOfWomen, 0)}</p>
                    <p>Total Boys: {filteredLogs.reduce((sum, log) => sum + log.numberOfBoys, 0)}</p>
                    <p>Total Girls: {filteredLogs.reduce((sum, log) => sum + log.numberOfGirls, 0)}</p>
                  </>
                )}
              </div>

              <div className="table-container">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th style={{color:'black'}}>#</th>
                      <th style={{color:'black'}}>Type</th>
                      <th style={{color:'black'}}>
                        {selectedAttendanceType === 'Adult' ? 'Men' : 
                         selectedAttendanceType === 'Children' ? 'Boys' : 'Men/Boys'}
                      </th>
                      <th style={{color:'black'}}>
                        {selectedAttendanceType === 'Adult' ? 'Women' : 
                         selectedAttendanceType === 'Children' ? 'Girls' : 'Women/Girls'}
                      </th>
                      <th style={{color:'black'}}>Total</th>
                      <th style={{color:'black'}}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, index) => {
                      const date = new Date(log.date);
                      const formattedDate = date.toLocaleDateString();

                      return (
                        <tr key={log.id}>
                          <td>{index + 1}</td>
                          <td>{log.attendanceType}</td>
                          <td>
                            {log.attendanceType === 'Adult' ? log.numberOfMen : log.numberOfBoys}
                          </td>
                          <td>
                            {log.attendanceType === 'Adult' ? log.numberOfWomen : log.numberOfGirls}
                          </td>
                          <td>{log.totalPeople}</td>
                          <td>
                            <div className="date-column">{formattedDate}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="6" className="table-footer">
                        Total Attendance: {filteredLogs.reduce((sum, log) => sum + log.totalPeople, 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="dropdown">
                <button className="download-btn">Download Report ▼</button>
                <div className="dropdown-content">
                  <button onClick={generatePDF}>Download as PDF</button>
                  <button onClick={generateExcel}>Download as Excel</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
      <div className="yearly-report-section">
        <h2>Yearly Report</h2>
        <div className="yearly-report-controls">
          <label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">Select a Year</option>
              {generateYearOptions().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
          <button 
            onClick={generateYearlyReport} 
            disabled={!selectedYear || yearlyReportLoading}
          >
            {yearlyReportLoading ? 'Generating Report...' : 'Generate'}
          </button>
        </div>

        {yearlyReportError && (
          <div className="error-message">
            {yearlyReportError}
          </div>
        )}

        {/* Yearly Report Display */}
        {yearlyReportSummary && (
          <div className="yearly-report-display">
            
            <div className="yearly-summary">
              <h3>Yearly Attendance Report - {yearlyReportSummary.selectedYear}</h3>

              <h4>Yearly Totals</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <h5>Adults</h5>
                  <p>Men: {yearlyReportSummary.yearlyTotals.Men}</p>
                  <p>Women: {yearlyReportSummary.yearlyTotals.Women}</p>
                  <p><strong>Adult Total: {yearlyReportSummary.yearlyTotals.AdultTotal}</strong></p>
                </div>
                <div>
                  <h5>Children</h5>
                  <p>Boys: {yearlyReportSummary.yearlyTotals.Boys}</p>
                  <p>Girls: {yearlyReportSummary.yearlyTotals.Girls}</p>
                  <p><strong>Children Total: {yearlyReportSummary.yearlyTotals.ChildrenTotal}</strong></p>
                </div>
              </div>
              <p><strong>Grand Total Attendance: {yearlyReportSummary.yearlyTotals.Total}</strong></p>
            </div>

            <table className="yearly-report-table">
              <thead>
                <tr>
                  <th style={{color:'black'}}>Month</th>
                  <th style={{color:'black'}}>Men</th>
                  <th style={{color:'black'}}>Women</th>
                  <th style={{color:'black'}}>Adult Total</th>
                  <th style={{color:'black'}}>Boys</th>
                  <th style={{color:'black'}}>Girls</th>
                  <th style={{color:'black'}}>Children Total</th>
                  <th style={{color:'black'}}>Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {yearlyReports.map((report) => (
                  <tr key={report.month}>
                    <td>{report.month}</td>
                    <td>{report.men}</td>
                    <td>{report.women}</td>
                    <td><strong>{report.adultTotal}</strong></td>
                    <td>{report.boys}</td>
                    <td>{report.girls}</td>
                    <td><strong>{report.childrenTotal}</strong></td>
                    <td><strong>{report.total}</strong></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                  <td>YEARLY TOTAL</td>
                  <td>{yearlyReportSummary.yearlyTotals.Men}</td>
                  <td>{yearlyReportSummary.yearlyTotals.Women}</td>
                  <td><strong>{yearlyReportSummary.yearlyTotals.AdultTotal}</strong></td>
                  <td>{yearlyReportSummary.yearlyTotals.Boys}</td>
                  <td>{yearlyReportSummary.yearlyTotals.Girls}</td>
                  <td><strong>{yearlyReportSummary.yearlyTotals.ChildrenTotal}</strong></td>
                  <td><strong>{yearlyReportSummary.yearlyTotals.Total}</strong></td>
                </tr>
              </tfoot>
            </table>

            <div className="yearly-report-actions">
              <div className="dropdown">
                <button className="download-btn">Download Report ▼</button>
                <div className="dropdown-content">
                  <button onClick={generateYearlyPDF}>Download as PDF</button>
                  <button onClick={generateYearlyExcel}>Download as Excel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;