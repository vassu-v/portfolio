class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => this.resolve = resolve);
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = '';
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="scramble-char">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

async function loadSocials() {
  try {
    const response = await fetch('./assets/data/socials.json');
    const socials = await response.json();

    const trayContainer = document.getElementById("contactTray");
    const footerContainer = document.getElementById("footerLinks");

    if (trayContainer) {
      const trayHTML = `
        <div class="contact-tray-container">
          ${socials
          .filter(s => s.showInTray)
          .map(s => `
              <a href="${s.url}" target="_blank" data-tooltip="${s.platform}">
                <i class="${s.icon}"></i>
              </a>
            `).join('')}
        </div>
      `;
      trayContainer.innerHTML = trayHTML;
    }

    if (footerContainer) {
      footerContainer.innerHTML = socials
        .filter(s => s.showInFooter)
        .map(s => `
          <a href="${s.url}" target="_blank">${s.platform}</a>
        `).join('');
    }
  } catch (error) {
    console.error('Error loading socials:', error);
  }
}

// Run the function on page load
loadSocials();
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
    ["Systems Thinking", "Research & Experiment Design", "Collaboration", "Vibe coding", "Python", "Web Development", "Arduino & Electronics", "C/C++", "AI"],
    "Skills"
  );
  startTypingEffect(
    ["Neuroscience", "Electronics", "Problem Solving", "Music", "Travelling", "Writing", "Chai", "Mathematics",],
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
  "Research",
  "UI/UX",
  "Collaboration",
  "Vibe coding",
  "Designing",
  "AI",
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

const image = document.getElementById("personImage");
const hoverText = document.getElementById("hoverText");
const rightSection = document.getElementById("rightSection");
const techStack = document.getElementById("techStack");
const fullscreenSection = document.getElementById("fullscreenSection");
const contact = document.getElementById("contact");

function getRandomWords(isMobile) {
  const wordCount = isMobile ? 8 : 25; // Further reduce word count on mobile for low-end devices
  return Array.from({ length: wordCount }, () => {
    const word = words[Math.floor(Math.random() * words.length)];
    const font = fonts[Math.floor(Math.random() * fonts.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return `<span class="word" style="font-family: ${font}; color: ${color};">${word}</span>`;
  }).join("");
}

function createRow(index, rowHeight, isMobile) {
  const row = document.createElement("div");
  row.classList.add("row");
  row.style.top = `${index * rowHeight}px`;
  row.style.height = `${rowHeight}px`; // Explicit height for better rendering
  row.style.fontSize = isMobile ? "18px" : "24px"; // Slightly smaller on mobile

  const directionClass = index % 2 === 0 ? "ltr" : "rtl";
  row.classList.add(directionClass);

  const textContainer = document.createElement("div");
  textContainer.classList.add("text");

  // Randomize starting position
  const randomDelay = Math.random() * -30;
  textContainer.style.animationDelay = `${randomDelay}s`;

  // Create content once and double it for seamless loop
  const wordsContent = getRandomWords(isMobile);
  textContainer.innerHTML = wordsContent + wordsContent;

  row.appendChild(textContainer);
  document.getElementById("container").appendChild(row);
}

const isMobile = window.matchMedia("(max-width: 768px), (orientation: portrait)").matches;

function setupRows() {
  const isMobileNow = window.matchMedia("(max-width: 768px), (orientation: portrait)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.getElementById("container").innerHTML = "";

  // Ultimate optimization: skip background generation if user prefers reduced motion
  if (prefersReducedMotion) return;

  const rowHeight = isMobileNow ? 100 : 50;
  let numRows = Math.floor(window.innerHeight / rowHeight) + 1;
  for (let i = 0; i < numRows; i++) {
    createRow(i, rowHeight, isMobileNow);
  }
}

setupRows();

// Debounced resize to prevent lag on mobile scroll/layout shifts
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(setupRows, 250);
});

function sectionInView(element, threshold = 0.6) {
  const rect = element.getBoundingClientRect();
  return rect.top < window.innerHeight * threshold && rect.bottom > 0;
}

const backToTopButton = document.getElementById("backToTop");
const progressBar = document.getElementById("scroll-progress");

const mobileQuery = window.matchMedia("(max-width: 768px), (orientation: portrait)");
let isMobileCached = mobileQuery.matches;
mobileQuery.addEventListener("change", (e) => {
  isMobileCached = e.matches;
});

const state = {
  activeSection: null,
};

// Intersection Observer for section transitions (performance optimization)
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      state.activeSection = entry.target.id;
    } else if (state.activeSection === entry.target.id) {
      state.activeSection = null;
    }
  });

  // Update UI state based on active section
  const isContentInView = state.activeSection !== null;
  const isBelowHeroThreshold = window.scrollY > 50;

  if (isMobileCached) {
    if (isContentInView || isBelowHeroThreshold) {
      // Permanent hide on mobile once we enter ANY content section or scroll down
      image.classList.add("hidden");
      image.classList.remove("shrink-left");
      if (state.activeSection === 'rightSection') {
        const rect = rightSection.getBoundingClientRect();
        hoverText.style.top = `${rect.top + 140}px`;
      } else {
        hoverText.style.top = "45vh";
      }
    } else {
      // Hero Section (Top)
      image.classList.remove("shrink-left", "hidden");
      hoverText.style.top = "45vh";
      hoverText.style.left = "50%";
    }
  } else if (state.activeSection === 'rightSection') {
    // Desktop: Shrink Left behavior
    image.classList.add("shrink-left");
    image.classList.remove("hidden");
    const rect = rightSection.getBoundingClientRect();
    hoverText.style.top = `${rect.top + 140}px`;
    hoverText.style.left = "50%";
  } else if (state.activeSection === 'fullscreenSection') {
    // Desktop: Hide in Projects area
    image.classList.add("hidden");
    image.classList.remove("shrink-left");
    hoverText.style.top = "45vh";
  } else {
    // Hero Section (Top) - Desktop
    image.classList.remove("shrink-left", "hidden");
    hoverText.style.top = "45vh";
    hoverText.style.left = "50%";
  }
}, { threshold: [0.5, 0.6] });

