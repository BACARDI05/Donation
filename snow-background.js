const snowLayerId = "snow-background";
const snowSettingsFile = "snow-particles.json";

function snowConfigURL(path) {
    const url = new URL(path, window.location.href);
    url.searchParams.set("v", Date.now().toString());
    return url.toString();
}

async function startSnowfall() {
    const snowLayer = document.getElementById(snowLayerId);
    if(!snowLayer || typeof particlesJS !== "function") return;

    try{
        const response = await fetch(snowConfigURL(snowSettingsFile), {
            cache: "no-store"
        });
        if(!response.ok) throw new Error("Unable to load snow settings.");
        const snowSettings = await response.json();
        particlesJS(snowLayerId, snowSettings);
    }catch(error){
        console.warn("[snowfall]", "Unable to start snow background.", error);
    }
}

document.addEventListener("DOMContentLoaded", startSnowfall);
