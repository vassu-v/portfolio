function calculateAge() {
    const birthdateInput = document.getElementById("birthdate").value;
    const birthdate = new Date(birthdateInput);
    const currentDate = new Date();

    const ageInMilliseconds = currentDate - birthdate;
    const ageInSeconds = ageInMilliseconds / 1000;
    const ageInMinutes = ageInSeconds / 60;
    const ageInHours = ageInMinutes / 60;
    const ageInDays = ageInHours / 24;

    const years = Math.floor(ageInDays / 365);
    const months = Math.floor((ageInDays % 365) / 30);
    const days = Math.floor(ageInDays % 30);

    document.getElementById("age-years").textContent = `Years: ${years}`;
    document.getElementById("age-months").textContent = `Months: ${months}`;
    document.getElementById("age-days").textContent = `Days: ${days}`;

    const resultDiv = document.getElementById("result");
    resultDiv.style.display = "block";
}
