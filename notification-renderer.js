document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('adhan-audio');
    const dismissBtn = document.getElementById('dismiss-btn');
    const prayerNameEl = document.getElementById('prayer-name');

    window.electronAPI.onPlayAdhan((event, prayerName) => {
        console.log("Received play-adhan event for:", prayerName);
        if (prayerName) {
            prayerNameEl.innerText = `It is time for ${prayerName}`;
        } else {
            prayerNameEl.innerText = "It is time for Prayer";
        }

        audio.currentTime = 0;
        audio.play().catch(e => console.error("Error playing adhan:", e));
    });

    dismissBtn.addEventListener('click', () => {
        audio.pause();
        audio.currentTime = 0;
        window.electronAPI.dismissNotification();
    });

    audio.addEventListener('ended', () => {
        window.electronAPI.dismissNotification();
    });
});
