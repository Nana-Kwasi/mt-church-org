import React, { useState } from "react";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import Papa from "papaparse";
import moment from "moment";
import app from "../../Component/Config/Config";
import "../../search.css";

const Search = () => {
  const db = getFirestore(app);

  const [csvFile, setCsvFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadSummary, setUploadSummary] = useState({
    totalRows: 0,
    successfulUploads: 0,
    skippedRows: 0,
    errors: [],
  });

  const parseDOB = (dobString) => {
    const formats = [
      "YYYY-MM-DD", 
      "MM/DD/YYYY", 
      "DD-MM-YYYY", 
      "YYYY/MM/DD", 
      "MM-DD-YYYY",
      "DD/MM/YYYY"
    ];
    
    for (let format of formats) {
      const parsedDate = moment(dobString, format, true);
      if (parsedDate.isValid()) {
        return parsedDate.toDate();
      }
    }
    throw new Error(`Invalid date format: ${dobString}`);
  };

  const validateContact = (contact) => {
    if (!contact) return false;
    const cleanContact = contact.toString().replace(/\D/g, "");
    return cleanContact.length >= 9 && cleanContact.length <= 15;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setError("No file selected.");
      return;
    }

    if (file.type !== "text/csv" && !file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a valid CSV file.");
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum file size is 5MB.");
      return;
    }

    setCsvFile(file);
    setError("");
    setSuccessMessage("");
    setUploadSummary({
      totalRows: 0,
      successfulUploads: 0,
      skippedRows: 0,
      errors: [],
    });
  };

  const processCsv = async () => {
    if (!csvFile) {
      setError("Please upload a CSV file.");
      return;
    }
  
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
  
    const reader = new FileReader();
  
    reader.onload = async (e) => {
      const text = e.target.result;
  
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header) => 
          header.trim().toLowerCase().replace(/\s+/g, ''),
        complete: async (results) => {
          // Detailed debugging logs
          console.log('Raw Parsed Results:', results);
          console.log('Parsed Headers:', Object.keys(results.data[0] || {}));
          console.log('First Row:', results.data[0]);
          
          const dataRows = results.data;
      
          // Comprehensive and flexible header mapping
          const headerMapping = {
            'memberid': [
              'memberid', 'member id', 'member', 'id', 'memberno', 
              'member_id', 'member number'
            ],
            'title': [
              'title', 'salutation', 'prefix'
            ],
            'firstname': [
              'firstname', 'first name', 'first', 'fname', 'forename'
            ],
            'middlename': [
              'middlename', 'middle name', 'middle', 'mname'
            ],
            'lastname': [
              'lastname', 'last name', 'last', 'lname', 'surname'
            ],
            'gender': [
              'gender', 'sex'
            ],
            'contact': [
              'contactno', 'contact no', 'contact', 'contactnumber', 
              'phone', 'phonenumber', 'telephone'
            ],
            'dob': [
              'dob', 'dateofbirth', 'birthdate', 'date of birth', 
              'birth_date', 'birthDay'
            ],
            'age': [
              'age', 'currentage', 'age0'
            ],
            'gps': [
              'gps', 'location', 'coordinates'
            ],
            'maritalstatus': [
              'maritalstatus', 'marital status', 'marital', 
              'married', 'relationship status'
            ],
            'employmentstatus': [
              'employmentstatus', 'employment status', 'employment', 
              'job status', 'work status'
            ],
            'profession': [
              'profession', 'profession/vocation', 'vocation', 
              'job', 'occupation'
            ],
            'homeregion': [
              'homeregion', 'home region', 'region', 
              'residential region'
            ],
            'hometown': [
              'hometown', 'home town', 'town', 
              'city', 'residence'
            ],
            'membership': [
              'membership', 'member type', 'membershipstatus'
            ],
            'class': [
              'class', 'class ?', 'memberclass', 'group'
            ],
            'classleadername': [
              'classleadername', 'class leader name', 'classleader', 
              'group leader', 'leader'
            ],
            'role': [
              'role', 'position', 'memberrole'
            ],
            'organisations': [
              'organisations', 'organisation', 'organizations', 
              'affiliations', 'groups'
            ]
          };
      
          const uploadSummaryUpdate = {
            totalRows: dataRows.length,
            successfulUploads: 0,
            skippedRows: 0,
            errors: [],
          };
      
          for (const row of dataRows) {
            try {
              // Enhanced header matching function
              const findHeader = (possibleHeaders) => {
                // Normalize row headers
                const rowHeaders = Object.keys(row).map(h => 
                  h.toLowerCase().replace(/\s+/g, '').replace(/[_-]/g, '')
                );
                
                // Try to find a match
                for (let header of possibleHeaders) {
                  const normalizedHeader = header.toLowerCase().replace(/\s+/g, '');
                  const matchIndex = rowHeaders.indexOf(normalizedHeader);
                  
                  if (matchIndex !== -1) {
                    return Object.keys(row)[matchIndex];
                  }
                }
                return null;
              };
      
              // Flexible data extraction with improved type handling
              const extractData = (possibleHeaders, options = {}) => {
                const { 
                  defaultValue = '', 
                  type = 'string',
                  trim = true 
                } = options;
                
                const header = findHeader(possibleHeaders);
                let value = header ? row[header] : defaultValue;
                
                // Type conversion and cleaning
                if (value === null || value === undefined) return defaultValue;
                
                // Trim if requested
                if (trim && typeof value === 'string') {
                  value = value.trim();
                }
                
                // Type conversion
                switch (type) {
                  case 'number':
                    return isNaN(Number(value)) ? defaultValue : Number(value);
                  case 'string':
                    return String(value);
                  case 'boolean':
                    return !!value;
                  default:
                    return value;
                }
              };
      
              // More robust date of birth parsing
              let dobDate, age;
              try {
                const dobHeader = findHeader(headerMapping.dob);
                if (dobHeader && row[dobHeader]) {
                  dobDate = parseDOB(row[dobHeader]);
                  const today = new Date();
                  age = today.getFullYear() - dobDate.getFullYear();
                  
                  const monthDiff = today.getMonth() - dobDate.getMonth();
                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
                    age--;
                  }
                }
              } catch (dobError) {
                console.warn('Date of Birth Parsing Error:', dobError);
              }
      
              const data = {
                memberId: extractData(headerMapping.memberid),
                title: extractData(headerMapping.title),
                firstName: extractData(headerMapping.firstname),
                middleName: extractData(headerMapping.middlename),
                lastName: extractData(headerMapping.lastname),
                gender: extractData(headerMapping.gender),
                contact: extractData(headerMapping.contact),
                dob: dobDate ? dobDate.toISOString() : '',
                age: age || extractData(headerMapping.age, { 
                  type: 'number', 
                  defaultValue: 0 
                }),
                gps: extractData(headerMapping.gps),
                maritalStatus: extractData(headerMapping.maritalstatus),
                employmentStatus: extractData(headerMapping.employmentstatus),
                profession: extractData(headerMapping.profession),
                homeRegion: extractData(headerMapping.homeregion),
                homeTown: extractData(headerMapping.hometown),
                membership: extractData(headerMapping.membership),
                class: extractData(headerMapping.class),
                classLeaderName: extractData(headerMapping.classleadername),
                role: extractData(headerMapping.role),
                organisations: extractData(headerMapping.organisations),
                registrationDate: new Date().toISOString(),
              };
      
              // Logging for debugging
              console.log('Processed Row Data:', data);
      
              // Add the document to the "Members" collection in Firestore
              await setDoc(doc(db, "Members", uuidv4()), data);
      
              uploadSummaryUpdate.successfulUploads++;
            } catch (rowError) {
              console.error('Row Processing Error:', rowError);
              uploadSummaryUpdate.skippedRows++;
              uploadSummaryUpdate.errors.push({
                row: row,
                reason: rowError.message,
              });
            }
          }
          setUploadSummary(uploadSummaryUpdate);

          if (uploadSummaryUpdate.totalRows > 0) {
            setSuccessMessage(
              `CSV data processed. Total Rows: ${uploadSummaryUpdate.totalRows}, Successful Uploads: ${uploadSummaryUpdate.successfulUploads}, Skipped Rows: ${uploadSummaryUpdate.skippedRows}`
            );
          } else { 
            setError(
              "No valid rows found in the CSV file. Please check your file format and ensure data is present."
            );
          }

          setIsLoading(false);
        },
      });
    };
  
    reader.onerror = () => {
      setError("File reading error.");
      setIsLoading(false);
    };
  
    reader.readAsText(csvFile);
  };

  return (
    <div className="search-screen">
      <h2>Member Upload</h2>
      <p>Upload CSV file with member details</p>

      <div className="csv-upload">
        <h3>Upload CSV</h3>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange} 
          disabled={isLoading} 
        />
        <button 
          onClick={processCsv} 
          disabled={isLoading || !csvFile} 
          className="upload-button"
        >
          {isLoading ? "Processing..." : "Upload CSV"}
        </button>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {uploadSummary.totalRows > 0 && (
          <div className="upload-summary">
            <h4>Upload Summary</h4>
            <p>Total Rows: {uploadSummary.totalRows}</p>
            <p>Successful Uploads: {uploadSummary.successfulUploads}</p>
            <p>Skipped Rows: {uploadSummary.skippedRows}</p>
            {uploadSummary.errors.length > 0 && (
              <div className="error-details">
                <h5>Detailed Errors</h5>
                <ul>
                  {uploadSummary.errors.map((error, index) => (
                    <li key={index}>
                      Row: {JSON.stringify(error.row)} - Reason: {error.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;