function calculateSIP() {
  const monthlyInvestment = parseFloat(
    document.getElementById('monthly').value
  );
  const annualRate = parseFloat(document.getElementById('return').value);
  const years = parseFloat(document.getElementById('years').value);

  const months = years * 12;
  const monthlyRate = annualRate / 12 / 100;

  let futureValue =
    (monthlyInvestment *
      ((Math.pow(1 + monthlyRate, months) - 1) * (1 + monthlyRate))) /
    monthlyRate;

  document.getElementById('result').innerText = `Estimated Value: ₹${futureValue
    .toFixed(0)
    .toLocaleString('en-IN')}`;
}
