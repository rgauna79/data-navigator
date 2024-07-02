import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useDataContext } from "../context/DataContext.jsx";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function ChartPage() {
  const { data, selectedOptions, typeReport } = useDataContext();
  const reportsRef = useRef();
  const chartRef = useRef();

  const handlePrint = async () => {
    try {
      const pdf = new jsPDF("p", "pt", "letter");
      // Render reports section to PDF
      if (reportsRef.current) {
        const reportsCanvas = await html2canvas(reportsRef.current);
        const reportsImgData = reportsCanvas.toDataURL("image/png");
        pdf.addImage(reportsImgData, "PNG", 40, 40, 400, 300); // Adjust position and dimensions as needed
      } else {
        console.warn("Reports section not available.");
      }

      // Render chart to PDF
      if (chartRef.current) {
        const chartCanvas = chartRef.current.canvas;
        const chartCanvasImage = await html2canvas(chartCanvas);
        const chartImgData = chartCanvasImage.toDataURL("image/png");
        pdf.addImage(chartImgData, "PNG", 40, 360, 400, 300); // Adjust position and dimensions as needed
      } else {
        console.warn("Chart section not available.");
      }
      // Open PDF in new tab instead of downloading
      const pdfBlob = await pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  useEffect(() => {
    if (typeReport === "statistics") {
      const filteredData = data.filter((row) => {
        return Object.entries(selectedOptions).every(([key, value]) => {
          return row.includes(value);
        });
      });
    }
  }, [data, selectedOptions, typeReport]);

  const generateReportData = () => {
    if (typeReport === "allColumns") {
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
    } else if (typeReport === "mostRepeated") {
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
        .slice(0, 5);

      if (mostRepeatedOptions.length > 0) {
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
      } else {
        return "No data to display";
      }
    }
  };

  const optionsCount = data.reduce((acc, row) => {
    const option = row[selectedOptions.mostRepeated];
    if (option !== null && option !== "") {
      acc[option] = (acc[option] || 0) + 1;
    }
    return acc;
  }, {});

  const sortedOptions = Object.entries(optionsCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Limitar a los 5 valores más frecuentes

  const labels = sortedOptions.map(([option]) => option);
  const values = sortedOptions.map(([, count]) => count);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "# of Times",
        data: values,
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
          "rgba(153, 102, 255, 0.2)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Most Repeated Options",
        font: {
          size: 20,
        },
      },
      legend: {
        display: true,
        position: "left",
        labels: {
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(0,0,0,0.7)",
        titleFont: {
          size: 16,
        },
        bodyFont: {
          size: 14,
        },
      },
    },
    animation: {
      animateScale: true,
      animateRotate: true,
    },
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center">
      <div className="bg-white rounded shadow-lg text-black">
        <div className="px-4 py-4 bg-blue-500 text-white border border-blue-500">
          <h1 className="text-2xl font-bold">Reports</h1>
        </div>
        <div ref={reportsRef} className="mt-4 flex flex-col px-8 pt-4 pb-8">
          <h2 className="text-lg font-bold">
            {typeReport === "statistics"
              ? "Personalized Options"
              : "Most Repeated Values"}
          </h2>
          {generateReportData()}
        </div>
        <div className="mt-4 mb-4">
          {typeReport === "mostRepeated" && (
            <div className="mt-4 w-full sm:w-auto">
              <Pie data={chartData} ref={chartRef} options={chartOptions} />
            </div>
          )}
        </div>
        <div className="flex justify-center mb-4">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2 mr-2"
            onClick={handlePrint}
          >
            Print Reports
          </button>
        </div>
      </div>
      <Link
        to="/filereader" // Ajusta la ruta según tu aplicación
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
      >
        Back
      </Link>
    </div>
  );
}

export default ChartPage;
