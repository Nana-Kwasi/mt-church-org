import React from 'react';
import "../../navbar.css";

const Navbar = () => {
  return (
    <div className="navbar">
      <div className="navbar-brand">
        <img
          src="/logo.jpg" 
          alt="Logo"
          className="logo"
        />
        <h2 style={{ color: 'white' }}>Methodist Church Ghana</h2>
      </div>
      <div className="navbar-links">
        <span>Welcome, User</span>
        <img
          src="https://via.placeholder.com/40" 
          alt="User Avatar"
          className="avatar"
        />
      </div>
    </div>
  );
};

export default Navbar;
