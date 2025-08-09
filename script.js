const sipForm = document.getElementById('sip-form');
const swpForm = document.getElementById('swp-form');
const investedDisplay = document.getElementById('invested');
const returnsDisplay = document.getElementById('returns');
const totalDisplay = document.getElementById('total');
const ctx = document.getElementById('sipChart').getContext('2d');
const chartContainer = document.querySelector('.chart-container');
const themeToggle = document.getElementById('theme-toggle');
const sipTab = document.getElementById('sipTab');
const swpTab = document.getElementById('swpTab');
const title = document.getElementById('title');

let sipChart;
let autoUpdateEnabledSIP = false;
let autoUpdateEnabledSWP = false;

function formatINR(num) {
  if (isNaN(num) || num === null) return '₹0';
  return '₹' + Math.round(num).toLocaleString('en-IN');
}

/* ---------------------- SIP calculation ---------------------- */
function calculateSIP() {
  const P = parseFloat(document.getElementById('monthlyInvestment').value);
  const r = parseFloat(document.getElementById('annualReturn').value) / 100;
  const years = parseFloat(document.getElementById('years').value);
  const stepUp = parseFloat(document.getElementById('stepUp').value || 0) / 100;

  if (isNaN(P) || isNaN(r) || isNaN(years)) return;

  const n = Math.round(years * 12);
  const i = r / 12;
  let investedAmount = 0;
  let futureValue = 0;

  if (stepUp === 0) {
    // Closed form (Groww style) when no step-up
    investedAmount = P * n;
    if (i === 0) {
      futureValue = P * n;
    } else {
      futureValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    }
  } else {
    // Monthly loop when step-up present
    let currentP = P;
    for (let month = 1; month <= n; month++) {
      futureValue = (futureValue + currentP) * (1 + i);
      investedAmount += currentP;
      if (month % 12 === 0) currentP *= (1 + stepUp);
    }
  }

  const estimatedReturns = futureValue - investedAmount;
  updateResults(investedAmount, estimatedReturns, futureValue);

  // Ensure chart visible for SIP
  if (chartContainer) chartContainer.style.display = 'block';
  renderChartSIP(years, P, r, stepUp);
}

/* ---------------------- Corrected SWP calculation (monthly compounding + withdrawals) ---------------------- */
function calculateSWP() {
  const initialInvestment = parseFloat(document.getElementById('initialInvestment').value);
  const annualReturn = parseFloat(document.getElementById('swpAnnualReturn').value) / 100;
  const withdrawal = parseFloat(document.getElementById('withdrawalAmount').value);
  const years = parseFloat(document.getElementById('swpYears').value);

  if (isNaN(initialInvestment) || isNaN(annualReturn) || isNaN(withdrawal) || isNaN(years)) return;

  const months = Math.round(years * 12);
  const monthlyRate = annualReturn / 12;

  let balance = initialInvestment;
  let totalWithdrawn = 0;

  for (let i = 1; i <= months; i++) {
    // earn interest
    balance = balance * (1 + monthlyRate);

    // withdraw up to requested amount but not more than balance
    const actualWithdrawal = Math.min(withdrawal, balance);
    balance -= actualWithdrawal;
    totalWithdrawn += actualWithdrawal;

    // if exhausted, stop
    if (balance <= 0) {
      balance = 0;
      break;
    }
  }

  // For SWP UI: show Invested, Total Withdrawal, Final Value
  investedDisplay.textContent = `Invested Amount: ${formatINR(initialInvestment)}`;
  returnsDisplay.textContent = `Total Withdrawal: ${formatINR(totalWithdrawn)}`;
  totalDisplay.textContent = `Final Value: ${formatINR(balance)}`;

  // hide chart for SWP
  if (chartContainer) {
    chartContainer.style.display = 'none';
    if (sipChart) {
      sipChart.destroy();
      sipChart = null;
    }
  }
}

