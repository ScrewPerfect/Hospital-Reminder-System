document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const appointmentForm = document.getElementById('appointmentForm');
    const appointmentList = document.getElementById('appointmentList');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const userSessionDiv = document.getElementById('user-session');
    const usernameDisplay = document.getElementById('username-display');
    const calendarDays = document.getElementById('calendarDays');
    const monthYear = document.getElementById('monthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    
    // Calendar State
    let currentDate = new Date();
    let appointments = [];
    
    // --- CORE FUNCTIONS ---
    
    // 1. Check if user is logged in
    const checkSession = async () => {
        try {
            const response = await fetch('check_session.php');
            const session = await response.json();
            if (!session.loggedIn) {
                window.location.href = 'login.html'; // Redirect if not logged in
            } else {
                usernameDisplay.textContent = session.username;
                userSessionDiv.classList.remove('hidden');
                // Once session is confirmed, fetch appointments and render the page
                await fetchAppointments();
                renderCalendar();
            }
        } catch (error) {
            console.error('Session check failed:', error);
            window.location.href = 'login.html';
        }
    };
    
    // 2. Fetch all appointments for the logged-in user
    const fetchAppointments = async () => {
        try {
            // Add a cache-busting parameter to prevent stale data
            const response = await fetch(`get_appointments.php?t=${new Date().getTime()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            appointments = data;
            renderAppointments();
            renderCalendar(); // Re-render calendar to highlight dates
        } catch (error) {
            console.error("Error fetching appointments:", error);
            appointmentList.innerHTML = `<div class="feedback-state"><p class="error">Could not load appointments. Please try again later.</p></div>`;
        }
    };
    
    // 3. Render appointments to the list
    const renderAppointments = () => {
        loadingState.classList.add('hidden');
        appointmentList.innerHTML = ''; // Clear previous list
        
        if (appointments.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            // Sort appointments by date
            appointments.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
            
            appointments.forEach(app => {
                const card = document.createElement('div');
                card.className = 'appointment-card';
                
                const appointmentDate = new Date(app.date + 'T' + app.time);
                const daysUntil = Math.ceil((appointmentDate - new Date()) / (1000 * 60 * 60 * 24));
                
                let countdownText = '';
                if (daysUntil > 1) {
                    countdownText = `in ${daysUntil} days`;
                } else if (daysUntil === 1) {
                    countdownText = `tomorrow`;
                } else if (daysUntil === 0) {
                    countdownText = `today`;
                } else {
                    countdownText = `overdue`;
                }

                card.innerHTML = `
                    <div class="flex items-start justify-between">
                        <div>
                            <p class="font-bold text-lg text-blue-700">${app.patient_name}</p>
                            <p class="text-sm text-gray-600">with Dr. ${app.doctor_name}</p>
                        </div>
                        <div class="countdown">${countdownText}</div>
                    </div>
                    <div class="mt-4 pt-4 border-t border-gray-200 text-sm">
                        <div class="flex items-center text-gray-700 mb-2">
                           <i data-lucide="calendar" class="w-4 h-4 mr-2 text-gray-500"></i> ${new Date(app.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <div class="flex items-center text-gray-700">
                            <i data-lucide="clock" class="w-4 h-4 mr-2 text-gray-500"></i> ${new Date('1970-01-01T' + app.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </div>
                         ${app.notes ? `<div class="mt-3 text-gray-600 bg-gray-50 p-3 rounded-md"><p>${app.notes}</p></div>` : ''}
                    </div>
                    <button class="delete-btn" data-id="${app.id}">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                `;
                appointmentList.appendChild(card);
            });
        }
        lucide.createIcons(); // Activate any new icons
    };
    
    // 4. Handle Add Appointment Form Submission
    appointmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(appointmentForm);
        
        try {
            const response = await fetch('add_appointment.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                appointmentForm.reset();
                await fetchAppointments(); // Refresh the list
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error("Error adding appointment:", error);
            alert("Could not add appointment. Please try again.");
        }
    });

    // 5. Handle Delete Appointment
    appointmentList.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            const appointmentId = deleteButton.dataset.id;
            if (confirm('Are you sure you want to delete this appointment?')) {
                try {
                    const response = await fetch('delete_appointment.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: `id=${appointmentId}`
                    });
                    const result = await response.json();
                    if (result.success) {
                        await fetchAppointments(); // Refresh the list
                    } else {
                        alert(`Error: ${result.message}`);
                    }
                } catch (error) {
                    console.error("Error deleting appointment:", error);
                    alert("Could not delete appointment. Please try again.");
                }
            }
        }
    });

    // --- CALENDAR FUNCTIONS ---
    
    // Render the calendar days
    const renderCalendar = () => {
        calendarDays.innerHTML = '';
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        
        monthYear.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
        
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Add empty cells for days before the 1st
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarDays.insertAdjacentHTML('beforeend', `<div></div>`);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(year, month, day);
            const dateString = dayDate.toISOString().split('T')[0];
            
            let classes = 'calendar-day';
            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                classes += ' today';
            }
            
            // Check if there's an appointment on this day
            const hasAppointment = appointments.some(app => app.date === dateString);
            if (hasAppointment) {
                classes += ' has-appointment';
            }
            
            calendarDays.insertAdjacentHTML('beforeend', `<div class="${classes}">${day}</div>`);
        }
        lucide.createIcons(); // Ensure icons are rendered
    };
    
    // Calendar navigation
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

