document.addEventListener('DOMContentLoaded', () => {
    setupWindowControls();
    setupModalControls();
    setupQuranNavigation();
    getVerseOfTheDay();
    startLiveClock();
});

// --- QURAN NAVIGATION SETUP ---
function setupQuranNavigation() {
    const quranNavWidget = document.querySelector('.quran-nav-widget');
    const quranModal = document.getElementById('quran-disclaimer-modal');
    const proceedBtn = document.getElementById('quran-proceed-btn');
    const cancelBtn = document.getElementById('quran-cancel-btn');
    const dontShowCheckbox = document.getElementById('dont-show-disclaimer');

    quranNavWidget?.addEventListener('click', () => {
        if (localStorage.getItem('hideQuranDisclaimer') === 'true') {
            window.electronAPI.openQuran();
        } else {
            quranModal.style.display = 'flex';
        }
    });

    cancelBtn?.addEventListener('click', () => {
        quranModal.style.display = 'none';
        if (dontShowCheckbox) dontShowCheckbox.checked = false; // Reset
    });

    proceedBtn?.addEventListener('click', () => {
        if (dontShowCheckbox && dontShowCheckbox.checked) {
            localStorage.setItem('hideQuranDisclaimer', 'true');
        }
        quranModal.style.display = 'none';
        window.electronAPI.openQuran();
    });
}


// --- Verse of the Day ---
async function getVerseOfTheDay() {
    const verseTextElement = document.querySelector('.verse-text');
    const verseRefElement = document.querySelector('.verse-reference');

    verseTextElement.innerText = '"Loading..."';
    verseRefElement.innerText = '';

    try {
        const randomNumber = Math.floor(Math.random() * 6236) + 1;
        const response = await fetch(`https://api.alquran.cloud/v1/ayah/${randomNumber}/editions/en.clearquran,en.sahih`);

        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

        const data = await response.json();

        if (data.code === 200 && data.data && data.data.length > 0) {
            let translationData = data.data.find(edition => edition.edition.identifier === 'en.clearquran');
            if (!translationData) {
                translationData = data.data.find(edition => edition.edition.identifier === 'en.sahih');
            }

            if (translationData) {
                const verseText = translationData.text;
                const surahName = translationData.surah.englishName;
                const verseNumber = translationData.numberInSurah;

                verseTextElement.innerText = `"${verseText}"`;
                verseRefElement.innerText = `- Quran ${surahName}:${verseNumber}`;
            } else {
                throw new Error("No suitable English translation found.");
            }
        } else {
            throw new Error(`API returned error code: ${data.code}`);
        }
    } catch (error) {
        console.error('Failed to fetch Verse of the Day:', error);
        verseTextElement.innerText = '"Indeed, with hardship will be ease."';
        verseRefElement.innerText = '- Quran 94:6';
    }
}

// --- MODAL & SETTINGS ---
function setupModalControls() {
    const settingsModal = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('settings-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const refreshBtn = document.getElementById('refresh-location-btn');
    const setLocationBtn = document.getElementById('set-location-btn');
    const testAdhanBtn = document.getElementById('test-adhan-btn');
    const restartBtn = document.getElementById('restart-app-btn');

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'flex';
            // Load current settings into inputs
            document.getElementById('method-select').value = localStorage.getItem('prayerMethod') || '2';
            document.getElementById('school-select').value = localStorage.getItem('prayerSchool') || '0';
            document.getElementById('format-select').value = localStorage.getItem('timeFormat') || '24h';
            document.getElementById('mute-toggle').checked = localStorage.getItem('isMuted') === 'true';
        });
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            saveSettings();
            settingsModal.style.display = 'none';
            getLocation(true);
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            localStorage.removeItem('userCoords');
            localStorage.removeItem('locationName');
            localStorage.removeItem('manualCity');
            document.getElementById('location-text').innerText = 'Detecting...';
            getLocation(true);
        });
    }

    if (setLocationBtn) {
        setLocationBtn.addEventListener('click', () => {
            const cityInput = document.getElementById('city-input');
            const city = cityInput.value.trim();
            if (city) {
                localStorage.setItem('manualCity', city);
                localStorage.removeItem('userCoords');
                localStorage.removeItem('locationName');
                document.getElementById('location-text').innerText = 'Setting...';
                saveSettings();
                getLocation(true);
            }
        });
    }

    if (testAdhanBtn) {
        testAdhanBtn.addEventListener('click', () => {
            window.electronAPI.testAdhan();
        });
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to restart NoorDesk?")) {
                window.electronAPI.restartApp();
            }
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    // Initial Load
    getLocation();
}

function saveSettings() {
    const settings = {
        prayerMethod: document.getElementById('method-select').value,
        prayerSchool: document.getElementById('school-select').value,
        timeFormat: document.getElementById('format-select').value,
        isMuted: document.getElementById('mute-toggle').checked,
        manualCity: localStorage.getItem('manualCity'),
        userCoords: JSON.parse(localStorage.getItem('userCoords'))
    };
    localStorage.setItem('prayerMethod', settings.prayerMethod);
    localStorage.setItem('prayerSchool', settings.prayerSchool);
    localStorage.setItem('timeFormat', settings.timeFormat);
    localStorage.setItem('isMuted', settings.isMuted);

    window.electronAPI.settingsUpdated(settings);
    console.log('Settings saved and sent to main process.');
}

function formatTime(time24) {
    if (!time24) return '--:--';
    const format = localStorage.getItem('timeFormat') || '24h';
    if (format === '12h') {
        const [hours, minutes] = time24.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    }
    return time24;
}

