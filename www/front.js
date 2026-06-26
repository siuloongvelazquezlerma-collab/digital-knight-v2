let currentTab = 'inicio';
let carouselIndex = 0;
let carouselInterval;

document.addEventListener("DOMContentLoaded", () => {
  fetch("front.json")
    .then(res => res.json())
    .then(data => {
      renderAll(data);
      setupTabs(data);
    });
});

function renderAll(data) {
  renderSection(currentTab, data[currentTab]);
}

function setupTabs(data) {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelector(".tab.active").classList.remove("active");
      tab.classList.add("active");
      currentTab = tab.dataset.tab;
      carouselIndex = 0;
      clearInterval(carouselInterval);
      renderSection(currentTab, data[currentTab]);
    });
  });
}

function renderSection(tab, sectionData) {
  const content = document.getElementById("content");
  content.innerHTML = "";

  // Carrusel principal
  const item = sectionData.carousel[carouselIndex];
  const carousel = document.createElement("div");
  carousel.className = "carousel";
  carousel.style.backgroundImage = `url(${item.img})`;

  carousel.innerHTML = `
    <div class="overlay"></div>
    <div class="carousel-content">
      <img src="${item.titleImg}" alt="" class="title-img" />
      <div class="badge">${item.badge}</div>
      <div class="meta">${item.meta}</div>
      <div class="desc">${item.desc}</div>
    </div>
  `;

  content.appendChild(carousel);

  // Paginación
  if (sectionData.carousel.length > 1) {
    const dots = document.createElement("div");
    dots.className = "dots";
    sectionData.carousel.forEach((_, idx) => {
      dots.innerHTML += `<span class="${idx === carouselIndex ? 'active' : ''}"></span>`;
    });
    content.appendChild(dots);
  }

  // Subsecciones
  sectionData.subsections.forEach(sub => {
    const sec = document.createElement("div");
    sec.className = "subsection";
    sec.innerHTML = `<h2>${sub.title}</h2><div class="items"></div>`;
    sub.items.forEach(item => {
      sec.querySelector(".items").innerHTML += `<a href="${item.link}"><img src="${item.img}" alt="${item.alt}" /></a>`;
    });
    content.appendChild(sec);
  });

  // Autoplay
  if (sectionData.carousel.length > 1) {
    carouselInterval = setInterval(() => {
      carouselIndex = (carouselIndex + 1) % sectionData.carousel.length;
      renderSection(tab, sectionData);
    }, 7000);
  }
}
