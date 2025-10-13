document.addEventListener('DOMContentLoaded', () => {
    // This wrapper ensures the script runs only after the page is fully loaded.

    // --- Page Check ---
    // This is a safety measure to ensure this script only runs on the main dashboard page.
    const appointmentForm = document.getElementById('appointmentForm');
    if (!appointmentForm) {
        // If the main form isn't found, stop running the script.
        return; 
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
    let appointments = []; // This will store the fetched appointments

    // --- Rendering Functions: Defined first to avoid initialization errors ---

    // Render the monthly calendar
    const renderCalendar = () => {
        if (!calendarDaysEl) return; // Safety check
        calendarDaysEl.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        monthYearEl.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
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

    // Create the HTML for a single appointment card
    const createAppointmentCard = (app) => {
        const card = document.createElement('div');
        card.className = 'appointment-card';
        card.dataset.id = app.id;

        card.innerHTML = `
            <div class="appointment-card-body">
                <p class="patient-name">${app.patient_name}</p>
                <p class="doctor-name">with Dr. ${app.doctor_name}</p>
                <div class="appointment-details">
                    <p><strong>Date:</strong> ${app.date}</p>
                    <p><strong>Time:</strong> ${app.time}</p>
                    <p><strong>Notes:</strong> ${app.notes || 'N/A'}</p>
                </div>
            </div>
            <div class="appointment-card-aside">
                <span class="status-tag status-${(app.status || 'scheduled').toLowerCase()}">${app.status || 'Scheduled'}</span>
                <div class="appointment-actions">
                    <button class="icon-button edit-btn" data-id="${app.id}">Edit</button>
                    <button class="icon-button delete-btn" data-id="${app.id}">Delete</button>
                </div>
            </div>
        `;
        return card;
    };

    // Render all appointment cards
    const renderAppointments = () => {
        if (!appointmentList) return; // Safety check
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
    };

    // --- Core Functions: Data Fetching and Session Management ---
    
    // Fetch appointments from the server
    const fetchAppointments = async () => {
        if (!loadingState || !emptyState || !appointmentList) return; // Safety check
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
            if (loadingState) loadingState.style.display = 'none';
        }
    };

    // Check if the user is logged in
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
                fetchAppointments(); 
            } else {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error("Session check failed:", error);
            window.location.href = 'login.html';
        }
    };

    // --- Event Listeners and Form Handlers ---

    appointmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(appointmentForm);
        try {
            const response = await fetch('php/add_appointment.php', { method: 'POST', body: formData });
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

    if (appointmentList) {
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
            if (editModal) editModal.classList.remove('hidden');
        }
    }
    
    // **THIS IS THE MAIN FIX** - Add event listeners only if the elements exist
    if (cancelEditBtn && editAppointmentForm) {
        cancelEditBtn.addEventListener('click', () => editModal.classList.add('hidden'));

        editAppointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(editAppointmentForm);
            try {
                const response = await fetch('php/update_appointment.php', { method: 'POST', body: formData });
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
    
    async function deleteAppointment(appointmentId) {
        try {
            const formData = new FormData();
            formData.append('appointment_id', appointmentId);
            const response = await fetch('php/delete_appointment.php', { method: 'POST', body: formData });
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

    if (prevMonthBtn && nextMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });

        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    // --- Initial Load ---
    checkLoginStatus(); 
});

