import React from 'react';

function StatisticsReport({ filteredData, totalRows, includedOptions }) {
  const calculateAverage = (columnName) => {
    const numericValues = filteredData
      .map(row => parseFloat(row[columnName]))
      .filter(value => !isNaN(value));

    if (numericValues.length === 0) return NaN;

    const sum = numericValues.reduce((acc, value) => acc + value, 0);
    return sum / numericValues.length;
  };

  const calculateSum = (columnName) => {
    const numericValues = filteredData
      .map(row => parseFloat(row[columnName]))
      .filter(value => !isNaN(value));

    if (numericValues.length === 0) return 0;

    return numericValues.reduce((acc, value) => acc + value, 0);
  };

  return (
    <div>
      <p className="mt-4">Selected Options:</p>
      <ul className="list-disc list-inside">
        {includedOptions.map(option => (
          <li key={option} className="bg-blue-200 text-blue-800 rounded-full px-2 py-1 mr-2 mt-2">
            {option}
          </li>
        ))}
      </ul>
      <p className="mt-4">
        Total rows for meeting this criteria: <span className="font-bold">{totalRows}</span>
      </p>

      {Object.keys(includedOptions).map((key, index) => {
        if (typeof includedOptions[key] === 'number' || !isNaN(includedOptions[key])) {
          const columnName = key;
          return (
            <div key={index} className="mt-4">
              <p className="font-bold">{`Average ${columnName}: `}<span>{calculateAverage(columnName)}</span></p>
              <p className="font-bold">{`Sum ${columnName}: `}<span>{calculateSum(columnName)}</span></p>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

export default StatisticsReport;
