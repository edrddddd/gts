 function openModal(id) {
    document.getElementById('modal-' + id).classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(id) {
    document.getElementById('modal-' + id).classList.remove('open');
    document.body.style.overflow = '';
  }
  function closeOnOverlay(e, id) {
    if (e.target === e.currentTarget) closeModal(id);
  }
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
      document.body.style.overflow = '';
    }
  });


  const WSP_NUMBER = '+5215643236165'; // Cambiar 
function openWSP(servicio){
  const msg = encodeURIComponent(`Hola, me interesa el servicio de *${servicio}*. ¿Podrían darme más información?`);
  window.open(`https://wa.me/${WSP_NUMBER}?text=${msg}`,'_blank');
}
function sendWhatsApp(){
  const msg = encodeURIComponent('Hola, me interesa contactarlos sobre sus servicios.');
  window.open(`https://wa.me/${WSP_NUMBER}?text=${msg}`,'_blank');
}