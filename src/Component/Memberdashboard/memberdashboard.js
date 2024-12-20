import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { PieChart, Pie, XAxis, BarChart, Bar, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { format, isToday } from 'date-fns';
import app from "../../Component/Config/Config";
import "../memberdashboard.css"

const MemberFinancialDashboard = ({ memberId }) => {
  const [monthlyCollections, setMonthlyCollections] = useState([]);
  const [currencyGroupedCollections, setCurrencyGroupedCollections] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchMoneyCollections = async () => {
      try {
        const q = query(
          collection(db, "Money Collections"),
          where("memberId", "==", memberId)
        );

        const querySnapshot = await getDocs(q);
        const collections = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));

        // Group collections by currency
        const currencyGroups = collections.reduce((acc, collection) => {
          const currency = collection.currency || 'Unknown';
          if (!acc[currency]) {
            acc[currency] = [];
          }
          acc[currency].push(collection);
          return acc;
        }, {});
        setCurrencyGroupedCollections(currencyGroups);

        const monthlyData = processMonthlyData(collections);
        setMonthlyCollections(monthlyData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching money collections:", err);
        setError("Failed to load financial data");
        setLoading(false);
      }
    };

    fetchMoneyCollections();
  }, [memberId, db]);

  const processMonthlyData = (collections) => {
    const monthMap = {};

    collections.forEach(collection => {
      const date = new Date(collection.timestamp.seconds * 1000);
      const monthKey = format(date, 'MMM yyyy');
      
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          month: monthKey,
          total: 0,
          transactions: []
        };
      }

      monthMap[monthKey].total += collection.amount;
      monthMap[monthKey].transactions.push({
        date: format(date, 'dd MMM'),
        paymentType: collection.paymentType,
        amount: collection.amount,
        currency: collection.currency
      });
    });

    return Object.values(monthMap).sort((a, b) => 
      new Date(a.month) - new Date(b.month)
    );
  };

  const getCurrentDayTotal = () => {
    // Group today's transactions by currency
    const todayTransactions = Object.entries(currencyGroupedCollections).reduce((acc, [currency, collections]) => {
      const todayTotal = collections
        .filter(collection => isToday(new Date(collection.timestamp.seconds * 1000)))
        .reduce((sum, collection) => sum + collection.amount, 0);
      
      if (todayTotal > 0) {
        acc[currency] = todayTotal;
      }
      return acc;
    }, {});

    return todayTransactions;
  };

  const getTotalContributions = () => {
    // Group total contributions by currency
    return Object.entries(currencyGroupedCollections).reduce((acc, [currency, collections]) => {
      const total = collections.reduce((sum, collection) => sum + collection.amount, 0);
      acc[currency] = total;
      return acc;
    }, {});
  };

  const preparePieData = () => {
    return monthlyCollections.map(month => ({
      name: month.month,
      value: month.total
    }));
  };

  if (loading) return <div className="loading-state">Loading financial data...</div>;
  if (error) return <div className="error-state">{error}</div>;

  const todayTotals = getCurrentDayTotal();
  const totalContributions = getTotalContributions();

  return (
    <div className="financial-dashboard">
      <div className="grid">  
        {/* Current Day Totals */}
        <div className="summary-metric">
          <div className="summary-metric-circle" style={{backgroundColor: '#3b82f6'}}>
            <div className="flex flex-col items-center justify-center w-full h-full">
              {Object.entries(todayTotals).map(([currency, amount]) => (
                <div key={currency} className="text-center">
                  <span className="text-xs font-bold">{currency}</span>
                  <span className="block text-sm">{amount.toFixed(2)}</span>
                </div>
              ))}
              <span className="text-xs absolute bottom-1 left-0 right-0 text-center">Today's Transactions</span>
            </div>
          </div>
        </div>

        {/* Total Contributions */}
        <div className="summary-metric">
          <div className="summary-metric-circle" style={{backgroundColor: '#10b981'}}>
            <div className="flex flex-col items-center justify-center w-full h-full">
              {Object.entries(totalContributions).map(([currency, amount]) => (
                <div key={currency} className="text-center">
                  <span className="text-xs font-bold">{currency}</span>
                  <span className="block text-sm">{amount.toFixed(2)}</span>
                </div>
              ))}
              <span className="text-xs absolute bottom-1 left-0 right-0 text-center">Monthly Transactions</span>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="chart-container col-span-full">
          <h3 className="chart-title">Monthly Contributions Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={preparePieData()}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {preparePieData().map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`hsl(${index * 60}, 70%, 50%)`} 
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="chart-container">
          <h3 className="chart-title">Monthly Contributions Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={preparePieData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8">
                {preparePieData().map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`hsl(${index * 60}, 70%, 50%)`} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Transaction Table */}
        <div className="col-span-full bg-white p-4 rounded-lg shadow-md">
          {/* <h3 className="text-lg font-semibold mb-4 text-center">Monthly Transactions</h3> */}
          <div className="transaction-table-container">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th style={{color:"white"}}>Month/Year</th>
                  <th style={{color:"white"}}>Date</th>
                  <th style={{color:"white"}}>Payment Type</th>
                  <th style={{color:"white"}}>Amount</th>
                  <th style={{color:"white"}}>Currency</th>
                  <th style={{color:"white"}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {monthlyCollections.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="transaction-table-empty">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  monthlyCollections.map((month, monthIndex) => (
                    month.transactions.map((transaction, transIndex) => (
                      <tr key={`${monthIndex}-${transIndex}`}>
                        {transIndex === 0 && (
                          <td 
                            rowSpan={month.transactions.length}
                            className="font-medium"
                          >
                            {month.month}
                          </td>
                        )}
                        <td>{transaction.date}</td>
                        <td>
                          <span 
                            className={`payment-type payment-type-${transaction.paymentType.toLowerCase()}`}
                          >
                            {transaction.paymentType}
                          </span>
                        </td>
                        <td 
                          className={`amount-column ${
                            transaction.amount > 0 ? 'positive-amount' : 'negative-amount'
                          }`}
                        >
                          {transaction.amount.toFixed(2)}
                        </td>
                        <td>{transaction.currency}</td>
                        {transIndex === 0 && (
                          <td 
                            rowSpan={month.transactions.length}
                            className="font-bold amount-column"
                          >
                            {month.total.toFixed(2)}
                          </td>
                        )}
                      </tr>
                    ))
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberFinancialDashboard;