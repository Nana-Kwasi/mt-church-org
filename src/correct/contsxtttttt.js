import React, { createContext, useState, useContext, useEffect } from "react";

const VisitorContext = createContext();

export const VisitorProvider = ({ children }) => {

  const [selectedBranch, setSelectedBranch] = useState("");
  const [branchData, setBranchData] = useState({
    analyticsData: [],
    totalVisitors: 0,
    visitorsToday: 0,
    todayVisitorsData: [],
    allVisitorsData: [],
  });
  
  // Authentication state
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  
  const API_URL = "http://localhost:5001/visitors";
  const AUTH_URL = "http://localhost:5001/auth";

  // Date formatting utilities
  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const parseAPIDate = (dateStr) => {
    if (!dateStr) {
      console.log("parseAPIDate: No date provided");
      return null;
    }
    console.log(`parseAPIDate: Parsing date string: "${dateStr}"`);
    
    if (dateStr instanceof Date) {
      console.log("parseAPIDate: Input is already a Date object");
      return dateStr;
    }
    
    try {
      // Handle ISO string format and YYYY-MM-DD format
      if (dateStr.includes("T") || dateStr.includes("-")) {
        const parsedDate = new Date(dateStr);
        console.log(`parseAPIDate: Parsed as ISO/YYYY-MM-DD: ${parsedDate}`);
        return parsedDate;
      }
      
      // Handle MM/DD/YYYY format
      if (dateStr.includes("/")) {
        const [month, day, year] = dateStr.split('/').map(num => parseInt(num, 10));
        const parsedDate = new Date(year, month - 1, day);
        console.log(`parseAPIDate: Parsed as MM/DD/YYYY: ${parsedDate}`);
        return parsedDate;
      }
      
      console.log(`parseAPIDate: Unrecognized date format: ${dateStr}`);
      return null;
    } catch (e) {
      console.error(`parseAPIDate: Error parsing date "${dateStr}":`, e);
      return null;
    }
  };

  // Fetch branch data from API
  const fetchBranchData = async (branchName) => {
    setLoading(true);
    setError("");
    
    try {
      console.log(`Fetching data for branch: ${branchName}`);
      
      // Use authentication token if available
      const headers = {};
      if (token) {
        headers['x-auth-token'] = token;
      }
      
      const response = await fetch(API_URL, { headers });
      
      if (!response.ok) {
        throw new Error(`API response error: ${response.status}`);
      }
      
      const allData = await response.json();
      console.log("API response received with entries:", allData.length);
      
      // Filter data by selected branch
      const branchData = allData.filter(item => 
        item.branchname === branchName || item.branch === branchName
      );
      console.log(`Filtered ${branchData.length} entries for branch: ${branchName}`);
      
      // Process data for dashboard
      const currentYear = new Date().getFullYear();
      const today = new Date();
      const todayFormatted = formatDateForAPI(today);
      console.log("Today's date formatted for comparison:", todayFormatted);
      
      // Debug all dates in the filtered data
      branchData.forEach((item, index) => {
        if (item.date) {
          const parsedDate = parseAPIDate(item.date);
          console.log(`Entry ${index} date: "${item.date}" -> Parsed: ${parsedDate ? parsedDate.toISOString() : 'null'}`);
        } else {
          console.log(`Entry ${index} has no date`);
        }
      });
      
      const groupedData = branchData.reduce(
        (acc, log) => {
          if (log.date) {
            try {
              const date = parseAPIDate(log.date);
              
              if (!date) {
                console.log(`Invalid date format for entry:`, log);
                return acc;
              }
              
              // Only process entries from current year
              if (date && date.getFullYear() === currentYear) {
                const month = date.toLocaleString("default", { month: "long" });
                acc.monthly[month] = (acc.monthly[month] || 0) + 1;
  
                // Check if the entry is from today
                const logDate = formatDateForAPI(date);
                console.log(`Comparing dates: logDate=${logDate}, todayFormatted=${todayFormatted}`);
                if (logDate === todayFormatted) {
                  acc.today += 1;
                  console.log(`Today match found! Today count: ${acc.today}`);
                }
              }
              
              // Include in total only if it's current year
              if (date && date.getFullYear() === currentYear) {
                acc.total += 1;
              }
            } catch (e) {
              console.error("Date parsing error:", e);
            }
          }
          return acc;
        },
        { monthly: {}, today: 0, total: 0 }
      );
      
      console.log("Grouped data results:", {
        total: groupedData.total,
        today: groupedData.today,
        monthCounts: groupedData.monthly
      });
  
      // Create array for all months in current year
      const fullYearMonths = Array.from({ length: 12 }, (_, i) => {
        const month = new Date(currentYear, i).toLocaleString("default", {
          month: "long",
        });
        return { month, visits: groupedData.monthly[month] || 0 };
      });
      
      // Filter today's visitors
      const todayVisitors = branchData.filter(visitor => {
        if (!visitor.date) return false;
        const visitorDate = parseAPIDate(visitor.date);
        const formattedVisitorDate = visitorDate ? formatDateForAPI(visitorDate) : null;
        const isToday = formattedVisitorDate === todayFormatted;
        
        if (isToday) {
          console.log(`Today's visitor found:`, visitor);
        }
        
        return isToday;
      });
      
      console.log(`Found ${todayVisitors.length} visitors today`);
      
      // Log detailed info about today's visitors
      if (todayVisitors.length > 0) {
        console.log("Today's visitors detail:", todayVisitors);
      }
      
      // Update context state
      setBranchData({
        analyticsData: fullYearMonths,
        totalVisitors: groupedData.total,
        visitorsToday: groupedData.today,
        todayVisitorsData: todayVisitors,
        allVisitorsData: branchData
      });
      
      // Store processed data in localStorage for persistence
      const dashboardData = {
        analyticsData: fullYearMonths,
        totalVisitors: groupedData.total,
        visitorsToday: groupedData.today,
        lastUpdated: new Date().toISOString(), // Add timestamp for cache validation
        selectedBranch: branchName
      };
      
      localStorage.setItem("dashboardData", JSON.stringify(dashboardData));
      console.log("Data stored in localStorage", dashboardData);
      
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Error fetching branch data:", err);
      setError("Failed to fetch branch data. Please try again.");
      setLoading(false);
      return false;
    }
  };

  // Authentication functions
  const verifyToken = async () => {
    if (!token) return false;
    
    try {
      const response = await fetch(`${AUTH_URL}/verify-token`, {
        headers: {
          'x-auth-token': token
        }
      });
      
      return response.ok;
    } catch (err) {
      console.error("Token verification error:", err);
      return false;
    }
  };

  // Login function - integrated with token-based auth
  const login = async (email, branch, authToken = null) => {
    setLoading(true);
    setError("");
    
    try {
      // If token is provided directly, use it
      if (authToken) {
        setToken(authToken);
        localStorage.setItem('token', authToken);
        
        const userData = { email, branch };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setSelectedBranch(branch);
        setAuthenticated(true);
        
        // Fetch branch data with the token
        await fetchBranchData(branch);
        
        setLoading(false);
        return true;
      }
      
      // Otherwise attempt login with credentials
      console.log(`Attempting login for ${email} at branch ${branch}`);
      
      const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: 'default-needed-in-body', branch })
      });
      
      if (!response.ok) {
        throw new Error("Authentication failed");
      }
      
      const data = await response.json();
      
      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user || { email, branch }));
      
      setToken(data.token);
      setUser(data.user || { email, branch });
      setSelectedBranch(branch);
      setAuthenticated(true);
      
      // Fetch branch data with new authentication
      await fetchBranchData(branch);
      
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please try again.");
      setLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    console.log("Logging out, clearing context and localStorage");
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem("dashboardData");
    
    setToken(null);
    setSelectedBranch("");
    setBranchData({
      analyticsData: [],
      totalVisitors: 0,
      visitorsToday: 0,
      todayVisitorsData: [],
      allVisitorsData: [],
    });
    setAuthenticated(false);
    setUser(null);
  };

  // Check for stored session on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const savedData = localStorage.getItem("dashboardData");
      
      if (storedToken && storedUser) {
        try {
          // Verify token with the backend
          const response = await fetch(`${AUTH_URL}/verify`, {
            headers: {
              'x-auth-token': storedToken
            }
          });
          
          if (response.ok) {
            const userData = JSON.parse(storedUser);
            setToken(storedToken);
            setUser(userData);
            setAuthenticated(true);
            
            if (userData.branch) {
              setSelectedBranch(userData.branch);
            }
            
            // Check saved dashboard data
            if (savedData) {
              try {
                console.log("Found saved dashboard data in localStorage");
                const parsedData = JSON.parse(savedData);
                
                // Check if data is stale (from a different day)
                const lastUpdated = new Date(parsedData.lastUpdated || 0);
                const today = new Date();
                const isSameDay = lastUpdated.toDateString() === today.toDateString();
                
                if (isSameDay) {
                  console.log("Restoring dashboard data from localStorage:", parsedData);
                  setBranchData({
                    analyticsData: parsedData.analyticsData || [],
                    totalVisitors: parsedData.totalVisitors || 0,
                    visitorsToday: parsedData.visitorsToday || 0,
                    todayVisitorsData: parsedData.todayVisitorsData || [],
                    allVisitorsData: parsedData.allVisitorsData || [],
                  });
                } else {
                  console.log("Saved data is from a different day, fetching fresh data");
                  if (userData.branch) {
                    fetchBranchData(userData.branch);
                  }
                }
              } catch (err) {
                console.error("Error parsing stored dashboard data:", err);
                localStorage.removeItem("dashboardData");
                if (userData.branch) {
                  fetchBranchData(userData.branch);
                }
              }
            } else if (userData.branch) {
              // No saved data but we have branch info, fetch fresh data
              fetchBranchData(userData.branch);
            }
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem("dashboardData");
          }
        } catch (err) {
          console.error('Token verification error:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem("dashboardData");
        }
      } else {
        console.log("No saved authentication found in localStorage");
      }
    };
    
    checkAuth();
  }, []);

  // Create context value
  const contextValue = {
    // Authentication context
    authenticated,
    user,
    loading,
    error,
    token,
    login,
    logout,
    
    // Visitor tracking context
    selectedBranch,
    branchData,
    fetchBranchData,
    setError,
  };

  return (
    <VisitorContext.Provider value={contextValue}>
      {children}
    </VisitorContext.Provider>
  );
};

// Custom hook for using the context
export const useVisitor = () => {
  const context = useContext(VisitorContext);
  if (!context) {
    throw new Error("useVisitor must be used within a VisitorProvider");
  }
  return context;
};