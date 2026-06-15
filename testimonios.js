// === Contador animado ===
let contador = document.getElementById('contador');
let totalClientes = 721; // Número total de clientes satisfechos
let count = 0;
let intervalo = setInterval(() => {
  if (count < totalClientes) {
    count++;
    contador.textContent = count;
  } else {
    clearInterval(intervalo);
  }
}, 20);

// === Cargar testimonios desde JSON ===
const contenedor = document.getElementById('contenedor-testimonios');
let testimonios = [];
let index = 0;

fetch('testimonios.json')
  .then(response => response.json())
  .then(data => {
    testimonios = data;
    mostrarTestimonios();
    iniciarCarrusel();
  })
  .catch(error => console.error('Error cargando los testimonios:', error));

function mostrarTestimonios() {
  contenedor.innerHTML = testimonios.map(t => `
    <div class="testimonio">
      <p class="texto">"${t.opinion}"</p>
      <div class="cliente">
        <h4>${t.nombre}</h4>
        <span>${t.institucion}</span>
      </div>
    </div>
  `).join('');
}

function iniciarCarrusel() {
  const carruselInner = document.querySelector('.carrusel-inner');
  setInterval(() => {
    index = (index + 1) % testimonios.length;
    carruselInner.style.transform = `translateX(-${index * 100}%)`;
  }, 5000);
}