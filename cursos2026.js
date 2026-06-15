const PAGO_ESTANDAR = [
  { icono: 'fas fa-university', texto: 'Transferencia BBVA (México): 4152 3140 6397 1694 · José Antonio Ovando Ricardez' },
  { icono: 'fab fa-paypal', texto: 'Pago internacional: PayPal — paypal.me/joseaovandor' },
  { icono: 'fas fa-money-bill-wave', texto: 'Western Union: solicitar instrucciones por correo' }
];

const INSTRUCTOR_JOSE = {
  nombre: 'José A. Ovando-Ricardez',
  cv: 'https://sites.google.com/view/joseantonioovandoricardez'
};

const CURSOS = [
  {
  id: 'c22',
  estado: 'activo',
  titulo: 'Metagenómica avanzada con Illumina y Oxford Nanopore',
  img: 'media/cursos/2026/c22.png',
  descripcion: 'Aprenderás a analizar datos metagenómicos utilizando tecnologías modernas como Illumina y Oxford Nanopore, desde el procesamiento de archivos FASTQ hasta la interpretación biológica de microbiomas complejos. Trabajaremos con datos reales y herramientas bioinformáticas actuales utilizadas en investigación.',
  instructor: { ...INSTRUCTOR_JOSE, desc: 'Bioinformático, instructor y consultor especializado en análisis metagenómicos y datos ómicos.' },
  fechas: '20, 21, 27 y 28 de Junio 2026',
  horario: '9:00 AM – 12:00 PM (CDMX)',
  duracion: '12 horas · 4 sesiones de 3 hrs',
  modalidad: 'En línea · Zoom',
  incluye: 'Certificado digital (12 hrs), grabaciones, material descargable y ejercicios prácticos con datos reales.',
  temario: [
    'Introducción a metagenómica shotgun',
    'Tecnologías Illumina y Nanopore',
    'Control de calidad de lecturas',
    'Clasificación taxonómica microbiana: Kraken2 y Bracken',
    'Ensamblado metagenómico',
    'Introducción a MAGs y binning',
    'Interpretación funcional de microbiomas',
    'Visualización de resultados con R'
  ],
  precios: {
    columnas: ['Perfil', '🟢 1ª Preventa (22 may – 5 jun)', '🟡 2ª Preventa (6 – 15 jun)', '🔴 Últimos días (16 – 20 jun)'],
    filas: [
      ['Licenciatura*', '$699 MXN', '$799 MXN', '$949 MXN'],
      ['Posgrado*', '$799 MXN', '$899 MXN', '$1,099 MXN'],
      ['Público general', '$1,099 MXN', '$1,199 MXN', '$1,399 MXN']
    ]
  },
  pago: PAGO_ESTANDAR,
  listaInteres: null
},
    {
    id: 'c21',
    estado: 'finalizado',
    titulo: 'Minicurso virtual GRATUITO Transcriptómica espacial: La nueva frontera del RNA-seq',
    img: 'media/cursos/2026/c21.jpg',
    descripcion: 'En este minicurso conocerás qué es la transcriptómica espacial, por qué está revolucionando el análisis de RNA-seq y cómo permite estudiar la expresión génica directamente dentro del tejido.',
    instructor: { ...INSTRUCTOR_JOSE, desc: 'Bioinformático, instructor y consultor especializado en análisis funcional, transcriptómica, interpretación biológica de datos ómicos y desarrollo de flujos bioinformáticos reproducibles.' },
    fechas: 'Jueves 7 de mayo de 2026',
    horario: '6:00 – 7:00 PM (GMT-6)',
    duracion: '1 hora',
    modalidad: 'En línea',
    incluye: 'Constancia digital de participación',
    temario: null,
    precios: {
      columnas: ['⚠️ Cupo limitado'],
      filas: [
        [''],
        [''],
      ]
    },
    pago: null,
    listaInteres: 'https://forms.gle/FBamLACJhZdKKyKx5'
  },
    {
    id: 'c20',
    estado: 'activo',
    titulo: 'Metagenómica 16S paso a paso con datos reales, sin necesidad de experiencia previa.',
    img: 'media/cursos/2026/c20.jpg',
    descripcion: 'En este curso intensivo aprenderás el flujo completo de análisis de datos metagenómicos (16S), desde archivos crudos hasta la interpretación biológica de resultados.',
    instructor: { ...INSTRUCTOR_JOSE, desc: 'Bioinformático, instructor y consultor especializado en análisis funcional, transcriptómica, interpretación biológica de datos ómicos y desarrollo de flujos bioinformáticos reproducibles.' },
    fechas: '06, 07, 13 y 14 de junio 2026',
    horario: '9:00 AM – 12:00 PM (CDMX)',
    duracion: '12 horas totales',
    modalidad: 'En línea · Zoom',
    incluye: 'Constancia digital de participación, Sesiones grabadas, Materiales y scripts descargables, Ejercicios prácticos con datos reales.',
    temario: [
      'Metagenómica 16S desde cero ',
      'Archivos FASTQ y control de calidad con FastQC y MultiQC',
      'Procesamiento de secuencias (DADA2 / QIIME2)',
      'Clasificación taxonómica y ASVs',
      'Analisis de diversidad microbiana (alfa y beta)',
      'Visualización e interpretación (pyloseq, ggplot2)',
    ],
    precios: {
      columnas: ['🎓 Promoción especial para estudiantes de licenciatura activos Inscríbete con un compañero/a y ambos obtienen acceso al curso por el precio de una sola inscripción (válido en 1ª preventa).'],
      filas: [
        ['💡 No se requiere experiencia previa en programación'],
        ['⚠️ Cupo limitado'],
      ]
    },
    pago: null,
    listaInteres: 'https://forms.gle/FBamLACJhZdKKyKx5'
  },
    {
    id: 'c19',
    estado: 'finalizado',
    titulo: 'Análisis de datos de secuenciación Illumina y Oxford Nanopore desde cero',
    img: 'media/cursos/2026/c19.jpg',
    descripcion: '¿Quieres aprender a analizar datos de secuenciación desde cero? En este taller intensivo trabajarás con las dos tecnologías más utilizadas actualmente: Illumina (lecturas cortas) y Oxford Nanopore (lecturas largas), comprendiendo el flujo de análisis desde datos crudos hasta la interpretación de resultados.',
    instructor: { ...INSTRUCTOR_JOSE, desc: 'Bioinformático, instructor y consultor especializado en análisis funcional, transcriptómica, interpretación biológica de datos ómicos y desarrollo de flujos bioinformáticos reproducibles.' },
    fechas: '30 y 31 de mayo 2026',
    horario: '9:00 AM – 1:00 PM (CDMX)',
    duracion: '8 horas totales',
    modalidad: 'En línea · Zoom',
    incluye: 'Certificado digital de participación, Sesiones grabadas, Materiales y recursos descargables.',
    temario: [
      'Fundamentos de secuenciacíon de nueva generación',
      'Fundamentos de Linux',
      'Archivos de secuenciación y control de calidad: FASTQ, MultiQC/ NanoPlot',
      'Procesamiento de lecturas: filtrado y trimming con Trimmomatic y NanoFilt',
      'Alineamiento de lecturas: (STAR)',
      'Ensamblado y análisis de lecturas largas (Flye / Canu / Medaka)',
    ],
    precios: {
      columnas: ['💵 Inversión:'],
      filas: [
        ['🟢 $499 MXN / $25 USD (hasta el 12 de mayo)'],
        ['🔴 $699 MXN / $35 USD después'],
        ['No se requiere experiencia previa en programación']
      ]
    },
    pago: null,
    listaInteres: 'https://forms.gle/PNneQdUrzdunPebj9'
  },
{
    id: 'c18',
    estado: 'finalizado',
    titulo: 'Análisis de Enriquecimiento Funcional desde Cero',
    img: 'media/cursos/2026/Analisis de enriquecimiento funcional desde cero.jpg',
    descripcion: 'Aprende el flujo completo del análisis de enriquecimiento funcional: desde la preparación de listas de genes hasta la interpretación biológica y clínica utilizando R, GO, KEGG y Reactome.',
    instructor: { ...INSTRUCTOR_JOSE, desc: 'Bioinformático, instructor y consultor especializado en análisis funcional, transcriptómica, interpretación biológica de datos ómicos y desarrollo de flujos bioinformáticos reproducibles.' },
    fechas: '07, 08, 14 y 15 de Marzo 2026',
    horario: '9:00 AM – 12:00 PM (CDMX)',
    duracion: '12 horas · 4 sesiones de 3 hrs',
    modalidad: 'En línea · Zoom',
    incluye: 'Constancia digital, grabaciones, material descargable y prácticas con datos reales.',
    temario: [
      'Fundamentos de R aplicados al análisis funcional',
      'Preparación y manejo de listas de genes',
      'Enriquecimiento funcional basado en ontologías y vías (GO, KEGG, Reactome)',
      'Enriquecimiento basado en rankings (GSEA)',
      'Redes de interacción proteína-proteína',
      'Redes de interacción miRNA-Gen'
    ],
    precios: {
      columnas: ['Perfil', '✨ 15% OFF (hasta 27 feb)'],
      filas: [
        ['Licenciatura', '$808 MXN / ~$45 USD'],
        ['Posgrado', '$935 MXN / ~$52 USD'],
        ['Público general', '$1,189 MXN / ~$65 USD']
      ]
    },
    pago: PAGO_ESTANDAR,
    listaInteres: null
  },
  {
    id: 'c17',
    estado: 'finalizado',
    titulo: 'RNA-seq desde cero: análisis bioinformático del transcriptoma',
    img: 'media/cursos/cursos 1/rnaseq.jpg',
    descripcion: 'Aprende paso a paso cómo analizar datos reales de RNA-seq con herramientas modernas y accesibles.',
    instructor: { ...INSTRUCTOR_JOSE, desc: 'Especialista en transcriptómica y análisis ómico, con experiencia en docencia y proyectos reales en ciencias biomédicas y genómicas.' },
    fechas: '08, 10, 15 y 17 de Julio 2025',
    horario: '5:00 PM – 7:00 PM (CDMX)',
    duracion: '4 sesiones de 2 horas (8 hrs total)',
    modalidad: 'En línea · Google Meet',
    incluye: 'Grabaciones, materiales, ejercicios prácticos y constancia digital.',
    temario: [
      'Uso de Google Colab para ejecutar comandos Linux',
      'Procesamiento de datos con FastQC y STAR',
      'Análisis estadístico con DESeq2',
      'Visualización funcional con ClusterProfiler',
      'Manejo de datos en R y Bioconductor'
    ],
    precios: {
      columnas: ['Perfil', 'Precio (inscripción temprana)'],
      filas: [
        ['Licenciatura', '$799 MXN'],
        ['Posgrado', '$899 MXN'],
        ['Público general', '$1,199 MXN']
      ]
    },
    pago: null,
    listaInteres: null
  },
  {
    id: 'c16',
    estado: 'finalizado',
    titulo: 'Bioinformática para Ciencias Biológicas y Médicas',
    img: 'media/cursos/cursos 1/Bioinformática para Ciencias Biológicas y Médicas.png',
    descripcion: 'Curso práctico desde cero para dominar herramientas bioinformáticas aplicadas al análisis genómico.',
    instructor: { ...INSTRUCTOR_JOSE, desc: 'Especialista en transcriptómica y análisis ómico, con experiencia en docencia y proyectos reales en ciencias biomédicas y genómicas.' },
    fechas: '03, 05, 10 y 12 de Junio 2025',
    horario: '5:00 PM – 7:00 PM (CDMX)',
    duracion: '4 sesiones de 2 horas',
    modalidad: 'En línea · Zoom + Grabaciones',
    incluye: 'Certificado digital, materiales y acompañamiento.',
    temario: [
      'Fundamentos de análisis genómico y transcriptómico',
      'Uso de herramientas bioinformáticas accesibles',
      'Clases en vivo y grabaciones disponibles',
      'Materiales, ejercicios y certificado digital'
    ],
    precios: {
      columnas: ['Perfil', 'Preventa (hasta 29 mayo)'],
      filas: [
        ['Estudiantes', '$649 MXN'],
        ['Posgrado', '$749 MXN'],
        ['Público general', '$999 MXN']
      ]
    },
    pago: null,
    listaInteres: null
  },
  {
    id: 'c15',
    estado: 'finalizado',
    titulo: 'Minicurso: ¿Cómo analizar datos transcriptómicos desde cero?',
    img: 'media/cursos/cursos 1/minicurso-transcriptomica.jpg',
    descripcion: 'Evento introductorio gratuito para aprender a analizar datos transcriptómicos desde cero.',
    instructor: null,
    fechas: '25 de Junio 2025',
    horario: '6:00 – 7:00 PM (CDMX)',
    duracion: '1 hora',
    modalidad: 'En línea · Google Meet',
    incluye: 'Constancia digital de participación.',
    temario: [
      'Conceptos fundamentales de transcriptómica',
      'Análisis de expresión génica desde cero',
      'Uso de herramientas como Google Colab, R, Bioconductor',
      'Introducción a FastQC, DESeq2 y ClusterProfiler'
    ],
    precios: null,
    pago: null,
    listaInteres: 'https://forms.gle/15dWDTYhEdzngEi1A'
  },
  {
    id: 'c14',
    estado: 'finalizado',
    titulo: 'Minicurso gratuito: ¿Cómo empezar en la bioinformática?',
    img: 'media/cursos/cursos 1/como iniciar en la bioinfo.jpg',
    descripcion: 'Sesión introductoria gratuita para quienes quieren dar sus primeros pasos en el mundo de la bioinformática.',
    instructor: null,
    fechas: '28 de Mayo 2025',
    horario: '6:00 – 7:00 PM (CDMX)',
    duracion: '1 hora',
    modalidad: 'En línea · Google Meet',
    incluye: 'Constancia digital de participación.',
    temario: [
      'Fundamentos de la bioinformática',
      'Introducción a herramientas clave',
      'Primeros pasos para trabajar con datos biológicos',
      'Aplicaciones reales en ciencias biológicas y médicas'
    ],
    precios: null,
    pago: null,
    listaInteres: 'https://forms.gle/9ojib1joBAPit2wt6'
  },
  {
    id: 'c13',
    estado: 'finalizado',
    titulo: 'Estadística para Ciencias Biológicas y Médicas con R',
    img: 'media/cursos/cursos 1/Estadística para ciencias biológicas y médicas con R.jpg',
    descripcion: 'Curso teórico-práctico donde los participantes aprendieron a analizar datos biológicos reales usando R y RStudio.',
    instructor: { ...INSTRUCTOR_JOSE, desc: 'Especialista en análisis estadístico de datos biomédicos y biotecnológicos, con experiencia docente y en investigación aplicada.' },
    fechas: '06, 08, 13 y 15 de Mayo 2025',
    horario: '5:00 PM – 7:30 PM (CDMX)',
    duracion: '4 sesiones de 2.5 horas',
    modalidad: 'En línea · Google Meet',
    incluye: 'Grabaciones, materiales descargables, ejercicios y constancia digital.',
    temario: [
      'Fundamentos de estadística aplicados al contexto biológico',
      'Uso de R y RStudio para importar y analizar datos',
      'Visualización de datos con ggplot2',
      'Pruebas de hipótesis (t-test, ANOVA, chi-cuadrado)',
      'Interpretación y reporte de resultados estadísticos'
    ],
    precios: {
      columnas: ['Perfil', 'Precio'],
      filas: [
        ['Público general', '$899 MXN'],
        ['Estudiantes', '$800 MXN'],
        ['Estudiante con recomendación', '$701 MXN']
      ]
    },
    pago: null,
    listaInteres: null
  },
  {
    id: 'c12',
    estado: 'finalizado',
    titulo: 'Python desde cero para datos biológicos',
    img: 'media/cursos/cursos 1/Python desde cero.jpg',
    descripcion: '¿Nunca has programado? Aprende Python para aplicarlo en biología, bioinformática y biotecnología con clases en línea paso a paso.',
    instructor: {
      nombre: 'Anette Roxana Gastélum Quiróz',
      desc: 'Licenciada en Ciencias Biomédicas con experiencia en análisis computacional de datos ómicos y enseñanza en programación para ciencias biológicas.',
      cv: null
    },
    fechas: '02 de Agosto 2025',
    horario: '9:00 AM – 2:00 PM (CDMX)',
    duracion: '1 sesión de 5 horas',
    modalidad: 'En línea · Clases en vivo',
    incluye: 'Constancia digital, grabación, materiales y actividades prácticas.',
    temario: [
      'Fundamentos de programación (variables, condicionales, funciones)',
      'Análisis numérico con NumPy',
      'Manejo de datos biológicos con Pandas',
      'Visualización con Matplotlib y Seaborn',
      'Exploración de herramientas como Biopython'
    ],
    precios: {
      columnas: ['Perfil', '🟢 Preventa', '🟡 Regular', '🔴 Últimos días'],
      filas: [
        ['Licenciatura', '$399 / ~$20 USD', '$499 / ~$25 USD', '$599 / ~$30 USD'],
        ['Posgrado', '$449 / ~$23 USD', '$549 / ~$28 USD', '$649 / ~$33 USD'],
        ['Público general', '$599 / ~$30 USD', '$699 / ~$35 USD', '$799 / ~$40 USD']
      ]
    },
    pago: PAGO_ESTANDAR,
    listaInteres: null
  },
  {
    id: 'c11',
    estado: 'finalizado',
    titulo: 'Escuela de Verano en Bioinformática 2025',
    img: 'media/cursos/cursos 1/Escuela de verano.jpg',
    descripcion: 'Curso gratuito en línea de una semana con opción a Paquete Completo con certificado y beneficios exclusivos.',
    instructor: null,
    fechas: '21 – 25 de Julio 2025',
    horario: 'A definir por sesión',
    duracion: '5 días · 20 horas totales',
    modalidad: 'En línea · Zoom',
    incluye: 'Certificado oficial (20 hrs), ingreso prioritario por Zoom, grabaciones completas, chat exclusivo con mentores y descuentos en futuros cursos.',
    temario: [
      'Lunes 21: Introducción a la Bioinformática',
      'Martes 22: Fundamentos de Linux para Bioinformática',
      'Miércoles 23: R para análisis de datos biológicos',
      'Jueves 24: Análisis de Datos Ómicos (Día 1)',
      'Viernes 25: Proyecto Integrador de Bioinformática'
    ],
    precios: {
      columnas: ['Perfil', '🟢 Preventa (hasta 21 jul)'],
      filas: [
        ['Estudiantes', '$199 MXN'],
        ['Profesionales', '$249 MXN']
      ]
    },
    pago: PAGO_ESTANDAR,
    listaInteres: null
  },
  {
    id: 'c10',
    estado: 'finalizado',
    titulo: 'Metagenómica desde cero – análisis bioinformático del microbioma',
    img: 'media/cursos/cursos 1/METAGENOMICA.jpg',
    descripcion: 'Aprende paso a paso cómo analizar datos reales del microbioma con herramientas modernas y enfoque práctico.',
    instructor: { ...INSTRUCTOR_JOSE, desc: 'Bioinformático, formador y divulgador científico. Especialista en análisis de datos genómicos, transcriptómicos y metagenómicos.' },
    fechas: '16 y 17 de Agosto 2025',
    horario: '9:00 AM – 2:00 PM (CDMX)',
    duracion: '2 sesiones de 5 horas (10 hrs total)',
    modalidad: 'En línea · Zoom',
    incluye: 'Constancia digital, grabaciones completas, recursos descargables, actividades prácticas y proyecto integrador.',
    temario: [
      'Control de calidad con FastQC y MultiQC',
      'Ensamblaje con MEGAHIT',
      'Binning con MetaBAT2',
      'Anotación taxonómica con Kraken2',
      'Anotación funcional y análisis metabólico',
      'Visualización en R con ggplot2',
      'Proyecto integrador con retroalimentación guiada'
    ],
    precios: {
      columnas: ['Perfil', '🟢 1ª Preventa', '🟡 2ª Preventa', '🔴 Últimos días'],
      filas: [
        ['Licenciatura', '$699 / ~$37 USD', '$799 / ~$42 USD', '$949 / ~$50 USD'],
        ['Posgrado', '$799 / ~$42 USD', '$899 / ~$47 USD', '$1,099 / ~$58 USD'],
        ['Público general', '$1,099 / ~$58 USD', '$1,199 / ~$63 USD', '$1,399 / ~$74 USD']
      ]
    },
    pago: PAGO_ESTANDAR,
    listaInteres: null
  },
  {
    id: 'c9',
    estado: 'finalizado',
    titulo: 'Minicurso gratuito: ¿Cómo analizar datos metagenómicos?',
    img: 'media/cursos/cursos 1/metagenomica_intro.jpg',
    descripcion: 'Evento introductorio gratuito para aprender metagenómica paso a paso, incluso sin experiencia previa.',
    instructor: null,
    fechas: '13 de Agosto 2025',
    horario: '6:00 – 7:00 PM (GMT-6)',
    duracion: '1 hora',
    modalidad: 'En línea · Google Meet',
    incluye: 'Constancia digital de participación.',
    temario: [
      'Qué es la metagenómica y su importancia',
      'Herramientas clave: FastQC, MEGAHIT, MetaBAT2, Kraken2, R y ggplot2',
      'Primeros pasos para trabajar con datos reales',
      'Introducción a la bioinformática aplicada al microbioma'
    ],
    precios: null,
    pago: null,
    listaInteres: 'https://forms.gle/BAKyeB2XVt8Q9g3y6'
  },
  {
    id: 'c8',
    estado: 'finalizado',
    titulo: 'Análisis bioinformático del epigenoma desde cero',
    img: 'media/cursos/cursos 1/epigenoma.jpg',
    descripcion: 'Aprende de forma práctica a analizar ATAC-seq, ChIP-seq, CUT&RUN y metilación usando Linux y R.',
    instructor: [
      { ...INSTRUCTOR_JOSE, desc: 'Especialista en transcriptómica y análisis ómico, con experiencia en docencia y proyectos reales en ciencias biomédicas y genómicas.' },
      { nombre: 'Josué Guzmán-Lináres', desc: 'Bioinformático con experiencia en análisis de datos NGS: RNA-Seq, ChIP-Seq y ATAC-Seq.', cv: null }
    ],
    fechas: '16, 18, 23, 25 y 30 de Septiembre 2025',
    horario: '5:00 – 7:00 PM (CDMX)',
    duracion: '5 sesiones de 2 horas (10 hrs total)',
    modalidad: 'En línea · Zoom',
    incluye: 'Constancia, grabaciones, recursos y prácticas.',
    temario: [
      'Fundamentos de epigenómica',
      'Herramientas computacionales (Linux y R)',
      'Análisis de accesibilidad de la cromatina (ATAC-seq)',
      'Mapeo de interacciones proteína-ADN (ChIP-seq y CUT&RUN)',
      'Perfil global de metilación del ADN (microarreglos de metilación)'
    ],
    precios: {
      columnas: ['Perfil', '🟢 1ª Preventa', '🟡 2ª Preventa', '🔴 Últimos días'],
      filas: [
        ['Licenciatura', '$699 / ~$37 USD', '$799 / ~$42 USD', '$949 / ~$50 USD'],
        ['Posgrado', '$799 / ~$42 USD', '$899 / ~$47 USD', '$1,099 / ~$58 USD'],
        ['Público general', '$1,099 / ~$58 USD', '$1,199 / ~$63 USD', '$1,399 / ~$74 USD']
      ]
    },
    pago: PAGO_ESTANDAR,
    listaInteres: null
  },
  {
    id: 'c7',
    estado: 'finalizado',
    titulo: 'Introducción a R y análisis funcional de vías biológicas',
    img: 'media/cursos/cursos 1/curso-r-funcional.jpg',
    descripcion: 'Aprende desde cero a trabajar en R y aplicar análisis funcional sobre rutas biológicas con ejemplos reales.',
    instructor: { ...INSTRUCTOR_JOSE, desc: 'Bioinformático, formador y divulgador científico. Especialista en análisis genómicos, transcriptómicos y funcionales.' },
    fechas: '6 y 7 de Septiembre 2025',
    horario: '9:00 AM – 2:00 PM (CDMX)',
    duracion: '2 sesiones de 5 horas (10 hrs total)',
    modalidad: 'En línea · Zoom',
    incluye: 'Grabaciones, materiales en R, actividades prácticas, constancia y proyecto guiado con retroalimentación.',
    temario: [
      'Fundamentos de R para datos biológicos',
      'Importación y depuración de listas génicas',
      'Análisis funcional con GO, KEGG y Reactome',
      'GSEA (Gene Set Enrichment Analysis) paso a paso',
      'Visualización de resultados (dotplots, mapas, barplots)',
      'Introducción a redes funcionales (genes, proteínas y RNAs no codificantes)'
    ],
    precios: {
      columnas: ['Perfil', '🟡 2ª Preventa', '🔴 Últimos días'],
      filas: [
        ['Licenciatura', '$559 / ~$29 USD', '$669 / ~$35 USD'],
        ['Posgrado', '$629 / ~$33 USD', '$769 / ~$40 USD'],
        ['Público general', '$839 / ~$44 USD', '$979 / ~$51 USD']
      ]
    },
    pago: PAGO_ESTANDAR,
    listaInteres: null
  },
  {
    id: 'c6',
    estado: 'finalizado',
    titulo: 'scRNA-seq desde cero: análisis bioinformático de célula única',
    img: 'media/cursos/cursos 1/scrna-sec.jpg',
    descripcion: 'Análisis bioinformático de datos de secuenciación de ARN de célula única con enfoque teórico-práctico.',
    instructor: { ...INSTRUCTOR_JOSE, desc: 'Bioinformático e investigador con experiencia en transcriptómica y análisis multi-ómicos.' },
    fechas: '01, 02, 08 y 09 de Noviembre 2025',
    horario: '9:00 AM – 12:00 PM (CDMX)',
    duracion: '12 horas · 4 sesiones de 3 hrs',
    modalidad: 'En línea · Zoom',
    incluye: 'Constancia digital, grabaciones, recursos didácticos y prácticas.',
    temario: [
      'Fundamentos de RNA-seq y análisis transcriptómico',
      'Descarga y control de calidad de datos de secuenciación',
      'Alineamiento y cuantificación de genes',
      'Análisis de expresión diferencial en R',
      'Visualización de resultados (PCA, volcano, heatmap)',
      'Enriquecimiento funcional (GO, KEGG)'
    ],
    precios: {
      columnas: ['Perfil', '🟢 1ª Preventa', '🟡 2ª Preventa', '🔴 Últimos días'],
      filas: [
        ['Licenciatura', '$699 / ~$37 USD', '$799 / ~$42 USD', '$949 / ~$50 USD'],
        ['Posgrado', '$799 / ~$42 USD', '$899 / ~$47 USD', '$1,099 / ~$58 USD'],
        ['Público general', '$1,099 / ~$58 USD', '$1,199 / ~$63 USD', '$1,399 / ~$74 USD']
      ]
    },
    pago: PAGO_ESTANDAR,
    listaInteres: null
  },
  {
    id: 'c5',
    estado: 'finalizado',
    titulo: 'Inteligencia Artificial en Datos Biológicos con Python desde Cero',
    img: 'media/cursos/cursos 1/inteligencia artificial en datos biologicos con python desde cero.jpg',
    descripcion: 'Aprende a aplicar machine learning y data science a datos genómicos, transcriptómicos y experimentales, desde cero y con enfoque práctico.',
    instructor: { ...INSTRUCTOR_JOSE, desc: 'Bioinformático, formador y divulgador científico con experiencia en análisis de datos biológicos y modelado computacional.' },
    fechas: '06, 07, 13 y 14 de Diciembre 2025',
    horario: '9:00 AM – 12:00 PM (CDMX)',
    duracion: '12 horas · 4 sesiones de 3 hrs',
    modalidad: 'En línea · Zoom',
    incluye: 'Constancia digital, grabaciones, materiales descargables, notebooks prácticos y actividades aplicadas.',
    temario: [
      'Pandas y NumPy para procesamiento de datos biológicos',
      'Visualización con Seaborn y Plotly',
      'Modelado con Scikit-learn (Regresión, Árboles, Random Forest)',
      'Interpretación de modelos y selección de características'
    ],
    precios: {
      columnas: ['Perfil', '🟢 1ª Preventa', '🟡 2ª Preventa', '🔴 Últimos días'],
      filas: [
        ['Licenciatura', '$699 / ~$38 USD', '$799 / ~$43 USD', '$949 / ~$51 USD'],
        ['Posgrado', '$799 / ~$43 USD', '$899 / ~$48 USD', '$1,099 / ~$59 USD'],
        ['Público general', '$1,099 / ~$59 USD', '$1,199 / ~$64 USD', '$1,399 / ~$75 USD']
      ]
    },
    pago: PAGO_ESTANDAR,
    listaInteres: null
  },
  {
    id: 'c4',
    estado: 'finalizado',
    titulo: 'Metagenómica desde cero (Análisis del Microbioma) – Enero 2026',
    img: 'media/cursos/2026/Metagenómica desde cero (Análisis del Microbioma).jpg',
    descripcion: 'Análisis del microbioma mediante herramientas bioinformáticas modernas con enfoque práctico.',
    instructor: { ...INSTRUCTOR_JOSE, desc: 'Bioinformático, instructor y consultor especializado en análisis de datos ómicos.' },
    fechas: '10, 11, 17 y 18 de Enero 2026',
    horario: 'A confirmar',
    duracion: '4 sesiones',
    modalidad: 'En línea · Zoom',
    incluye: 'Constancia digital, grabaciones y materiales.',
    temario: [
      'Análisis del microbioma mediante secuenciación masiva',
      'Herramientas bioinformáticas modernas para metagenómica',
      'Control de calidad y procesamiento de datos',
      'Análisis taxonómico y funcional'
    ],
    precios: null,
    pago: null,
    listaInteres: null
  },
  {
    id: 'c3',
    estado: 'finalizado',
    titulo: 'RNA-seq desde cero (Análisis del Transcriptoma) – Enero 2026',
    img: 'media/cursos/2026/RNA-seq desde cero (Análisis del Transcriptoma).jpg',
    descripcion: 'Aprende paso a paso todo el flujo de trabajo de RNA-seq con R, Linux y Google Colab: desde control de calidad hasta expresión diferencial y enriquecimiento funcional.',
    instructor: { ...INSTRUCTOR_JOSE, desc: 'Bioinformático, instructor y consultor especializado en análisis de expresión génica, pipelines de NGS, transcriptómica y análisis estadístico aplicado a datos ómicos.' },
    fechas: '20, 22, 27 y 29 de Enero 2026',
    horario: '5:00 PM – 8:00 PM (CDMX)',
    duracion: '12 horas · 4 sesiones de 3 hrs',
    modalidad: 'En línea · Zoom',
    incluye: 'Constancia digital, grabaciones, materiales, notebooks y prácticas con datos reales.',
    temario: [
      'Fundamentos de RNA-seq',
      'Control de calidad (FastQC, MultiQC)',
      'Alineamiento y cuantificación',
      'Análisis de expresión diferencial (R, DESeq2)',
      'Visualizaciones: PCA, heatmap, volcano plot',
      'Enriquecimiento funcional (GO, KEGG)'
    ],
    precios: {
      columnas: ['Perfil', '🔥 40% OFF (primeros 10)', '✨ 25% OFF', '🎓 Precio normal'],
      filas: [
        ['Licenciatura', '$419 / ~$21 USD', '$524 / ~$26 USD', '$949 / ~$47 USD'],
        ['Posgrado', '$479 / ~$24 USD', '$599 / ~$30 USD', '$1,099 / ~$55 USD'],
        ['Público general', '$659 / ~$33 USD', '$824 / ~$41 USD', '$1,399 / ~$70 USD']
      ]
    },
    pago: null,
    listaInteres: null
  },
  {
    id: 'c2',
    estado: 'finalizado',
    titulo: 'Análisis bioinformático de variantes genéticas desde cero',
    img: 'media/cursos/2026/Análisis bioinformático de variantes genéticas desde cero online.jpg',
    descripcion: 'Flujo completo de análisis de variantes genéticas con Linux y R: desde alineamiento al genoma de referencia hasta anotación funcional e interpretación biológica y clínica de SNPs e indels.',
    instructor: { ...INSTRUCTOR_JOSE, desc: 'Bioinformático e instructor especializado en análisis de variantes, pipelines de NGS, genómica aplicada e interpretación funcional de datos ómicos.' },
    fechas: '8, 9, 14 y 15 de Febrero 2026',
    horario: '9:00 AM – 12:00 PM (CDMX)',
    duracion: '12 horas · 4 sesiones de 3 hrs',
    modalidad: 'En línea · Zoom',
    incluye: 'Constancia digital, grabaciones, material descargable y prácticas con datos reales.',
    temario: [
      'Fundamentos del análisis de variantes genéticas',
      'Alineamiento al genoma de referencia',
      'Llamado de variantes (SNPs e indels)',
      'Control de calidad y filtrado de variantes',
      'Análisis exploratorio y estructuración de datos genéticos',
      'Anotación funcional e interpretación biológica y clínica'
    ],
    precios: {
      columnas: ['Perfil', 'Precio'],
      filas: [
        ['Licenciatura*', '$949 MXN / $53 USD'],
        ['Posgrado*', '$1,099 MXN / $61 USD'],
        ['Público general', '$1,399 MXN / $78 USD']
      ]
    },
    pago: null,
    listaInteres: null
  },
  {
    id: 'c1',
    estado: 'finalizado',
    titulo: 'Introducción a la programación en bioinformática: Linux, R y Python',
    img: 'media/cursos/2026/Introducción a la programación en bioinformática Linux, R y Python!.jpg',
    descripcion: 'Curso teórico–práctico enfocado en aprender programación desde cero y comprender cómo Linux, R y Python se integran en flujos de trabajo bioinformáticos reales.',
    instructor: { ...INSTRUCTOR_JOSE, desc: 'Bioinformático e instructor especializado en programación científica, análisis de datos ómicos y desarrollo de pipelines bioinformáticos.' },
    fechas: '17, 19, 24 y 26 de Febrero 2026',
    horario: '5:00 PM – 8:00 PM (CDMX)',
    duracion: '12 horas · 4 sesiones de 3 hrs',
    modalidad: 'En línea · Clases en vivo',
    incluye: 'Constancia digital, grabaciones, material didáctico y ejercicios prácticos guiados.',
    temario: [
      'Fundamentos de programación aplicada a la bioinformática',
      'Introducción a Linux y línea de comandos',
      'Manejo y automatización básica de archivos en Linux',
      'Introducción a R para análisis de datos biológicos',
      'Introducción a Python para procesamiento de datos genómicos',
      'Integración de Linux, R y Python en flujos bioinformáticos'
    ],
    precios: {
      columnas: ['Perfil', 'Precio'],
      filas: [
        ['Licenciatura*', '$712 MXN / $35 USD'],
        ['Posgrado*', '$824 MXN / $41 USD'],
        ['Público general', '$1,049 MXN / $52 USD']
      ]
    },
    pago: null,
    listaInteres: null
  }
];
function buildInstructor(inst) {
  if (!inst) return '';
  if (Array.isArray(inst)) {
    return inst.map(i => `
      <div class="modal-instructor">
        <i class="fas fa-user-tie"></i>
        ${i.cv
          ? `<a href="${i.cv}" target="_blank">${i.nombre} ↗</a>`
          : `<span>${i.nombre}</span>`
        }
        <span style="color:#7aaa95;font-size:0.75rem;width:100%;margin-left:16px;">— ${i.desc}</span>
      </div>`).join('');
  }
  return `
    <div class="modal-instructor">
      <i class="fas fa-user-tie"></i>
      ${inst.cv
        ? `<a href="${inst.cv}" target="_blank">${inst.nombre} · ${inst.desc} ↗</a>`
        : `<span>${inst.nombre} · ${inst.desc}</span>`
      }
    </div>`;
}

