document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();

    const appointmentForm = document.getElementById('appointmentForm');
    const appointmentList = document.getElementById('appointmentList');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    // Calendar elements
    const monthYearEl = document.getElementById('monthYear');
    const calendarDaysEl = document.getElementById('calendarDays');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    // Edit Modal Elements
    const editModal = document.getElementById('editModal');
    const editAppointmentForm = document.getElementById('editAppointmentForm');
    const cancelEditBtn = document.getElementById('cancelEdit');

    let currentDate = new Date();
    let appointments = [];

    async function checkLoginStatus() {
        try {
            const response = await fetch('php/check_session.php');
            const session = await response.json();
            if (session.loggedIn) {
                const userInfoDiv = document.getElementById('user-info');
                if (userInfoDiv) {
                    userInfoDiv.innerHTML = `
                        <p>
                            Welcome, <span class="font-semibold text-gray-800">${session.username}</span> | 
                            <a href="profile.html" class="text-blue-600 hover:underline">Profile</a> | 
                            <a href="php/logout.php" class="text-blue-600 hover:underline">Logout</a>
                        </p>
                    `;
                }
                fetchAppointments();
            } else {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error("Session check failed:", error);
            window.location.href = 'login.html';
        }
    }

    async function fetchAppointments() {
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
                alert('Could not fetch appointments.');
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
            alert('An error occurred while fetching appointments.');
        } finally {
            loadingState.style.display = 'none';
        }
    }

    function renderAppointments() {
        appointmentList.innerHTML = '';
        if (appointments.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            appointments.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
            appointments.forEach(app => {
                appointmentList.appendChild(createAppointmentCard(app));
            });
        }
        // Re-initialize lucide icons
        lucide.createIcons();
    }
    
    function createAppointmentCard(app) {
        const card = document.createElement('div');
        card.className = 'appointment-card';
        card.dataset.id = app.id;

        const countdown = calculateCountdown(app.date, app.time);

        card.innerHTML = `
            <div class="appointment-card-content">
                <div class="appointment-card-header">
                    <i data-lucide="user" class="appointment-card-icon"></i>
                    <p class="appointment-card-title">${app.patient_name}</p>
                </div>
                <div class="appointment-card-subheader">
                    <i data-lucide="stethoscope" class="appointment-card-icon"></i>
                    <p>with Dr. ${app.doctor_name}</p>
                </div>
                <div class="appointment-card-details">
                    <div class="detail-item">
                        <i data-lucide="calendar" class="appointment-card-icon"></i>
                        <span>${new Date(app.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div class="detail-item">
                        <i data-lucide="clock" class="appointment-card-icon"></i>
                        <span>${new Date('1970-01-01T' + app.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                    </div>
                     <div class="detail-item">
                        <i data-lucide="info" class="appointment-card-icon"></i>
                        <p class="flex-1">Notes: <span class="text-gray-800">${app.notes || 'N/A'}</span></p>
                    </div>
                </div>
            </div>
            <div class="appointment-card-right-panel">
                <div class="countdown">
                    <span class="countdown-timer">${countdown}</span>
                    <span class="countdown-label">left</span>
                </div>
                <span class="status-tag status-${String(app.status).toLowerCase()}">${app.status}</span>
                 <div class="appointment-card-actions">
                    <button class="icon-button edit-btn" data-id="${app.id}">
                        <i data-lucide="edit-2" class="h-5 w-5"></i>
                    </button>
                    <button class="icon-button delete-btn" data-id="${app.id}">
                        <i data-lucide="trash-2" class="h-5 w-5"></i>
                    </button>
                </div>
            </div>
        `;
        return card;
    }

     function calculateCountdown(date, time) {
        const appointmentTime = new Date(`${date}T${time}`);
        const now = new Date();
        const diff = appointmentTime - now;

        if (diff < 0) return "Past";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        return `${minutes}m`;
    }

    function renderCalendar() {
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
                console.log(`Appointment found for ${currentDateStr}`);
                dayEl.classList.add('has-appointment');
            }
            
            calendarDaysEl.appendChild(dayEl);
        }
    }

    // Event Listeners
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

    if (appointmentForm) {
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
                    alert(result.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            }
        });
    }

    if (appointmentList) {
        appointmentList.addEventListener('click', (e) => {
            const target = e.target.closest('.edit-btn, .delete-btn');
            if (!target) return;

            const appointmentId = target.dataset.id;
            console.log(`Button clicked for appointment ID: ${appointmentId}`);

            if (target.classList.contains('edit-btn')) {
                console.log('Edit button clicked');
                openEditModal(appointmentId);
            }

            if (target.classList.contains('delete-btn')) {
                console.log('Delete button clicked');
                if(confirm('Are you sure you want to delete this appointment?')) {
                    deleteAppointment(appointmentId);
                }
            }
        });
    }


    function openEditModal(appointmentId) {
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
        } else {
            console.error(`Appointment with ID ${appointmentId} not found.`);
        }
    }

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
                alert('An error occurred while updating. Please try again.');
            }
        });
    }

    async function deleteAppointment(appointmentId) {
        try {
             const formData = new FormData();
             formData.append('id', appointmentId);

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
            alert('An error occurred while deleting. Please try again.');
        }
    }
});

