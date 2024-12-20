// import React from 'react';
// import { Link } from 'react-router-dom';
// import "../../sidebar.css"

// const Sidebar = () => {
//   return (
//     <div className="sidebar">
//       <ul>
//         <li><Link to="/dashboard">Dashboard</Link></li>
//         <li><Link to="/registration">Registration</Link></li>
//         <li><Link to="/attendance">Attendance</Link></li>
//         <li><Link to="/donation">Collections</Link></li>
//         <li><Link to="/groups">Manage Users</Link></li>
//         <li><Link to="/assign-member">Manage Members</Link></li>
//         {/* <li><Link to="/events">Events</Link></li> */}
//         {/* <li><Link to="/announcements">Announcements</Link></li> */}
//         {/* <li><Link to="/search">Upload Files</Link></li> */}
//         <li><Link to="/reports">Reports</Link></li>
//       </ul>
//     </div>
//   );
// };

// export default Sidebar;
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../sidebar.css";

const Sidebar = () => {
  const [userRole, setUserRole] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  const getMenuItems = () => {
    const menuItems = {
      Admin: [
        { path: "/dashboard", label: "Dashboard" },
        { path: "/registration", label: "Registration" },
        { path: "/attendance", label: "Attendance" },
        { path: "/donation", label: "Collections" },
        { path: "/groups", label: "Manage Users" },
        { path: "/assign-member", label: "Manage Members" },
        { path: "/reports", label: "Reports" },
      ],
      Finance: [
        { path: "/dashboard", label: "Dashboard" },
        { path: "/registration", label: "Registration" },
        { path: "/attendance", label: "Attendance" },
        { path: "/donation", label: "Collections" },
        { path: "/reports", label: "Reports" },
      ],
      Support: [
        { path: "/dashboard", label: "Dashboard" },
        { path: "/registration", label: "Registration" },
        { path: "/attendance", label: "Attendance" },
        { path: "/donation", label: "Collections" },
        { path: "/reports", label: "Reports" },
      ],
      User: [{ path: "/dashboard", label: "Dashboard" }],
    };

    return menuItems[userRole] || [];
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <div className={`sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <button
          className="hamburger"
          onClick={toggleMobileMenu}
          aria-label="Toggle sidebar menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        <ul>
          {getMenuItems().map((item) => (
            <li key={item.path}>
              <Link to={item.path}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
