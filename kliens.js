function showError(container, message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  container.appendChild(errorDiv);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.subject-detailed').forEach((item) => {
    item.addEventListener('click', async function xd() {
      const tantargyId = this.dataset.id;
      const rang = this.dataset.user;
      const leirasDiv = this.nextElementSibling;
      leirasDiv.innerHTML = '';
      console.log(rang);
      try {
        const response = await fetch(`/getDescription/${tantargyId}`);
        if (response.ok) {
          const data = await response.json();
          const { description } = data;

          const h3 = document.createElement('h3');
          h3.textContent = description;
          leirasDiv.appendChild(h3);
          console.log(description);
          const link = document.createElement('a');
          link.href = `/subjects/${tantargyId}/feladatok`;
          link.textContent = 'Feladatok megtekintése';
          leirasDiv.appendChild(link);

          if (rang === 1) {
            const form = document.createElement('form');
            form.action = '/deleteSubject';
            form.method = 'post';

            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'tantargyId';
            input.value = tantargyId;
            form.appendChild(input);

            const button = document.createElement('button');
            button.type = 'submit';
            button.textContent = 'Törlés';
            form.appendChild(button);

            leirasDiv.appendChild(form);
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ismeretlen hiba történt');
        }
      } catch (error) {
        console.error('Hiba történt az adatok betöltése során:', error);
        showError(leirasDiv, 'Hiba történt az adatok betöltése során.');
      }
    });
  });
});
