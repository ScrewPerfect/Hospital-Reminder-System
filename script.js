document.addEventListener('DOMContentLoaded', () => {
    // --- EARLY EXIT ---
    // This is a crucial check to ensure this script only runs on the main dashboard page.
    if (!document.getElementById('appointmentForm')) {
        return; 
    }

    // --- DOM ELEMENT REFERENCES ---
    const appointmentForm = document.getElementById('appointmentForm');
    const appointmentList = document.getElementById('appointmentList');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const monthYearEl = document.getElementById('monthYear');
    const calendarDaysEl = document.getElementById('calendarDays');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const editModal = document.getElementById('editModal');
    const editAppointmentForm = document.getElementById('editAppointmentForm');
    const cancelEditBtn = document.getElementById('cancelEdit');
    const healthTipWidget = document.getElementById('healthTipWidget');
    const quoteWidget = document.getElementById('quoteWidget');
    const languageSwitcher = document.getElementById('language-switcher');

    let currentDate = new Date();
    let appointments = [];
    let translations = {}; 

    // --- TRANSLATION FUNCTIONS ---
    async function loadLanguage(lang) {
        try {
            // THE FINAL FIX: Using the relative path that starts from the index.html location.
            // Since index.html and php folder are siblings, this is the most reliable path structure.
            const path = `php/locales/${lang.toLowerCase()}.json?v=${Date.now()}`;
            
            const response = await fetch(path);
            
            // Check if response status is OK (200-299)
            if (!response.ok) {
                 // Throw a custom error if the file is not found (404)
                throw new Error(`Failed to load ${lang}.json from path: ${path}. Status: ${response.status}`);
            }
            translations = await response.json();
            translatePage();
        } catch (error) {
            console.error(`Could not load language file for: ${lang}`, error);
            // Fallback to English if translation fails on the first attempt
            if (lang !== 'en') {
                loadLanguage('en');
            }
        }
    }

    function translatePage() {
        document.querySelectorAll('[data-i18n-key]').forEach(element => {
            const key = element.getAttribute('data-i18n-key');
            if (translations[key]) {
                element.textContent = translations[key];
            }
        });
        // Re-render user info and widgets after translation
        checkLoginStatus(true); 
        displayHealthTip();
        fetchQuote();
    }

    if (languageSwitcher) {
        languageSwitcher.addEventListener('change', (e) => {
            loadLanguage(e.target.value);
        });
    }

    // --- CORE FUNCTIONS ---

    const checkLoginStatus = async (isTranslation = false) => {
        try {
            const res = await fetch('php/check_session.php');
            const session = await res.json();
            if (session.loggedIn) {
                const userInfoDiv = document.getElementById('user-info');
                if (userInfoDiv) {
                    // Update user info and links based on current language
                    const profileText = translations.profileLink || 'Profile';
                    const logoutText = translations.logoutLink || 'Logout';

                    userInfoDiv.innerHTML = `
                        <p>
                            Welcome, <span class="font-semibold">${session.username}</span> | 
                            <a href="profile.html" class="link">${profileText}</a> | 
                            <a href="php/logout.php" class="link">${logoutText}</a>
                        </p>
                    `;
                }
                // Only load the language and fetch data on the FIRST run (not during translation update)
                if (!isTranslation) {
                    // Load saved language or default to 'en'
                    await loadLanguage(languageSwitcher ? languageSwitcher.value : 'en'); 
                    fetchAppointments();
                    displayHealthTip();
                    fetchQuote();
                }
            } else {
                window.location.href = 'login.html';
            }
        } catch {
            window.location.href = 'login.html';
        }
    };

    const fetchAppointments = async () => {
        if (!loadingState || !emptyState || !appointmentList) return;
        loadingState.style.display = 'block';
        emptyState.style.display = 'none';
        appointmentList.innerHTML = '';

        try {
            const res = await fetch(`./php/get_appointments.php?t=${Date.now()}`);
            const data = await res.json();

            if (data.success) {
                appointments = data.appointments;
                renderAppointments();
                renderCalendar();
            } else {
                alert(translations.loadingError || 'Could not fetch appointments.');
            }
        } catch (err) {
            console.error(err);
            alert(translations.loadingError || 'Error fetching appointments.');
        } finally {
            loadingState.style.display = 'none';
        }
    };

    // --- RENDER FUNCTIONS ---

    const renderAppointments = () => {
        appointmentList.innerHTML = '';
        if (appointments.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            appointments.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
            appointments.forEach(app => appointmentList.appendChild(createAppointmentCard(app)));
        }
        lucide.createIcons();
    };

    const createAppointmentCard = (app) => {
        const card = document.createElement('div');
        card.className = 'appointment-card';
        card.dataset.id = app.id;
        
        // Use translated text for buttons/status if available
        const statusText = translations[app.status.toLowerCase()] || app.status;
        const editText = translations.edit || 'Edit';
        const deleteText = translations.delete || 'Delete';

        card.innerHTML = `
            <div class="appointment-card-body">
                <p class="patient-name">${app.patient_name}</p>
                <p class="doctor-name">${translations.withDr || 'with Dr.'} ${app.doctor_name}</p>
                <div class="appointment-details">
                    <p><i data-lucide="calendar"></i>${app.date}</p>
                    <p><i data-lucide="clock"></i>${app.time}</p>
                    <p><i data-lucide="info"></i>${translations.notesLabel || 'Notes:'} ${app.notes || 'N/A'}</p>
                </div>
            </div>
            <div class="appointment-card-aside">
                <span class="status-tag status-${(app.status || 'scheduled').toLowerCase()}">${statusText}</span>
                <div class="appointment-actions">
                    <button class="icon-button edit-btn" data-id="${app.id}"><i data-lucide="edit-2"></i> ${editText}</button>
                    <button class="icon-button delete-btn" data-id="${app.id}"><i data-lucide="trash-2"></i> ${deleteText}</button>
                </div>
            </div>
        `;
        return card;
    };

    const renderCalendar = () => {
        if (!calendarDaysEl) return;
        calendarDaysEl.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        monthYearEl.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const appointmentDates = appointments.map(a => a.date);
        for (let i = 0; i < firstDay; i++) calendarDaysEl.innerHTML += '<div></div>';
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.textContent = day;
            dayEl.classList.add('calendar-day');
            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayEl.classList.add('today');
            }
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (appointmentDates.includes(dateStr)) dayEl.classList.add('has-appointment');
            calendarDaysEl.appendChild(dayEl);
        }
    };
    
    // --- WIDGET FUNCTIONS ---

    const displayHealthTip = () => {
        const tips = [
            translations.tip1 || "Drink at least 8 glasses of water a day to stay hydrated.",
            translations.tip2 || "Aim for 30 minutes of moderate exercise most days of the week.",
            translations.tip3 || "Eat a balanced diet with plenty of fruits and vegetables.",
            translations.tip4 || "Get 7-9 hours of quality sleep per night.",
            translations.tip5 || "Practice mindfulness or meditation to reduce stress levels."
        ];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        if (healthTipWidget) {
            healthTipWidget.innerHTML = `
                <i data-lucide="heart-pulse"></i>
                <div>
                    <h3 class="widget-title" data-i18n-key="healthTipTitle">${translations.healthTipTitle || 'Health Tip of the Day'}</h3>
                    <p class="widget-text">${randomTip}</p>
                </div>
            `;
            lucide.createIcons();
        }
    };
    
    const fetchQuote = async () => {
        if (quoteWidget) {
            try {
                const res = await fetch('php/get_quote.php');
                const data = await res.json();
                if (data.success) {
                    quoteWidget.innerHTML = `
                        <i data-lucide="quote"></i>
                        <div>
                            <h3 class="widget-title" data-i18n-key="quoteTitle">${translations.quoteTitle || 'Quote of the Day'}</h3>
                            <p class="widget-text">"${data.quote.q}" - <em>${data.quote.a}</em></p>
                        </div>
                    `;
                } else {
                     quoteWidget.innerHTML = `<p class="widget-text" data-i18n-key="couldNotLoadQuote">${translations.couldNotLoadQuote || 'Could not load quote.'}</p>`;
                }
            } catch {
                quoteWidget.innerHTML = `<p class="widget-text" data-i18n-key="couldNotLoadQuote">${translations.couldNotLoadQuote || 'Could not load quote.'}</p>`;
            }
            lucide.createIcons();
        }
    };


    // --- EVENT LISTENERS ---

    appointmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(appointmentForm);
        try {
            const res = await fetch('php/add_appointment.php', { method: 'POST', body: formData });
            const result = await res.json();
            if (result.success) {
                fetchAppointments();
                appointmentForm.reset();
            } else {
                alert(result.message || (translations.addError || 'Error adding appointment.'));
            }
        } catch {
            alert(translations.addError || 'Error adding appointment.');
        }
    });

    appointmentList.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const delBtn = e.target.closest('.delete-btn');
        if (editBtn) openEditModal(editBtn.dataset.id);
        if (delBtn && confirm(translations.confirmDelete || 'Are you sure you want to delete this appointment?')) {
            deleteAppointment(delBtn.dataset.id);
        }
    });

    const openEditModal = (id) => {
        const app = appointments.find(a => a.id == id);
        if (!app) return;
        document.getElementById('edit_appointment_id').value = app.id;
        document.getElementById('edit_patient_name').value = app.patient_name;
        document.getElementById('edit_doctor_name').value = app.doctor_name;
        document.getElementById('edit_appointment_date').value = app.date;
        document.getElementById('edit_appointment_time').value = app.time;
        document.getElementById('edit_status').value = app.status;
        document.getElementById('edit_notes').value = app.notes;
        editModal.classList.remove('hidden');
    };
    
    const closeEditModal = () => {
        if(editModal) editModal.classList.add('hidden');
    };
    
    if(cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeEditModal);
    }

    if(editAppointmentForm) {
        editAppointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(editAppointmentForm);
            try {
                const res = await fetch('php/update_appointment.php', { method: 'POST', body: formData });
                const result = await res.json();
                if (result.success) {
                    closeEditModal();
                    fetchAppointments();
                } else {
                    alert(result.message || (translations.updateError || 'Error updating appointment.'));
                }
            } catch (err) {
                console.error('Update appointment error:', err);
                alert(translations.updateError || 'An error occurred while updating.');
            }
        });
    }

    const deleteAppointment = async (id) => {
        try {
            const fd = new FormData();
            fd.append('appointment_id', id);
            const res = await fetch('php/delete_appointment.php', { method: 'POST', body: fd });
            const result = await res.json();
            if (result.success) fetchAppointments();
            else alert(result.message || (translations.deleteError || 'Error deleting appointment.'));
        } catch {
            alert(translations.deleteError || 'Error deleting appointment.');
        }
    };

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    // --- INITIAL LOAD ---
    checkLoginStatus();
});