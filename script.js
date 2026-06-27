let scriptsData = [];
function openTab(tabName, button = null) {
    document
        .querySelectorAll(".page")
        .forEach(page => {
            page.classList.remove("active");
        });
    document
        .getElementById(tabName)
        .classList.add("active");
    document
        .querySelectorAll(".tab, .sidebar button")
        .forEach(btn => {
            btn.classList.remove("active");
        });
    if (button) {
        button.classList.add("active");
    }
    document
        .querySelectorAll(`[onclick*="${tabName}"]`)
        .forEach(btn => {
            btn.classList.add("active");
        });
    document
        .querySelector(".sidebar")
        ?.classList.remove("active");
}
async function loadScripts() {
    let response = await fetch("script-data.json");
    scriptsData = await response.json();
    displayScripts(scriptsData);
}
function displayScripts(data, isSearch = false) {
    let container = document.getElementById("scriptContainer");
    container.innerHTML = "";
    if (data.length === 0) {
        if (isSearch) {
            container.innerHTML = `
            <div class="empty-card">
                <i data-lucide="search-x"></i>
                <h2>
                No Script Found
                </h2>
                <p>
                No script found matching your search.
                </p>
            </div>
            `;
        } else {
            container.innerHTML = `
            <div class="empty-card">
                <i data-lucide="folder-x"></i>
                <h2>
                No Scripts Available
                </h2>
                <p>
                No scripts have been uploaded by the owner yet. Please check back later.
                </p>
            </div>
            `;
        }
        lucide.createIcons();
        return;
    }
    data.forEach(script => {
        container.innerHTML += `
        <div class="script-card">
            <div class="script-title">
                <i data-lucide="file-code"></i>
                <h2>
                ${script.name}
                </h2>
            </div>
            <p>
            ${script.description}
            </p>
            <button 
            class="primary"
            onclick="downloadScript('${script.file}')">
            Download
            </button>
        </div>
        `;
    });
    lucide.createIcons();
}
async function downloadScript(url) {
    try {
        let response = await fetch(url);
        if (!response.ok) {
            throw new Error("File not found");
        }
        let blob = await response.blob();
        let downloadURL = URL.createObjectURL(blob);
        let link = document.createElement("a");
        link.href = downloadURL;
        link.download = url.split("/").pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadURL);
    } catch (error) {
        alert("Script unavailable. Contact author.");
    }
}
document
    .addEventListener("DOMContentLoaded", () => {
        loadScripts();
        document
            .getElementById("scriptSearch")
            .addEventListener("input", (e) => {
                let value =
                    e.target.value.toLowerCase();
                let filtered =
                    scriptsData.filter(script =>
                        script.name
                            .toLowerCase()
                            .includes(value)
                    );
                displayScripts(filtered);
            });
    });
function toggleMenu() {
    document
        .querySelector(".sidebar")
        .classList.toggle("active");
}
