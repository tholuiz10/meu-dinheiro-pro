function navigate(page) {

    const content = document.getElementById("content");

    content.classList.add("fade-out");

    setTimeout(() => {

        switch(page) {

            case "dashboard":
                content.innerHTML = dashboardPage();
                break;

            case "meses":
                content.innerHTML = mesesPage();
                break;

            case "cartao":
                content.innerHTML = cartaoPage();
                break;

            case "anual":
                content.innerHTML = gastoAnualPage();
                break;

            case "dividas":
                content.innerHTML = dividasPage();
                break;

            case "metas":
                content.innerHTML = metasPage();
                break;

            case "fixos":
                content.innerHTML = fixosPage();
                break;

            case "categorias":
                content.innerHTML = categoriasPage();
                break;

            case "ganhos":
                content.innerHTML = ganhosPage();
                break;

            case "categorias":
                content.innerHTML = categoriasPage();
                break;

            case "assistente":
                content.innerHTML = assistentePage();
                break;


            default:
                content.innerHTML = dashboardPage();
        }

        content.classList.remove("fade-out");
        content.classList.add("fade-in");

    }, 200);
}

function aplicarTemaAutomatico() {
    const prefereEscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (localStorage.getItem("tema")) {
        if (localStorage.getItem("tema") === "dark") {
            document.body.classList.add("dark-mode");
        }
    } else {
        if (prefereEscuro) {
            document.body.classList.add("dark-mode");
        }
    }
}

function alternarTema() {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("tema", "dark");
    } else {
        localStorage.setItem("tema", "light");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    navigate("dashboard");
});