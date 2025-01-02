import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import app from "../../Component/Config/Config";
import "../User Actions .css";

const Announcements = () => {
  const navigate = useNavigate();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const db = getFirestore(app);

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.clear();
    navigate('/');
  };

  const fetchUserActions = async () => {
    setLoading(true);
    setError("");
    try {
      const snapshot = await getDocs(collection(db, "UsersActions"));
      const actionsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.seconds
          ? new Date(data.timestamp.seconds * 1000)
          : null;
        const formattedTimestamp = timestamp
          ? timestamp.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })
          : "---";

        return {
          id: doc.id,
          actionType: data.actionType || "---",
          details: data.details || "---",
          deviceInfo: {
            language: data.deviceInfo?.language || "---",
            platform: data.deviceInfo?.platform || "---",
            screenResolution: data.deviceInfo?.screenResolution || "---",
            userAgent: data.deviceInfo?.userAgent || "---"
          },
          ipAddress: data.ipAddress || "---",
          status: data.status || "---",
          timestamp: formattedTimestamp,
          userId: data.userId || "---",
          userName: data.userName || "---",
          userRole: data.userRole || "---"
        };
      });

      setActions(actionsData);
    } catch (err) {
      setError(`Failed to retrieve data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserActions();
  }, []);

  if (loading) {
    return (
      <div className="actions-container">
        <div className="logout-container">
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <div className="loading">Loading user actions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="actions-container">
        <div className="logout-container">
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="actions-container">
      <div className="logout-container">
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <h2>User Actions Log</h2>

      {actions.length === 0 ? (
        <p>No user actions found.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Action Type</th>
                <th>Details</th>
                <th>Device Info</th>
                {/* <th>IP Address</th> */}
                <th>Status</th>
                <th>Timestamp</th>
                <th>User Name</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action, index) => (
                <tr key={action.id}>
                  <td>{index + 1}</td>
                  <td>{action.actionType}</td>
                  <td>{action.details}</td>
                  <td>
                    <small>
                      Platform: {action.deviceInfo.platform}<br/>
                      Resolution: {action.deviceInfo.screenResolution}<br/>
                      Language: {action.deviceInfo.language}
                    </small>
                  </td>
                  {/* <td>{action.ipAddress}</td> */}
                  <td>{action.status}</td>
                  <td>{action.timestamp}</td>
                  <td>{action.userName}</td>
                  <td>{action.userRole}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Announcements;