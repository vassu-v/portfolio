let date = new Date();
let hours = date.getHours();

let greetings;
if (hours > 16)
greetings = "Good Evening";
else if (hours > 12)
greetings = "Good Afternoon";
else if (hours > 0)
greetings = "Good Morning";

let otp = document.getElementById("con")
otp.insertAdjacentText("afterbegin", greetings)

let bubbles = document.querySelectorAll("#circle")
bubbles.forEach((bubble, index) => {
    bubble.addEventListener("click", () => {
        bubbles[index].style.animationName = "none";
        requestAnimationFrame(() => {
            bubbles[index].style.animationName = "";
        })
    })
})
