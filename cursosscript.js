const CURSOS = [
  {
  id: 'c1', estado: 'finalizado',
  titulo: 'Análisis de Enriquecimiento Funcional desde Cero',
  fecha: '07, 08, 14 y 15 de Marzo 2026',
  horario: '9:00 AM – 12:00 PM (hora CDMX)',
  duracion: '4 sesiones de 3 horas (12 hrs total)',
  modalidad: 'En línea · Zoom',
  incluye: 'Constancia digital, grabaciones, material descargable y prácticas con datos reales',
  instructor: 'José A. Ovando-Ricardez',
  descripcion: 'Aprende el flujo completo del análisis de enriquecimiento funcional: desde la preparación de listas de genes hasta la interpretación biológica y clínica utilizando R, GO, KEGG y Reactome.',
  temario: [
    'Fundamentos de R aplicados al análisis funcional',
    'Preparación y manejo de listas de genes',
    'Enriquecimiento funcional basado en ontologías y vías (GO, KEGG, Reactome)',
    'Enriquecimiento basado en rankings (GSEA)',
    'Redes de interacción proteína-proteína',
    'Redes de interacción miRNA-Gen'
  ],
  precios: [
    { perfil: 'Licenciatura', precio: '$808 MXN / ~$45 USD' },
    { perfil: 'Posgrado', precio: '$935 MXN / ~$52 USD' },
    { perfil: 'Público general', precio: '$1,189 MXN / ~$65 USD' }
  ],
  img: 'media/cursos/2026/Analisis de enriquecimiento funcional desde cero.jpg'
},
  {
    id: 'c2', estado: 'finalizado',
    titulo: 'RNA-seq desde cero',
    fecha: 'Julio 2025 · Finalizado',
    duracion: '4 sesiones de 2 horas',
    precio: '$999 MXN',
    descripcion: 'Análisis bioinformático del transcriptoma desde datos crudos hasta genes diferencialmente expresados.',
    img: 'media/cursos/cursos 1/rnaseq.jpg'
  },
  {
    id: 'c3', estado: 'finalizado',
    titulo: 'Bioinformática Biomédica',
    fecha: 'Junio 2025 · Finalizado',
    duracion: '4 sesiones de 2 horas',
    precio: '$999 MXN',
    descripcion: 'Aplicación de herramientas bioinformáticas al análisis de datos clínicos y biológicos.',
    img: 'media/cursos/cursos 1/Bioinformática para Ciencias Biológicas y Médicas.png'
  },
  {
    id: 'c4', estado: 'finalizado',
    titulo: 'Minicurso Transcriptómica',
    fecha: '25 de Junio 2025 · Finalizado',
    duracion: '1 sesión intensiva',
    precio: '$399 MXN',
    descripcion: 'Introducción rápida al análisis transcriptómico con herramientas modernas.',
    img: 'media/cursos/cursos 1/minicurso-transcriptomica.jpg'
  },
  {
    id: 'c5', estado: 'finalizado',
    titulo: '¿Cómo empezar en la bioinformática?',
    fecha: '28 de Mayo 2025 · Finalizado',
    duracion: '1 sesión de 2 horas',
    precio: 'Gratuito',
    descripcion: 'Sesión introductoria para quienes quieren iniciar en el mundo de la bioinformática.',
    img: 'media/cursos/cursos 1/como iniciar en la bioinfo.jpg'
  },
  {
    id: 'c6', estado: 'finalizado',
    titulo: 'Estadística con R',
    fecha: 'Mayo 2025 · Finalizado',
    duracion: '4 sesiones de 2 horas',
    precio: '$999 MXN',
    descripcion: 'Estadística aplicada a ciencias biológicas y médicas usando R.',
    img: 'media/cursos/cursos 1/Estadística para ciencias biológicas y médicas con R.jpg'
  },
  {
    id: 'c7', estado: 'finalizado',
    titulo: 'Python desde cero',
    fecha: '02 de Agosto 2025 · Finalizado',
    duracion: '4 sesiones de 2 horas',
    precio: '$999 MXN',
    descripcion: 'Programación en Python orientada al análisis de datos biológicos.',
    img: 'media/cursos/cursos 1/Python desde cero.jpg'
  },
  {
    id: 'c8', estado: 'finalizado',
    titulo: 'Escuela de Verano 2025',
    fecha: '21–25 de Julio 2025 · Finalizado',
    duracion: '5 días intensivos',
    precio: '$2,500 MXN',
    descripcion: 'Semana intensiva de bioinformática con múltiples temas cubiertos.',
    img: 'media/cursos/cursos 1/Escuela de verano.jpg'
  },
  {
    id: 'c9', estado: 'finalizado',
    titulo: 'Metagenómica desde cero',
    fecha: '16-17 de Agosto 2025 · Finalizado',
    duracion: '2 sesiones de 2 horas',
    precio: '$799 MXN',
    descripcion: 'Análisis del microbioma mediante secuenciación masiva y herramientas bioinformáticas.',
    img: 'media/cursos/cursos 1/METAGENOMICA.jpg'
  },
  {
    id: 'c10', estado: 'finalizado',
    titulo: 'Minicurso: Metagenómica',
    fecha: '13 de Agosto 2025 · Finalizado',
    duracion: '1 sesión de 2 horas',
    precio: '$399 MXN',
    descripcion: 'Introducción rápida al análisis metagenómico.',
    img: 'media/cursos/cursos 1/metagenomica_intro.jpg'
  },
  {
    id: 'c11', estado: 'finalizado',
    titulo: 'Análisis bioinformático del epigenoma desde cero',
    fecha: '16, 18, 23, 25 y 30 de Septiembre 2025 · Finalizado',
    duracion: '5 sesiones de 2 horas',
    precio: '$1,199 MXN',
    descripcion: 'Análisis de datos de metilación, ATAC-seq y ChIP-seq aplicado al epigenoma.',
    img: 'media/cursos/cursos 1/epigenoma.jpg'
  },
  {
    id: 'c12', estado: 'finalizado',
    titulo: 'Introducción a R y análisis funcional de vías biológicas',
    fecha: '6 y 7 de Septiembre 2025 · Finalizado',
    duracion: '2 sesiones de 2 horas',
    precio: '$799 MXN',
    descripcion: 'Uso de R para análisis estadístico y enriquecimiento funcional de vías biológicas.',
    img: 'media/cursos/cursos 1/curso-r-funcional.jpg'
  },
  {
    id: 'c13', estado: 'finalizado',
    titulo: 'scRNA-seq desde cero: análisis bioinformático de célula única',
    fecha: '01, 02, 08 y 09 de Noviembre 2025 · Finalizado',
    duracion: '4 sesiones de 2 horas',
    precio: '$999 MXN',
    descripcion: 'Análisis bioinformático de datos de secuenciación de ARN de célula única.',
    img: 'media/cursos/cursos 1/scrna-sec.jpg'
  },
  {
    id: 'c14', estado: 'finalizado',
    titulo: 'RNA-seq desde cero: análisis bioinformático del transcriptoma',
    fecha: '04, 05, 11 y 12 de Octubre 2025 · Finalizado',
    duracion: '4 sesiones de 2 horas',
    precio: '$999 MXN',
    descripcion: 'Análisis completo del transcriptoma desde datos crudos hasta interpretación biológica.',
    img: 'media/cursos/cursos 1/rnaseq2.jpg'
  },
  {
    id: 'c15', estado: 'finalizado',
    titulo: 'Inteligencia Artificial en Datos Biológicos con Python desde Cero',
    fecha: '06, 07, 13 y 14 de Diciembre 2025 · Finalizado',
    duracion: '4 sesiones de 2 horas',
    precio: '$999 MXN',
    descripcion: 'Aplicación de machine learning e inteligencia artificial al análisis de datos biológicos usando Python.',
    img: 'media/cursos/cursos 1/inteligencia artificial en datos biologicos con python desde cero.jpg'
  },
  {
    id: 'c16', estado: 'finalizado',
    titulo: 'Metagenómica desde cero (Análisis del Microbioma)',
    fecha: '10, 11, 17 y 18 de Enero 2026 · Finalizado',
    duracion: '4 sesiones de 2 horas',
    precio: '$999 MXN',
    descripcion: 'Análisis del microbioma mediante herramientas bioinformáticas modernas.',
    img: 'media/cursos/2026/Metagenómica desde cero (Análisis del Microbioma).jpg'
  },
  {
    id: 'c17', estado: 'finalizado',
    titulo: 'RNA-seq desde cero (Análisis del Transcriptoma)',
    fecha: '20, 22, 27 y 29 de Enero 2026 · Finalizado',
    duracion: '4 sesiones de 2 horas',
    precio: '$999 MXN',
    descripcion: 'Análisis del transcriptoma desde datos crudos hasta resultados publicables.',
    img: 'media/cursos/2026/RNA-seq desde cero (Análisis del Transcriptoma).jpg'
  },
  {
    id: 'c18', estado: 'finalizado',
    titulo: 'Análisis bioinformático de variantes genéticas desde cero',
    fecha: '07, 08, 14 y 15 de Febrero 2026 · Finalizado',
    duracion: '4 sesiones de 2 horas',
    precio: '$999 MXN',
    descripcion: 'Identificación y análisis de variantes genéticas (SNPs, indels) desde datos de secuenciación.',
    img: 'media/cursos/2026/Análisis bioinformático de variantes genéticas desde cero online.jpg'
  },
  {
    id: 'c19', estado: 'finalizado',
    titulo: 'Introducción a la programación en bioinformática: Linux, R y Python',
    fecha: '17, 19, 24 y 26 de Febrero 2026 · Finalizado',
    duracion: '4 sesiones de 2 horas',
    precio: '$999 MXN',
    descripcion: 'Fundamentos de programación para bioinformática usando los tres lenguajes más usados en el campo.',
    img: 'media/cursos/2026/Introducción a la programación en bioinformática Linux, R y Python!.jpg'
  }
];

