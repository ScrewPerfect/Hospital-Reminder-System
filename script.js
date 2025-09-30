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

    let currentDate = new Date();

    async function checkLoginStatus() {
        try {
            const response = await fetch('php/check_session.php');
            const data = await response.json();
            if (!data.loggedIn) {
                // If not logged in, redirect to login page immediately
                window.location.href = 'login.html';
            } else {
                // If logged in, display welcome message and load appointments
                if(userWelcome) {
                    userWelcome.textContent = `Welcome, ${data.username}!`;
                }
                fetchAppointments();
            }
        } catch (error) {
            console.error('Error checking login status:', error);
            // If there's an error, redirect to login as a fallback
            window.location.href = 'login.html';
        }
    }

    async function fetchAppointments() {
        loadingState.style.display = 'block';
        emptyState.style.display = 'none';
        appointmentList.innerHTML = ''; // Clear previous list
         try {
            // Append a cache-busting parameter
            const response = await fetch(`php/get_appointments.php?t=${new Date().getTime()}`);
            const appointments = await response.json();
            
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
        div.innerHTML = `
            <div class="flex-grow">
                <div class="flex items-center justify-between">
                    <h3 class="font-bold text-lg text-blue-700">${app.patient_name}</h3>
                    <div class="countdown-tag">${calculateCountdown(app.date)}</div>
                </div>
                <p class="text-sm text-gray-600">With <span class="font-semibold">${app.doctor_name}</span></p>
                <div class="text-sm text-gray-500 mt-2 flex items-center">
                     <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    ${new Date(app.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div class="text-sm text-gray-500 flex items-center mt-1">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    ${formatTime(app.time)}
                </div>
                ${app.notes ? `<div class="notes-section mt-3 pt-3 border-t border-gray-200"><p class="text-sm text-gray-800">${app.notes}</p></div>` : ''}
            </div>
            <button class="delete-btn" data-id="${app.id}">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        `;
        appointmentList.appendChild(div);
    }

    function calculateCountdown(dateStr) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const appDate = new Date(dateStr + 'T00:00:00');
        const diffTime = appDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'Past';
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        return `In ${diffDays} days`;
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
        
        // Fetch appointments for the current month view
        const response = await fetch(`php/get_appointments.php?t=${new Date().getTime()}`);
        const appointments = await response.json();
        const appointmentDates = appointments.map(app => app.date);

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
            
            // Check for appointments
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

    // Initial render
    // We don't call renderCalendar() here anymore because fetchAppointments() will do it
});

