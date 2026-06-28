let scriptsData = [];
const DATA_DEBUG_PREFIX = "[script-data]";
let notifications = {
    script_not_found: {
        icon: "file-warning",
        title: "Script Not Found",
        description: "The requested script file could not be loaded."
    },
    copy_success: {
        icon: "copy-check",
        title: "Script Copied",
        description: "Raw script code copied successfully."
    },
    copy_failed: {
        icon: "circle-alert",
        title: "Copy Failed",
        description: "Unable to fetch script code."
    },
    download_failed: {
        icon: "download-cloud",
        title: "Download Failed",
        description: "Script file is currently unavailable."
    }
};
let notificationTimer = null;
let notificationRemoveTimer = null;
function cacheSafeURL(path) {
    const url = new URL(path, window.location.href);
    url.searchParams.set("v", Date.now().toString());
    return url.toString();
}
function debugData(message, details = null) {
    if(details){
        console.warn(DATA_DEBUG_PREFIX, message, details);
        return;
    }
    console.warn(DATA_DEBUG_PREFIX, message);
}
function normalizeScriptsData(data) {
    const entries = Array.isArray(data) ? data : [data];
    return entries.filter(script => {
        const isValid = script && typeof script === "object" && !Array.isArray(script);
        if(!isValid) debugData("Ignored invalid script entry.", script);
        return isValid;
    }).map(script => ({
        file: typeof script.file === "string" ? script.file.trim() : "",
        name: typeof script.name === "string" && script.name.trim() ? script.name.trim() : "Untitled Script",
        description: typeof script.description === "string" ? script.description.trim() : ""
    }));
}
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;"
    }[character]));
}
async function loadData() {
    try{
        const notificationResponse = await fetch(cacheSafeURL("notifications.json"), {
            cache: "no-store"
        });
        if(notificationResponse.ok){
            notifications = {
                ...notifications,
                ...await notificationResponse.json()
            };
        }
    }catch(error){
        debugData("Unable to load notifications.json. Using defaults.", error);
        notifications = { ...notifications };
    }

    try{
        const scriptResponse = await fetch(cacheSafeURL("script-data.json"), {
            cache: "no-store"
        });
        if(!scriptResponse.ok) throw new Error("Unable to load script data.");
        const loadedScripts = await scriptResponse.json();
        scriptsData = normalizeScriptsData(loadedScripts);
        displayScripts(scriptsData);
    }catch(error){
        debugData("Unable to load or parse script-data.json.", error);
        scriptsData = [];
        displayScripts(scriptsData);
    }
}
function openTab(tabName, button = null) {
    document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
    document.getElementById(tabName).classList.add("active");
    document.querySelectorAll(".tab, .sidebar button").forEach(btn => btn.classList.remove("active"));
    if(button) button.classList.add("active");
    document.querySelectorAll(`[onclick*="${tabName}"]`).forEach(btn => btn.classList.add("active"));
    document.querySelector(".sidebar")?.classList.remove("active");
}
function notify(type) {
    const data = notifications[type];
    if(!data) return;

    let root = document.getElementById("notificationRoot");
    if(!root){
        root = document.createElement("div");
        root.id = "notificationRoot";
        root.className = "notification-root";
        root.setAttribute("aria-live", "polite");
        root.setAttribute("aria-atomic", "true");
        document.body.appendChild(root);
    }

    clearTimeout(notificationTimer);
    clearTimeout(notificationRemoveTimer);
    root.innerHTML = "";

    const box = document.createElement("div");
    box.className = "notification";
    box.setAttribute("role", "status");

    const iconWrap = document.createElement("span");
    iconWrap.className = "notification__icon";
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", data.icon);
    iconWrap.appendChild(icon);

    const content = document.createElement("div");
    content.className = "notification__content";

    const title = document.createElement("h3");
    title.className = "notification__title";
    title.textContent = data.title;

    const description = document.createElement("p");
    description.className = "notification__description";
    description.textContent = data.description;

    content.append(title, description);
    box.append(iconWrap, content);
    root.appendChild(box);

    lucide.createIcons({
        attrs: {
            "aria-hidden": "true"
        }
    });

    requestAnimationFrame(() => {
        requestAnimationFrame(() => box.classList.add("show"));
    });

    notificationTimer = setTimeout(() => {
        box.classList.remove("show");
        notificationRemoveTimer = setTimeout(() => {
            box.remove();
        }, 500);
    }, 3000);
}
function displayScripts(data) {
    const container = document.getElementById("scriptContainer");
    container.innerHTML = "";
    container.classList.toggle("is-empty", data.length === 0);
    if(data.length === 0){
        container.innerHTML = `
        <div class="empty-card">
            <i data-lucide="search-x"></i>
            <h2>No Script Found</h2>
            <p>No scripts matched your search.</p>
        </div>`;
        lucide.createIcons();
        return;
    }
    data.forEach(script => {
        const hasFile = Boolean(script.file);
        const safeFileArgument = escapeHTML(JSON.stringify(script.file));
        container.innerHTML += `
        <div class="script-card">
            <div class="script-title">
                <i data-lucide="file-code"></i>
                <h2>${escapeHTML(script.name)}</h2>
            </div>
            <p>${escapeHTML(script.description)}</p>
            <div class="script-actions">
                <button class="primary" ${hasFile ? `onclick="copyScript(${safeFileArgument})"` : "disabled"}>
                    Copy Script
                </button>
                <button class="primary" ${hasFile ? `onclick="downloadScript(${safeFileArgument})"` : "disabled"}>
                    ${hasFile ? "Download" : "Unavailable"}
                </button>
            </div>
        </div>`;
    });
    lucide.createIcons();
}
function getRawURL(url){
    if(!url) return "";
    if(!url.includes("github.com")) return url;
    return url
    .replace("github.com", "raw.githubusercontent.com")
    .replace("/blob/", "/");
}
async function copyScript(url){
    try{
        if(!url) throw new Error("Missing script file URL.");
        const response = await fetch(getRawURL(url));
        if(!response.ok) throw new Error();
        const text = await response.text();
        await navigator.clipboard.writeText(text);
        notify("copy_success");
    }catch{
        notify("copy_failed");
    }
}
async function downloadScript(url){
    try{
        if(!url) throw new Error("Missing script file URL.");
        const response = await fetch(getRawURL(url));
        if(!response.ok) throw new Error();
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = url.split("/").pop();
        document.body.appendChild(link);
        link.click();
        link.remove();
    }catch{
        notify("download_failed");
    }
}
document.addEventListener("DOMContentLoaded",()=>{
    loadData();
    document.getElementById("scriptSearch").addEventListener("input",(e)=>{
        const value = e.target.value.toLowerCase();
        const filtered = scriptsData.filter(script =>
            script.name.toLowerCase().includes(value) ||
            script.description.toLowerCase().includes(value)
        );
        displayScripts(filtered);
    });
});
function toggleMenu(){
    document.querySelector(".sidebar").classList.toggle("active");
}
