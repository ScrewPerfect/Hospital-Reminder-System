document.addEventListener('DOMContentLoaded', () => {
    // Run only after page is fully loaded

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

    // --- EARLY EXIT ---
    // Stop the script if not on the dashboard page
    if (!appointmentForm) {
        console.log("⚠️ script.js loaded on a page without #appointmentForm — safely exiting.");
        return;
    }

    let currentDate = new Date();
    let appointments = [];

    // --- RENDER CALENDAR ---
    const renderCalendar = () => {
        if (!calendarDaysEl || !monthYearEl) return;

        calendarDaysEl.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        monthYearEl.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const appointmentDates = appointments.map(a => a.date);

        for (let i = 0; i < firstDay; i++) {
            calendarDaysEl.innerHTML += '<div></div>';
        }

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

    // --- CREATE APPOINTMENT CARD ---
    const createAppointmentCard = (a) => {
        const card = document.createElement('div');
        card.className = 'appointment-card';
        card.dataset.id = a.id;

        card.innerHTML = `
            <div class="appointment-card-body">
                <p class="patient-name">${a.patient_name}</p>
                <p class="doctor-name">with Dr. ${a.doctor_name}</p>
                <div class="appointment-details">
                    <p><strong>Date:</strong> ${a.date}</p>
                    <p><strong>Time:</strong> ${a.time}</p>
                    <p><strong>Notes:</strong> ${a.notes || 'N/A'}</p>
                </div>
            </div>
            <div class="appointment-card-aside">
                <span class="status-tag status-${(a.status || 'scheduled').toLowerCase()}">${a.status || 'Scheduled'}</span>
                <div class="appointment-actions">
                    <button class="icon-button edit-btn" data-id="${a.id}">Edit</button>
                    <button class="icon-button delete-btn" data-id="${a.id}">Delete</button>
                </div>
            </div>
        `;
        return card;
    };

    // --- RENDER APPOINTMENTS ---
    const renderAppointments = () => {
        if (!appointmentList || !emptyState) return;
        appointmentList.innerHTML = '';

        if (appointments.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            appointments.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
            appointments.forEach(app => appointmentList.appendChild(createAppointmentCard(app)));
        }
    };

    // --- FETCH APPOINTMENTS ---
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
                alert('Could not fetch appointments.');
            }
        } catch (err) {
            console.error(err);
            alert('Error fetching appointments.');
        } finally {
            loadingState.style.display = 'none';
        }
    };

    // --- SESSION CHECK ---
    const checkLoginStatus = async () => {
        try {
            const res = await fetch('php/check_session.php');
            const session = await res.json();
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
                fetchAppointments();
            } else {
                window.location.href = 'login.html';
            }
        } catch {
            window.location.href = 'login.html';
        }
    };

    // --- ADD APPOINTMENT FORM ---
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
                alert(result.message || 'Error adding appointment.');
            }
        } catch {
            alert('Error adding appointment.');
        }
    });

    // --- EDIT/DELETE BUTTON HANDLERS ---
    if (appointmentList) {
        appointmentList.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-btn');
            const delBtn = e.target.closest('.delete-btn');
            if (editBtn) openEditModal(editBtn.dataset.id);
            if (delBtn && confirm('Are you sure you want to delete this appointment?')) {
                deleteAppointment(delBtn.dataset.id);
            }
        });
    }

    // --- OPEN EDIT MODAL ---
    function openEditModal(id) {
        const app = appointments.find(a => a.id == id);
        if (!app || !editModal) return;

        const eid = (sel) => document.getElementById(sel);
        eid('edit_appointment_id').value = app.id;
        eid('edit_patient_name').value = app.patient_name;
        eid('edit_doctor_name').value = app.doctor_name;
        eid('edit_appointment_date').value = app.date;
        eid('edit_appointment_time').value = app.time;
        eid('edit_status').value = app.status;
        eid('edit_notes').value = app.notes;
        editModal.classList.remove('hidden');
    }

    // --- DELETE APPOINTMENT ---
    async function deleteAppointment(id) {
        try {
            const fd = new FormData();
            fd.append('appointment_id', id);
            const res = await fetch('php/delete_appointment.php', { method: 'POST', body: fd });
            const result = await res.json();
            if (result.success) fetchAppointments();
            else alert(result.message || 'Error deleting appointment.');
        } catch {
            alert('Error deleting appointment.');
        }
    }

    // --- SAFE MODAL EVENT LISTENERS ---
    console.log('🧩 Modal element check:', {
        editModalExists: !!editModal,
        cancelEditBtnExists: !!cancelEditBtn,
        editAppointmentFormExists: !!editAppointmentForm
    });

    cancelEditBtn?.addEventListener('click', () => {
        if (editModal) editModal.classList.add('hidden');
    });

    editAppointmentForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(editAppointmentForm);
        try {
            const res = await fetch('php/update_appointment.php', { method: 'POST', body: fd });
            const result = await res.json();
            if (result.success) {
                if (editModal) editModal.classList.add('hidden');
                fetchAppointments();
            } else {
                alert(result.message || 'Error updating appointment.');
            }
        } catch (err) {
            console.error('Update appointment error:', err);
            alert('An error occurred while updating.');
        }
    });

    // --- CALENDAR NAVIGATION ---
    prevMonthBtn?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // --- INITIAL LOAD ---
    checkLoginStatus();
});
