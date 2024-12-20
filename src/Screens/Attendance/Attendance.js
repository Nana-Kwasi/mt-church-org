import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, collection, getDocs } from "firebase/firestore";
import app from "../../Component/Config/Config";
import { v4 as uuidv4 } from 'uuid';
import jsPDF from "jspdf";
import "jspdf-autotable";
import "../attendance.css"

const Attendance = () => {
  const db = getFirestore(app);

  // State for controlling form visibility
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isReportsVisible, setIsReportsVisible] = useState(false);

  // State for form data
  const [attendanceData, setAttendanceData] = useState({
    date: '',
    numberOfPeople: '',
    attendanceType: ''
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

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitLoading(true);
    setSubmitError('');
    setSuccess('');

    try {
      // Validate required fields
      const requiredFields = ['date', 'numberOfPeople', 'attendanceType'];
      const missingFields = requiredFields.filter(field => !attendanceData[field]);

      if (missingFields.length > 0) {
        setSubmitError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setIsSubmitLoading(false);
        return;
      }

      // Generate unique ID for Firestore document
      const attendanceDocumentId = uuidv4();

      // Prepare attendance data for Firestore
      const attendanceSubmissionData = {
        ...attendanceData,
        submittedAt: new Date().toISOString()
      };

      // Submit attendance data to Firestore
      await setDoc(doc(db, "Attendance", attendanceDocumentId), attendanceSubmissionData);

      // Reset form
      setAttendanceData({
        date: '',
        numberOfPeople: '',
        attendanceType: ''
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
          numberOfPeople: data.numberOfPeople || 0,
          attendanceType: data.attendanceType || "Unknown",
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

    // Add table data
    const tableData = filteredLogs.map((log, index) => [
      index + 1,
      log.attendanceType,
      log.numberOfPeople,
      log.date,
      log.submittedAt
    ]);

    doc.text("Attendance Reports", 70, 20);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 70, 30);
    doc.text(`Attendance Type: ${selectedAttendanceType || "All"}`, 70, 40);
    doc.text(`Generated on: ${currentDate}`, 70, 50);

    doc.autoTable({
      head: [["#", "Attendance Type", "Number of People", "Date", "Submitted At"]],
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
          numberOfPeople: parseInt(data.numberOfPeople) || 0,
          attendanceType: data.attendanceType || "Unknown",
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

      // Group logs by month and attendance type
      const monthlyBreakdown = {};
      const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
      ];

      monthNames.forEach(month => {
        monthlyBreakdown[month] = {
          Children: 0,
          Adult: 0,
          Total: 0
        };
      });

      filteredYearlyLogs.forEach(log => {
        const logDate = new Date(log.date);
        const monthName = monthNames[logDate.getMonth()];
        
        monthlyBreakdown[monthName][log.attendanceType] += log.numberOfPeople;
        monthlyBreakdown[monthName].Total += log.numberOfPeople;
      });

      // Calculate yearly totals
      const yearlyTotals = {
        Children: Object.values(monthlyBreakdown).reduce((sum, month) => sum + month.Children, 0),
        Adult: Object.values(monthlyBreakdown).reduce((sum, month) => sum + month.Adult, 0),
        Total: Object.values(monthlyBreakdown).reduce((sum, month) => sum + month.Total, 0)
      };

      // Prepare summary for display
      const monthlyReportData = monthNames.map(month => ({
        month,
        children: monthlyBreakdown[month].Children,
        adult: monthlyBreakdown[month].Adult,
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
      report.children,
      report.adult,
      report.total
    ]);

    // Add table
    doc.autoTable({
      head: [["Month", "Children", "Adult", "Total"]],
      body: [
        ...tableData,
        [
          "YEARLY TOTAL", 
          yearlyReportSummary.yearlyTotals.Children, 
          yearlyReportSummary.yearlyTotals.Adult, 
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


  return (
    <div className="container">
      <div className="circles-container">
        {/* Buttons for different sections */}
        <div 
          className="circle-button" 
          onClick={() => {
            setIsFormVisible(!isFormVisible);
            setIsReportsVisible(false);
            // Reset form when opening
            setAttendanceData({
              date: '',
              numberOfPeople: '',
              attendanceType: ''
            });
          }}
        >
          Record Attendance
        </div>
        <div 
          className="circle-button" 
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

            {/* Number of People */}
            <div>
              <label>Number of People</label>
              <input 
                type="number"
                name="numberOfPeople"
                value={attendanceData.numberOfPeople}
                onChange={handleChange}
                min="0"
                required
              />
            </div>

            <button type="submit" disabled={isSubmitLoading}>
              {isSubmitLoading ? 'Recording Attendance...' : 'Record Attendance'}
            </button>
          </form>
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
              Fetch Attendance Records
            </button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : filteredLogs.length === 0 ? (
            <p>No attendance records found for the selected criteria.</p>
          ) : (
            <>
              <div className="summary-section">
                <h3>Summary</h3>
                <p>Total Attendance Records: {filteredLogs.length}</p>
                <p>Total People: {filteredLogs.reduce((sum, log) => sum + parseInt(log.numberOfPeople), 0)}</p>
              </div>

              <div className="table-container">
  <table className="attendance-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Attendance Type</th>
        <th>Number of People</th>
        <th>Date</th>
        {/* <th>Time&Date</th> */}
        {/* <th>Submitted At</th> */}
      </tr>
    </thead>
    <tbody>
  {filteredLogs.map((log, index) => {
    const date = new Date(log.date);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString();

    return (
      <tr key={log.id}>
        <td>{index + 1}</td>
        <td>{log.attendanceType}</td>
        <td>{log.numberOfPeople}</td>
        <td>
          <div className="date-column">{formattedDate}</div>
          {/* <div className="time-column">{formattedTime}</div> */}
        </td>
        {/* <td>{log.submittedAt}</td> */}
      </tr>
    );
  })}
</tbody>
    <tfoot>
      <tr>
        <td colSpan="6" className="table-footer">
          Total Attendance:{" "}
          {filteredLogs.reduce((sum, log) => sum + parseInt(log.numberOfPeople), 0)}
        </td>
      </tr>
    </tfoot>
  </table>
</div>
<button onClick={generatePDF} className="download-btn">
                Download PDF Report
              </button>
            </>
          )}
        </div>
      )}
       <div className="yearly-report-section">
        <h2>Generate Yearly Report</h2>
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
            {yearlyReportLoading ? 'Generating Report...' : 'Generate Yearly Report'}
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
            <h3>Yearly Attendance Report - {yearlyReportSummary.selectedYear}</h3>
            
            <div className="yearly-summary">
              <h4>Yearly Totals</h4>
              <p>Children: {yearlyReportSummary.yearlyTotals.Children}</p>
              <p>Adult: {yearlyReportSummary.yearlyTotals.Adult}</p>
              <p>Total Attendance: {yearlyReportSummary.yearlyTotals.Total}</p>
            </div>

            <table className="yearly-report-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Children</th>
                  <th>Adult</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {yearlyReports.map((report) => (
                  <tr key={report.month}>
                    <td>{report.month}</td>
                    <td>{report.children}</td>
                    <td>{report.adult}</td>
                    <td>{report.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="yearly-report-actions">
              <button 
                onClick={generateYearlyPDF}
                className="download-btn"
              >
                Download PDF Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;