function buildPrecios(p) {
  if (!p) return '';
  const ths = p.columnas.map(c => `<th>${c}</th>`).join('');
  const trs = p.filas.map(f => `<tr>${f.map((v,i) => i > 0 ? `<td class="precio-val">${v}</td>` : `<td>${v}</td>`).join('')}</tr>`).join('');
  return `
    <div class="modal-section-title"><i class="fas fa-tag"></i> Precios por perfil</div>
    <table class="precios-tabla">
      <thead><tr>${ths}</tr></thead>
      <tbody>${trs}</tbody>
    </table>`;
}

function buildPago(pago) {
  if (!pago) return '';
  const items = pago.map(p => `<div class="pago-item"><i class="${p.icono}"></i><span>${p.texto}</span></div>`).join('');
  return `
    <div class="modal-section-title"><i class="fas fa-credit-card"></i> Formas de pago</div>
    <div class="pago-box">${items}</div>`;
}

function buildCTAs(c) {
  if (c.estado === 'activo') {
    return `
      <div class="modal-ctas">
        <button class="modal-cta cta-whatsapp" onclick="window.open('https://wa.me/5215643236165','_blank')">
          <i class="fab fa-whatsapp"></i> Inscribirme por WhatsApp
        </button>
        <button class="modal-cta cta-email" onclick="window.open('mailto:hola@genomicstracksolutions.com','_blank')">
          <i class="fas fa-envelope"></i> Escribir por correo
        </button>
      </div>`;
  }
  let btns = `<button class="modal-cta cta-email" onclick="window.open('mailto:hola@genomicstracksolutions.com','_blank')">
    <i class="fas fa-envelope"></i> Notificarme de próxima edición
  </button>`;
  if (c.listaInteres) {
    btns += `<button class="modal-cta cta-lista" onclick="window.open('${c.listaInteres}','_blank')">
      <i class="fas fa-list"></i> Lista de interés
    </button>`;
  }
  btns += `<button class="modal-cta cta-whatsapp" onclick="window.open('https://wa.me/5215643236165','_blank')">
    <i class="fab fa-whatsapp"></i> WhatsApp
  </button>`;
  return `<div class="modal-ctas">${btns}</div>`;
}

