import React, { useState, useEffect } from "react";
import { useVisitor } from "../context/VisitorContext";
import "../login.css";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [branches, setBranches] = useState([]);
  const [fetchingBranches, setFetchingBranches] = useState(true);
  const [localError, setLocalError] = useState("");
  const [manualLoginAttempt, setManualLoginAttempt] = useState(false);
  
  
  const { login, loading, error, setError, authenticated } = useVisitor();

  const API_URL = "http://localhost:5001/visitors";
  const AUTH_URL = "http://localhost:5001/auth";

  useEffect(() => {
    if (authenticated && email && manualLoginAttempt) {
      console.log("Authentication successful after manual login attempt, navigating to dashboard");
      onLogin(email);
      setManualLoginAttempt(false);
    } else if (authenticated) {
      console.log("Already authenticated from storage, but not navigating (waiting for manual login)");
    }
  }, [authenticated, email, onLogin, manualLoginAttempt]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setFetchingBranches(true);
        console.log("Fetching branches from:", API_URL);
        const response = await fetch(API_URL);
        
        if (!response.ok) {
          throw new Error(`API response error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Received ${data.length} entries from API`);
        
        const uniqueBranches = [...new Set(data
          .map(entry => entry.branchname )
          .filter(branch => branch && branch.trim() !== "")
        )];
        
        console.log(`Found ${uniqueBranches.length} unique branches`);
        setBranches(uniqueBranches.sort());
      } catch (err) {
        console.error("Error fetching branches:", err);
        setLocalError("Failed to load branches. Please try again later.");
      } finally {
        setFetchingBranches(false);
      }
    };

    fetchBranches();
  }, [API_URL, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Login form submitted");
    setLocalError("");
  
    if (email.length > 25) {
      setLocalError("F number is incorrect");
      return;
    }
  
    if (!selectedBranch) {
      setLocalError("Please select a branch");
      return;
    }
  
    try {
      console.log("Login validation passed, setting manual login attempt flag");
      setManualLoginAttempt(true);
      
      console.log("Attempting login with:", { email, branch: selectedBranch });
      
      const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          branch: selectedBranch
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data = await response.json();
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      const success = await login(email, selectedBranch, data.token);
      
      console.log("Login result:", success);
      
      if (!success) {
        console.log("Login failed, resetting manual login attempt flag");
        setManualLoginAttempt(false);
        setLocalError("Login failed. Please check your credentials and try again.");
      }
    } catch (err) {
      console.error("Login submission error:", err);
      setManualLoginAttempt(false);
      setLocalError(err.message || "An unexpected error occurred. Please try again.");
    }
  };

  
  const displayError = error || localError;

  return (
    <div className="login-container">
      <div className="login-card">
        <img src="/FNB logo.png" alt="FNB Logo" className="login-logo" />
        <h2>Welcome to FNB Admin</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={25}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <div className="select-container">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              required
              disabled={fetchingBranches}
              className="branch-select"
            >
              <option value="">Select Branch</option>
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            {fetchingBranches && (
              <span className="select-spinner"></span>
            )}
          </div>
          
          {displayError && <p className="error-message">{displayError}</p>}
          <button type="submit" className="login-button" disabled={loading || fetchingBranches}>
            {loading ? <span className="spinner"></span> : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;