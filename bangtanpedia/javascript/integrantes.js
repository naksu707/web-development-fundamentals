const tarjetas = document.querySelectorAll('.tarjeta-integrante');

const informacion = {
    rm: {
        nombre: 'RM',
        nombreReal: 'Kim Namjoon',
        descripcion: 'Fue el primer miembro en unirse a Big Hit y el líder de BTS. Anteriormente conocido como Rap Monster, es el pilar en la composición y producción del grupo. Como solista debutó con la mixtape "RM" (2015), seguida de "Mono" (2018), y ha lanzado dos álbumes de estudio oficiales: "Indigo" (2022) y "Right Place, Wrong Person" (2024), además de destacados sencillos como "Wild Flower" y "Come back to me".'
    },
    jin: {
        nombre: 'Jin',
        nombreReal: 'Kim Seokjin',
        descripcion: 'Descubierto en la calle por su presencia visual, es el miembro de mayor edad y vocalista del grupo. Ha lanzado aclamados sencillos en solitario como "The Astronaut" (coescrito con Coldplay), "Super Tuna", "Tonight" y "Abyss", además de participar en importantes bandas sonoras. En 2024 lanzó su primer álbum de estudio en solitario titulado "Happy".'
    },
    suga: {
        nombre: 'SUGA',
        nombreReal: 'Min Yoongi',
        descripcion: 'Se unió a la agencia tras destacar como rapero underground en Daegu. Es uno de los principales productores de BTS. Desarrolla su carrera en solitario bajo el alter ego Agust D, con el que lanzó las mixtapes "Agust D" (2016) y "D-2" (2020), culminando la trilogía con su álbum de estudio "D-DAY" (2023) y sencillos icónicos como "Daechwita" y "Haegeum".'
    },
    jhope: {
        nombre: 'j-hope',
        nombreReal: 'Jung Hoseok',
        descripcion: 'Era un reconocido bailarín callejero en Gwangju antes de unirse como rapero y bailarín principal. Fue el primer miembro en lanzar un álbum oficial de estudio en solitario con "Jack In The Box" (2022) y encabezar Lollapalooza. Su discografía en solitario incluye la mixtape "Hope World" (2018), el EP "HOPE ON THE STREET VOL.1" (2024) y sencillos como "Chicken Noodle Soup" (con Becky G) y "MORE".'
    },
    jimin: {
        nombre: 'Jimin',
        nombreReal: 'Park Jimin',
        descripcion: 'Fue el último miembro en unirse a la alineación final tras ser el mejor estudiante de danza contemporánea en Busan. Vocalista y bailarín principal, hizo su debut solista con el EP "FACE" (2023) —logrando el #1 en Billboard Hot 100 con el sencillo "Like Crazy"— y continuó con su segundo álbum de estudio "MUSE" (2024) y su éxito "Who".'
    },
    v: {
        nombre: 'V',
        nombreReal: 'Kim Taehyung',
        descripcion: 'Acompañó a un amigo a una audición en Daegu y terminó siendo el único seleccionado, manteniéndose como el "miembro secreto" de BTS hasta el debut. Destacado por su voz de barítono, debutó como solista con el álbum de estudio "Layover" (2023) producido junto a Min Hee-jin, incluyendo sencillos como "Slow Dancing", "Love Me Again" y su posterior sencillo digital "FRI(END)S".'
    },
    jungkook: {
        nombre: 'Jung Kook',
        nombreReal: 'Jeon Jungkook',
        descripcion: 'El "Golden Maknae" (miembro más joven) se unió a Big Hit tras ser buscado por múltiples agencias luego de audicionar en Superstar K, eligiendo la empresa al quedar impresionado por el rap de RM. Lanzó su exitoso álbum de estudio solista "GOLDEN" (2023), rompiendo récords globales con sencillos como "Seven" (feat. Latto), "3D" y "Standing Next to You".'
    }
};

tarjetas.forEach(function(tarjeta) {
    tarjeta.addEventListener('click', function() {
        const integrante = tarjeta.dataset.integrante;

        tarjetas.forEach(t => t.classList.remove('activo'));

        tarjeta.classList.add('activo');

        mostrarInformacion(integrante);
    });
});

function mostrarInformacion(integrante) {
    const datos = informacion[integrante];

    document.getElementById('nombre-integrante').textContent = datos.nombre;
    document.getElementById('nombre-real').textContent = datos.nombreReal;
    document.getElementById('descripcion-integrante').textContent = datos.descripcion;

    document.getElementById('informacion-integrante').classList.add('mostrar');
}

const cerrar = document.getElementById('cerrar-info');

cerrar.addEventListener('click', function() {
    document.getElementById('informacion-integrante').classList.remove('mostrar');
    
    tarjetas.forEach(t => t.classList.remove('activo'));
});