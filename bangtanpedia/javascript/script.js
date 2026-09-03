document.addEventListener('DOMContentLoaded', () => {
    const ballena = document.querySelector('.ballena');

    if (ballena) {
        ballena.classList.add('flotando');
        ballena.addEventListener('click', () => {
            ballena.classList.remove('flotando');
            ballena.style.transform = 'translateY(15px) scale(0.9)';
            window.scrollBy({
                top: 300,
                behavior: 'smooth'
            });
            setTimeout(() => {
                ballena.style.transform = '';
                ballena.classList.add('flotando');
            }, 250);
        });
    }
});