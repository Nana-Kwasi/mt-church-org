import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import app from "../../Component/Config/Config";

const COLLECTION_TYPES = [
  "Total Offering",
  "Annual Harvest",
  "Sunday Collection",
  "Tithe Collection",
  "Building Fund",
  "Mission Fund",
  "Special Events"
];

const CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "GHS", symbol: "GH₵" }
];

const Donation = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collections, setCollections] = useState([{
    type: COLLECTION_TYPES[0],
    amounts: [{ currency: "GH₵", value: "" }]
  }]);
  
  const navigate = useNavigate();
  const db = getFirestore(app);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "Members"));
        const membersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMembers(membersData);
        setFilteredMembers(membersData);
      } catch (error) {
        console.error("Error fetching members:", error);
        setError("Error fetching members. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [db]);

  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredMembers(
      members.filter(
        (member) =>
          member.firstName?.toLowerCase().includes(query) ||
          member.lastName?.toLowerCase().includes(query) ||
          member.contact?.toLowerCase().includes(query)
      )
    );
  };

  const handleRowClick = (memberId) => {
    navigate(`/member-details/${encodeURIComponent(memberId)}`);
  };

  const handleAddCollection = () => {
    setCollections([...collections, {
      type: COLLECTION_TYPES[0],
      amounts: [{ currency: "USD", value: "" }]
    }]);
  };

  const handleRemoveCollection = (index) => {
    setCollections(collections.filter((_, i) => i !== index));
  };

  const handleTypeChange = (index, value) => {
    const newCollections = [...collections];
    newCollections[index].type = value;
    setCollections(newCollections);
  };

  const handleAddAmount = (collectionIndex) => {
    const newCollections = [...collections];
    newCollections[collectionIndex].amounts.push({ currency: "USD", value: "" });
    setCollections(newCollections);
  };

  const handleRemoveAmount = (collectionIndex, amountIndex) => {
    const newCollections = [...collections];
    newCollections[collectionIndex].amounts.splice(amountIndex, 1);
    setCollections(newCollections);
  };

  const handleAmountChange = (collectionIndex, amountIndex, field, value) => {
    const newCollections = [...collections];
    newCollections[collectionIndex].amounts[amountIndex][field] = value;
    setCollections(newCollections);
  };

  const handleSubmit = async () => {
    try {
      const validCollections = collections.every(collection => 
        collection.amounts.every(amount => 
          amount.value && !isNaN(amount.value) && parseFloat(amount.value) > 0
        )
      );

      if (!validCollections) {
        alert("Please enter valid amounts for all collections");
        return;
      }

      const collectionData = {
        collections: collections.map(collection => ({
          type: collection.type,
          amounts: collection.amounts.map(amount => ({
            currency: amount.currency,
            value: parseFloat(amount.value)
          }))
        })),
        timestamp: new Date()
      };

      await addDoc(collection(db, "BulkCollections"), collectionData);
      alert("Collections saved successfully!");
      setIsModalOpen(false);
      setCollections([{
        type: COLLECTION_TYPES[0],
        amounts: [{ currency: "USD", value: "" }]
      }]);
    } catch (error) {
      console.error("Error saving collections:", error);
      alert("Error saving collections. Please try again.");
    }
  };
  const modalStyles = {
    overlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      marginLeft:"10%",
      padding: '1rem',
      zIndex: 50,
      backdropFilter: 'blur(4px)'
    },
    content: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '1rem',
      width: '95%',
      maxWidth: '70rem',
      maxHeight: '85vh',
      overflow: 'auto',
      margin: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
    header: {
      marginBottom: '2rem',
      paddingBottom: '1rem',
      borderBottom: '2px solid #edf2f7'
    },
    collectionCard: {
      padding: '2rem',
      marginBottom: '2rem',
      backgroundColor: '#fff',
      borderRadius: '1rem',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="members p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Members</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="add-collection-btn"
        >
          Load Bulk Collection
        </button>
      </div>

      {isModalOpen && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.content}>
            <div style={modalStyles.header}>
              <h2 className="text-2xl font-bold text-gray-800">Add Collections</h2>
            </div>
            
            {collections.map((collection, collectionIndex) => (
              <div key={collectionIndex} style={modalStyles.collectionCard}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <select
                    value={collection.type}
                    onChange={(e) => handleTypeChange(collectionIndex, e.target.value)}
                    className="form-select w-full md:w-2/3"
                  >
                    {COLLECTION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {collections.length > 1 && (
                    <button
                      onClick={() => handleRemoveCollection(collectionIndex)}
                      className="remove-btn w-full md:w-auto"
                    >
                      Remove Collection
                    </button>
                  )}
                </div>

                {collection.amounts.map((amount, amountIndex) => (
                  <div key={amountIndex} className="flex flex-col md:flex-row gap-4 mb-6">
                    <select
                      value={amount.currency}
                      onChange={(e) => handleAmountChange(collectionIndex, amountIndex, "currency", e.target.value)}
                      className="form-select w-full md:w-1/4"
                    >
                      {CURRENCIES.map(curr => (
                        <option key={curr.code} value={curr.code}>{curr.code} ({curr.symbol})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={amount.value}
                      onChange={(e) => handleAmountChange(collectionIndex, amountIndex, "value", e.target.value)}
                      placeholder="Amount"
                      className="form-input w-full md:w-1/2"
                    />
                    {collection.amounts.length > 1 && (
                      <button
                        onClick={() => handleRemoveAmount(collectionIndex, amountIndex)}
                        className="remove-btn w-full md:w-auto"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => handleAddAmount(collectionIndex)}
                  className="btn-link mt-4"
                >
                  Add Another Currency
                </button>
              </div>
            ))}

            <div className="flex flex-col md:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleAddCollection}
                className="btn btn-primary w-full md:w-auto"
              >
                Add Another Collection
              </button>
              <button
                onClick={handleSubmit}
                className="btn btn-success w-full md:w-auto"
              >
                Load Collections
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-secondary w-full md:w-auto"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="search-bar-container">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by Name or Contact..."
          className="search-bar rounded-full"
        />
      </div>

      {filteredMembers.length === 0 ? (
        <div>No matching members found.</div>
      ) : (
        <div className="table-container">
          <table className="members-table">
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr
                  key={member.id}
                  onClick={() => handleRowClick(member.id)}
                  className="clickable-row"
                >
                  <td>{member.firstName || "N/A"}</td>
                  <td>{member.lastName || "N/A"}</td>
                  <td>{member.contact || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Donation;