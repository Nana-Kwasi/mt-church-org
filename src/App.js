import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from '../src/Component/Sidebar/Sidebar';
import Navbar from '../src/Component/Navbar/Navbar'; 
import WelcomeScreen from '../src/Screens/WelcomeScreen/WelcomeScreen';
import Dashboard from '../src/Screens/Dashboard/Dashboard';
import Registration from '../src/Screens/Registration/Registration';
import Attendance from '../src/Screens/Attendance/Attendance';
import Donation from '../src/Screens/Donation/Donation';
import Groups from '../src/Screens/Groups/Groups';
import AssignMember from '../src/Screens/Assign/Assign';
import Events from '../src/Screens/Events/Events';
import Announcements from '../src/Screens/Announcements/Announcements';
import Search from '../src/Screens/Search/Search';
import Reports from '../src/Screens/Reports/Reports';
import MemberDetails from './Screens/Detail/Details';
import Users from './Screens/Users/Users';
import "../src/global.css";
import "../src/responsive.css";

const Layout = ({ children }) => {
  const location = useLocation();

  // Check if the current route is the Welcome Screen
  const isWelcomeScreen = location.pathname === '/';

  return (
    <div className="app">
      {!isWelcomeScreen && <Navbar />} {/* Navbar only appears on non-welcome routes */}
      <div className="main">
        {!isWelcomeScreen && <Sidebar />} {/* Sidebar only appears on non-welcome routes */}
        <div className="content">{children}</div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/donation" element={<Donation />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/assign-member" element={<AssignMember />} />
          <Route path="/events" element={<Events />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/search" element={<Search />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/users" element={<Users />} />
          <Route path="/member-details/:memberId" element={<MemberDetails />} /> {/* Add this route */}
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
