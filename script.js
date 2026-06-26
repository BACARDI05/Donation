function openTab(tabName){
    document
    .querySelectorAll(".page")
    .forEach(page => {
        page.classList.remove("active");
    });
    document
    .getElementById(tabName)
    .classList.add("active");
    document
    .querySelectorAll(".tab")
    .forEach(btn => {
        btn.classList.remove("active");
    });
    event.currentTarget.classList.add("active");
}