function renderCursos() {
  const grid = document.getElementById('cursos-grid');
  const modales = document.getElementById('modales-container');
  grid.innerHTML = '';
  modales.innerHTML = '';

  [...CURSOS].sort((a, b) => (a.estado === 'activo' ? -1 : 1)).forEach(c => {
    const esActivo = c.estado === 'activo';

    // TARJETA
    grid.innerHTML += `
      <div class="tarjeta-curso" data-estado="${c.estado}">
        <img class="tarjeta-img" src="${c.img}" alt="${c.titulo}" onerror="this.style.display='none'">
        <span class="badge badge-${c.estado}">${esActivo ? '● ACTIVO' : '✓ FINALIZADO'}</span>
        <div class="tarjeta-body">
          <div class="tarjeta-titulo">${c.titulo}</div>
          <div class="tarjeta-fecha"><i class="fas fa-calendar-alt"></i> ${c.fechas.split('·')[0].trim()}</div>
          <button class="btn-modal ${esActivo ? '' : 'finalizado'}" onclick="abrirModal('${c.id}')">
            <i class="fas fa-plus"></i> ${esActivo ? 'Más información' : 'Ver detalles'}
          </button>
        </div>
      </div>`;

    // MODAL
    const temarioHTML = c.temario
      ? `<div class="modal-section-title"><i class="fas fa-list-ul"></i> Temario</div>
         <ul class="temario-list">${c.temario.map(t => `<li>${t}</li>`).join('')}</ul>`
      : '';

    const avisoCurso = c.estado === 'finalizado'
      ? `<div class="aviso-finalizado">
           <i class="fas fa-info-circle" style="color:#4ade80;margin-right:6px;"></i>
           Este curso ya fue impartido. Si te interesa una próxima edición, escríbenos o únete a nuestra lista de interés.
         </div>`
      : '';

    modales.innerHTML += `
      <div class="modal-overlay" id="modal-${c.id}" onclick="cerrarOverlay(event,'${c.id}')">
        <div class="modal-box">
          <button class="modal-close" onclick="cerrarModal('${c.id}')"><i class="fas fa-times"></i></button>
          <div class="modal-hero">
            <img src="${c.img}" alt="${c.titulo}" onerror="this.parentElement.style.background='#1a6b50';this.style.display='none'">
            <div class="modal-hero-overlay"></div>
            <span class="modal-badge-hero ${c.estado}">${esActivo ? '● ACTIVO' : '✓ FINALIZADO'}</span>
          </div>
          <div class="modal-body">
            <div class="modal-titulo">${c.titulo}</div>
            ${buildInstructor(c.instructor)}
            <p class="modal-desc">${c.descripcion}</p>

            <div class="modal-section-title"><i class="fas fa-info-circle"></i> Detalles del curso</div>
            <div class="modal-info-grid">
              <div class="info-chip"><label>Fechas</label><span>${c.fechas}</span></div>
              <div class="info-chip"><label>Horario</label><span>${c.horario}</span></div>
              <div class="info-chip"><label>Duración</label><span>${c.duracion}</span></div>
              <div class="info-chip"><label>Modalidad</label><span>${c.modalidad}</span></div>
            </div>

            <div class="modal-section-title"><i class="fas fa-gift"></i> ¿Qué incluye?</div>
            <div class="incluye-box"><i class="fas fa-check-circle"></i>${c.incluye}</div>

            ${temarioHTML}
            ${buildPrecios(c.precios)}
            ${buildPago(c.pago)}
            ${avisoCurso}
            ${buildCTAs(c)}
          </div>
        </div>
      </div>`;
  });
}

function filtrar(estado, btn) {
  document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('activo'));
  btn.classList.add('activo');
  document.querySelectorAll('.tarjeta-curso').forEach(card => {
    card.classList.toggle('oculto', estado !== 'todos' && card.dataset.estado !== estado);
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

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
  }
});

renderCursos();