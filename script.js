function zatwierdz() {
    try {
        window.open("tabela.html", "_blank");
    } catch (error) {
        console.error("Error opening table page:", error);
        alert("Could not open the table page.");
    }
}