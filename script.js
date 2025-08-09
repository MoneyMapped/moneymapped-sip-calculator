// --- Existing selectors ---
const sipForm = document.getElementById('sip-form');
const swpForm = document.getElementById('swp-form');
const lumpSumForm = document.getElementById('lumpsum-form');
const goalForm = document.getElementById('goal-form');

const investedDisplay = document.getElementById('invested');
const returnsDisplay = document.getElementById('returns');
const totalDisplay = document.getElementById('total');
const ctx = document.getElementById('sipChart').getContext('2d');
const chartContainer = document.querySelector('.chart-container');
const themeToggle = document.getElementById('theme-toggle');

// Tabs
const sipTab = document.getElementById('sipTab');
const swpTab = document.getElementById('swpTab');
const lumpSumTab = document.getElementById('lumpSumTab');
const goalTab = document.getElementById('goalTab');
const title = document.getElementById('title');

let sipChart;
let autoUpdateEnabledSIP = false;
let autoUpdateEnabledSWP = false;
let autoUpdateEnabledLumpSum = false;
let autoUpdateEnabledGoal = false;

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
    investedAmount = P * n;
    if (i === 0) {
      futureValue = P * n;
    } else {
      futureValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    }
  } else {
    let currentP = P;
    for (let month = 1; month <= n; month++) {
      futureValue = (futureValue + currentP) * (1 + i);
      investedAmount += currentP;
      if (month % 12 === 0) currentP *= (1 + stepUp);
    }
  }

  const estimatedReturns = futureValue - investedAmount;
  updateResults(investedAmount, estimatedReturns, futureValue);

  if (chartContainer) chartContainer.style.display = 'block';
  renderChartSIP(years, P, r, stepUp);
}

/* ---------------------- SWP calculation ---------------------- */
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
    balance = balance * (1 + monthlyRate);
    const actualWithdrawal = Math.min(withdrawal, balance);
    balance -= actualWithdrawal;
    totalWithdrawn += actualWithdrawal;
    if (balance <= 0) {
      balance = 0;
      break;
    }
  }

  investedDisplay.textContent = `Invested Amount: ${formatINR(initialInvestment)}`;
  returnsDisplay.textContent = `Total Withdrawal: ${formatINR(totalWithdrawn)}`;
  totalDisplay.textContent = `Final Value: ${formatINR(balance)}`;

  if (chartContainer) {
    chartContainer.style.display = 'none';
    if (sipChart) sipChart.destroy();
  }
}

/* ---------------------- Lump Sum calculation ---------------------- */
function calculateLumpSum() {
  const amount = parseFloat(document.getElementById('lumpSumAmount').value);
  const annualReturn = parseFloat(document.getElementById('lumpSumAnnualReturn').value) / 100;
  const years = parseFloat(document.getElementById('lumpSumYears').value);

  if (isNaN(amount) || isNaN(annualReturn) || isNaN(years)) return;

  const futureValue = amount * Math.pow(1 + annualReturn, years);
  const estimatedReturns = futureValue - amount;

  updateResults(amount, estimatedReturns, futureValue);

  if (chartContainer) chartContainer.style.display = 'block';
  renderChartLumpSum(years, amount, annualReturn);
}

/* ---------------------- Goal calculation ---------------------- */
function calculateGoal() {
  const goalAmount = parseFloat(document.getElementById('goalAmount').value);
  const annualReturn = parseFloat(document.getElementById('goalAnnualReturn').value) / 100;
  const years = parseFloat(document.getElementById('goalYears').value);

  if (isNaN(goalAmount) || isNaN(annualReturn) || isNaN(years)) return;

  const monthlyRate = annualReturn / 12;
  const months = years * 12;

  const monthlyInvestment = (goalAmount * monthlyRate) / ((Math.pow(1 + monthlyRate, months) - 1) * (1 + monthlyRate));
  const investedAmount = monthlyInvestment * months;
  const estimatedReturns = goalAmount - investedAmount;

  investedDisplay.textContent = `Required Monthly Investment: ${formatINR(monthlyInvestment)}`;
  returnsDisplay.textContent = `Total Invested: ${formatINR(investedAmount)}`;
  totalDisplay.textContent = `Goal Amount: ${formatINR(goalAmount)}`;

  if (chartContainer) {
    chartContainer.style.display = 'none';
    if (sipChart) sipChart.destroy();
  }
}

