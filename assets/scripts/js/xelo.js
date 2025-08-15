(function () {
  const data = [
    {
      title: "Climbed Trikuta Mountain at age 9",
      img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
    },
    {
      title: "Started coding at age 10",
      img: "./assets/images/young.png",
    },
    {
      title: "Won a silver medal at a national-level competition",
      img: "./assets/images/cont.jpeg",
    },
    {
      title: "Reached over 8,000+ views on YouTube in 2021",
      img: "./assets/images/yt.jpeg",
    },
    {
      title: "Started a blog in 2020",
      img: "./assets/images/blog.jpeg",
    },
    {
      title: "Started learning mechatronics at 13",
      img: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a",
    },
    {
      title: "Participated in a science exhibition as a one-person team and gave a presentation",
      img: "https://images.unsplash.com/photo-1631323272731-b765ddfb59d1",
    },
    {
      title: "Received goodies from Google Cloud by participating and winning in a program at 14",
      img: "./assets/images/google.jpeg",
    },
    {
      title: "Wrote a book at 15",
      img: "./assets/images/amzn.jpeg",
    },
    {
      title: "Started investing in the stock market at age 13",
      img: "./assets/images/images (1).jpg",
    },
    {
      title: "Made a Soldering Station",
      img: "./assets/images/solder.jpeg",
    },
  ];

  const sizes = ["small", "medium", "large"];

  const style = document.createElement("style");
  style.textContent = `
      .explore-gallery-wrapper {
        font-family: sans-serif;
        color: #fff;
      }
  
      .explore-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 10px;
      }
  
      .explore-item {
        background: #1a1a1a;
        overflow: hidden;
        border-radius: 10px;
        position: relative;
        cursor: pointer;
        display: flex;
        flex-direction: column;
      }
  
      .explore-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
        border-radius: 10px 10px 0 0;
      }
  
      .explore-item:hover img {
        transform: scale(1.05);
      }
  
      .explore-small { height: 120px; }
      .explore-medium { height: 180px; }
      .explore-large { height: 220px; }
  
      .explore-title {
        padding: 8px;
        font-size: 14px;
        text-align: center;
        background: #222;
        border-radius: 0 0 10px 10px;
      }
  
      .explore-modal {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
  
      .explore-modal-content {
        background: #1e1e1e;
        padding: 20px;
        border-radius: 12px;
        max-width: 90%;
        max-height: 90%;
        text-align: center;
      }
  
      .explore-modal-content img {
        max-width: 100%;
        max-height: 70vh;
        border-radius: 8px;
      }
  
      .explore-modal-title {
        color: #fff;
        text-align: center;
        margin-top: 10px;
        font-size: 16px;
        font-family: "Roboto Mono", monospace;
      }
  
      .explore-close {
        position: absolute;
        top: 20px;
        right: 30px;
        font-size: 28px;
        color: white;
        cursor: pointer;
      }
    `;
  document.head.appendChild(style);

  const wrapper = document.querySelector(".explore-gallery-wrapper");
  const grid = document.createElement("div");
  grid.className = "explore-grid";
  wrapper.appendChild(grid);

  const modal = document.createElement("div");
  modal.className = "explore-modal";
  modal.innerHTML = `
      <div class="explore-close">&times;</div>
      <div class="explore-modal-content">
        <img id="exploreModalImg" src="" />
        <div class="explore-modal-title" id="exploreModalTitle"></div>
      </div>
    `;
  document.body.appendChild(modal);

  const modalImg = modal.querySelector("#exploreModalImg");
  const modalTitle = modal.querySelector("#exploreModalTitle");
  const closeBtn = modal.querySelector(".explore-close");

  closeBtn.addEventListener("click", () => (modal.style.display = "none"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  data.forEach((post) => {
    const card = document.createElement("div");
    card.className = `explore-item explore-${
      sizes[Math.floor(Math.random() * sizes.length)]
    }`;
    card.innerHTML = `
        <img src="${post.img}?auto=format&fit=crop&w=800&q=80" alt="${post.title}" />
        
      `;
    card.addEventListener("click", () => {
      modalImg.src = post.img + "?auto=format&fit=crop&w=1080&q=90";
      modalTitle.textContent = post.title;
      modal.style.display = "flex";
    });
    grid.appendChild(card);
  });
})();

//now for project gallery

(function () {
  const projectData = [
    {
      title: "Age Calculator",
      img: "./assets/projects/age calc/Capture6.PNG",
      link: "./assets/projects/age calc/index.html",
      description: "This age calculator is a simple yet precise tool that computes a user’s exact age from their birthdate — down to the number of years, months, and days. It provides a quick and accurate way to determine age for everything from birthday tracking to formal documentation. The user inputs their birthdate, and the tool instantly returns a detailed breakdown of their age, emphasizing clarity and ease of use. Beyond personal curiosity, this tool can be creatively adapted for age-restricted platforms, generating countdowns to milestones, or even embedded into online forms or educational apps where age validation is required. Its effectiveness is measured through calculation accuracy, clean UI, and responsiveness across devices.",
      skills: ["HTML", "CSS", "Vanilla JavaScript"]
    },
    {
      title: "Landing Page",
      img: "./assets/projects/landing-page/Capturefrerf.PNG",
      link: "./assets/projects/landing-page/index.html",
      description: "This project is a dynamic landing page designed for web browsers. It features a personalized greeting that changes based on the user's local time, four fully customizable quick-access buttons for favorite sites or tools, and a playful bubble-popping game for casual engagement. Designed to blend functionality with a touch of fun, the page acts as a daily home base for users looking to streamline access to common links while enjoying a bit of light interaction. Beyond a traditional start page, it can be creatively adapted into a kids' educational portal, a personal productivity dashboard, or even a calming anti-stress page with interactive elements. Its value lies in its user-friendly interface, personalization, and subtle entertainment factor.",
      skills: ["HTML", "CSS", "JavaScript"]
    },
    {
      title: "Password Generator",
      img: "./assets/projects/password-generator/pg.PNG",
      link: "./assets/projects/password-generator/index.html",
      description: "This password generator is a lightweight web tool that allows users to create secure, customizable passwords. It offers options to include uppercase and lowercase letters, numbers, and special characters, and lets users define the desired length for maximum flexibility. Fully client-side, it ensures user privacy and promotes stronger password habits. While primarily designed for password generation, it can also be repurposed creatively to generate secure PINs, temporary access codes, or randomized OTPs for apps and websites. Its success is measured by ease of use, correctness of output, and cross-device responsiveness, making it a practical and adaptable solution.",
      skills: ["HTML", "CSS", "JavaScript"]
    },
    {
      title: "Szam Logo Design",
      img: "./assets/projects/szam/Szam-logo.png",
      link: "./assets/projects/szam/Szam-logo.png",
      description: "A custom logo designed for SZAM, a hypothetical tech company offering solutions in electronics, mechatronics, and software development, including programming in Python and other technologies. The design reflects a fusion of hardware and software elements, aiming to visually represent innovation, integration, and modern engineering. It balances a sleek, tech-forward aesthetic with versatile usability across digital and print platforms, making it ideal for branding in multidisciplinary tech environments.",
      skills: ["Illustrator", "Branding"]
    },
    {
      title: "Very Old Product Catalouge",
      img: "./assets/projects/Old-catalouge/se.PNG",
      link: "./assets/projects/Old-catalouge/Website/index.html",
      description: "An early HTML-based product catalogue featuring item titles, descriptions, prices, and a basic search function. Though simple by today’s standards, it was a relevant and practical project at the time, demonstrating core concepts like structured content, user interaction, and filtering. It served as a foundational step in understanding how digital storefronts and product listings work, laying the groundwork for more dynamic applications later on.",
      skills: ["HTML", "CSS", "JavaScript"]
    },
    {
      title: "Chem X: Reaction Sim",
      img: "./assets/projects/chemx/image.png",
      link: "https://github.com/vassu-v/ChemX_001/",
      description: "ChemX is a basic chemistry (reactions) simulator built using Arduino, aimed at making abstract chemical concepts a bit more hands-on. It uses simple components like LEDs, buttons, and sensors to mimic chemical reactions and behaviors in a fun, interactive way. This project started as a DIY experiment to explore how physical systems could represent molecular interactions, especially for students or anyone curious about chemistry. While it’s still in the early stages, it opens up possibilities for turning textbook theory into something you can actually play with. It could be expanded into a cool classroom demo, a science fair project, or even a base for more complex STEM kits down the line.",
      skills: ["Vanilla HTML", "Simulation", "Arduino & Electronics", "C/C++"]
    },
    {
      title: "Info Card",
      img: "./assets/projects/srya-bscard/Img Blank.png",
      link: "./assets/projects/srya-bscard/index.html",
      description: "This dynamic info card is a fun project built with HTML, CSS, and JavaScript that updates key personal details in real-time, like the user's age, class, and skills. The age automatically adjusts based on the birthdate input, making it an interactive and user-friendly display. The card shows personal details like the name, class, languages known and hobbies, making it a great way to introduce someone in a tech-savvy, modern way. It’s perfect for personal portfolios or digital business cards and could be expanded to include more dynamic data like social media handles, project updates, or a mini resume.",
      skills: ["HTML", "CSS"]
    },
    {
      title: "This Portfolio",
      img: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
      link: "#",
      description: "The portfolio you're looking at right now.",
      skills: ["HTML", "CSS", "Vanilla JavaScript"]
    },
    {
      title: "Masterpiece",
      img: "./assets/images/dra.jpeg",
      link: "./assets/images/dra.jpeg",
      description: "A touching masterpiece showing Lord Jagannath with his devoted follower, who is moved to tears upon meeting him. The scene captures the pure emotion of devotion, with the devotee’s tears symbolizing the depth of love and reverence for the divine presence of Lord Jagannath.",
      skills: ["Art", "Watercolour"]
    }
  ];


  const wrapper = document.querySelector(".insta-explore-wrapper");
  if (!wrapper) return;

  const grid = document.createElement("div");
  grid.className = "insta-explore-grid";
  wrapper.appendChild(grid);

  const modal = document.createElement("div");
  modal.className = "insta-modal";
  modal.innerHTML = `
    <div class="insta-modal-content">
      <span class="insta-close">&times;</span>
      <div class="insta-modal-img"><img src="" alt="Project Image" /></div>
      <div class="insta-modal-info">
        <h2></h2>
        <p class="insta-description"></p>
        <div class="insta-skills"></div>
        <a href="#" target="_blank" class="insta-btn">Preview</a>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const modalImg = modal.querySelector(".insta-modal-img img");
  const modalTitle = modal.querySelector("h2");
  const modalDesc = modal.querySelector(".insta-description");
  const modalSkills = modal.querySelector(".insta-skills");
  const modalLink = modal.querySelector(".insta-btn");
  const modalClose = modal.querySelector(".insta-close");

  modalClose.onclick = () => {
    modal.style.display = "none";
  };

  const colorPalette = ["#A6D8A3", "#C4E0C1", "#A7D8A1", "#A0C7A4", "#A4D3B1", "#FFB3A6", "#7FBFFF", "#F4C074", "#F29AC1", "#66C28E"];


  projectData.forEach((project) => {
    const card = document.createElement("div");
    card.className = "insta-card";
    const randomHeight = Math.floor(Math.random() * (300 - 180) + 180);

    card.innerHTML = `
      <img src="${project.img}" alt="${project.title}" style="height:${randomHeight}px;" />
      <div class="insta-title">${project.title}</div>
    `;

    card.onclick = () => {
      modalImg.src = project.img;
      modalTitle.textContent = project.title;
      modalDesc.textContent = project.description;
      modalLink.href = project.link;

      modalSkills.innerHTML = project.skills.map(skill => {
        const bgColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        return `<span style="background-color: ${bgColor};">${skill}</span>`;
      }).join("");

      modal.style.display = "flex";
    };

    grid.appendChild(card);
  });
})();

