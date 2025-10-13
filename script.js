document.addEventListener('DOMContentLoaded', () => {
    // This wrapper ensures the script runs only after the page is fully loaded.

    // --- Page Check ---
    // This script is intended ONLY for the main dashboard page (index.html).
    // The check below ensures it exits gracefully if loaded on another page.
    const appointmentForm = document.getElementById('appointmentForm');
    if (!appointmentForm) {
        return; // Exit if not on the main dashboard page
    }

    // --- DOM Element Selection ---
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

    let currentDate = new Date();
    let appointments = [];

    // --- Rendering Functions (Defined First) ---

    function createAppointmentCard(app) {
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow flex justify-between items-start';
        card.dataset.id = app.id;

        const statusColors = {
            'Scheduled': 'bg-blue-100 text-blue-800',
            'Completed': 'bg-green-100 text-green-800',
            'Canceled': 'bg-red-100 text-red-800'
        };

        card.innerHTML = `
            <div class="flex-grow">
                <p class="font-bold text-lg text-gray-800">${app.patient_name}</p>
                <p class="text-sm text-gray-600 mb-3">with Dr. ${app.doctor_name}</p>
                <div class="text-sm space-y-2">
                    <div class="flex items-center text-gray-500"><i data-lucide="calendar" class="h-4 w-4 mr-2"></i><span>${new Date(app.date + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                    <div class="flex items-center text-gray-500"><i data-lucide="clock" class="h-4 w-4 mr-2"></i><span>${new Date('1970-01-01T' + app.time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}</span></div>
                    <div class="flex items-center text-gray-500"><i data-lucide="info" class="h-4 w-4 mr-2"></i><span>Notes: ${app.notes || 'N/A'}</span></div>
                </div>
            </div>
            <div class="flex flex-col items-end space-y-3">
                <span class="text-xs font-semibold px-2 py-1 rounded-full ${statusColors[app.status] || 'bg-gray-100 text-gray-800'}">${app.status}</span>
                <div class="flex space-x-2">
                    <button class="edit-btn p-2 text-gray-500 hover:text-blue-600" data-id="${app.id}"><i data-lucide="edit-2" class="h-5 w-5 pointer-events-none"></i></button>
                    <button class="delete-btn p-2 text-gray-500 hover:text-red-600" data-id="${app.id}"><i data-lucide="trash-2" class="h-5 w-5 pointer-events-none"></i></button>
                </div>
            </div>
        `;
        return card;
    }

    function renderAppointments() {
        appointmentList.innerHTML = '';
        if (appointments.length === 0) {
            emptyState.style.display = 'block';
        } else {
            appointments.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
            appointments.forEach(app => {
                appointmentList.appendChild(createAppointmentCard(app));
            });
        }
        if (window.lucide) {
            lucide.createIcons();
        }
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
                dayEl.classList.add('has-appointment');
            }

            calendarDaysEl.appendChild(dayEl);
        }
    }

    // --- Data Fetching and Core Logic ---

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
        }
    }

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
            alert('An error occurred while deleting.');
        }
    }

    // --- Event Listeners ---

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
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
        }
    });

    appointmentList.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-btn');
        const deleteButton = e.target.closest('.delete-btn');

        if (editButton) {
            openEditModal(editButton.dataset.id);
        }
        if (deleteButton) {
            if (confirm('Are you sure you want to delete this appointment?')) {
                deleteAppointment(deleteButton.dataset.id);
            }
        }
    });

    // Defensive check for modal buttons
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
                    alert(`Error updating: ${result.message}`);
                }
            } catch (error) {
                alert('An error occurred while updating.');
            }
        });
    }

    // --- Initial Load ---
    checkLoginStatus();
});
