// File: script.js

document.addEventListener('DOMContentLoaded', () => {
    // This function checks if the user is logged in right away
    checkLoginStatus();

    // The rest of your script.js file...
    const appointmentForm = document.getElementById('appointmentForm');
    const appointmentList = document.getElementById('appointmentList');
    const calendarDays = document.getElementById('calendarDays');
    const monthYear = document.getElementById('monthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const userWelcome = document.getElementById('userWelcome');

    // New variables for the edit modal
    const editModal = document.getElementById('editModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const editAppointmentForm = document.getElementById('editAppointmentForm');
    
    let appointmentsCache = []; // To store fetched appointments temporarily

    let currentDate = new Date();

    async function checkLoginStatus() {
        try {
            const response = await fetch('php/check_session.php');
            const data = await response.json();
            if (!data.loggedIn) {
                window.location.href = 'login.html';
            } else {
                if(userWelcome) {
                    userWelcome.textContent = `Welcome, ${data.username}!`;
                }
                fetchAppointments();
            }
        } catch (error) {
            console.error('Error checking login status:', error);
            window.location.href = 'login.html';
        }
    }

    async function fetchAppointments() {
        loadingState.style.display = 'block';
        emptyState.style.display = 'none';
        appointmentList.innerHTML = ''; 
         try {
            const response = await fetch(`php/get_appointments.php?t=${new Date().getTime()}`);
            const appointments = await response.json();
            
            appointmentsCache = appointments; // Cache the appointments
            
            loadingState.style.display = 'none';
            
            if (appointments.length === 0) {
                emptyState.style.display = 'block';
            } else {
                emptyState.style.display = 'none';
                appointments.forEach(renderAppointment);
            }
            renderCalendar();
        } catch (error) {
            console.error('Error fetching appointments:', error);
            loadingState.textContent = 'Failed to load appointments.';
        }
    }

    function renderAppointment(app) {
        const div = document.createElement('div');
        div.className = 'appointment-card';
        
        const countdownInfo = calculateCountdown(app.date);

        div.innerHTML = `
            <div class="flex-grow">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="font-bold text-lg text-gray-800">${app.patient_name}</h3>
                    <div class="countdown-tag ${countdownInfo.class}">${countdownInfo.text}</div>
                </div>
                <p class="text-sm text-gray-600 flex items-center gap-2">
                    <i data-lucide="user-md" class="w-4 h-4 text-gray-500"></i>
                    With <span class="font-semibold">${app.doctor_name}</span>
                </p>
                <div class="text-sm text-gray-500 mt-2 flex items-center gap-2">
                     <i data-lucide="calendar-days" class="w-4 h-4 text-gray-500"></i>
                    ${new Date(app.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div class="text-sm text-gray-500 flex items-center mt-1 gap-2">
                    <i data-lucide="clock" class="w-4 h-4 text-gray-500"></i>
                    ${formatTime(app.time)}
                </div>
                ${app.notes ? `<div class="notes-section mt-3"><p class="text-sm">${app.notes}</p></div>` : ''}
            </div>
            <div class="flex flex-col">
                <button class="edit-btn" data-id="${app.id}">
                    <i data-lucide="pencil" class="w-5 h-5"></i>
                </button>
                <button class="delete-btn" data-id="${app.id}">
                     <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>
            </div>
        `;
        appointmentList.appendChild(div);
        lucide.createIcons();
    }

    function calculateCountdown(dateStr) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const appDate = new Date(dateStr + 'T00:00:00');
        const diffTime = appDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: 'Past', class: 'past' };
        if (diffDays === 0) return { text: 'Today', class: 'today' };
        if (diffDays === 1) return { text: 'Tomorrow', class: '' };
        return { text: `In ${diffDays} days`, class: '' };
    }
    
    function formatTime(timeStr) {
        const [hour, minute] = timeStr.split(':');
        const hourInt = parseInt(hour, 10);
        const ampm = hourInt >= 12 ? 'PM' : 'AM';
        const formattedHour = hourInt % 12 || 12;
        return `${formattedHour}:${minute} ${ampm}`;
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
                    appointmentForm.reset();
                    fetchAppointments();
                } else {
                    alert('Error adding appointment: ' + result.message);
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                alert('An error occurred. Please try again.');
            }
        });
    }

    if (appointmentList) {
        appointmentList.addEventListener('click', async (e) => {
            // Handle Delete
            if (e.target.closest('.delete-btn')) {
                const btn = e.target.closest('.delete-btn');
                const id = btn.dataset.id;
                if (confirm('Are you sure you want to delete this appointment?')) {
                    try {
                        const response = await fetch('php/delete_appointment.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: `id=${id}`
                        });
                        const result = await response.json();
                        if (result.success) {
                            fetchAppointments();
                        } else {
                            alert('Error deleting appointment: ' + result.message);
                        }
                    } catch (error) {
                        console.error('Error deleting appointment:', error);
                        alert('An error occurred. Please try again.');
                    }
                }
            }
            
            // Handle Edit
            if (e.target.closest('.edit-btn')) {
                const btn = e.target.closest('.edit-btn');
                const id = btn.dataset.id;
                openEditModal(id);
            }
        });
    }
    
    // --- Edit Modal Logic ---
    function openEditModal(id) {
        const appointmentToEdit = appointmentsCache.find(app => app.id == id);
        if (!appointmentToEdit) {
            alert('Could not find appointment to edit.');
            return;
        }

        document.getElementById('editAppointmentId').value = appointmentToEdit.id;
        document.getElementById('editPatientName').value = appointmentToEdit.patient_name;
        document.getElementById('editDoctorName').value = appointmentToEdit.doctor_name;
        document.getElementById('editAppointmentDate').value = appointmentToEdit.date;
        document.getElementById('editAppointmentTime').value = appointmentToEdit.time;
        document.getElementById('editNotes').value = appointmentToEdit.notes;

        editModal.classList.remove('hidden');
    }

    function closeEditModal() {
        editModal.classList.add('hidden');
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeEditModal);
    }
    if (editModal) {
        // Close modal if user clicks on the overlay
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                closeEditModal();
            }
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
                    closeEditModal();
                    fetchAppointments(); // Refresh the list
                } else {
                    alert('Error updating appointment: ' + result.message);
                }
            } catch (error) {
                console.error('Error updating form:', error);
                alert('An error occurred while saving changes. Please try again.');
            }
        });
    }


     // --- Calendar Logic ---
    async function renderCalendar() {
        calendarDays.innerHTML = '';
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        
        monthYear.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Use the cached appointments for the calendar
        const appointmentDates = appointmentsCache.map(app => app.date);

        // Create blank days for padding
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            calendarDays.appendChild(emptyCell);
        }

        // Create days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.textContent = i;
            dayCell.className = 'calendar-day';

            const today = new Date();
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayCell.classList.add('today');
            }
            
            const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            if(appointmentDates.includes(cellDateStr)) {
                dayCell.classList.add('has-appointment');
            }
            
            calendarDays.appendChild(dayCell);
        }
    }

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
});

