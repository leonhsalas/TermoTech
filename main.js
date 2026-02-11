document.addEventListener('DOMContentLoaded', function() {
    const sun = document.getElementById("sun");
let day = true;
const termo = document.getElementById("termo");
const tech = document.getElementById("tech");
const pronunciation  = document.getElementById("pronunciation");
const search = document.getElementById("search");
const green = document.getElementById("green");
const word = document.getElementById("word");
const purple = document.getElementById("purple");
const content = document.getElementsByClassName("content");
const text = document.getElementsByClassName("text");
const examplecontainer = document.getElementById("example-container");
const background = document.getElementById("background")
const card = document.getElementById("card");
const synonym = document.getElementById("synonym");
const synonyms = document.getElementById("synonyms");
const type = document.getElementById('type');
const formality = document.getElementById('formality');
const example = document.getElementById('example');
const descriptions = document.getElementById('descriptions');
const input = document.getElementById("search-input");
const etymology = document.getElementById("etymology");
const synonymsSection = document.getElementById("synonyms-section");
const regionContainer = document.getElementById("region-container");
const region = document.getElementById("region");
let numbers = document.getElementsByClassName("number");
let cachedData = null;

async function obtenerDatos() {
    if (cachedData) return cachedData;
    try {
        const respuesta = await fetch('data.json');
        if (!respuesta.ok) throw new Error('Error en la red');

        cachedData = await respuesta.json();
        return cachedData;
    } catch (error) {
        console.error("Error al obtener data:", error);
    }
}

sun.addEventListener("click",() => {
    if (day === true) {
        sun.src = './img/night.webp';
        sun.style.width = '2.6rem';
        day = false;
        termo.style.color = "#1c8347";
        document.body.style.backgroundColor = "black";
        pronunciation.style.color = "white";
        search.src = "./img/searchw.webp";
        for (let i=0; i<content.length; i++) {
            content.item(i).style.color = "#FFFFFF";
        }
        etymology.style.color = "white";
        background.style.backgroundColor = "#1D1E24";
        green.style.backgroundColor = "#1c8347";
        examplecontainer.style.backgroundColor = "#1c8347";
        card.style.backgroundColor = "#1F2026";
        synonym.style.backgroundColor = "#2F323C";
        purple.style.backgroundColor = "rgb(106, 0, 106)";
        input.style.color = "white"
    } else {
        sun.src = './img/sun.webp';
        sun.style.width = '4.7rem';
        day = true;
        termo.style.color = "#27AE60";
        document.body.style.backgroundColor = "white";
        pronunciation.style.color = "gray";
        search.src = "./img/search.webp";
        examplecontainer.style.backgroundColor = "#F7CC5E";
        green.style.backgroundColor = "#27AE60";
        background.style.backgroundColor = "#FCFCFD";
        purple.style.backgroundColor = "purple";
        card.style.backgroundColor = "";
        synonym.style.backgroundColor = "#EEF2FA";
        for (let i=0; i<content.length; i++) {
            content.item(i).style.color = "black";
        }
        etymology.style.color = "gray";
        input.style.color = "black"
    }
})

function createDescription(index, descText) {
    let description = document.createElement("div");
    description.style.display = "flex";
    description.style.fontSize = "1.3rem";
    description.classList.add("number");
    let number = document.createElement("p");
    let content = document.createElement("p");
    number.style.fontWeight = "bolder";
    number.style.color = "#2F80ED";
    number.classList.add("number");
    content.classList.add("content");
    content.classList.add("number");
    if (day === false) {
        content.style.color = "white";
    }
    number.innerText = `${index + 1}.`;
    content.innerText = descText;
    description.style.marginTop = index === 0 ? "1.4rem" : "2.4rem";
    description.appendChild(number);
    description.appendChild(content);
    descriptions.appendChild(description);
}

function displayWord(data, query) {
    let found = false;
    for (let i = 0; i < data.length; i++) {
        const matchPalabra = data[i].Palabra.toLowerCase() === query;
        const matchWord1 = data[i].Word1.toLowerCase() === query;
        const matchWord2 = data[i].Word2.toLowerCase() === query;
        if (matchPalabra || matchWord1 || matchWord2) {
            word.textContent = data[i].Palabra;
            pronunciation.textContent = data[i].Pronunciacion;
            example.textContent = data[i].Ejemplo;
            type.textContent = data[i].Tipo.join(", ");
            if (data[i].Sinonimos.length > 0) {
                synonyms.innerText = data[i].Sinonimos.join(", ");
                synonymsSection.style.display = "flex";
            } else {
                synonymsSection.style.display = "none";
            }
            etymology.textContent = data[i].Etimologia;
            if (data[i].Region) {
                region.textContent = data[i].Region;
                regionContainer.style.display = "block";
            } else {
                regionContainer.style.display = "none";
            }
            while (numbers.length > 0) {
                numbers[0].remove();
            }
            data[i].Descripciones.forEach((desc, idx) => {
                createDescription(idx, desc);
            });
            const url = new URL(window.location);
            url.searchParams.set('word', data[i].Palabra.toLowerCase());
            history.pushState(null, '', url);
            found = true;
            break;
        }
    }
    if (!found) {
        word.innerText = "La Palabra";
        example.innerText = "";
        synonyms.innerText = "";
        type.innerText = "Frase";
        pronunciation.innerText = "No Existe";
        etymology.textContent = "";
        regionContainer.style.display = "none";
    }
}

input.addEventListener('keypress', function(event) {
    if (event.key === "Enter") {
        obtenerDatos().then(data => {
            displayWord(data, input.value.toLowerCase());
        });
    }
})

// Load word from URL on page load
const params = new URLSearchParams(window.location.search);
const wordParam = params.get('word');
if (wordParam) {
    obtenerDatos().then(data => {
        displayWord(data, wordParam.toLowerCase());
    });
}

});
