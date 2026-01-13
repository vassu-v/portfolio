window.addEventListener("load", function () {
  const loader = document.getElementById("loading-screen");

  // Fade out effect
  loader.style.opacity = "0";

  setTimeout(() => {
    loader.style.display = "none";
  }, 500); // Smooth removal
});

console.log("It took me 3 Days(actually 15hrs) to make this, hope you like it")

console.log("This was last updated on 13/4/2025")

// Orientation check removed as per new direction


const tip = document.getElementById("tipMessage");

const hideTip = () => {
  if (tip) {
    tip.style.opacity = "0";
    setTimeout(() => tip.style.display = "none", 500); // Optional: fully remove it
  }

  // Remove event listeners after first interaction
  document.removeEventListener("click", hideTip);
  document.removeEventListener("keydown", hideTip);
  document.removeEventListener("scroll", hideTip);
  document.removeEventListener("touchstart", hideTip);
};

// Listen for any interaction
document.addEventListener("click", hideTip);
document.addEventListener("keydown", hideTip);
document.addEventListener("scroll", hideTip);
document.addEventListener("touchstart", hideTip);