async function getLocation(forceRefresh = false) {
    const manualCity = localStorage.getItem('manualCity');
    if (manualCity && !forceRefresh) {
        getPrayerTimesByCity(manualCity);
        return;
    }
    const savedCoords = localStorage.getItem('userCoords');
    if (savedCoords && !forceRefresh) {
        const locationName = localStorage.getItem('locationName');
        if (locationName) {
            document.getElementById('location-text').innerText = locationName;
        }
        const { latitude, longitude } = JSON.parse(savedCoords);
        getPrayerTimesByCoords(latitude, longitude, locationName);
        return;
    }
    try {
        document.getElementById('location-text').innerText = 'Detecting...';
        const response = await fetch('https://apiip.net/api/check?accessKey=7ec5a818-c4dc-4780-9256-5389ad5e29fe');
        const data = await response.json();

        if (data.latitude && data.longitude && data.city && data.countryName) {
            const { latitude, longitude, city, countryName } = data;
            const locationString = `${city}, ${countryName}`;

            localStorage.setItem('userCoords', JSON.stringify({ latitude, longitude }));
            localStorage.setItem('locationName', locationString);
            document.getElementById('location-text').innerText = locationString;
            saveSettings();
            getPrayerTimesByCoords(latitude, longitude, locationString);
        } else {
            throw new Error('IP lookup failed: Incomplete data received.');
        }
    } catch (error) {
        console.error(`Location error: ${error.message}`);
        document.getElementById('location-text').innerText = 'Detection failed. Showing default.';
        getPrayerTimesByCity('Ahmedabad, India');
    }
}

function getPrayerTimesByCity(city) {
    const method = localStorage.getItem('prayerMethod') || '2';
    const school = localStorage.getItem('prayerSchool') || '0';
    const url = `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=&method=${method}&school=${school}`;
    fetchPrayerData(url, city);
}

function getPrayerTimesByCoords(latitude, longitude, locationName = null) {
    const method = localStorage.getItem('prayerMethod') || '2';
    const school = localStorage.getItem('prayerSchool') || '0';
    const url = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=${method}&school=${school}`;
    const locationToPass = locationName || localStorage.getItem('locationName');
    fetchPrayerData(url, locationToPass);
}

let notifiedPrayers = [];
let prayerTimesData = {};
let countdownInterval;

function fetchPrayerData(url, locationString = null) {
    fetch(url).then(res => res.json()).then(data => {
        if (data.code === 200) {
            prayerTimesData = data.data.timings;
            notifiedPrayers = [];
            updatePrayerTimesUI(data.data);
            startCountdown();
            if (locationString) {
                document.getElementById('location-text').innerText = locationString;
            } else if (localStorage.getItem('locationName')) {
                document.getElementById('location-text').innerText = localStorage.getItem('locationName');
            } else {
                document.getElementById('location-text').innerText = 'Location set';
            }
        } else {
            document.getElementById('location-text').innerText = `Could not find location`;
        }
    }).catch(err => {
        console.error('Error fetching data:', err);
        document.getElementById('location-text').innerText = 'Request failed';
    });
}

function updatePrayerTimesUI(data) {
    document.getElementById('fajr-time').innerText = formatTime(data.timings.Fajr);
    document.getElementById('dhuhr-time').innerText = formatTime(data.timings.Dhuhr);
    document.getElementById('asr-time').innerText = formatTime(data.timings.Asr);
    document.getElementById('maghrib-time').innerText = formatTime(data.timings.Maghrib);
    document.getElementById('isha-time').innerText = formatTime(data.timings.Isha);
    document.getElementById('gregorian-date').innerText = `${data.date.gregorian.weekday.en}, ${data.date.gregorian.date}`;
    document.getElementById('hijri-date').innerText = `${data.date.hijri.day} ${data.date.hijri.month.en} ${data.date.hijri.year}`;
}

function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        const now = new Date();
        let nextPrayerName = '';
        let nextPrayerTime = null;
        const prayerTimes = { Fajr: prayerTimesData.Fajr, Dhuhr: prayerTimesData.Dhuhr, Asr: prayerTimesData.Asr, Maghrib: prayerTimesData.Maghrib, Isha: prayerTimesData.Isha };
        for (const [name, time] of Object.entries(prayerTimes)) {
            if (!time) continue;
            const [hours, minutes] = time.split(':');
            const prayerDate = new Date();
            prayerDate.setHours(hours, minutes, 0, 0);
            if (prayerDate > now) {
                nextPrayerName = name;
                nextPrayerTime = prayerDate;
                break;
            }
        }
        if (!nextPrayerTime) {
            nextPrayerName = 'Fajr';
            const [hours, minutes] = prayerTimesData.Fajr.split(':');
            nextPrayerTime = new Date();
            nextPrayerTime.setDate(nextPrayerTime.getDate() + 1);
            nextPrayerTime.setHours(hours, minutes, 0, 0);
        }
        const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        prayerNames.forEach(name => {
            const card = document.getElementById(`${name.toLowerCase()}-card`);
            card?.classList.toggle('next-prayer', name === nextPrayerName);
        });
        const diff = nextPrayerTime - now;
        const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        document.getElementById('next-prayer-name').innerText = nextPrayerName;
        document.getElementById('countdown-timer').innerText = `${hours}:${minutes}:${seconds}`;
    }, 1000);
}

function setupWindowControls() {
    document.getElementById('minimize-btn').addEventListener('click', () => window.electronAPI.minimizeApp());
    document.getElementById('toggle-fullscreen-btn').addEventListener('click', () => window.electronAPI.toggleFullscreen());
    document.getElementById('close-btn').addEventListener('click', () => window.electronAPI.closeApp());
}

function startLiveClock() {
    const clockElement = document.getElementById('live-clock');
    setInterval(() => {
        const now = new Date();
        clockElement.innerText = now.toLocaleTimeString('en-US', { hour12: false });
    }, 1000);
}