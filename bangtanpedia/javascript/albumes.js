// ==========================================
// DISCOGRAFÍA COMPLETA
// ==========================================
const discografiaBTS = [
    // --- ÁLBUMES COREANOS ---
    {
        id: "2cool4skool",
        titulo: "2 Cool 4 Skool",
        fecha: "2013",
        categoria: "Album Coreano",
        portada: "img/albumes/2cool4skool.webp",
        canciones: ["Intro : 2 Cool 4 Skool", "We Are Bulletproof Pt.2", "Skit : Circle Room Talk", "No More Dream", "Interlude", "Like (좋아요)", "Outro : Circle Room Cypher"]
    },
    {
        id: "darkandwild",
        titulo: "Dark & Wild",
        fecha: "2014",
        categoria: "Album Coreano",
        portada: "img/albumes/dark-and-wild.webp",
        canciones: ["Intro : What am I to you", "Danger", "War of Hormone", "Hip Hop Phile", "Let Me Know", "Rain", "BTS Cypher PT.3: KILLER", "Look Here", "2nd Grade"]
    },
    {
        id: "wings",
        titulo: "Wings",
        fecha: "2016",
        categoria: "Album Coreano",
        portada: "img/albumes/wings.webp",
        canciones: ["Intro : Boy Meets Evil", "Blood Sweat & Tears", "Begin", "Lie", "Stigma", "First Love", "Reflection", "MAMA", "Awake", "Lost", "BTS Cypher 4", "21st Century Girl"]
    },
    {
        id: "mots-7",
        titulo: "Map of the Soul: 7",
        fecha: "2020",
        categoria: "Album Coreano",
        portada: "img/albumes/map-of-the-soul-7.jpg",
        canciones: ["Intro : Persona", "Boy With Luv", "Make It Right", "Jamais Vu", "Dionysus", "Interlude : Shadow", "Black Swan", "Filter", "My Time", "ON", "UGH!", "00:00", "Inner Child", "Friends", "Moon"]
    },
    {
        id: "be",
        titulo: "BE",
        fecha: "2020",
        categoria: "Album Coreano",
        portada: "img/albumes/be.jpg",
        canciones: ["Life Goes On", "Fly To My Room", "Blue & Grey", "Skit", "Telepathy", "Dis-ease", "Stay", "Dynamite"]
    },

    // --- EPS Y ESPECIALES ---
    {
        id: "ly-answer",
        titulo: "Love Yourself: Answer",
        fecha: "2018",
        categoria: "EP / Especial",
        portada: "img/albumes/love-yourself-answer.jpg",
        canciones: ["Euphoria", "Trivia 起 : Just Dance", "Serendipity", "DNA", "Dimple", "Trivia 承 : Love", "Fake Love", "MIC Drop", "Singularity", "Epiphany", "IDOL", "Answer : Love Myself"]
    },
    {
        id: "proof",
        titulo: "Proof",
        fecha: "2022",
        categoria: "EP / Especial",
        portada: "img/albumes/proof.webp",
        canciones: ["Born Singer", "No More Dream", "N.O", "Boy In Luv", "Danger", "I NEED U", "RUN", "FIRE", "Blood Sweat & Tears", "Spring Day", "DNA", "FAKE LOVE", "IDOL", "Boy With Luv", "ON", "Dynamite", "Life Goes On", "Butter", "Yet To Come", "Run BTS"]
    },

    // --- SINGLES E INGLÉS ---
    {
        id: "dynamite-single",
        titulo: "Dynamite",
        fecha: "2020",
        categoria: "Single",
        portada: "img/albumes/dynamite.jpg",
        canciones: ["Dynamite", "Dynamite (Instrumental)", "Dynamite (Acoustic Remix)", "Dynamite (EDM Remix)"]
    },
    {
        id: "butter-single",
        titulo: "Butter / Permission to Dance",
        fecha: "2021",
        categoria: "Single",
        portada: "img/albumes/butter.png",
        canciones: ["Butter", "Permission to Dance", "Butter (Instrumental)", "Permission to Dance (Instrumental)"]
    },
    {
        id: "take-two",
        titulo: "Take Two",
        fecha: "2023",
        categoria: "Single",
        portada: "img/albumes/take-two.jpg",
        canciones: ["Take Two"]
    },

    // --- PROYECTOS SOLISTAS Y DESTACADOS (COMO "WHO") ---
    {
        id: "muse-jimin",
        titulo: "MUSE (Jimin - incl. 'Who')",
        fecha: "2024",
        categoria: "EP / Especial",
        portada: "img/albumes/muse.jpg",
        canciones: ["Rebirth (Intro)", "Interlude : Showtime", "Sgalleri (feat. Loco)", "Slow Dance (feat. Sofia Carson)", "Be Mine", "Who", "Closer Than This"]
    },

    // --- COLABORACIONES GLOBALES ---
    {
        id: "my-universe",
        titulo: "My Universe (Coldplay x BTS)",
        fecha: "2021",
        categoria: "Single",
        portada: "img/albumes/my-universe.jpg",
        canciones: ["My Universe", "My Universe (Acoustic Version)", "My Universe (SUGA's Remix)"]
    },
    {
        id: "mic-drop-remix",
        titulo: "MIC Drop (Steve Aoki Remix)",
        fecha: "2017",
        categoria: "Single",
        portada: "img/albumes/mic-drop.jpg",
        canciones: ["MIC Drop (feat. Desiigner) [Steve Aoki Remix]", "Snake Rhythms"]
    },
    {
        id: "boy-with-luv-colab",
        titulo: "Boy With Luv (feat. Halsey)",
        fecha: "2019",
        categoria: "Single",
        portada: "img/albumes/boy-with-luv.jpg",
        canciones: ["Boy With Luv (feat. Halsey)"]
    },

    // --- ÁLBUMES JAPONESES ---
    {
        id: "wake-up",
        titulo: "Wake Up",
        fecha: "2014",
        categoria: "Album Japones",
        portada: "img/albumes/wake-up.jpg",
        canciones: ["INTRO", "THE STARS", "JUMP -Japanese Ver.-", "Danger -Japanese Ver.-", "BOY IN LUV -Japanese Ver.-", "JUST ONE DAY -Japanese Ver.-", "WAKE UP"]
    },
    {
        id: "youth",
        titulo: "Youth",
        fecha: "2016",
        categoria: "Album Japones",
        portada: "img/albumes/youth.jpg",
        canciones: ["INTRODUCTION : YOUTH", "RUN -Japanese Ver.-", "FIRE -Japanese Ver.-", "DOPE -Japanese Ver.-", "Good Day", "FOR YOU"]
    },
    {
        id: "face-yourself",
        titulo: "Face Yourself",
        fecha: "2018",
        categoria: "Album Japones",
        portada: "img/albumes/face-yourself.jpg",
        canciones: ["INTRO : Ringwanderung", "Best Of Me -Japanese Ver.-", "Blood Sweat & Tears -Japanese Ver.-", "DNA -Japanese Ver.-", "Don't Leave Me", "Crystal Snow"]
    },
    {
        id: "mots-7-journey",
        titulo: "Map of the Soul: 7 ~ The Journey ~",
        fecha: "2020",
        categoria: "Album Japones",
        portada: "img/albumes/mots-journey.webp",
        canciones: ["INTRO : Calling", "Stay Gold", "Lights", "Your eyes tell", "OUTRO : The Journey"]
    },
    {
        id: "bts-the-best",
        titulo: "BTS, the Best",
        fecha: "2021",
        categoria: "Album Japones",
        portada: "img/albumes/bts-the-best.jpg",
        canciones: ["Film out", "DNA -Japanese Ver.-", "Lights", "Blood Sweat & Tears -Japanese Ver.-", "Your eyes tell"]
    },
    {
        id: "hyhh-pt1",
        titulo: "The Most Beautiful Moment in Life, Pt. 1",
        fecha: "2015",
        categoria: "Album Japones",
        portada: "img/albumes/hyhh-pt1.jpg",
        canciones: ["Intro : The Most Beautiful Moment in Life", "I NEED U", "Hold Me Tight", "SKIT : Expectation!", "DOPE", "Boyz with Fun", "Converse High", "Moving On", "Outro : Love is Not Over"]
    },
    {
        id: "hyhh-pt2",
        titulo: "The Most Beautiful Moment in Life, Pt. 2",
        fecha: "2015",
        categoria: "Album Japones",
        portada: "img/albumes/hyhh-pt2.webp",
        canciones: ["INTRO : Never Mind", "RUN", "Butterfly", "Whalien 52", "Ma City", "Silver Spoon (Baepsae)", "SKIT : One night in a strange city", "Autumn Leaves", "OUTRO : House of Cards"]
    },
    // --- DISCOS Y EPS ADICIONALES ---
    {
        id: "orul82",
        titulo: "O!RUL8,2?",
        fecha: "2013",
        categoria: "EP / Especial",
        portada: "img/albumes/orul82.jpg",
        canciones: ["INTRO : O!RUL8,2?", "N.O", "We On", "If I Ruled The World", "Coffee", "BTS Cypher PT.1", "Attack on Bangtan", "Paldogangsan", "OUTRO : Luv in Skool"]
    },
    {
        id: "skool-luv-affair",
        titulo: "Skool Luv Affair",
        fecha: "2014",
        categoria: "EP / Especial",
        portada: "img/albumes/skool-luv-affair.jpg",
        canciones: ["Intro : Skool Luv Affair", "Boy In Luv", "Skit : Soulmate", "Where You From", "Just One Day", "Tomorrow", "BTS Cypher PT.2: Triptych", "Spine Breaker", "Jump", "Outro : Propose"]
    },
    {
        id: "young-forever",
        titulo: "The Most Beautiful Moment in Life: Young Forever",
        fecha: "2016",
        categoria: "EP / Especial",
        portada: "img/albumes/young-forever.jpg",
        canciones: ["Intro : Youth", "FIRE", "Save ME", "EPILOGUE : Young Forever", "House of Cards (Full Length)", "Love is Not Over (Full Length)", "I NEED U (Urban Mix)", "RUN (Ballad Mix)"]
    },
    {
        id: "ynwa",
        titulo: "You Never Walk Alone",
        fecha: "2017",
        categoria: "Album Coreano",
        portada: "img/albumes/ynwa.jpg",
        canciones: ["Spring Day", "Not Today", "Outro : Wings", "A Supplementary Story : You Never Walk Alone", "Blood Sweat & Tears", "Begin", "Lie", "Stigma", "First Love", "Reflection", "MAMA", "Awake"]
    },
    {
        id: "ly-her",
        titulo: "Love Yourself: Her",
        fecha: "2017",
        categoria: "EP / Especial",
        portada: "img/albumes/love-yourself-her.jpg",
        canciones: ["Intro : Serendipity", "DNA", "Best Of Me", "dimple", "Pied Piper", "Skit : Billboard Music Awards Speech", "MIC Drop", "Go Go", "Outro : Her"]
    },
    {
        id: "ly-tear",
        titulo: "Love Yourself: Tear",
        fecha: "2018",
        categoria: "Album Coreano",
        portada: "img/albumes/love-yourself-tear.webp",
        canciones: ["Intro : Singularity", "FAKE LOVE", "The Truth Untold (feat. Steve Aoki)", "134340", "Paradise", "Love Maze", "Magic Shop", "Airplane pt.2", "Anpanman", "So What", "Outro : Tear"]
    },
    {
        id: "mots-persona",
        titulo: "Map of the Soul: Persona",
        fecha: "2019",
        categoria: "EP / Especial",
        portada: "img/albumes/mots-persona.jpg",
        canciones: ["Intro : Persona", "Boy With Luv (feat. Halsey)", "Make It Right", "Jamais Vu", "Dionysus", "Interlude : Shadow"]
    }
];

