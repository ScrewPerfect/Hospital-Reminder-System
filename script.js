document.addEventListener('DOMContentLoaded', () => {
    const appointmentList = document.getElementById('appointmentList');
    const appointmentForm = document.getElementById('appointmentForm');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const userInfo = document.getElementById('user-info');

    // Modal elements
    const editModal = document.getElementById('editModal');
    const closeModal = document.getElementById('closeModal');
    const cancelEdit = document.getElementById('cancelEdit');
    const editAppointmentForm = document.getElementById('editAppointmentForm');

    let appointments = [];
    let currentDate = new Date();

    // Check if user is logged in
    const checkSession = async () => {
        try {
            const response = await fetch('php/check_session.php');
            const data = await response.json();
            if (data.success && data.loggedIn) {
                userInfo.innerHTML = `
                    <span class="font-semibold text-gray-700">Welcome, ${data.username}!</span>
                    <a href="php/logout.php" class="ml-4 text-sm text-blue-600 hover:underline">Logout</a>
                `;
                fetchAppointments();
                renderCalendar();
            } else {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Session check failed:', error);
            window.location.href = 'login.html';
        }
    };

    const fetchAppointments = async () => {
        loadingState.style.display = 'block';
        emptyState.style.display = 'none';
        appointmentList.innerHTML = '';

        try {
            const response = await fetch(`php/get_appointments.php?t=${new Date().getTime()}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
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
            alert('An error occurred. Please try again.');
        } finally {
            loadingState.style.display = 'none';
        }
    };

    const renderAppointments = () => {
        appointmentList.innerHTML = '';
        if (appointments.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            appointments.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
            appointments.forEach(app => {
                const card = renderAppointment(app);
                appointmentList.appendChild(card);
            });
            lucide.createIcons();
        }
    };

    const renderAppointment = (app) => {
        const card = document.createElement('div');
        card.className = 'bg-white p-5 rounded-lg shadow-sm border border-gray-200 appointment-card';
        card.dataset.id = app.id;

        const statusColors = {
            'Scheduled': 'status-scheduled',
            'Completed': 'status-completed',
            'Canceled': 'status-canceled'
        };
        const statusClass = statusColors[app.status] || 'status-scheduled';

        card.innerHTML = `
            <div class="appointment-card-header">
                <div>
                    <h3 class="font-bold text-lg text-gray-800">${app.patient_name}</h3>
                    <p class="text-sm text-gray-500">with Dr. ${app.doctor_name}</p>
                </div>
                <div class="appointment-actions flex items-center space-x-2">
                     <span class="status-tag ${statusClass}">${app.status}</span>
                    <button class="edit-btn" data-id="${app.id}"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    <button class="delete-btn" data-id="${app.id}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>
            <div class="appointment-card-body mt-4 space-y-2">
                <p><i data-lucide="calendar" class="w-4 h-4 text-gray-500 mr-3"></i>${new Date(app.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><i data-lucide="clock" class="w-4 h-4 text-gray-500 mr-3"></i>${formatTime(app.time)}</p>
                ${app.notes ? `<p><i data-lucide="info" class="w-4 h-4 text-gray-500 mr-3"></i>${app.notes}</p>` : ''}
                <div class="pt-2 text-sm font-semibold text-blue-600">${calculateCountdown(app.date, app.time)}</div>
            </div>
        `;
        return card;
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hour, minute] = timeString.split(':');
        const hourNum = parseInt(hour, 10);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const formattedHour = hourNum % 12 || 12;
        return `${formattedHour}:${minute} ${ampm}`;
    };

    const calculateCountdown = (date, time) => {
        const now = new Date();
        const appDate = new Date(`${date}T${time}`);
        const diff = appDate - now;

        if (diff < 0) return 'Appointment has passed';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

        if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
        return 'Less than an hour away';
    };

    appointmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(appointmentForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('php/add_appointment.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
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

    appointmentList.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;
        if (target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this appointment?')) {
                deleteAppointment(id);
            }
        } else if (target.classList.contains('edit-btn')) {
            openEditModal(id);
        }
    });

    const deleteAppointment = async (id) => {
        try {
            const response = await fetch('php/delete_appointment.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const result = await response.json();
            if (result.success) {
                fetchAppointments();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    };
    
    const openEditModal = (id) => {
        const appointment = appointments.find(app => app.id == id);
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

    const closeEditModal = () => {
        editModal.classList.add('hidden');
    };

    closeModal.addEventListener('click', closeEditModal);
    cancelEdit.addEventListener('click', closeEditModal);

    editAppointmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(editAppointmentForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('php/update_appointment.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.success) {
                closeEditModal();
                fetchAppointments();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    });

    // Calendar logic
    const monthYearEl = document.getElementById('monthYear');
    const calendarDaysEl = document.getElementById('calendarDays');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    const renderCalendar = () => {
        calendarDaysEl.innerHTML = '';
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        monthYearEl.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarDaysEl.innerHTML += `<div></div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.textContent = day;
            dayEl.className = 'calendar-day';
            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayEl.classList.add('today');
            }
            // Check for appointments
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (appointments.some(app => app.date === dateStr)) {
                dayEl.classList.add('has-appointment');
            }
            calendarDaysEl.appendChild(dayEl);
        }
    };
    
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    checkSession();
});

