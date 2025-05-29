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

function checkOrientation() {
  const warning = document.getElementById("landscape-warning");
  if (window.innerWidth < window.innerHeight) {
    warning.style.display = "flex"; // Portrait
  } else {
    warning.style.display = "none"; // Landscape
  }
}

// Check on load and resize
window.addEventListener("load", checkOrientation);
window.addEventListener("resize", checkOrientation);
window.addEventListener("orientationchange", checkOrientation);


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