// ==========================================
// ELEMENTOS DEL DOM Y FUNCIONES DE CONTROL
// ==========================================
function inicializarApp() {
    // Captura de Elementos DOM
    const contenedor = document.getElementById("contenedor-albumes");
    const modal = document.getElementById("modal-album");
    const btnCerrar = document.getElementById("cerrar-modal");

    const modalPortada = document.getElementById("modal-portada");
    const modalTitulo = document.getElementById("modal-titulo");
    const modalFecha = document.getElementById("modal-fecha");
    const modalCategoria = document.getElementById("modal-categoria");
    const modalTracklist = document.getElementById("modal-tracklist");
    const botonesFiltro = document.querySelectorAll(".btn-filtro");

    if (!contenedor) return;

    // Función para renderizar las tarjetas en la grilla
    function renderizarAlbumes(lista) {
        contenedor.innerHTML = "";
        lista.forEach(album => {
            const tarjeta = document.createElement("article");
            tarjeta.className = "tarjeta-album";
            tarjeta.innerHTML = `
                <img src="${album.portada}" alt="${album.titulo}" onerror="this.src='img/logo.webp'">
                <h3>${album.titulo}</h3>
                <p>${album.fecha}</p>
                <span class="badge-categoria">${album.categoria}</span>
            `;
            
            tarjeta.addEventListener("click", () => abrirModal(album));
            contenedor.appendChild(tarjeta);
        });
    }

    // Función para desplegar el modal horizontal
    function abrirModal(album) {
        modalPortada.src = album.portada;
        modalTitulo.textContent = album.titulo;
        modalFecha.textContent = `Lanzamiento: ${album.fecha}`;
        modalCategoria.textContent = album.categoria;

        modalTracklist.innerHTML = "";
        album.canciones.forEach((cancion, index) => {
            const card = document.createElement("div");
            card.className = "card-cancion";
            card.innerHTML = `
                <div>
                    <div class="numero-cancion">#${(index + 1).toString().padStart(2, '0')}</div>
                    <div class="nombre-cancion">${cancion}</div>
                </div>
            `;
            modalTracklist.appendChild(card);
        });

        modal.classList.add("activo");
    }

    // Eventos para cerrar modal
    if (btnCerrar) {
        btnCerrar.onclick = () => modal.classList.remove("activo");
    }

    window.onclick = (e) => {
        if (e.target === modal) modal.classList.remove("activo");
    };

    // Eventos de los Botones de Filtro
    botonesFiltro.forEach(btn => {
        btn.addEventListener("click", () => {
            botonesFiltro.forEach(b => b.classList.remove("activo"));
            btn.classList.add("activo");

            const cat = btn.dataset.categoria;
            if (cat === "todos") {
                renderizarAlbumes(discografiaBTS);
            } else {
                renderizarAlbumes(discografiaBTS.filter(a => a.categoria === cat));
            }
        });
    });

    // Carga inicial de todo el catálogo
    renderizarAlbumes(discografiaBTS);
}

// Ejecución segura
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarApp);
} else {
    inicializarApp();
}