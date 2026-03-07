function initNavbar() {
    const navbar    = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu   = document.getElementById('navMenu');
    const navLinks  = document.querySelectorAll('.nav-link');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    window.scrollTo({
                        top: target.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}
function initTabs() {
    const tabBtns   = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const panel = document.getElementById(btn.getAttribute('data-tab'));
            if (panel) panel.classList.add('active');
        });
    });
}
function initDiary() {
    const diaryForm = document.getElementById('diaryForm');
    const moodBtns  = document.querySelectorAll('.mood-btn');
    moodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            moodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('selectedMood').value = btn.getAttribute('data-mood');
        });
    });
    diaryForm.addEventListener('submit', function (e) {
        e.preventDefault();
        saveDiaryEntry();
    });
}
function saveDiaryEntry() {
    const periodStart    = document.getElementById('periodStart').value;
    const periodEnd      = document.getElementById('periodEnd').value;
    const flowIntensity  = document.getElementById('flowIntensity').value;
    const selectedMood   = document.getElementById('selectedMood').value;
    const notes          = document.getElementById('notes').value.trim();
    const symptoms = [];
    document.querySelectorAll('input[name="symptom"]:checked').forEach(cb => {
        symptoms.push(cb.value);
    });
    if (new Date(periodStart) > new Date(periodEnd)) {
        alert('Tanggal mulai tidak boleh lebih dari tanggal selesai!');
        return;
    }
    const entry = {
        id: Date.now(),
        periodStart,
        periodEnd,
        flowIntensity,
        symptoms,
        mood: selectedMood,
        notes,
        createdAt: new Date().toISOString()
    };
    const entries = JSON.parse(localStorage.getItem('Lunara_diary')) || [];
    entries.push(entry);
    localStorage.setItem('Lunara_diary', JSON.stringify(entries));
    document.getElementById('diaryForm').reset();
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));

    loadHistoryData();
    alert('Catatan berhasil disimpan!');
    document.querySelector('.diary-history-container').scrollIntoView({ behavior: 'smooth' });
}
function loadHistoryData() {
    const historyList = document.getElementById('historyList');
    const entries     = JSON.parse(localStorage.getItem('Lunara_diary')) || [];
    if (entries.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-inbox"></i>
                <p>Belum ada catatan periode</p>
            </div>`;
        document.getElementById('avgCycle').textContent    = '- hari';
        document.getElementById('avgDuration').textContent = '- hari';
        return;
    }
    entries.sort((a, b) => new Date(b.periodStart) - new Date(a.periodStart));
    const moodMap = {
        'sangat buruk': '😡',
        'buruk':        '😦',
        'normal':       '😐',
        'baik':         '😊',
        'sangat baik':  '😄'
    };
    const symptomsMap = {
        'kram':         'Kram',
        'sakitkepala':  'Sakit kepala',
        'mood berubah': 'Mood tidak stabil',
        'keletihan':    'Kelelahan',
        'pusing':       'Pusing',
        'pencernaan':   'Nyeri pencernaan',
        'Nafsu':        'Nafsu makan meningkat',
        'ciri':         'Bercak darah',
        'keputihan':    'Keputihan',
        'timbul':       'Timbul jerawat',
        'minyak':       'Wajah lebih berminyak',
        'fisik':        'Perubahan fisik'
    };
    let html = '';
    entries.forEach(entry => {
        const start    = new Date(entry.periodStart);
        const end      = new Date(entry.periodEnd);
        const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        const symptomsText = entry.symptoms
            .map(s => symptomsMap[s] || s)
            .join(', ');
        const moodEmoji = entry.mood ? (moodMap[entry.mood] || '') : '';
        const moodLabel = entry.mood
            ? `<span class="symptom-tag mood-tag">${moodEmoji} ${entry.mood}</span>`
            : '';
        const notesHtml = entry.notes
            ? `<div class="history-item-notes"><i class="fas fa-sticky-note"></i> ${entry.notes}</div>`
            : '';
        html += `
            <div class="history-item">
                <div class="history-item-header">
                    <span class="history-item-date">${formatDate(entry.periodStart)} – ${formatDate(entry.periodEnd)}</span>
                    <span class="history-item-duration">${duration} hari</span>
                </div>
                <div class="history-item-symptoms">
                    ${entry.flowIntensity ? `<span class="symptom-tag">💧 ${entry.flowIntensity}</span>` : ''}
                    ${symptomsText        ? `<span class="symptom-tag">${symptomsText}</span>` : ''}
                    ${moodLabel}
                </div>
                ${notesHtml}
            </div>`;
    });
    historyList.innerHTML = html;
    calculateAverages(entries);
}
function calculateAverages(entries) {
    if (entries.length < 2) {
        document.getElementById('avgCycle').textContent    = '- hari';
        document.getElementById('avgDuration').textContent = '- hari';
        return;
    }
    let totalDuration = 0;
    let totalCycle    = 0;
    entries.forEach(entry => {
        const start    = new Date(entry.periodStart);
        const end      = new Date(entry.periodEnd);
        totalDuration += Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    });
    for (let i = 0; i < entries.length - 1; i++) {
        const cycle = Math.ceil(
            (new Date(entries[i].periodStart) - new Date(entries[i + 1].periodStart))
            / (1000 * 60 * 60 * 24)
        );
        if (cycle > 0) totalCycle += cycle;
    }
    const avgDuration = Math.round(totalDuration / entries.length);
    const avgCycle    = Math.round(totalCycle / (entries.length - 1));
    document.getElementById('avgDuration').textContent = avgDuration + ' hari';
    document.getElementById('avgCycle').textContent    = avgCycle > 0 ? avgCycle + ' hari' : '- hari';
    if (avgCycle > 0) localStorage.setItem('Lunara_avg_cycle', avgCycle);
}
function initPrediction() {
    const predictionForm = document.getElementById('predictionForm');
    predictionForm.addEventListener('submit', function (e) {
        e.preventDefault();
        calculatePrediction();
    });
    loadLastPeriodDate();
}
function loadLastPeriodDate() {
    const entries = JSON.parse(localStorage.getItem('Lunara_diary')) || [];
    if (entries.length > 0) {
        entries.sort((a, b) => new Date(b.periodStart) - new Date(a.periodStart));
        document.getElementById('lastPeriod').value = entries[0].periodStart;
        const avgCycle = localStorage.getItem('Lunara_avg_cycle');
        if (avgCycle) document.getElementById('cycleLength').value = avgCycle;
    }
}
function calculatePrediction() {
    const lastPeriod  = document.getElementById('lastPeriod').value;
    const cycleLength = parseInt(document.getElementById('cycleLength').value);
    if (!lastPeriod || !cycleLength) {
        alert('Mohon lengkapi semua data!');
        return;
    }
    const lastDate   = new Date(lastPeriod);
    const today      = new Date();
    const nextPeriod = new Date(lastDate);
    nextPeriod.setDate(nextPeriod.getDate() + cycleLength);
    const ovulationDate = new Date(nextPeriod);
    ovulationDate.setDate(ovulationDate.getDate() - 14);
    const fertileStart = new Date(ovulationDate);
    fertileStart.setDate(fertileStart.getDate() - 5);
    const fertileEnd = new Date(ovulationDate);
    fertileEnd.setDate(fertileEnd.getDate() + 1);
    const daysUntil = Math.ceil((nextPeriod - today) / (1000 * 60 * 60 * 24));
    let periodDuration = 5;
    const entries = JSON.parse(localStorage.getItem('Lunara_diary')) || [];
    if (entries.length > 0) {
        let totalDuration = 0;
        entries.forEach(entry => {
            const s = new Date(entry.periodStart);
            const e = new Date(entry.periodEnd);
            totalDuration += Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
        });
        periodDuration = Math.round(totalDuration / entries.length);
    }
    displayPredictionResult(nextPeriod, ovulationDate, daysUntil, periodDuration, fertileStart, fertileEnd);
    generateCalendar(nextPeriod, ovulationDate, daysUntil, periodDuration, fertileStart, fertileEnd);
}
function displayPredictionResult(nextPeriod, ovulationDate, daysUntil, periodDuration, fertileStart, fertileEnd) {
    const resultContainer = document.getElementById('predictionResult');
    resultContainer.innerHTML = `
        <div class="prediction-result">
            <h3>Hasil Prediksi</h3>
            <div class="countdown-container">
                <div class="countdown-item">
                    <span class="countdown-number">${Math.max(0, daysUntil)}</span>
                    <span class="countdown-label">Hari</span>
                </div>
                <div class="countdown-item">
                    <span class="countdown-number">${Math.floor(Math.max(0, daysUntil) / 7)}</span>
                    <span class="countdown-label">Minggu</span>
                </div>
            </div>
            <div class="prediction-info">
                <div class="info-box highlight">
                    <div class="info-box-label">Periode Berikutnya</div>
                    <div class="info-box-value">${formatDate(nextPeriod.toISOString().split('T')[0])}</div>
                </div>
                <div class="info-box">
                    <div class="info-box-label">Perkiraan Durasi</div>
                    <div class="info-box-value">${periodDuration} hari</div>
                </div>
                <div class="info-box">
                    <div class="info-box-label">Tanggal Ovulasi</div>
                    <div class="info-box-value">${formatDate(ovulationDate.toISOString().split('T')[0])}</div>
                </div>
                <div class="info-box">
                    <div class="info-box-label">Periode Subur</div>
                    <div class="info-box-value">${formatDate(fertileStart.toISOString().split('T')[0])} – ${formatDate(fertileEnd.toISOString().split('T')[0])}</div>
                </div>
            </div>
        </div>`;
}
let currentCalendarDate = new Date();

function initCalendar() {
    generateCalendar();
}
function generateCalendar(nextPeriod, ovulationDate, daysUntil, periodDuration, fertileStart, fertileEnd) {
    const container = document.getElementById('calendarContainer');
    const year      = currentCalendarDate.getFullYear();
    const month     = currentCalendarDate.getMonth();
    const firstDay   = new Date(year, month, 1);
    const lastDay    = new Date(year, month + 1, 0);
    const startDay   = firstDay.getDay();
    const totalDays  = lastDay.getDate();
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni',
                        'Juli','Agustus','September','Oktober','November','Desember'];
    const weekdays   = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
    let html = `
        <div class="calendar">
            <div class="calendar-header">
                <div class="calendar-month">${monthNames[month]} ${year}</div>
                <div class="calendar-nav">
                    <button onclick="changeMonth(-1)" aria-label="Bulan sebelumnya"><i class="fas fa-chevron-left"></i></button>
                    <button onclick="changeMonth(1)"  aria-label="Bulan berikutnya"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
            <div class="calendar-weekdays">
                ${weekdays.map(d => `<div>${d}</div>`).join('')}
            </div>
            <div class="calendar-days">`;
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month">${prevMonthLastDay - i}</div>`;
    }
    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
        const cur = new Date(year, month, day);
        let classes = 'calendar-day';
        if (cur.toDateString() === today.toDateString()) classes += ' today';
        if (nextPeriod && daysUntil > 0 && daysUntil <= periodDuration) {
            const pStart = new Date(nextPeriod);
            pStart.setDate(pStart.getDate() - periodDuration + 1);
            if (cur >= pStart && cur <= nextPeriod) classes += ' period';
        }
        if (nextPeriod     && cur.toDateString() === nextPeriod.toDateString())    classes += ' predicted';
        if (ovulationDate  && cur.toDateString() === ovulationDate.toDateString()) classes += ' ovulation';
        if (fertileStart   && fertileEnd && cur >= fertileStart && cur <= fertileEnd) classes += ' fertile';
        html += `<div class="${classes}">${day}</div>`;
    }
    const remaining = 42 - (startDay + totalDays);
    for (let i = 1; i <= remaining; i++) {
        html += `<div class="calendar-day other-month">${i}</div>`;
    }

    html += '</div></div>';
    container.innerHTML = html;
}
function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    const lastPeriod  = document.getElementById('lastPeriod').value;
    const cycleLength = parseInt(document.getElementById('cycleLength').value);
    if (lastPeriod && cycleLength) {
        calculatePrediction();
    } else {
        generateCalendar();
    }
}
function initScrollTop() {
    const btn = document.getElementById('scrollTop');
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 300);
    });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
