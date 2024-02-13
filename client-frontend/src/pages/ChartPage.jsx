import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Chart from "chart.js/auto";

function ChartPage() {
  const location = useLocation();
  const { selectedColumns, data } = location.state || {};
  const [chartData, setChartData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedColumns || !data) {
      navigate("/");
    }
  }, [selectedColumns, data, navigate]);

  useEffect(() => {
    if (selectedColumns && data) {
      // Lógica para generar los datos del gráfico
      const newData = selectedColumns.map((column) => ({
        label: column,
        value: Math.floor(Math.random() * 100), // Simulando datos aleatorios
      }));
      setChartData(newData);
    }
  }, [selectedColumns, data]);

  useEffect(() => {
    if (chartData.length > 0) {
      // Lógica para crear y actualizar el gráfico
      const ctx = document.getElementById("myChart").getContext("2d");

      new Chart(ctx, {
        type: "bar",
        data: {
          labels: chartData.map((data) => data.label),
          datasets: [
            {
              label: "Data",
              data: chartData.map((data) => data.value),
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              borderColor: "rgba(255, 99, 132, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  }, [chartData]);

  return (
    <div>
      <h1>Gráficos</h1>
      <Link
        to="/filereader"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Back
      </Link>
      <canvas id="myChart" width="400" height="400"></canvas>
    </div>
  );
}

export default ChartPage;
