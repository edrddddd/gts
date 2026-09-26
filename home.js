'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const catalog = window.CourseCatalog;
  if (!catalog) return;
  const cards = document.querySelectorAll('[data-course-id]');
  cards.forEach(card => {
    const course = catalog.getById(card.dataset.courseId);
    if (course) card.querySelector('[data-course-status]').textContent = catalog.labelStatus(catalog.getStatus(course));
  });
  const intro = document.getElementById('home-course-intro');
  const available = catalog.courses.some(c => catalog.getStatus(c) === 'inscripcion');
  const ongoing = catalog.courses.some(c => catalog.getStatus(c) === 'en-curso');
  if (intro) intro.textContent = available
    ? 'Conoce las próximas ediciones y consulta los requisitos para participar.'
    : ongoing ? 'Estas ediciones ya están en marcha. Consulta al equipo sobre las próximas oportunidades para aprender.'
    : 'Conoce nuestras ediciones recientes y solicita información sobre los próximos grupos.';
});
