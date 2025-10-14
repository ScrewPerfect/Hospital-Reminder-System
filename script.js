document.addEventListener('DOMContentLoaded', () => {
    // This script will only run on the page it's designed for.
    const isDashboardPage = document.getElementById('appointmentForm');
    if (!isDashboardPage) {
        return; // Stop the script if not on the main dashboard page
    }

    // --- DOM ELEMENTS ---
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

    let currentDate = new Date();
    let appointments = [];

    // --- CORE FUNCTIONS ---

    const checkLoginStatus = async () => {
        try {
            const response = await fetch('php/check_session.php');
            const session = await response.json();
            if (session.loggedIn) {
                const userInfoDiv = document.getElementById('user-info');
                if (userInfoDiv) {
                    userInfoDiv.innerHTML = `
                        <p>
                            Welcome, <span class="font-semibold">${session.username}</span> | 
                            <a href="profile.html" class="link">Profile</a> | 
                            <a href="php/logout.php" class="link">Logout</a>
                        </p>
                    `;
                }
                // Once logged in, fetch all necessary data
                fetchAppointments();
                displayHealthTip();
                fetchQuoteOfTheDay();
            } else {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error("Session check failed:", error);
            window.location.href = 'login.html';
        }
    };

    const fetchAppointments = async () => {
        loadingState.style.display = 'block';
        emptyState.style.display = 'none';
        appointmentList.innerHTML = '';

        try {
            const response = await fetch(`./php/get_appointments.php?t=${new Date().getTime()}`);
            const data = await response.json();
            
            if (data.success) {
                appointments = data.appointments;
                renderAppointments();
                renderCalendar();
            } else {
                alert('Could not fetch appointments: ' + data.message);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
            alert('An error occurred while fetching appointments.');
        } finally {
            loadingState.style.display = 'none';
        }
    };

    // --- WIDGET FUNCTIONS ---

    const displayHealthTip = () => {
        const healthTips = [
            "Drink at least 8 glasses of water a day to stay hydrated.",
            "Aim for 30 minutes of moderate physical activity most days of the week.",
            "Eat a variety of fruits and vegetables to get essential vitamins and minerals.",
            "Get 7-9 hours of quality sleep per night for optimal health.",
            "Wash your hands frequently to prevent the spread of germs.",
            "Practice mindfulness or meditation to reduce stress levels.",
            "Limit processed foods, sugary drinks, and unhealthy fats.",
            "Schedule regular check-ups with your doctor, even if you feel healthy."
        ];
        const randomTip = healthTips[Math.floor(Math.random() * healthTips.length)];
        
        if(healthTipWidget) {
            healthTipWidget.innerHTML = `
                <i data-lucide="heart-pulse"></i>
                <div>
                    <h3 class="widget-title">Health Tip of the Day</h3>
                    <p class="widget-text">${randomTip}</p>
                </div>
            `;
            lucide.createIcons();
        }
    };

    const fetchQuoteOfTheDay = async () => {
        if(quoteWidget) {
            quoteWidget.innerHTML = `
                <i data-lucide="quote"></i>
                <div>
                    <h3 class="widget-title">Quote of the Day</h3>
                    <p class="widget-text">Loading...</p>
                </div>
            `;
            lucide.createIcons();

            try {
                const response = await fetch('php/get_quote.php');
                const data = await response.json();
                if (data.success) {
                    quoteWidget.innerHTML = `
                        <i data-lucide="quote"></i>
                        <div>
                            <h3 class="widget-title">Quote of the Day</h3>
                            <p class="widget-text"><em>"${data.quote.q}"</em> - ${data.quote.a}</p>
                        </div>
                    `;
                    lucide.createIcons();
                } else {
                     quoteWidget.querySelector('.widget-text').textContent = 'Could not load quote.';
                }
            } catch (error) {
                console.error("Could not fetch quote:", error);
                quoteWidget.querySelector('.widget-text').textContent = 'Could not load quote.';
            }
        }
    };

    // --- RENDER FUNCTIONS ---
    
    const createAppointmentCard = (app) => {
        const card = document.createElement('div');
        card.className = 'appointment-card';
        card.dataset.id = app.id;

        const countdown = calculateCountdown(app.date, app.time);

        card.innerHTML = `
            <div class="appointment-card-body">
                <p class="patient-name">${app.patient_name}</p>
                <p class="doctor-name">with Dr. ${app.doctor_name}</p>
                <div class="appointment-details">
                    <p><i data-lucide="calendar"></i> <span>${new Date(app.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
                    <p><i data-lucide="clock"></i> <span>${new Date('1970-01-01T' + app.time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}</span></p>
                    <p><i data-lucide="info"></i> <span>Notes: ${app.notes || 'N/A'}</span></p>
                </div>
            </div>
            <div class="appointment-card-aside">
                <div class="text-center mb-4">
                    <span class="countdown-timer">${countdown}</span>
                </div>
                <span class="status-tag status-${(app.status || 'scheduled').toLowerCase()}">${app.status || 'Scheduled'}</span>
                <div class="appointment-actions">
                    <button class="icon-button edit-btn" data-id="${app.id}"><i data-lucide="edit-2"></i></button>
                    <button class="icon-button delete-btn" data-id="${app.id}"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `;
        return card;
    };

    const renderAppointments = () => {
        appointmentList.innerHTML = '';
        if (appointments.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            appointments.forEach(app => {
                appointmentList.appendChild(createAppointmentCard(app));
            });
        }
        lucide.createIcons();
    };
    
    const renderCalendar = () => {
        calendarDaysEl.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        monthYearEl.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            calendarDaysEl.innerHTML += '<div></div>';
        }

        const appointmentDates = appointments.map(app => app.date);

        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.textContent = day;
            dayEl.classList.add('calendar-day');
            
            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayEl.classList.add('today');
            }

            const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (appointmentDates.includes(currentDateStr)) {
                dayEl.classList.add('has-appointment');
            }
            
            calendarDaysEl.appendChild(dayEl);
        }
    };

    const calculateCountdown = (date, time) => {
        const appointmentTime = new Date(`${date}T${time}`);
        const now = new Date();
        const diff = appointmentTime - now;

        if (diff < 0) return "Past Due";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 1) return `in ${days} days`;
        if (days === 1) return `Tomorrow`;
        if (hours > 0) return `in ${hours} hours`;
        return `Soon`;
    };

    // --- EVENT LISTENERS ---

    appointmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(appointmentForm);
        
        try {
            const response = await fetch('php/add_appointment.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                fetchAppointments();
                appointmentForm.reset();
            } else {
                alert(`Error adding appointment: ${result.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    });

    appointmentList.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const appointmentId = target.dataset.id;

        if (target.classList.contains('edit-btn')) {
            openEditModal(appointmentId);
        }

        if (target.classList.contains('delete-btn')) {
            if(confirm('Are you sure you want to delete this appointment?')) {
                deleteAppointment(appointmentId);
            }
        }
    });

    const openEditModal = (appointmentId) => {
        const appointment = appointments.find(app => app.id == appointmentId);
        if (appointment) {
            document.getElementById('edit_appointment_id').value = appointment.id;
            document.getElementById('edit_patient_name').value = appointment.patient_name;
            document.getElementById('edit_doctor_name').value = appointment.doctor_name;
            document.getElementById('edit_appointment_date').value = appointment.date;
            document.getElementById('edit_appointment_time').value = appointment.time;
            document.getElementById('edit_status').value = appointment.status;
            document.getElementById('edit_notes').value = appointment.notes;
            editModal.classList.remove('hidden');
        }
    };

    const deleteAppointment = async (appointmentId) => {
        const formData = new FormData();
        formData.append('appointment_id', appointmentId);
        try {
            const response = await fetch('php/delete_appointment.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                fetchAppointments();
            } else {
                alert(`Error deleting appointment: ${result.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while deleting.');
        }
    };

    // Modal event listeners with safety checks
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            editModal.classList.add('hidden');
        });
    }

    if (editAppointmentForm) {
        editAppointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(editAppointmentForm);
            
            try {
                const response = await fetch('php/update_appointment.php', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();

                if (result.success) {
                    editModal.classList.add('hidden');
                    fetchAppointments();
                } else {
                    alert(`Error updating appointment: ${result.message}`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while updating.');
            }
        });
    }

    // Calendar navigation
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

