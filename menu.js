document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("menu-toggle");
  const navMenu = document.querySelector("nav ul");
  const links = document.querySelectorAll("nav ul li a");
  const header = document.getElementById('main-header');
  const logoImg = document.querySelector('#main-header .logo img');
  const contador = document.getElementById("contador");
  const fechaObjetivo = new Date("2025-06-01T00:00:00").getTime();

  // Menú móvil
  toggleBtn.addEventListener("click", () => {
    navMenu.classList.toggle("activo");
    toggleBtn.classList.toggle("abierto");
  });

  
  // Cierre del menú al hacer clic fuera
  document.addEventListener("click", (e) => {
    if (!e.target.closest("nav") && !e.target.closest("#menu-toggle")) {
      navMenu.classList.remove("activo");
      toggleBtn.classList.remove("abierto");
    }
  });

  // Scroll efecto en header
  const updateHeader = () => {
    if (window.scrollY > 50) {
      header.classList.remove('transparent');
      header.classList.add('solid');
      if (logoImg) logoImg.src = 'media/logos/load3.png';
    } else {
      header.classList.remove('solid');
      header.classList.add('transparent');
      if (logoImg) logoImg.src = 'media/logos/load2.png';
    }
  };

  window.addEventListener('scroll', updateHeader);
  window.addEventListener('load', updateHeader);

  // Contador
  //if (contador) {
 //   const intervalo = setInterval(() => {
  //    const ahora = new Date().getTime();
  //    const diferencia = fechaObjetivo - ahora;
//
  //    if (diferencia <= 0) {
  //      clearInterval(intervalo);
   //     contador.textContent = "¡Ya casi estamos listos!";
   //     return;
   //   }

   //   const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
   //   const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
   //   const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
   //   const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

    //  contador.textContent = `Faltan ${dias}d ${horas}h ${minutos}m ${segundos}s`;
   // }, 1000);
 // }

  // Enlaces activos
  const currentPath = window.location.pathname.split("/").pop();
  links.forEach(link => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    }
  });

  // Botones "acerca de"
  const botones = document.querySelectorAll('.acercadeboton');
  botones.forEach(boton => {
    boton.addEventListener('click', () => {
      botones.forEach(b => b.classList.remove('activo'));
      boton.classList.add('activo');
    });
  });
});

// Loader
window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target); // Para que no se repita
    }
  });
}, {
  threshold: 0.1
});

// Selecciona directamente las secciones por clase
const sections = document.querySelectorAll('.lavision, .lavision2, .marca-grafica');
sections.forEach(section => observer.observe(section));

//animaciones 
document.querySelector('.menu-item.has-submenu > a').addEventListener('click', function(e) {
  e.preventDefault(); // evita que el link navegue
});


(function(){
  const track = document.getElementById("servicesTrack");
  const dotsContainer = document.getElementById("servicesDots");
  if (!track || !dotsContainer) return;

  const cards = track.querySelectorAll(".service-box");
  cards.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.className = "dot" + (i===0 ? " active":"");
    dotsContainer.appendChild(dot);
  });
  const dots = dotsContainer.querySelectorAll(".dot");

  track.addEventListener("scroll", () => {
    const cardWidth = cards[0].offsetWidth + 16; // ancho + gap
    const index = Math.round(track.scrollLeft / cardWidth);
    dots.forEach((d,i)=> d.classList.toggle("active", i===index));
  });
})();