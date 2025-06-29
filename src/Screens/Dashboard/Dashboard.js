import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import "../../Dashboard.css";
import { useLocation } from 'react-router-dom';
const Dashboard = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [membersData, setMembersData] = useState([]);
  const [collectionsData, setCollectionsData] = useState([]);
  const [announcementsData, setAnnouncementsData] = useState([]);
  const [eventsData, setEventsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentScripture, setCurrentScripture] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get user data from navigation state or context
  const userDetails = location.state?.userDetails 


  const [summaryStats, setSummaryStats] = useState({
    totalMembers: 0,
    totalAttendance: 0,
    attendanceBreakdown: {
      Adult: 0,
      Children: 0
    },
    totalCollectionsByCurrency: {},
    totalAnnouncements: 0,
    totalEvents: 0
  });

  // Bible verses array
  const bibleVerses = [
    { text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.", reference: "Jeremiah 29:11" },
    { text: "Trust in the Lord with all your heart and lean not on your own understanding.", reference: "Proverbs 3:5" },
    { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", reference: "Joshua 1:9" },
    { text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", reference: "Romans 8:28" },
    { text: "The Lord is my shepherd, I lack nothing.", reference: "Psalm 23:1" },
    { text: "Cast all your anxiety on him because he cares for you.", reference: "1 Peter 5:7" },
    { text: "I can do all this through him who gives me strength.", reference: "Philippians 4:13" },
    { text: "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.", reference: "Numbers 6:24-25" }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Time-based greeting function
  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning! 🌅";
    if (hour < 17) return "Good Afternoon! ☀️";
    if (hour < 21) return "Good Evening! 🌆";
    return "Good Night! 🌙";
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Rotate scripture every 10 seconds
  useEffect(() => {
    const scriptureTimer = setInterval(() => {
      setCurrentScripture((prev) => (prev + 1) % bibleVerses.length);
    }, 10000);

    return () => clearInterval(scriptureTimer);
  }, []);

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

  // Calendar Component
  const EventCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    
    const eventDates = eventsData.map(event => {
      const eventDate = event.date?.toDate?.() || new Date(event.date);
      return eventDate.getDate();
    }).filter(date => !isNaN(date));

    const handleDateClick = (day) => {
      if (eventDates.includes(day)) {
        navigate('/events');
      }
    };

    const renderCalendarDays = () => {
      const days = [];
      
      // Empty cells for days before the first day of the month
      for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
      }
      
      // Days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const hasEvent = eventDates.includes(day);
        days.push(
          <div
            key={day}
            className={`calendar-day ${hasEvent ? 'has-event' : ''}`}
            onClick={() => handleDateClick(day)}
            style={{ cursor: hasEvent ? 'pointer' : 'default' }}
          >
            {day}
          </div>
        );
      }
      
      return days;
    };

    return (
      <div className="event-calendar">
        <div className="calendar-header">
          <h4>{currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h4>
        </div>
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-days">
          {renderCalendarDays()}
        </div>
      </div>
    );
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

        // Fetch Announcements Data
        const announcementsSnapshot = await getDocs(collection(db, 'Announcements'));
        const announcementsList = announcementsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));

        // Fetch Events Data
        const eventsSnapshot = await getDocs(collection(db, 'Events'));
        const eventsList = eventsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));

        setAttendanceData(attendanceList);
        setMembersData(membersList);
        setCollectionsData(collectionsList);
        setAnnouncementsData(announcementsList);
        setEventsData(eventsList);

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
          totalCollectionsByCurrency,
          totalAnnouncements: announcementsList.length,
          totalEvents: eventsList.length
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

  // Analog Clock Component
  const AnalogClock = () => {
    const seconds = currentTime.getSeconds();
    const minutes = currentTime.getMinutes();
    const hours = currentTime.getHours() % 12;

    const secondAngle = (seconds * 6) - 90;
    const minuteAngle = (minutes * 6) - 90;
    const hourAngle = (hours * 30 + minutes * 0.5) - 90;

    return (
      <div className="analog-clock">
        <svg width="120" height="120" viewBox="0 0 120 120">
          {/* Clock face */}
          <circle cx="60" cy="60" r="58" fill="white" stroke="#333" strokeWidth="2"/>
          
          {/* Hour markers */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30) * Math.PI / 180;
            const x1 = 60 + 45 * Math.cos(angle);
            const y1 = 60 + 45 * Math.sin(angle);
            const x2 = 60 + 50 * Math.cos(angle);
            const y2 = 60 + 50 * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#333"
                strokeWidth="2"
              />
            );
          })}
          
          {/* Hour hand */}
          <line
            x1="60"
            y1="60"
            x2={60 + 25 * Math.cos(hourAngle * Math.PI / 180)}
            y2={60 + 25 * Math.sin(hourAngle * Math.PI / 180)}
            stroke="#333"
            strokeWidth="4"
            strokeLinecap="round"
          />
          
          {/* Minute hand */}
          <line
            x1="60"
            y1="60"
            x2={60 + 35 * Math.cos(minuteAngle * Math.PI / 180)}
            y2={60 + 35 * Math.sin(minuteAngle * Math.PI / 180)}
            stroke="#666"
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          {/* Second hand */}
          <line
            x1="60"
            y1="60"
            x2={60 + 40 * Math.cos(secondAngle * Math.PI / 180)}
            y2={60 + 40 * Math.sin(secondAngle * Math.PI / 180)}
            stroke="#e74c3c"
            strokeWidth="1"
            strokeLinecap="round"
          />
          
          {/* Center dot */}
          <circle cx="60" cy="60" r="3" fill="#333"/>
        </svg>
      </div>
    );
  };
  
  return (
    <div className="dashboard">
      {/* Header Section with Greeting, Clock and Scripture */}
      <div className="dashboard-header">
        <div className="greeting-section">
          <h1 className="time-greeting">{getTimeBasedGreeting()} {userDetails?.firstName} {userDetails?.lastName}</h1>
          <p className="current-date">{currentTime.toLocaleDateString('en-GB', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
        
        <div className="clock-section">
          <AnalogClock />
          <div className="digital-time">
            {currentTime.toLocaleTimeString('en-GB', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>
        
        <div className="scripture-section">
          <div className="scripture-container">
            <p className="scripture-text">"{bibleVerses[currentScripture].text}"</p>
            <p className="scripture-reference">- {bibleVerses[currentScripture].reference}</p>
          </div>
        </div>
        
      </div>

      {/* <h2>Dashboard Overview</h2> */}
      
      {/* Icon Stats Section */}
      <div className="icon-stats">
        <div className="icon-stat-item">
          <div className="icon-container">
            <img src="/team.png" alt="Total Members" className="stat-icon" />
          </div>
          <div className="stat-data">
            <h3>Total Members</h3>
            <p className="stat-number">{summaryStats.totalMembers}</p>
          </div>
        </div>
        
        <div className="icon-stat-item">
          <div className="icon-container">
            <img src="/check.png" alt="Attendance" className="stat-icon" />
          </div>
          <div className="stat-data">
            <h3>Attendance ({getCurrentYear()})</h3>
            <p className="stat-number total-attendance">Total: {summaryStats.totalAttendance}</p>
            <div className="attendance-breakdown">
              {Object.entries(summaryStats.attendanceBreakdown).map(([type, count]) => (
                <p key={type} className="attendance-type">
                  {type}: {count}
                </p>
              ))}
            </div>
          </div>
        </div>
        
        <div className="icon-stat-item">
          <div className="icon-container">
            <img src="/money.png" alt="Collections" className="stat-icon" />
          </div>
          <div className="stat-data">
            <h3>Total Collections ({getCurrentYear()})</h3>
            <div className="collections-data">
              {Object.entries(summaryStats.totalCollectionsByCurrency).map(([currency, amount]) => (
                <p key={currency} className="collection-amount">
                  {currency} {amount.toLocaleString()}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="icon-stat-item">
          <div className="icon-container">
            <img src="/megaphone.png" alt="Announcements" className="stat-icon" />
          </div>
          <div className="stat-data">
            <h3>Total Announcements</h3>
            <p className="stat-number">{summaryStats.totalAnnouncements}</p>
          </div>
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
         <div className="chart-item">
          <h3>Event Calendar</h3>
          <EventCalendar />
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
    </div>
  );
};

export default Dashboard;


//worked 
// import React, { useEffect, useState } from 'react';
// import { getFirestore, collection, getDocs } from 'firebase/firestore';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
// import "../../Dashboard.css";

// const Dashboard = () => {
//   const [attendanceData, setAttendanceData] = useState([]);
//   const [membersData, setMembersData] = useState([]);
//   const [collectionsData, setCollectionsData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentTime, setCurrentTime] = useState(new Date());
//   const [currentScripture, setCurrentScripture] = useState(0);

//   const [summaryStats, setSummaryStats] = useState({
//     totalMembers: 0,
//     totalAttendance: 0,
//     attendanceBreakdown: {
//       Adult: 0,
//       Children: 0
//     },
//     totalCollectionsByCurrency: {}
//   });

//   // Bible verses array
//   const bibleVerses = [
//     { text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.", reference: "Jeremiah 29:11" },
//     { text: "Trust in the Lord with all your heart and lean not on your own understanding.", reference: "Proverbs 3:5" },
//     { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", reference: "Joshua 1:9" },
//     { text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", reference: "Romans 8:28" },
//     { text: "The Lord is my shepherd, I lack nothing.", reference: "Psalm 23:1" },
//     { text: "Cast all your anxiety on him because he cares for you.", reference: "1 Peter 5:7" },
//     { text: "I can do all this through him who gives me strength.", reference: "Philippians 4:13" },
//     { text: "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.", reference: "Numbers 6:24-25" }
//   ];

//   const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

//   // Time-based greeting function
//   const getTimeBasedGreeting = () => {
//     const hour = currentTime.getHours();
//     if (hour < 12) return "Good Morning! 🌅";
//     if (hour < 17) return "Good Afternoon! ☀️";
//     if (hour < 21) return "Good Evening! 🌆";
//     return "Good Night! 🌙";
//   };

//   // Update time every second
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setCurrentTime(new Date());
//     }, 1000);

//     return () => clearInterval(timer);
//   }, []);

//   // Rotate scripture every 10 seconds
//   useEffect(() => {
//     const scriptureTimer = setInterval(() => {
//       setCurrentScripture((prev) => (prev + 1) % bibleVerses.length);
//     }, 10000);

//     return () => clearInterval(scriptureTimer);
//   }, []);

//   const formatDate = (timestamp) => {
//     if (!timestamp) return 'N/A';
    
//     try {
//       if (timestamp.toDate) {
//         return timestamp.toDate().toLocaleDateString('en-GB', {
//           day: 'numeric',
//           month: 'long',
//           year: 'numeric'
//         });
//       }
      
//       if (timestamp instanceof Date) {
//         return timestamp.toLocaleDateString('en-GB', {
//           day: 'numeric',
//           month: 'long',
//           year: 'numeric'
//         });
//       }

//       if (typeof timestamp === 'number') {
//         return new Date(timestamp).toLocaleDateString('en-GB', {
//           day: 'numeric',
//           month: 'long',
//           year: 'numeric'
//         });
//       }

//       if (timestamp.seconds) {
//         return new Date(timestamp.seconds * 1000).toLocaleDateString('en-GB', {
//           day: 'numeric',
//           month: 'long',
//           year: 'numeric'
//         });
//       }

//       if (typeof timestamp === 'string') {
//         if (timestamp.includes(' at ')) {
//           return timestamp.split(' at ')[0];
//         }
//         return new Date(timestamp).toLocaleDateString('en-GB', {
//           day: 'numeric',
//           month: 'long',
//           year: 'numeric'
//         });
//       }

//       return 'Invalid Date Format';
//     } catch (error) {
//       console.error('Error formatting date:', error);
//       console.error('Problematic timestamp:', timestamp);
//       return 'Date Error';
//     }
//   };

//   const getCurrentYear = () => {
//     return new Date().getFullYear();
//   };

//   useEffect(() => {
//     const fetchData = async () => {
//       const db = getFirestore();
//       try {
//         // Fetch Attendance Data
//         const attendanceSnapshot = await getDocs(collection(db, 'Attendance'));
//         const currentYear = getCurrentYear();
        
//         const attendanceList = attendanceSnapshot.docs
//           .map(doc => ({
//             ...doc.data(),
//             id: doc.id
//           }))
//           .filter(attendance => {
//             const attendanceDate = new Date(attendance.date);
//             return attendanceDate.getFullYear() === currentYear;
//           });

//         // Fetch Members Data
//         const membersSnapshot = await getDocs(collection(db, 'Members'));
//         const membersList = membersSnapshot.docs.map(doc => ({
//           ...doc.data(),
//           id: doc.id
//         }));

//         // Fetch Collections Data
//         const collectionsSnapshot = await getDocs(collection(db, 'Money Collections'));
//         const collectionsList = collectionsSnapshot.docs
//           .map(doc => ({
//             ...doc.data(),
//             id: doc.id
//           }))
//           .filter(collection => {
//             const collectionDate = collection.timestamp?.toDate?.() || new Date(collection.timestamp);
//             return collectionDate.getFullYear() === currentYear;
//           });

//         setAttendanceData(attendanceList);
//         setMembersData(membersList);
//         setCollectionsData(collectionsList);

//         // Calculate attendance breakdown
//         const attendanceBreakdown = attendanceList.reduce((acc, item) => {
//           const type = item.attendanceType || 'Other';
//           const count = parseInt(item.numberOfPeople || 0);
//           acc[type] = (acc[type] || 0) + count;
//           return acc;
//         }, {});

//         const totalAttendance = Object.values(attendanceBreakdown).reduce((sum, count) => sum + count, 0);

//         // Group collections by currency (only for current year)
//         const totalCollectionsByCurrency = collectionsList.reduce((acc, item) => {
//           const currency = item.currency || 'GHS';
//           const amount = item.amount || 0;
//           acc[currency] = (acc[currency] || 0) + amount;
//           return acc;
//         }, {});

//         setSummaryStats({
//           totalMembers: membersList.length,
//           totalAttendance,
//           attendanceBreakdown,
//           totalCollectionsByCurrency
//         });

//         setLoading(false);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   // Prepare data for pie chart
//   const membershipDistribution = membersData.reduce((acc, member) => {
//     const membership = member.membership || 'Other';
//     acc[membership] = (acc[membership] || 0) + 1;
//     return acc;
//   }, {});

//   const pieChartData = Object.entries(membershipDistribution).map(([name, value]) => ({
//     name,
//     value
//   }));

//   if (loading) {
//     return <div className="dashboard">Loading...</div>;
//   }
//   const processAttendanceData = (data) => {
//     const groupedData = data.reduce((acc, item) => {
//       const date = formatDate(item.submittedAt || item.date);
//       if (!acc[date]) {
//         acc[date] = {
//           date,
//           Adult: 0,
//           Children: 0
//         };
//       }
      
//       const type = item.attendanceType || 'Other';
//       if (type === 'Adult' || type === 'Children') {
//         acc[date][type] += parseInt(item.numberOfPeople || 0);
//       }
      
//       return acc;
//     }, {});

//     return Object.values(groupedData).sort((a, b) => 
//       new Date(a.date) - new Date(b.date)
//     );
//   };

//   // Custom tooltip component to format the date display
//   const CustomTooltip = ({ active, payload, label }) => {
//     if (active && payload && payload.length) {
//       return (
//         <div className="custom-tooltip" style={{
//           backgroundColor: 'white',
//           padding: '10px',
//           border: '1px solid #ccc',
//           borderRadius: '4px'
//         }}>
//           <p style={{ margin: '0', fontWeight: 'bold' }}>{label}</p>
//           {payload.map((entry, index) => (
//             <p key={index} style={{ 
//               color: entry.color,
//               margin: '5px 0 0'
//             }}>
//               {entry.name}: {entry.value}
//             </p>
//           ))}
//         </div>
//       );
//     }
//     return null;
//   };

//   // Analog Clock Component
//   const AnalogClock = () => {
//     const seconds = currentTime.getSeconds();
//     const minutes = currentTime.getMinutes();
//     const hours = currentTime.getHours() % 12;

//     const secondAngle = (seconds * 6) - 90;
//     const minuteAngle = (minutes * 6) - 90;
//     const hourAngle = (hours * 30 + minutes * 0.5) - 90;

//     return (
//       <div className="analog-clock">
//         <svg width="120" height="120" viewBox="0 0 120 120">
//           {/* Clock face */}
//           <circle cx="60" cy="60" r="58" fill="white" stroke="#333" strokeWidth="2"/>
          
//           {/* Hour markers */}
//           {[...Array(12)].map((_, i) => {
//             const angle = (i * 30) * Math.PI / 180;
//             const x1 = 60 + 45 * Math.cos(angle);
//             const y1 = 60 + 45 * Math.sin(angle);
//             const x2 = 60 + 50 * Math.cos(angle);
//             const y2 = 60 + 50 * Math.sin(angle);
//             return (
//               <line
//                 key={i}
//                 x1={x1}
//                 y1={y1}
//                 x2={x2}
//                 y2={y2}
//                 stroke="#333"
//                 strokeWidth="2"
//               />
//             );
//           })}
          
//           {/* Hour hand */}
//           <line
//             x1="60"
//             y1="60"
//             x2={60 + 25 * Math.cos(hourAngle * Math.PI / 180)}
//             y2={60 + 25 * Math.sin(hourAngle * Math.PI / 180)}
//             stroke="#333"
//             strokeWidth="4"
//             strokeLinecap="round"
//           />
          
//           {/* Minute hand */}
//           <line
//             x1="60"
//             y1="60"
//             x2={60 + 35 * Math.cos(minuteAngle * Math.PI / 180)}
//             y2={60 + 35 * Math.sin(minuteAngle * Math.PI / 180)}
//             stroke="#666"
//             strokeWidth="3"
//             strokeLinecap="round"
//           />
          
//           {/* Second hand */}
//           <line
//             x1="60"
//             y1="60"
//             x2={60 + 40 * Math.cos(secondAngle * Math.PI / 180)}
//             y2={60 + 40 * Math.sin(secondAngle * Math.PI / 180)}
//             stroke="#e74c3c"
//             strokeWidth="1"
//             strokeLinecap="round"
//           />
          
//           {/* Center dot */}
//           <circle cx="60" cy="60" r="3" fill="#333"/>
//         </svg>
//       </div>
//     );
//   };
  
//   return (
//     <div className="dashboard">
//       {/* Header Section with Greeting, Clock and Scripture */}
//       <div className="dashboard-header">
//         <div className="greeting-section">
//           <h1 className="time-greeting">{getTimeBasedGreeting()}</h1>
//           <p className="current-date">{currentTime.toLocaleDateString('en-GB', { 
//             weekday: 'long', 
//             year: 'numeric', 
//             month: 'long', 
//             day: 'numeric' 
//           })}</p>
//         </div>
        
//         <div className="clock-section">
//           <AnalogClock />
//           <div className="digital-time">
//             {currentTime.toLocaleTimeString('en-GB', { 
//               hour: '2-digit', 
//               minute: '2-digit',
//               second: '2-digit'
//             })}
//           </div>
//         </div>
        
//         <div className="scripture-section">
//           <div className="scripture-container">
//             <p className="scripture-text">"{bibleVerses[currentScripture].text}"</p>
//             <p className="scripture-reference">- {bibleVerses[currentScripture].reference}</p>
//           </div>
//         </div>
//       </div>

//       <h2>Dashboard Overview</h2>
      
//       {/* Icon Stats Section */}
//       <div className="icon-stats">
//         <div className="icon-stat-item">
//           <div className="icon-container">
//             <img src="/team.png" alt="Total Members" className="stat-icon" />
//           </div>
//           <div className="stat-data">
//             <h3>Total Members</h3>
//             <p className="stat-number">{summaryStats.totalMembers}</p>
//           </div>
//         </div>
        
//         <div className="icon-stat-item">
//           <div className="icon-container">
//             <img src="/check.png" alt="Attendance" className="stat-icon" />
//           </div>
//           <div className="stat-data">
//             <h3>Attendance ({getCurrentYear()})</h3>
//             <p className="stat-number total-attendance">Total: {summaryStats.totalAttendance}</p>
//             <div className="attendance-breakdown">
//               {Object.entries(summaryStats.attendanceBreakdown).map(([type, count]) => (
//                 <p key={type} className="attendance-type">
//                   {type}: {count}
//                 </p>
//               ))}
//             </div>
//           </div>
//         </div>
        
//         <div className="icon-stat-item">
//           <div className="icon-container">
//             <img src="/money.png" alt="Collections" className="stat-icon" />
//           </div>
//           <div className="stat-data">
//             <h3>Total Collections ({getCurrentYear()})</h3>
//             <div className="collections-data">
//               {Object.entries(summaryStats.totalCollectionsByCurrency).map(([currency, amount]) => (
//                 <p key={currency} className="collection-amount">
//                   {currency} {amount.toLocaleString()}
//                 </p>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Charts Section */}
//       <div className="charts-container">
//         <div className="chart-item">
//           <h3>Membership Distribution</h3>
//           <PieChart width={400} height={300}>
//             <Pie
//               data={pieChartData}
//               cx={200}
//               cy={150}
//               labelLine={false}
//               outerRadius={80}
//               fill="#8884d8"
//               dataKey="value"
//               label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
//             >
//               {pieChartData.map((entry, index) => (
//                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//               ))}
//             </Pie>
//             <Tooltip />
//             <Legend />
//           </PieChart>
//         </div>

//         <div className="chart-item">
//           <h3>Attendance Trends</h3>
//           <LineChart 
//             width={400} 
//             height={300} 
//             data={processAttendanceData(attendanceData)}
//             margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
//           >
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis 
//               dataKey="date"
//               tick={false}  // This hides the X-axis labels
//               axisLine={true}  // Keep the axis line
//               tickLine={true}  // Keep the tick marks
//             />
//             <YAxis 
//               label={{ 
//                 value: 'Number of People', 
//                 angle: -90, 
//                 position: 'insideLeft',
//                 style: { textAnchor: 'middle' }
//               }}
//             />
//             <Tooltip content={<CustomTooltip />} />
//             <Legend />
//             <Line 
//               type="monotone" 
//               dataKey="Adult" 
//               stroke="#8884d8" 
//               strokeWidth={2}
//               dot={{ r: 4 }}
//               activeDot={{ r: 8 }}
//             />
//             <Line 
//               type="monotone" 
//               dataKey="Children" 
//               stroke="#82ca9d" 
//               strokeWidth={2}
//               dot={{ r: 4 }}
//               activeDot={{ r: 8 }}
//             />
//           </LineChart>
//         </div>
//       </div>

//       {/* Tables Section */}
//       <div className="tables-container">
//         <div className="table-section">
//           <h3>Recent Collections</h3>
//           <table>
//             <thead>
//               <tr>
//                 <th>Date</th>
//                 <th>Type</th>
//                 <th>Amount</th>
//               </tr>
//             </thead>
//             <tbody>
//         {Object.values(
//           collectionsData.reduce((acc, collection) => {
//             // Get month and year from timestamp
//             const date = collection.timestamp?.toDate?.() || new Date(collection.timestamp);
//             const monthYear = date.toLocaleDateString('en-GB', { 
//               month: 'long',
//               year: 'numeric'
//             });
//             const type = collection.paymentType || 'Other';
//             const amount = collection.amount || 0;
            
//             if (!acc[monthYear]) {
//               acc[monthYear] = {
//                 monthYear,
//                 types: new Set(), // Use Set to store unique types
//                 totalAmount: 0
//               };
//             }
            
//             acc[monthYear].types.add(type);
//             acc[monthYear].totalAmount += amount;
//             return acc;
//           }, {})
//         )
//         .sort((a, b) => {
//           // Sort by date (convert month name to date for proper sorting)
//           const dateA = new Date(a.monthYear);
//           const dateB = new Date(b.monthYear);
//           return dateA - dateB;
//         })
//         .map((group) => (
//           <tr key={group.monthYear}>
//             <td>{group.monthYear}</td>
//             <td>{Array.from(group.types).join(', ')}</td>
//             <td>GHS {group.totalAmount.toLocaleString()}</td>
//           </tr>
//         ))}
//       </tbody>
//           </table>
//         </div>

//         <div className="table-section">
//           <h3>Recent Attendance</h3>
//           <table>
//             <thead>
//               <tr>
//                 <th>Date</th>
//                 <th>Type</th>
//                 <th>Number of People</th>
//               </tr>
//             </thead>
//             <tbody>
//               {attendanceData.slice(0, 5).map((attendance) => (
//                 <tr key={attendance.id}>
//                   <td>{attendance.submittedAt? formatDate(attendance.submittedAt) : 'N/A'}</td>
//                   <td>{attendance.attendanceType}</td>
//                   <td>{attendance.numberOfPeople}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;




// import React, { useEffect, useState } from 'react';
// import { getFirestore, collection, getDocs } from 'firebase/firestore';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
// import "../../Dashboard.css";

// const Dashboard = () => {
//   const [attendanceData, setAttendanceData] = useState([]);
//   const [membersData, setMembersData] = useState([]);
//   const [collectionsData, setCollectionsData] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [summaryStats, setSummaryStats] = useState({
//     totalMembers: 0,
//     totalAttendance: 0,
//     attendanceBreakdown: {
//       Adult: 0,
//       Children: 0
//     },
//     totalCollectionsByCurrency: {}
//   });

//   const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

//   const formatDate = (timestamp) => {
//     if (!timestamp) return 'N/A';
    
//     try {
//       if (timestamp.toDate) {
//         return timestamp.toDate().toLocaleDateString('en-GB', {
//           day: 'numeric',
//           month: 'long',
//           year: 'numeric'
//         });
//       }
      
//       if (timestamp instanceof Date) {
//         return timestamp.toLocaleDateString('en-GB', {
//           day: 'numeric',
//           month: 'long',
//           year: 'numeric'
//         });
//       }

//       if (typeof timestamp === 'number') {
//         return new Date(timestamp).toLocaleDateString('en-GB', {
//           day: 'numeric',
//           month: 'long',
//           year: 'numeric'
//         });
//       }

//       if (timestamp.seconds) {
//         return new Date(timestamp.seconds * 1000).toLocaleDateString('en-GB', {
//           day: 'numeric',
//           month: 'long',
//           year: 'numeric'
//         });
//       }

//       if (typeof timestamp === 'string') {
//         if (timestamp.includes(' at ')) {
//           return timestamp.split(' at ')[0];
//         }
//         return new Date(timestamp).toLocaleDateString('en-GB', {
//           day: 'numeric',
//           month: 'long',
//           year: 'numeric'
//         });
//       }

//       return 'Invalid Date Format';
//     } catch (error) {
//       console.error('Error formatting date:', error);
//       console.error('Problematic timestamp:', timestamp);
//       return 'Date Error';
//     }
//   };

//   const getCurrentYear = () => {
//     return new Date().getFullYear();
//   };

//   useEffect(() => {
//     const fetchData = async () => {
//       const db = getFirestore();
//       try {
//         // Fetch Attendance Data
//         const attendanceSnapshot = await getDocs(collection(db, 'Attendance'));
//         const currentYear = getCurrentYear();
        
//         const attendanceList = attendanceSnapshot.docs
//           .map(doc => ({
//             ...doc.data(),
//             id: doc.id
//           }))
//           .filter(attendance => {
//             const attendanceDate = new Date(attendance.date);
//             return attendanceDate.getFullYear() === currentYear;
//           });

//         // Fetch Members Data
//         const membersSnapshot = await getDocs(collection(db, 'Members'));
//         const membersList = membersSnapshot.docs.map(doc => ({
//           ...doc.data(),
//           id: doc.id
//         }));

//         // Fetch Collections Data
//         const collectionsSnapshot = await getDocs(collection(db, 'Money Collections'));
//         const collectionsList = collectionsSnapshot.docs
//           .map(doc => ({
//             ...doc.data(),
//             id: doc.id
//           }))
//           .filter(collection => {
//             const collectionDate = collection.timestamp?.toDate?.() || new Date(collection.timestamp);
//             return collectionDate.getFullYear() === currentYear;
//           });

//         setAttendanceData(attendanceList);
//         setMembersData(membersList);
//         setCollectionsData(collectionsList);

//         // Calculate attendance breakdown
//         const attendanceBreakdown = attendanceList.reduce((acc, item) => {
//           const type = item.attendanceType || 'Other';
//           const count = parseInt(item.numberOfPeople || 0);
//           acc[type] = (acc[type] || 0) + count;
//           return acc;
//         }, {});

//         const totalAttendance = Object.values(attendanceBreakdown).reduce((sum, count) => sum + count, 0);

//         // Group collections by currency (only for current year)
//         const totalCollectionsByCurrency = collectionsList.reduce((acc, item) => {
//           const currency = item.currency || 'GHS';
//           const amount = item.amount || 0;
//           acc[currency] = (acc[currency] || 0) + amount;
//           return acc;
//         }, {});

//         setSummaryStats({
//           totalMembers: membersList.length,
//           totalAttendance,
//           attendanceBreakdown,
//           totalCollectionsByCurrency
//         });

//         setLoading(false);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   // Prepare data for pie chart
//   const membershipDistribution = membersData.reduce((acc, member) => {
//     const membership = member.membership || 'Other';
//     acc[membership] = (acc[membership] || 0) + 1;
//     return acc;
//   }, {});

//   const pieChartData = Object.entries(membershipDistribution).map(([name, value]) => ({
//     name,
//     value
//   }));

//   if (loading) {
//     return <div className="dashboard">Loading...</div>;
//   }
//   const processAttendanceData = (data) => {
//     const groupedData = data.reduce((acc, item) => {
//       const date = formatDate(item.submittedAt || item.date);
//       if (!acc[date]) {
//         acc[date] = {
//           date,
//           Adult: 0,
//           Children: 0
//         };
//       }
      
//       const type = item.attendanceType || 'Other';
//       if (type === 'Adult' || type === 'Children') {
//         acc[date][type] += parseInt(item.numberOfPeople || 0);
//       }
      
//       return acc;
//     }, {});

//     return Object.values(groupedData).sort((a, b) => 
//       new Date(a.date) - new Date(b.date)
//     );
//   };

//   // Custom tooltip component to format the date display
//   const CustomTooltip = ({ active, payload, label }) => {
//     if (active && payload && payload.length) {
//       return (
//         <div className="custom-tooltip" style={{
//           backgroundColor: 'white',
//           padding: '10px',
//           border: '1px solid #ccc',
//           borderRadius: '4px'
//         }}>
//           <p style={{ margin: '0', fontWeight: 'bold' }}>{label}</p>
//           {payload.map((entry, index) => (
//             <p key={index} style={{ 
//               color: entry.color,
//               margin: '5px 0 0'
//             }}>
//               {entry.name}: {entry.value}
//             </p>
//           ))}
//         </div>
//       );
//     }
//     return null;
//   };
//   return (
//     <div className="dashboard">
//       <h2>Dashboard Overview</h2>
      
//       {/* Summary Statistics Cards */}
//       <div className="stats">
//         <div className="stat-item orange">
//           <h3 className="stat-item orange">Total Members</h3>
//           <p>{summaryStats.totalMembers}</p>
//         </div>
//         <div className="stat-item blue">
//           <h3  className="stat-item blue">Attendance ({getCurrentYear()})</h3>
//           <div className="attendance-breakdown">
//             <p className="total-attendance">Total: {summaryStats.totalAttendance}</p>
//             {Object.entries(summaryStats.attendanceBreakdown).map(([type, count]) => (
//               <p key={type} className="attendance-type">
//                 {type}: {count}
//               </p>
//             ))}
//           </div>
//         </div>
//         <div className="stat-item green">
//           <h3 className="stat-item green">Total Collections ({getCurrentYear()})</h3>
//           {Object.entries(summaryStats.totalCollectionsByCurrency).map(([currency, amount]) => (
//             <p key={currency} className="mb-2">
//               {currency} {amount.toLocaleString()}
//             </p>
//           ))}
//         </div>
//       </div>

//       {/* Charts Section */}
//       <div className="charts-container">
//         <div className="chart-item">
//           <h3>Membership Distribution</h3>
//           <PieChart width={400} height={300}>
//             <Pie
//               data={pieChartData}
//               cx={200}
//               cy={150}
//               labelLine={false}
//               outerRadius={80}
//               fill="#8884d8"
//               dataKey="value"
//               label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
//             >
//               {pieChartData.map((entry, index) => (
//                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//               ))}
//             </Pie>
//             <Tooltip />
//             <Legend />
//           </PieChart>
//         </div>

//         <div className="chart-item">
//           <h3>Attendance Trends</h3>
//           <LineChart 
//             width={400} 
//             height={300} 
//             data={processAttendanceData(attendanceData)}
//             margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
//           >
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis 
//               dataKey="date"
//               tick={false}  // This hides the X-axis labels
//               axisLine={true}  // Keep the axis line
//               tickLine={true}  // Keep the tick marks
//             />
//             <YAxis 
//               label={{ 
//                 value: 'Number of People', 
//                 angle: -90, 
//                 position: 'insideLeft',
//                 style: { textAnchor: 'middle' }
//               }}
//             />
//             <Tooltip content={<CustomTooltip />} />
//             <Legend />
//             <Line 
//               type="monotone" 
//               dataKey="Adult" 
//               stroke="#8884d8" 
//               strokeWidth={2}
//               dot={{ r: 4 }}
//               activeDot={{ r: 8 }}
//             />
//             <Line 
//               type="monotone" 
//               dataKey="Children" 
//               stroke="#82ca9d" 
//               strokeWidth={2}
//               dot={{ r: 4 }}
//               activeDot={{ r: 8 }}
//             />
//           </LineChart>
//         </div>
//       </div>

//       {/* Tables Section */}
//       <div className="tables-container">
//         <div className="table-section">
//           <h3>Recent Collections</h3>
//           <table>
//             <thead>
//               <tr>
//                 <th>Date</th>
//                 <th>Type</th>
//                 <th>Amount</th>
//               </tr>
//             </thead>
//             <tbody>
//         {Object.values(
//           collectionsData.reduce((acc, collection) => {
//             // Get month and year from timestamp
//             const date = collection.timestamp?.toDate?.() || new Date(collection.timestamp);
//             const monthYear = date.toLocaleDateString('en-GB', { 
//               month: 'long',
//               year: 'numeric'
//             });
//             const type = collection.paymentType || 'Other';
//             const amount = collection.amount || 0;
            
//             if (!acc[monthYear]) {
//               acc[monthYear] = {
//                 monthYear,
//                 types: new Set(), // Use Set to store unique types
//                 totalAmount: 0
//               };
//             }
            
//             acc[monthYear].types.add(type);
//             acc[monthYear].totalAmount += amount;
//             return acc;
//           }, {})
//         )
//         .sort((a, b) => {
//           // Sort by date (convert month name to date for proper sorting)
//           const dateA = new Date(a.monthYear);
//           const dateB = new Date(b.monthYear);
//           return dateA - dateB;
//         })
//         .map((group) => (
//           <tr key={group.monthYear}>
//             <td>{group.monthYear}</td>
//             <td>{Array.from(group.types).join(', ')}</td>
//             <td>GHS {group.totalAmount.toLocaleString()}</td>
//           </tr>
//         ))}
//       </tbody>
//           </table>
//         </div>

//         <div className="table-section">
//           <h3>Recent Attendance</h3>
//           <table>
//             <thead>
//               <tr>
//                 <th>Date</th>
//                 <th>Type</th>
//                 <th>Number of People</th>
//               </tr>
//             </thead>
//             <tbody>
//               {attendanceData.slice(0, 5).map((attendance) => (
//                 <tr key={attendance.id}>
//                   <td>{attendance.submittedAt? formatDate(attendance.submittedAt) : 'N/A'}</td>
//                   <td>{attendance.attendanceType}</td>
//                   <td>{attendance.numberOfPeople}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;