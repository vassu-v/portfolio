function createContactTray() {
  const trayHTML = `
          <div class="contact-tray-container">
              <a href="tel: +917003803486" data-tooltip="Call: +91 7003 804 486">
                  <i class="fa-solid fa-phone"></i>
              </a>
              <a href="mailto:coderscode17@gmail.com" data-tooltip="Email: coderscode@gmail.com">
                  <i class="fa-solid fa-envelope"></i>
              </a>
              <!-- 
              <a href="https://x.com/yourprofile" target="_blank" data-tooltip="Twitter: @yourprofile">
                  <i class="fa-brands fa-x-twitter"></i>
              </a>
              <a href="https://instagram.com/yourprofile" target="_blank" data-tooltip="Instagram: @yourprofile">
                  <i class="fa-brands fa-instagram"></i>
              </a>
               -->
              <a href="http://wa.me/919830911135" target="_blank" data-tooltip="WhatsApp">
                  <i class="fa-brands fa-whatsapp"></i>
              </a>
              <a href="https://github.com/vassu-v" target="_blank" data-tooltip="GitHub">
                  <i class="fa-brands fa-github"></i>
              </a>
          </div>
      `;
  document.getElementById("contactTray").innerHTML = trayHTML;
}

// Run the function on page load
createContactTray();
function startTypingEffect(phrases, elementId) {
  const typingElement = $(`#${elementId}`);
  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let isHovered = false;

  

  function typeNextPhrase() {
    if (isHovered) return; // Pause when hovered

    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      typingElement.text(currentPhrase.substring(0, charIndex));
      charIndex--;
      if (charIndex < 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
    } else {
      typingElement.text(currentPhrase.substring(0, charIndex + 1));
      charIndex++;
      if (charIndex === currentPhrase.length) {
        isDeleting = true;
      }
    }

    setTimeout(typeNextPhrase, isDeleting ? 70 : 300); // Adjust speed
  }

  // Pause on hover, show all phrases
  typingElement.hover(
    function () {
      isHovered = true;
      const allText = phrases.join(" • ");
      $(this).text(allText); // You can use .html(phrases.join("<br>")) if you want line-by-line
    },
    function () {
      isHovered = false;
      charIndex = 0; // Optional: reset typing effect
      typeNextPhrase();
    }
  );

  typeNextPhrase();
}


// Example usage
$(document).ready(function () {
  startTypingEffect(
    ["Vibe coding  ", "Designing  ", "Python ", "Web Development  ", "AI Stitching", "Arduino & Electronics  ", "Writing  ", "C/C++", "AI  "],
    "Skills"
  );
  startTypingEffect(
    ["Music  ", "Travelling  ", "Writing  ", "Problem Solving  ", "Chai  ", "Mathematics  ", "Talking & Memes  ", "Shayari  "],
    "Interest"
  );
});

// Birthdate
const birthDate = new Date("2009-09-02");

// Current date
const currentDate = new Date();

// Calculate age in years
let age = currentDate.getFullYear() - birthDate.getFullYear();
if (
  currentDate.getMonth() < birthDate.getMonth() ||
  (currentDate.getMonth() === birthDate.getMonth() &&
    currentDate.getDate() < birthDate.getDate())
) {
  age--; // Adjust if birthday hasn't occurred yet this year
}

// Output the age
console.log(`Currently I am ${age} years old.`);

const ageOutput = document.getElementById("ageOutput");
if (ageOutput) ageOutput.textContent = age;

const words = [
  "Code",
  "Algorithm",
  "Prototype",
  "Automation",
  "Kolkata",
  "Random",
  "Effect",
  "Text",
  "Animation",
  "Young",
  "Arduino",
];

const colors = ["red", "purple", "white", "blue", "magenta"];

const fonts = [
  "Arial",
  "Courier New",
  "Georgia",
  "Impact",
  "Poppins",
  "Bebas Neue",
  "Oswald",
  "Rubik",
  "Playfair Display",
  "Exo",
  "Nunito",
  "Lobster",
  "Caveat",
];

let rowHeight = 50;
const image = document.getElementById("personImage");
const hoverText = document.getElementById("hoverText");
const rightSection = document.getElementById("rightSection");
const fullscreenSection = document.getElementById("fullscreenSection");

function getRandomWords() {
  return Array.from({ length: 25 }, () => {
    const word = words[Math.floor(Math.random() * words.length)];
    const font = fonts[Math.floor(Math.random() * fonts.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return `<span class="word" style="font-family: ${font}; color: ${color};">${word}</span>`;
  }).join(" ");
}

function createRow(index) {
  const row = document.createElement("div");
  row.classList.add("row");
  row.style.top = `${index * rowHeight}px`;

  const direction = index % 2 === 0 ? 1 : -1;
  const textContainer = document.createElement("div");
  textContainer.classList.add("text");
  textContainer.innerHTML = getRandomWords() + " " + getRandomWords();

  row.appendChild(textContainer);
  document.getElementById("container").appendChild(row);

  let position = direction === 1 ? -textContainer.scrollWidth / 2 : 0;

  function animate() {
    position += direction * 2.5;
    if (direction === 1 && position > 0) {
      position = -textContainer.scrollWidth / 2;
    } else if (direction === -1 && position < -textContainer.scrollWidth / 2) {
      position = 0;
    }
    textContainer.style.transform = `translateX(${position}px)`;
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

function setupRows() {
  document.getElementById("container").innerHTML = "";
  let numRows = Math.floor(window.innerHeight / rowHeight) + 1;
  for (let i = 0; i < numRows; i++) {
    createRow(i);
  }
}

setupRows();
window.addEventListener("resize", setupRows);

function sectionInView(element, threshold = 0.6) {
  const rect = element.getBoundingClientRect();
  return rect.top < window.innerHeight * threshold && rect.bottom > 0;
}

window.addEventListener("scroll", function () {
  if (sectionInView(rightSection, 0.6)) {
    image.classList.add("shrink-left");
    image.classList.remove("hidden");
    hoverText.style.top = `${rightSection.getBoundingClientRect().top + 100}px`;
    hoverText.style.left = "53%";
  } else if (sectionInView(fullscreenSection, 0.5)) {
    image.classList.add("hidden");
  } else {
    image.classList.remove("shrink-left", "hidden");
    hoverText.style.top = "45vh";
    hoverText.style.left = "50%";
  }
});
