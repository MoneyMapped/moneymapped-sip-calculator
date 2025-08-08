const form = document.getElementById('sip-form');
const investedDisplay = document.getElementById('invested');
const returnsDisplay = document.getElementById('returns');
const totalDisplay = document.getElementById('total');
const ctx = document.getElementById('sipChart').getContext('2d');
const themeToggle = document.getElementById('theme-toggle');
let sipChart;
let autoUpdateEnabled = false;

function formatINR(num) {
  return '₹' + Math.round(num).toLocaleString('en-IN');
}

function calculateAndRenderChart() {
  const monthlyInvestment = parseFloat(document.getElementById('monthlyInvestment').value);
  const annualReturn = parseFloat(document.getElementById('annualReturn').value) / 100;
  const years = parseFloat(document.getElementById('years').value);
  const stepUpPercent = parseFloat(document.getElementById('stepUp')?.value) || 0;

  if (isNaN(monthlyInvestment) || isNaN(annualReturn) || isNaN(years)) return;

  const months = years * 12;
  const monthlyRate = annualReturn / 12;

  let investedAmount = 0;
  let futureValue = 0;
  let currentMonthlyInvestment = monthlyInvestment;

  for (let i = 1; i <= months; i++) {
    futureValue = (futureValue + currentMonthlyInvestment) * (1 + monthlyRate);
    investedAmount += currentMonthlyInvestment;

    if (i % 12 === 0) {
      currentMonthlyInvestment *= 1 + (stepUpPercent / 100);
    }
  }

  const estimatedReturns = futureValue - investedAmount;

  investedDisplay.textContent = `Invested Amount: ${formatINR(investedAmount)}`;
  returnsDisplay.textContent = `Estimated Returns: ${formatINR(estimatedReturns)}`;
  totalDisplay.textContent = `Total Value: ${formatINR(futureValue)}`;

  const labels = [];
  const investedData = [];
  const totalData = [];
  currentMonthlyInvestment = monthlyInvestment;

  for (let year = 1; year <= years; year++) {
    let investedSoFar = 0;
    let totalSoFar = 0;
    currentMonthlyInvestment = monthlyInvestment;

    for (let i = 1; i <= year * 12; i++) {
      totalSoFar = (totalSoFar + currentMonthlyInvestment) * (1 + monthlyRate);
      investedSoFar += currentMonthlyInvestment;
      if (i % 12 === 0) {
        currentMonthlyInvestment *= 1 + (stepUpPercent / 100);
      }
    }

    labels.push(year);
    investedData.push(investedSoFar);
    totalData.push(totalSoFar);
  }

  if (sipChart) sipChart.destroy();

  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#ffffff' : '#000000';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

  sipChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Invested Amount',
          data: investedData,
          borderColor: '#ff4d4d',
          fill: false,
          tension: 0.3
        },
        {
          label: 'Total Value',
          data: totalData,
          borderColor: '#4caf50',
          fill: false,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Years',
            color: textColor
          },
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor
          }
        },
        y: {
          title: {
            display: true,
            text: 'Amount (₹)',
            color: textColor
          },
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor
          }
        }
      }
    }
  });
}

// Submit button triggers calculation & enables auto update
form.addEventListener('submit', function (e) {
  e.preventDefault();
  calculateAndRenderChart();
  autoUpdateEnabled = true;
});

// Auto-calculate on input change after first submit
document.querySelectorAll('#monthlyInvestment, #annualReturn, #years, #stepUp').forEach(input => {
  input.addEventListener('input', () => {
    if (autoUpdateEnabled) {
      calculateAndRenderChart();
    }
  });
});

// Dark mode toggle with persistence
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains('dark-mode');
  themeToggle.textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
  localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
  calculateAndRenderChart(); // Re-render chart with new theme
});

// Load dark mode preference on page load
document.addEventListener('DOMContentLoaded', () => {
  const darkModeSetting = localStorage.getItem('darkMode');
  if (darkModeSetting === 'enabled') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️ Light Mode';
  } else {
    document.body.classList.remove('dark-mode');
    themeToggle.textContent = '🌙 Dark Mode';
  }
});