function initRevealOnScroll() {
    const hero      = document.querySelector('.hero') || document.getElementById('home');
    const revealEls = document.querySelectorAll('.reveal-on-scroll');
    if (!hero || !revealEls.length) return;
    const observer = new IntersectionObserver(entries => {
        const e = entries[0];
        if (e.isIntersecting) {
            revealEls.forEach(el => {
                el.classList.remove('show');
                el.style.transitionDelay = '';
            });
        } else {
            revealEls.forEach((el, i) => {
                el.style.transitionDelay = (el.dataset.delay ? parseInt(el.dataset.delay) : i * 100) + 'ms';
                el.classList.add('show');
            });
        }
    }, { root: null, threshold: 0, rootMargin: '0px' });
    observer.observe(hero);
}
function initScrollSpy() {
    const navLinks = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
    if (!navLinks.length) return;
    const sections = navLinks
        .map(l => document.querySelector(l.getAttribute('href')))
        .filter(Boolean)
        .filter(s => !(s.dataset?.skipSpy === 'true' || s.dataset?.skipSpy === '1') && !s.classList.contains('no-scrollspy'));

    if (!sections.length) return;
    const clearActive = () => navLinks.forEach(l => l.classList.remove('active'));
    const offset = 90;
    let ticking  = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
            const fromTop = window.scrollY + offset;
            let current  = null;
            for (let i = sections.length - 1; i >= 0; i--) {
                if (sections[i].offsetTop <= fromTop) { current = sections[i]; break; }
            }
            clearActive();
            if (current) {
                const link = document.querySelector(`.nav-link[href="#${current.id}"]`);
                if (link) link.classList.add('active');
            }
            ticking = false;
        });
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}
function formatDate(dateStr) {
    const date  = new Date(dateStr);
    const month = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
    return `${date.getDate()} ${month[date.getMonth()]} ${date.getFullYear()}`;
}
document.addEventListener('DOMContentLoaded', () => {
    try {
        initNavbar();
        initTabs();
        initDiary();
        loadHistoryData();
        initPrediction();
        initCalendar();
        initScrollTop();
        initRevealOnScroll();
        initScrollSpy();
    } catch (err) {
        console.error('Initialization error:', err);
    }
});
