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
                            Welcome, <strong>${session.username}</strong> | 
                            <a href="profile.html">Profile</a> | 
                            <a href="php/logout.php">Logout</a>
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
        emptyState.classList.add('hidden');
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
            loadingState.style.display = 'none';
            emptyState.classList.remove('hidden');
            alert('An error occurred while fetching appointments.');
        } finally {
            loadingState.style.display = 'none';
        }
    }

    function renderAppointments() {
        appointmentList.innerHTML = '';
        if (appointments.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            appointments.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
            appointments.forEach(app => {
                appointmentList.appendChild(createAppointmentCard(app));
            });
        }
        lucide.createIcons();
    }
    
    function createAppointmentCard(app) {
        const card = document.createElement('div');
        card.className = 'appointment-card card';
        card.dataset.id = app.id;

        const countdown = calculateCountdown(app.date, app.time);

        card.innerHTML = `
            <div class="countdown">
                <div class="countdown-timer">${countdown}</div>
                <div style="font-size: 0.75rem; color: #6b7280;">left</div>
            </div>
            <div style="flex-grow: 1;">
                <p style="font-weight: 700; font-size: 1.125rem;">${app.patient_name}</p>
                <p style="color: #6b7280; margin-bottom: 1rem;">with Dr. ${app.doctor_name}</p>
                <p><strong>Date:</strong> ${new Date(app.date + 'T00:00:00').toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${new Date('1970-01-01T' + app.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                <p><strong>Notes:</strong> ${app.notes || 'N/A'}</p>
            </div>
            <div>
                <div class="status-tag status-${app.status}">${app.status}</div>
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button class="edit-btn icon-button" data-id="${app.id}">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="delete-btn icon-button" data-id="${app.id}">
                        <i data-lucide="trash-2"></i>
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
        if (days > 0) return `${days}d`;
        
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (hours > 0) return `${hours}h`;

        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
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
            dayEl.className = 'calendar-day';
            
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
    }

    // Event Listeners
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

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
        const target = e.target.closest('.edit-btn, .delete-btn');
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


    cancelEditBtn.addEventListener('click', () => {
        editModal.classList.add('hidden');
    });

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

    async function deleteAppointment(appointmentId) {
        try {
             const formData = new FormData();
             formData.append('appointment_id', appointmentId);

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