/* ---------------------- Update result text ---------------------- */
function updateResults(invested, returns, total) {
  investedDisplay.textContent = `Invested Amount: ${formatINR(invested)}`;
  returnsDisplay.textContent = `Estimated Returns: ${formatINR(returns)}`;
  totalDisplay.textContent = `Total Value: ${formatINR(total)}`;
}

/* ---------------------- Charts ---------------------- */
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

  drawChart(labels, investedData, totalData);
}

function renderChartLumpSum(years, amount, r) {
  const labels = [];
  const investedData = [];
  const totalData = [];

  for (let y = 1; y <= years; y++) {
    labels.push(y);
    investedData.push(amount);
    totalData.push(Math.round(amount * Math.pow(1 + r, y)));
  }

  drawChart(labels, investedData, totalData);
}

function drawChart(labels, investedData, totalData) {
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
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { ticks: { color: textColor }, grid: { color: gridColor } }
      }
    }
  });
}

/* ---------------------- Event wiring ---------------------- */
sipForm.addEventListener('submit', e => {
  e.preventDefault();
  calculateSIP();
  autoUpdateEnabledSIP = true;
});
document.querySelectorAll('#monthlyInvestment, #annualReturn, #years, #stepUp')
  .forEach(input => input.addEventListener('input', () => {
    if (autoUpdateEnabledSIP) calculateSIP();
  }));

swpForm.addEventListener('submit', e => {
  e.preventDefault();
  calculateSWP();
  autoUpdateEnabledSWP = true;
});
document.querySelectorAll('#initialInvestment, #swpAnnualReturn, #withdrawalAmount, #swpYears')
  .forEach(input => input.addEventListener('input', () => {
    if (autoUpdateEnabledSWP) calculateSWP();
  }));

lumpSumForm.addEventListener('submit', e => {
  e.preventDefault();
  calculateLumpSum();
  autoUpdateEnabledLumpSum = true;
});
document.querySelectorAll('#lumpSumAmount, #lumpSumAnnualReturn, #lumpSumYears')
  .forEach(input => input.addEventListener('input', () => {
    if (autoUpdateEnabledLumpSum) calculateLumpSum();
  }));

goalForm.addEventListener('submit', e => {
  e.preventDefault();
  calculateGoal();
  autoUpdateEnabledGoal = true;
});
document.querySelectorAll('#goalAmount, #goalAnnualReturn, #goalYears')
  .forEach(input => input.addEventListener('input', () => {
    if (autoUpdateEnabledGoal) calculateGoal();
  }));

// Tabs
function setActiveTab(activeForm, activeTab, titleText) {
  [sipForm, swpForm, lumpSumForm, goalForm].forEach(f => f.style.display = 'none');
  activeForm.style.display = 'block';

  [sipTab, swpTab, lumpSumTab, goalTab].forEach(t => {
    t.style.backgroundColor = '#ccc';
    t.style.color = '#333';
  });
  activeTab.style.backgroundColor = '#2e7d32';
  activeTab.style.color = '#fff';

  title.textContent = titleText;
}

sipTab.addEventListener('click', () => setActiveTab(sipForm, sipTab, 'SIP Calculator'));
swpTab.addEventListener('click', () => setActiveTab(swpForm, swpTab, 'SWP Calculator'));
lumpSumTab.addEventListener('click', () => setActiveTab(lumpSumForm, lumpSumTab, 'Lump Sum Calculator'));
goalTab.addEventListener('click', () => setActiveTab(goalForm, goalTab, 'Goal Calculator'));

/* ---------------------- Dark mode toggle ---------------------- */
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');

  if (autoUpdateEnabledSIP) calculateSIP();
  if (autoUpdateEnabledSWP) calculateSWP();
  if (autoUpdateEnabledLumpSum) calculateLumpSum();
  if (autoUpdateEnabledGoal) calculateGoal();
});

document.addEventListener('DOMContentLoaded', () => {
  const darkModeSetting = localStorage.getItem('darkMode');
  if (darkModeSetting === 'enabled') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️ Light Mode';
  }
});
