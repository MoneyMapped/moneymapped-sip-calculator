const form = document.getElementById('sip-form');
const investedDisplay = document.getElementById('invested');
const returnsDisplay = document.getElementById('returns');
const totalDisplay = document.getElementById('total');
const ctx = document.getElementById('sipChart').getContext('2d');
const themeToggle = document.getElementById('theme-toggle');
let sipChart;

function formatINR(num) {
  return '₹' + Math.round(num).toLocaleString('en-IN');
}

function calculateAndRenderChart() {
  const monthlyInvestment = parseFloat(document.getElementById('monthlyInvestment').value);
  const annualReturn = parseFloat(document.getElementById('annualReturn').value) / 100;
  const years = parseFloat(document.getElementById('years').value);

  if (isNaN(monthlyInvestment) || isNaN(annualReturn) || isNaN(years)) return;

  const months = years * 12;
  const monthlyRate = annualReturn / 12;

  let investedAmount = monthlyInvestment * months;
  let futureValue = 0;

  for (let i = 1; i <= months; i++) {
    futureValue = (futureValue + monthlyInvestment) * (1 + monthlyRate);
  }

  const estimatedReturns = futureValue - investedAmount;

  investedDisplay.textContent = `Invested Amount: ${formatINR(investedAmount)}`;
  returnsDisplay.textContent = `Estimated Returns: ${formatINR(estimatedReturns)}`;
  totalDisplay.textContent = `Total Value: ${formatINR(futureValue)}`;

  const labels = [];
  const investedData = [];
  const totalData = [];
  let totalSoFar = 0;

  for (let year = 1; year <= years; year++) {
    let investedSoFar = monthlyInvestment * 12 * year;
    totalSoFar = 0;
    for (let i = 1; i <= year * 12; i++) {
      totalSoFar = (totalSoFar + monthlyInvestment) * (1 + monthlyRate);
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

// Form submit handler
form.addEventListener('submit', function (e) {
  e.preventDefault();
  calculateAndRenderChart();
});

// Dark mode toggle
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  themeToggle.textContent = document.body.classList.contains('dark-mode')
    ? '☀️ Light Mode'
    : '🌙 Dark Mode';
  calculateAndRenderChart(); // Re-render chart with new theme colors
});
