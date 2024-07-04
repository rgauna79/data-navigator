import React from 'react';

function MostRepeatedReport({ mostRepeatedOptions }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300 mt-4">
        <thead className="bg-gray-200">
          <tr>
            <th className="py-2 px-4 border-b">#</th>
            <th className="py-2 px-4 border-b">Value</th>
            <th className="py-2 px-4 border-b">Count</th>
          </tr>
        </thead>
        <tbody>
          {mostRepeatedOptions.map(([option, count], index) => (
            <tr key={index} className="text-center">
              <td className="py-2 px-4 border-b">{index + 1}</td>
              <td className="py-2 px-4 border-b">{option}</td>
              <td className="py-2 px-4 border-b">{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MostRepeatedReport;
