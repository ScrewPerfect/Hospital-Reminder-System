document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const appointmentForm = document.getElementById('appointmentForm');
    const appointmentList = document.getElementById('appointmentList');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const userInfo = document.getElementById('user-info');
    
    // Calendar Elements
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

    // --- SESSION & AUTHENTICATION ---
    const checkSession = async () => {
        try {
            const response = await fetch('php/check_session.php');
            const data = await response.json();
            if (data.success && data.loggedIn) {
                userInfo.innerHTML = `
                    <span class="font-medium text-slate-600">Welcome, ${data.username}</span>
                    <a href="php/logout.php" class="ml-4 text-indigo-600 hover:text-indigo-800 font-semibold">Logout</a>
                `;
                fetchAppointments();
            } else {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Session check failed:', error);
            window.location.href = 'login.html';
        }
    };

    // --- DATA FETCHING & RENDERING ---
    const fetchAppointments = async () => {
        loadingState.style.display = 'block';
        emptyState.style.display = 'none';
        appointmentList.innerHTML = ''; 
        try {
            const response = await fetch(`php/get_appointments.php?t=${new Date().getTime()}`);
            const data = await response.json();
            if (data.success) {
                appointments = data.appointments;
                renderAppointments();
                renderCalendar();
            } else {
                console.error('Failed to fetch appointments:', data.message);
                alert('Could not fetch appointments.');
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
            alert('An error occurred while fetching appointments.');
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
            // Sort appointments by date and time
            appointments.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

            appointments.forEach(app => {
                const appointmentCard = document.createElement('div');
                appointmentCard.className = 'appointment-card';
                appointmentCard.dataset.id = app.id;

                const countdown = calculateCountdown(app.date, app.time);

                appointmentCard.innerHTML = `
                    <div class="flex-1">
                        <p class="font-bold text-lg text-slate-800">${app.patient_name}</p>
                        <p class="text-sm text-slate-500">With Dr. ${app.doctor_name}</p>
                        <p class="text-sm text-slate-500 mt-2 flex items-center">
                            <i data-lucide="calendar" class="w-4 h-4 mr-2"></i>
                            ${new Date(app.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p class="text-sm text-slate-500 flex items-center">
                             <i data-lucide="clock" class="w-4 h-4 mr-2"></i>
                             ${new Date('1970-01-01T' + app.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </p>
                        ${app.notes ? `<p class="text-sm mt-2 p-2 bg-slate-50 rounded-md"><strong>Notes:</strong> ${app.notes}</p>` : ''}
                    </div>
                    <div class="text-right">
                        <div class="countdown ${countdown.class}">${countdown.text}</div>
                        <div class="flex justify-end mt-4 space-x-2">
                            <button class="icon-button edit-btn" data-id="${app.id}" title="Edit Appointment">
                                <i data-lucide="pencil" class="w-5 h-5"></i>
                            </button>
                            <button class="icon-button delete-btn" data-id="${app.id}" title="Delete Appointment">
                                <i data-lucide="trash-2" class="w-5 h-5"></i>
                            </button>
                        </div>
                    </div>
                `;
                appointmentList.appendChild(appointmentCard);
            });
        }
        lucide.createIcons();
    };
    
    const calculateCountdown = (dateStr, timeStr) => {
        const appointmentDateTime = new Date(`${dateStr}T${timeStr}`);
        const now = new Date();
        const diffTime = appointmentDateTime - now;
        
        if (diffTime < 0) {
            return { text: 'Completed', class: 'completed' };
        }
        
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return { text: 'Today', class: 'today' };
        } else if (diffDays === 1) {
            return { text: 'Tomorrow', class: 'tomorrow' };
        } else {
            return { text: `${diffDays} days`, class: 'upcoming' };
        }
    };

    // --- EVENT HANDLERS ---
    appointmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(appointmentForm);
        try {
            const response = await fetch('php/add_appointment.php', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                fetchAppointments();
                appointmentForm.reset();
            } else {
                alert(`Error adding appointment: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('An error occurred. Please try again.');
        }
    });

    // Delegated event listener for edit and delete buttons
    appointmentList.addEventListener('click', (e) => {
        const target = e.target.closest('.icon-button');
        if (!target) return;

        const id = target.dataset.id;
        if (target.classList.contains('edit-btn')) {
            openEditModal(id);
        } else if (target.classList.contains('delete-btn')) {
            deleteAppointment(id);
        }
    });
    
    // --- EDIT MODAL LOGIC ---
    const openEditModal = (id) => {
        const appointment = appointments.find(app => app.id == id);
        if (!appointment) return;
        
        document.getElementById('editAppointmentId').value = appointment.id;
        document.getElementById('edit_patient_name').value = appointment.patient_name;
        document.getElementById('edit_doctor_name').value = appointment.doctor_name;
        document.getElementById('edit_appointment_date').value = appointment.date;
        document.getElementById('edit_appointment_time').value = appointment.time;
        document.getElementById('edit_notes').value = appointment.notes || '';
        
        editModal.classList.remove('hidden');
        editModal.classList.add('flex');
    };

    const closeEditModal = () => {
        editModal.classList.add('hidden');
        editModal.classList.remove('flex');
    };

    cancelEditBtn.addEventListener('click', closeEditModal);

    editAppointmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(editAppointmentForm);
        try {
            const response = await fetch('php/update_appointment.php', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                closeEditModal();
                fetchAppointments();
            } else {
                alert(`Error updating appointment: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Update error:', error);
            alert('An error occurred while updating. Please try again.');
        }
    });

    // --- DELETE LOGIC ---
    const deleteAppointment = async (id) => {
        if (!confirm('Are you sure you want to delete this appointment?')) return;
        
        const formData = new FormData();
        formData.append('id', id);

        try {
            const response = await fetch('php/delete_appointment.php', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                fetchAppointments();
            } else {
                alert(`Error deleting appointment: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An error occurred while deleting. Please try again.');
        }
    };
    
    // --- CALENDAR LOGIC ---
    const renderCalendar = () => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        monthYearEl.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
        
        calendarDaysEl.innerHTML = '';
        
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarDaysEl.innerHTML += `<div></div>`;
        }
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.textContent = i;
            dayEl.classList.add('calendar-day');
            
            const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            if (appointments.some(app => app.date === dayString)) {
                dayEl.classList.add('has-appointment');
            }
            
            const today = new Date();
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayEl.classList.add('today');
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

    // --- INITIALIZATION ---
    checkSession();
});