if (rightSection) sectionObserver.observe(rightSection);
if (fullscreenSection) sectionObserver.observe(fullscreenSection);

let scrollTicking = false;
window.addEventListener("scroll", function () {
  if (!scrollTicking) {
    window.requestAnimationFrame(function () {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const scrollHeight = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
      ) - windowHeight;

      const scrollProgress = scrollHeight > 0 ? (scrollY / scrollHeight) * 100 : 0;

      if (progressBar) {
        progressBar.style.width = `${Math.min(100, Math.max(0, scrollProgress))}%`;
      }

      if (backToTopButton) {
        if (scrollY > 300) {
          backToTopButton.classList.add("show");
        } else {
          backToTopButton.classList.remove("show");
        }
      }

      // If About Me is in view, we still need to update position on scroll to keep it pinned
      if (state.activeSection === 'rightSection') {
        const rect = rightSection.getBoundingClientRect();
        hoverText.style.top = `${rect.top + 140}px`;
      }

      scrollTicking = false;
    });
    scrollTicking = true;
  }
});

if (backToTopButton) {
  backToTopButton.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

// Custom Cursor Tracking - Disabled on mobile for performance
const customCursor = document.getElementById("custom-cursor");
if (customCursor && !isMobile) {
  window.addEventListener("mousemove", (e) => {
    customCursor.style.left = `${e.clientX}px`;
    customCursor.style.top = `${e.clientY}px`;
  });
} else if (customCursor && isMobile) {
  customCursor.style.display = 'none';
}

// Load Tech Stack dynamically with cache busting
fetch('./assets/data/tech-stack.json?v=' + new Date().getTime())
  .then(response => response.json())
  .then(data => {
    const marqueeContent = document.getElementById('marqueeContent');
    if (marqueeContent) {
      // Create items for each tech
      const createItems = () => {
        return data.map(item => {
          // Handle both old (string) and new (object) formats to prevent "undefined" loop
          const name = typeof item === 'object' ? item.name : item;
          const icon = typeof item === 'object' ? item.icon : 'fa-solid fa-code';

          return `
            <div class="tech-item">
              <span class="tech-name">${name}</span>
              <i class="${icon} tech-logo"></i>
            </div>
          `;
        }).join('');
      };

      // Inject content multiple times for seamless loop
      marqueeContent.innerHTML = createItems() + createItems() + createItems() + createItems();

      // Trigger Scramble on "Tech Stack" header once when visible
      const techStackHeader = document.querySelector('#techStack h3');
      if (techStackHeader) {
        const fx = new TextScramble(techStackHeader);
        let hasScrambled = false;

        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !hasScrambled) {
              fx.setText("Tech Stack");
              hasScrambled = true;
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.5 });

        observer.observe(techStackHeader);
      }
    }
  })
  .catch(error => console.error('Error loading tech stack:', error));
