

document.addEventListener("DOMContentLoaded", function () {
  const button = document.getElementById('contactBtn');
  const tooltip = document.getElementById('tooltipContacto');

  // Redireccionar al hacer clic
  if (button) {
    button.addEventListener('click', function () {
      window.location.href = 'contacto.html';
    });

    // Accesibilidad: activar con tecla Enter
    button.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        window.location.href = 'contacto.html';
      }
    });
  }

  // Mostrar tooltip automáticamente por 3 segundos
  if (tooltip) {
    tooltip.classList.add('visible');
    setTimeout(() => {
      tooltip.classList.remove('visible');
    }, 3000);
  }
});