/* ---------------------- Update result text (shared UI) ---------------------- */
function updateResults(invested, returns, total) {
  investedDisplay.textContent = `Invested Amount: ${formatINR(invested)}`;
  returnsDisplay.textContent = `Estimated Returns: ${formatINR(returns)}`;
  totalDisplay.textContent = `Total Value: ${formatINR(total)}`;
}

/* ---------------------- SIP chart renderer (year-by-year) ---------------------- */
function renderChartSIP(years, P, r, stepUp) {
  const labels = [];
  const investedData = [];
  const totalData = [];

  let currentSIP = P;
  let cumulativeInvested = 0;
  let cumulativeValue = 0;
  const monthlyRate = r / 12;

  for (let y = 1; y <= years; y++) {
    for (let m = 1; m <= 12; m++) {
      cumulativeValue = (cumulativeValue + currentSIP) * (1 + monthlyRate);
      cumulativeInvested += currentSIP;
    }
    labels.push(y);
    investedData.push(Math.round(cumulativeInvested));
    totalData.push(Math.round(cumulativeValue));
    currentSIP *= (1 + stepUp);
  }

  if (sipChart) sipChart.destroy();

  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#ffffff' : '#000000';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  sipChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Invested Amount', data: investedData, borderColor: '#ff4d4d', fill: false, tension: 0.3 },
        { label: 'Total Value', data: totalData, borderColor: '#4caf50', fill: false, tension: 0.3 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: textColor } } },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor }, title: { display: true, text: 'Years', color: textColor } },
        y: { ticks: { color: textColor }, grid: { color: gridColor }, title: { display: true, text: 'Amount (₹)', color: textColor } }
      }
    }
  });
}

/* ---------------------- Event wiring ---------------------- */

// SIP Form submit and auto-update after first submit
sipForm.addEventListener('submit', e => {
  e.preventDefault();
  calculateSIP();
  autoUpdateEnabledSIP = true;
});
document.querySelectorAll('#monthlyInvestment, #annualReturn, #years, #stepUp')
  .forEach(input => input.addEventListener('input', () => {
    if (autoUpdateEnabledSIP) calculateSIP();
  }));

// SWP Form submit and auto-update after first submit
swpForm.addEventListener('submit', e => {
  e.preventDefault();
  calculateSWP();
  autoUpdateEnabledSWP = true;
});
document.querySelectorAll('#initialInvestment, #swpAnnualReturn, #withdrawalAmount, #swpYears')
  .forEach(input => input.addEventListener('input', () => {
    if (autoUpdateEnabledSWP) calculateSWP();
  }));

// Tabs behavior (keeps UI styling inline like before)
sipTab.addEventListener('click', () => {
  sipForm.style.display = 'block';
  swpForm.style.display = 'none';
  if (chartContainer) chartContainer.style.display = 'block';
  sipTab.style.backgroundColor = '#2e7d32';
  sipTab.style.color = '#fff';
  swpTab.style.backgroundColor = '#ccc';
  swpTab.style.color = '#333';
  title.textContent = 'SIP Calculator';
});

swpTab.addEventListener('click', () => {
  sipForm.style.display = 'none';
  swpForm.style.display = 'block';
  if (chartContainer) chartContainer.style.display = 'none';
  swpTab.style.backgroundColor = '#2e7d32';
  swpTab.style.color = '#fff';
  sipTab.style.backgroundColor = '#ccc';
  sipTab.style.color = '#333';
  title.textContent = 'SWP Calculator';
});

/* ---------------------- Dark mode toggle + persistence ---------------------- */
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');

  if (autoUpdateEnabledSIP) calculateSIP();
  if (autoUpdateEnabledSWP) calculateSWP();
});

document.addEventListener('DOMContentLoaded', () => {
  const darkModeSetting = localStorage.getItem('darkMode');
  if (darkModeSetting === 'enabled') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️ Light Mode';
  }

  // On load, keep chart visible only if SIP tab is visible
  if (swpForm.style.display === 'block' && chartContainer) {
    chartContainer.style.display = 'none';
  }
});
