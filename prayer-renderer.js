document.addEventListener('DOMContentLoaded', () => {
    // --- NAVIGATION ---
    const dashboardBtn = document.getElementById('dashboard-btn');
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', () => {
            window.electronAPI.navigateToDashboard();
        });
    }

    // --- INITIAL DATA LOAD ---
    // Use the saved location data from the dashboard
    const savedCoords = localStorage.getItem('userCoords');
    const locationName = localStorage.getItem('locationName');
    const manualCity = localStorage.getItem('manualCity');

    const locationTextElement = document.getElementById('location-text');

    // Prioritize manual city, then saved location, then default
    if (manualCity) {
        locationTextElement.innerText = manualCity;
        getPrayerTimesByCity(manualCity);
    } else if (savedCoords) {
        if (locationName) {
            locationTextElement.innerText = locationName;
        }
        const { latitude, longitude } = JSON.parse(savedCoords);
        getPrayerTimesByCoords(latitude, longitude);
    } else {
        // Fallback to default if no location is saved at all
        locationTextElement.innerText = 'Ahmedabad, India';
        getPrayerTimesByCity('Ahmedabad');
    }
});

// --- DATA FETCHING ---
function getPrayerTimesByCity(city) {
    const method = localStorage.getItem('prayerMethod') || '2';
    const school = localStorage.getItem('prayerSchool') || '0';
    const url = `http://api.aladhan.com/v1/timingsByCity?city=${city}&country=&method=${method}&school=${school}`;
    fetchPrayerData(url);
}

function getPrayerTimesByCoords(latitude, longitude) {
    const method = localStorage.getItem('prayerMethod') || '2';
    const school = localStorage.getItem('prayerSchool') || '0';
    const url = `http://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=${method}&school=${school}`;
    fetchPrayerData(url);
}

function fetchPrayerData(url) {
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.code === 200) {
                updateUI(data.data);
            } else {
                console.error("Failed to fetch prayer times for prayer page.");
            }
        })
        .catch(err => console.error(err));
}


// --- UI UPDATES ---
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

function updateUI(data) {
    if (!data) return;
    document.getElementById('fajr-time').innerText = formatTime(data.timings.Fajr);
    document.getElementById('dhuhr-time').innerText = formatTime(data.timings.Dhuhr);
    document.getElementById('asr-time').innerText = formatTime(data.timings.Asr);
    document.getElementById('maghrib-time').innerText = formatTime(data.timings.Maghrib);
    document.getElementById('isha-time').innerText = formatTime(data.timings.Isha);
    document.getElementById('hijri-date').innerText = `${data.date.hijri.day} ${data.date.hijri.month.en} ${data.date.hijri.year}`;
    document.getElementById('gregorian-date').innerText = `${data.date.gregorian.weekday.en}, ${data.date.gregorian.date}`;
}
