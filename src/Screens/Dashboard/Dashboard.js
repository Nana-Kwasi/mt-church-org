// Dashboard.js
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
        const collectionsList = collectionsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));

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

        // Group collections by currency
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
          <h3 className="stat-item green">Total Collections</h3>
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
          <LineChart width={600} height={300} data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="numberOfPeople" stroke="#8884d8" />
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
              {collectionsData.slice(0, 5).map((collection) => (
                <tr key={collection.id}>
                  <td>{collection.timestamp ? formatDate(collection.timestamp) : 'N/A'}</td>
                  <td>{collection.paymentType}</td>
                  <td>{collection.currency || 'GHS'} {collection.amount?.toLocaleString()}</td>
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
                  <td>{attendance.date}</td>
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