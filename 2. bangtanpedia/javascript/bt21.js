document.addEventListener('DOMContentLoaded', () => {
    const mainBT21 = document.querySelector('.bt21');
    if (mainBT21) {
        mainBT21.style.backgroundImage = `linear-gradient(rgba(245, 239, 251, 0.88), rgba(245, 239, 251, 0.88)), url('img/fondo21.png')`;
        mainBT21.style.backgroundSize = 'cover';
        mainBT21.style.backgroundPosition = 'center';
        mainBT21.style.backgroundAttachment = 'fixed';
    }

    const gifBT21 = document.querySelector('.gif-bt21');
    if (gifBT21) {
        gifBT21.addEventListener('click', () => {
            gifBT21.style.transform = 'scale(0.95)';
            setTimeout(() => {
                gifBT21.style.transform = '';
            }, 150);
        });
    }

});