import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import "../../Dashboard.css";

const Dashboard = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [membersData, setMembersData] = useState([]);
  const [collectionsData, setCollectionsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [summaryStats, setSummaryStats] = useState({
    totalMembers: 0,
    totalAttendance: 0,
    attendanceBreakdown: {
      Adult: 0,
      Children: 0
    },
    totalCollectionsByCurrency: {}
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
      
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }

      if (typeof timestamp === 'number') {
        return new Date(timestamp).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }

      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }

      if (typeof timestamp === 'string') {
        if (timestamp.includes(' at ')) {
          return timestamp.split(' at ')[0];
        }
        return new Date(timestamp).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }

      return 'Invalid Date Format';
    } catch (error) {
      console.error('Error formatting date:', error);
      console.error('Problematic timestamp:', timestamp);
      return 'Date Error';
    }
  };

  const getCurrentYear = () => {
    return new Date().getFullYear();
  };

  useEffect(() => {
    const fetchData = async () => {
      const db = getFirestore();
      try {
        // Fetch Attendance Data
        const attendanceSnapshot = await getDocs(collection(db, 'Attendance'));
        const currentYear = getCurrentYear();
        
        const attendanceList = attendanceSnapshot.docs
          .map(doc => ({
            ...doc.data(),
            id: doc.id
          }))
          .filter(attendance => {
            const attendanceDate = new Date(attendance.date);
            return attendanceDate.getFullYear() === currentYear;
          });

        // Fetch Members Data
        const membersSnapshot = await getDocs(collection(db, 'Members'));
        const membersList = membersSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));

        // Fetch Collections Data
        const collectionsSnapshot = await getDocs(collection(db, 'Money Collections'));
        const collectionsList = collectionsSnapshot.docs
          .map(doc => ({
            ...doc.data(),
            id: doc.id
          }))
          .filter(collection => {
            const collectionDate = collection.timestamp?.toDate?.() || new Date(collection.timestamp);
            return collectionDate.getFullYear() === currentYear;
          });

        setAttendanceData(attendanceList);
        setMembersData(membersList);
        setCollectionsData(collectionsList);

        // Calculate attendance breakdown
        const attendanceBreakdown = attendanceList.reduce((acc, item) => {
          const type = item.attendanceType || 'Other';
          const count = parseInt(item.numberOfPeople || 0);
          acc[type] = (acc[type] || 0) + count;
          return acc;
        }, {});

        const totalAttendance = Object.values(attendanceBreakdown).reduce((sum, count) => sum + count, 0);

        // Group collections by currency (only for current year)
        const totalCollectionsByCurrency = collectionsList.reduce((acc, item) => {
          const currency = item.currency || 'GHS';
          const amount = item.amount || 0;
          acc[currency] = (acc[currency] || 0) + amount;
          return acc;
        }, {});

        setSummaryStats({
          totalMembers: membersList.length,
          totalAttendance,
          attendanceBreakdown,
          totalCollectionsByCurrency
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prepare data for pie chart
  const membershipDistribution = membersData.reduce((acc, member) => {
    const membership = member.membership || 'Other';
    acc[membership] = (acc[membership] || 0) + 1;
    return acc;
  }, {});

  const pieChartData = Object.entries(membershipDistribution).map(([name, value]) => ({
    name,
    value
  }));

  if (loading) {
    return <div className="dashboard">Loading...</div>;
  }
  const processAttendanceData = (data) => {
    const groupedData = data.reduce((acc, item) => {
      const date = formatDate(item.submittedAt || item.date);
      if (!acc[date]) {
        acc[date] = {
          date,
          Adult: 0,
          Children: 0
        };
      }
      
      const type = item.attendanceType || 'Other';
      if (type === 'Adult' || type === 'Children') {
        acc[date][type] += parseInt(item.numberOfPeople || 0);
      }
      
      return acc;
    }, {});

    return Object.values(groupedData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  };

  // Custom tooltip component to format the date display
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p style={{ margin: '0', fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              color: entry.color,
              margin: '5px 0 0'
            }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  return (
    <div className="dashboard">
      <h2>Dashboard Overview</h2>
      
      {/* Summary Statistics Cards */}
      <div className="stats">
        <div className="stat-item orange">
          <h3 className="stat-item orange">Total Members</h3>
          <p>{summaryStats.totalMembers}</p>
        </div>
        <div className="stat-item blue">
          <h3  className="stat-item blue">Attendance ({getCurrentYear()})</h3>
          <div className="attendance-breakdown">
            <p className="total-attendance">Total: {summaryStats.totalAttendance}</p>
            {Object.entries(summaryStats.attendanceBreakdown).map(([type, count]) => (
              <p key={type} className="attendance-type">
                {type}: {count}
              </p>
            ))}
          </div>
        </div>
        <div className="stat-item green">
          <h3 className="stat-item green">Total Collections ({getCurrentYear()})</h3>
          {Object.entries(summaryStats.totalCollectionsByCurrency).map(([currency, amount]) => (
            <p key={currency} className="mb-2">
              {currency} {amount.toLocaleString()}
            </p>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-container">
        <div className="chart-item">
          <h3>Membership Distribution</h3>
          <PieChart width={400} height={300}>
            <Pie
              data={pieChartData}
              cx={200}
              cy={150}
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        <div className="chart-item">
          <h3>Attendance Trends</h3>
          <LineChart 
            width={400} 
            height={300} 
            data={processAttendanceData(attendanceData)}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              tick={false}  // This hides the X-axis labels
              axisLine={true}  // Keep the axis line
              tickLine={true}  // Keep the tick marks
            />
            <YAxis 
              label={{ 
                value: 'Number of People', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Adult" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
            />
            <Line 
              type="monotone" 
              dataKey="Children" 
              stroke="#82ca9d" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </div>
      </div>

      {/* Tables Section */}
      <div className="tables-container">
        <div className="table-section">
          <h3>Recent Collections</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
        {Object.values(
          collectionsData.reduce((acc, collection) => {
            // Get month and year from timestamp
            const date = collection.timestamp?.toDate?.() || new Date(collection.timestamp);
            const monthYear = date.toLocaleDateString('en-GB', { 
              month: 'long',
              year: 'numeric'
            });
            const type = collection.paymentType || 'Other';
            const amount = collection.amount || 0;
            
            if (!acc[monthYear]) {
              acc[monthYear] = {
                monthYear,
                types: new Set(), // Use Set to store unique types
                totalAmount: 0
              };
            }
            
            acc[monthYear].types.add(type);
            acc[monthYear].totalAmount += amount;
            return acc;
          }, {})
        )
        .sort((a, b) => {
          // Sort by date (convert month name to date for proper sorting)
          const dateA = new Date(a.monthYear);
          const dateB = new Date(b.monthYear);
          return dateA - dateB;
        })
        .map((group) => (
          <tr key={group.monthYear}>
            <td>{group.monthYear}</td>
            <td>{Array.from(group.types).join(', ')}</td>
            <td>GHS {group.totalAmount.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
          </table>
        </div>

        <div className="table-section">
          <h3>Recent Attendance</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Number of People</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.slice(0, 5).map((attendance) => (
                <tr key={attendance.id}>
                  <td>{attendance.submittedAt? formatDate(attendance.submittedAt) : 'N/A'}</td>
                  <td>{attendance.attendanceType}</td>
                  <td>{attendance.numberOfPeople}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;