function renderCursos() {
  const grid = document.getElementById('cursos-grid');
  const modales = document.getElementById('modales-container');
  grid.innerHTML = '';
  modales.innerHTML = '';

  CURSOS.forEach(c => {
    const esActivo = c.estado === 'activo';

    grid.innerHTML += `
      <div class="tarjeta-curso" data-estado="${c.estado}" id="card-${c.id}">
        <img class="tarjeta-img" src="${c.img}" alt="${c.titulo}" onerror="this.style.display='none'">
        <span class="badge badge-${c.estado}">${esActivo ? '● ACTIVO' : '✓ FINALIZADO'}</span>
        <div class="tarjeta-body">
          <div class="tarjeta-titulo">${c.titulo}</div>
          <div class="tarjeta-fecha"><i class="fas fa-calendar-alt"></i> ${c.fecha.split('·')[0].trim()}</div>
          <button class="btn-modal ${esActivo ? '' : 'finalizado'}" onclick="abrirModal('${c.id}')">
            <i class="fas fa-plus"></i> ${esActivo ? 'Más información' : 'Ver detalles'}
          </button>
        </div>
      </div>`;

    modales.innerHTML += `
      <div class="modal-overlay" id="modal-${c.id}" onclick="cerrarOverlay(event, '${c.id}')">
        <div class="modal-box">
          <button class="modal-close" onclick="cerrarModal('${c.id}')"><i class="fas fa-times"></i></button>
          <img class="modal-img" src="${c.img}" alt="${c.titulo}" onerror="this.style.display='none'">
          <span class="modal-badge ${c.estado}">${esActivo ? '● ACTIVO' : '✓ FINALIZADO'}</span>
          <div class="modal-titulo">${c.titulo}</div>
          <div class="modal-label">Descripción</div>
          <div class="modal-valor">${c.descripcion}</div>
          <div class="modal-grid">
            <div class="modal-grid-item"><label>Fechas</label><span>${c.fecha}</span></div>
            <div class="modal-grid-item"><label>Duración</label><span>${c.duracion}</span></div>
            <div class="modal-grid-item full"><label>Precio</label><span>${c.precio}</span></div>
          </div>
          ${esActivo
            ? `<button class="modal-cta" onclick="window.open('https://wa.me/TUNUMERO','_blank')"><i class="fab fa-whatsapp"></i> Inscribirme por WhatsApp</button>`
            : `<button class="modal-cta no-disponible"><i class="fas fa-lock"></i> Curso finalizado · No disponible</button>`
          }
        </div>
      </div>`;
  });
}

function filtrar(estado, btn) {
  document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('activo'));
  btn.classList.add('activo');
  document.querySelectorAll('.tarjeta-curso').forEach(card => {
    if (estado === 'todos' || card.dataset.estado === estado) {
      card.classList.remove('oculto');
    } else {
      card.classList.add('oculto');
    }
  });
}

function abrirModal(id) {
  document.getElementById('modal-' + id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function cerrarModal(id) {
  document.getElementById('modal-' + id).classList.remove('open');
  document.body.style.overflow = '';
}

function cerrarOverlay(e, id) {
  if (e.target === e.currentTarget) cerrarModal(id);
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
  }
});

renderCursos();