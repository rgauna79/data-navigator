import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate  } from "react-router-dom";


function ChartPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    type,
    selectedColumns: initialSelectedColumns,
    selectedOptions: initialSelectedOptions,
    workbook: initialWorkbook,
    selectedSheet : initialSelectedSheet,
    data: initialData,
  } = location.state || {};

  const [selectedColumns, setSelectedColumns] = useState(
    initialSelectedColumns || [],
  );
  const [selectedOptions, setSelectedOptions] = useState(
    initialSelectedOptions || {},
  );
  const [workbook, setworkbook] = useState(
    initialWorkbook || [],
  );
  const [selectedSheet, setselectedSheet] = useState(
    initialSelectedSheet || {},
  );
  const [data, setData] = useState(initialData || []);

   

    
  useEffect(() => {
    
    if (type === "statistics") {
      const filteredData = data.filter((row) => {
        return Object.entries(selectedOptions).every(([key, value]) => {
          return row.includes(value);
        });
      });
      setData(filteredData);
    }
  }, []);

  const generateReportData = () => {
    if (type === "statistics") {
      const filteredData = data.filter((row) => {
        return Object.entries(selectedOptions).every(([key, value]) => {
          return row.includes(value);
        });
      });
      const totalRows = filteredData.length;

      const includedOptions = Object.entries(selectedOptions)
        .filter(([key, value]) => value !== "")
        .map(([key, value]) => `${key}: ${value}`);

      return (
        <div>
          <p className="mt-4">Selected Options:</p>
          <ul className="list-disc list-inside">
            {includedOptions.map((option) => (
              <li
                key={option}
                className="bg-blue-200 text-blue-800 rounded-full px-2 py-1 mr-2 mt-2"
              >
                {option}
              </li>
            ))}
          </ul>
          <p className="mt-4">
            Total rows for meeting this criteria:
            <span className="font-bold"> {totalRows}</span>
          </p>
        </div>
      );

      // `Total rows for selected options: ${totalRows}. \nOptions included: ${includedOptions.join("\n")}`;
    } else if (type === "mostRepeated") {
      const selectedColumn = selectedOptions.mostRepeated;
      const optionsCount = {};

      data.forEach((row) => {
        const option = row[selectedColumn];
        if (option !== null && option !== "") {
          optionsCount[option] = (optionsCount[option] || 0) + 1;
        }
      });

      const mostRepeatedOptions = Object.entries(optionsCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([option, count]) => `${option}: ${count}`);

      return mostRepeatedOptions.length > 0
        ? mostRepeatedOptions.join(", ")
        : "No data to display";
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center">
      <div className="bg-white rounded shadow-lg text-black">
        <div className="px-4 py-4 bg-blue-500 text-white border border-blue-500 ">
          <h1 className="text-2xl font-bold ">Reports</h1>
        </div>
        {type && (
          <div className="mt-4 flex flex-col px-8 pt-4 pb-8">
            <h2 className="text-lg font-bold">
              {type === "statistics"
                ? "Personalized options"
                : "Most repeated values"}{" "}
            </h2>
            <p>{generateReportData()}</p>
          </div>
        )}
      </div>
       <Link
        to={(workbook != "") ? "/filereader" : "/savedfiles"}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
        state={{ selectedColumns, selectedOptions, data, workbook, selectedSheet }}
      >
        Back
      </Link> 
      
    </div>
  );
}

export default ChartPage;
