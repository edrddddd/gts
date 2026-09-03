document.addEventListener("DOMContentLoaded", () => {
  const dataDestacados = [
      {
      imagen: "media/cursos/2026/c29.png",
      fecha: "8, 10, 15 y 17 de Septiembre de 2026",
      titulo: "Metagenómica desde cero: análisis de 16S / 18S / ITS",
      link: "https://api.whatsapp.com/send/?phone=5215643236165&text&type=phone_number&app_absent=0",
      destacado: null
    },
         {
      imagen: "media/cursos/2026/c31.png",
      fecha: "22, 24 y 29 de Septiembre, y 1 de Octubre de 2026",
      titulo: "Bioestadística en R para datos biológicos y ómicos",
      link: "https://api.whatsapp.com/send/?phone=5215643236165&text&type=phone_number&app_absent=0",
      destacado: true
    },
          {
      imagen: "media/cursos/2026/c30.png",
      fecha: "16, 18, 23, 25 y 30 de Septiembre de 2026",
      titulo: "Análisis bioinformático del epigenoma desde cero",
      link: "https://api.whatsapp.com/send/?phone=5215643236165&text&type=phone_number&app_absent=0",
      destacado: null
    },

  ];

  const contenedor = document.getElementById("contenedorTarjetas");

  dataDestacados.forEach(item => {
    const div = document.createElement("div");
    div.className = `tarjeta-overview${item.destacado ? " tarjeta-grande" : ""}`;
    div.style.backgroundImage = `url('${item.imagen}')`;
    div.innerHTML = `
      <div class="overlay">
        <p class="fecha">${item.fecha}</p>
        <h3>${item.titulo}</h3>
        <a href="${item.link}" class="boton-leer">Inscribirse</a>
      </div>
    `;
    contenedor.appendChild(div);
  });
});


// mierda para calendario de dates con putoovando
flatpickr("#fecha", {
  dateFormat: "Y-m-d",
  minDate: "today",
  maxDate: new Date().fp_incr(60),
  disable: [
    function(date) {
      const dia = date.getDay();
      return ![0,1,2,3,4,5,6].includes(dia); 

    }
  ],
  locale: {
    firstDayOfWeek: 1,
    weekdays: {
      shorthand: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      longhand:  ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
    },
    months: {
      shorthand: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
      longhand:  ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    }
  }
});

// Mostrar disponibilidad y activar botón Siguiente
document.getElementById('btnDisponibilidad').addEventListener('click', () => {
  const fecha = document.getElementById('fecha').value;
  const hora = document.getElementById('hora').value;

  if (fecha && hora) {

    const fechaLocal = new Date(fecha + "T00:00:00");

    document.getElementById('fechaSeleccionada').textContent =
      fechaLocal.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

    document.getElementById('horaSeleccionada').textContent = hora;

    document.getElementById('btnSiguiente').disabled = false;
  }
});


document.getElementById('btnSiguiente').addEventListener('click', () => {
  const fecha = document.getElementById('fechaSeleccionada').textContent;
  const hora = document.getElementById('horaSeleccionada').textContent;

  const mensaje = `Hola, quiero agendar una asesoría para ${fecha} a las ${hora}.`;
  const whatsappURL = `https://wa.me/5215643236165?text=${encodeURIComponent(mensaje)}`;

  window.open(whatsappURL, '_blank');
});

document.addEventListener('DOMContentLoaded', function() {
  // Solo en celular alvvvvvvvvv
  if (window.innerWidth > 600) return;
  const container = document.getElementById('contenedorTarjetas');
  const dotsContainer = document.getElementById('overviewDots');
  if (!container || !dotsContainer) return;

  // Espera a que las tarjetas estén cargadas 
  setTimeout(() => {
    const cards = container.querySelectorAll('.tarjeta-overview, .tarjeta-grande');
    if (cards.length < 2) return;

    // Crea los puntos de navegación
    dotsContainer.innerHTML = '';
    cards.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'overview-dot' + (i === 0 ? ' active' : '');
      dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll('.overview-dot');

    // Actualiza el puntito activo al hacer scroll
    container.addEventListener('scroll', () => {
      let closest = 0;
      let minDiff = Infinity;
      cards.forEach((card, i) => {
        const diff = Math.abs(card.getBoundingClientRect().left - container.getBoundingClientRect().left);
        if (diff < minDiff) {
          minDiff = diff;
          closest = i;
        }
      });
      dots.forEach(dot => dot.classList.remove('active'));
      dots[closest].classList.add('active');
    });
  }, 500); // Ajusta el timeout si tus tarjetas tardan más en cargarse
});
  

