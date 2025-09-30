document.addEventListener('DOMContentLoaded', () => {
    const appointmentForm = document.getElementById('appointmentForm');
    const appointmentList = document.getElementById('appointmentList');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const userSessionDiv = document.getElementById('user-session');
    const usernameDisplay = document.getElementById('username-display');

    let appointments = [];
    let currentDate = new Date();

    // --- SECURITY: Check if user is logged in ---
    const checkUserSession = async () => {
        try {
            const response = await fetch('check_session.php');
            const data = await response.json();

            if (data.loggedIn && data.username) {
                // User is logged in, show the dashboard content and username
                usernameDisplay.textContent = data.username;
                userSessionDiv.classList.remove('hidden');
                userSessionDiv.classList.add('flex'); // Make it visible
                fetchAppointments(); // Fetch their appointments
            } else {
                // User is not logged in, redirect to login page
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error checking session:', error);
            // In case of error, assume not logged in and redirect
            window.location.href = 'login.html';
        }
    };


    // --- DATA FETCHING ---
    const fetchAppointments = async () => {
        loadingState.style.display = 'block';
        emptyState.style.display = 'none';
        try {
            // Add a cache-busting parameter to prevent stale data
            const response = await fetch(`get_appointments.php?t=${new Date().getTime()}`);
            if (!response.ok) {
                 if (response.status === 401) { // Unauthorized
                    window.location.href = 'login.html';
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            appointments = data;
            renderAppointments();
            renderCalendar();
        } catch (error) {
            console.error('Error fetching appointments:', error);
            appointmentList.innerHTML = `<p class="text-red-500 text-center">Failed to load appointments.</p>`;
        } finally {
            loadingState.style.display = 'none';
        }
    };

    // --- RENDERING ---
    const renderAppointments = () => {
        appointmentList.innerHTML = ''; // Clear current list except for states
        appointmentList.appendChild(loadingState);
        appointmentList.appendChild(emptyState);

        if (appointments.length === 0) {
            emptyState.style.display = 'block';
        } else {
             const sortedAppointments = appointments.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
            sortedAppointments.forEach(app => {
                const appointmentCard = createAppointmentCard(app);
                appointmentList.appendChild(appointmentCard);
            });
            emptyState.style.display = 'none';
        }
        lucide.createIcons(); // Re-render icons after adding new elements
    };

    const createAppointmentCard = (app) => {
        const card = document.createElement('div');
        card.className = 'appointment-card';

        const appointmentDate = new Date(`${app.date}T${app.time}`);
        const now = new Date();
        const diffTime = appointmentDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let countdownText;
        if (diffDays > 0) {
            countdownText = `${diffDays} day(s) left`;
        } else if (diffDays === 0) {
            countdownText = 'Today';
        } else {
            countdownText = 'Past';
        }

        card.innerHTML = `
            <div class="flex-1">
                <div class="flex items-center gap-3">
                    <div class="bg-blue-100 text-blue-600 p-2 rounded-full">
                        <i data-lucide="calendar" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <p class="font-bold text-lg text-gray-800">${app.patient_name}</p>
                        <p class="text-sm text-gray-500">with Dr. ${app.doctor_name}</p>
                    </div>
                </div>
                <div class="mt-4 pl-12">
                    <p class="text-sm text-gray-600"><strong class="font-semibold">Date:</strong> ${new Date(app.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p class="text-sm text-gray-600"><strong class="font-semibold">Time:</strong> ${new Date('1970-01-01T' + app.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    ${app.notes ? `<p class="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded-md"><strong class="font-semibold">Notes:</strong> ${app.notes}</p>` : ''}
                </div>
            </div>
            <div class="flex flex-col items-center justify-center gap-2">
                 <div class="countdown">${countdownText}</div>
                <button class="delete-btn" data-id="${app.id}">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>
            </div>
        `;
        return card;
    };


    // --- EVENT LISTENERS ---
    appointmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(appointmentForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('add_appointment.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.success) {
                fetchAppointments(); // Refresh the list
                appointmentForm.reset();
            } else {
                alert('Error adding appointment: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    });

    appointmentList.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            const id = deleteButton.dataset.id;
            if (confirm('Are you sure you want to delete this appointment?')) {
                try {
                    const response = await fetch('delete_appointment.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id })
                    });
                    const result = await response.json();
                    if (result.success) {
                        fetchAppointments(); // Refresh list
                    } else {
                        alert('Error deleting appointment: ' + result.message);
                    }
                } catch (error) {
                    console.error('Error:', error);
                }
            }
        }
    });
    
    // --- CALENDAR LOGIC ---
    const calendarDays = document.getElementById('calendarDays');
    const monthYear = document.getElementById('monthYear');

    const renderCalendar = () => {
        calendarDays.innerHTML = '';
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        monthYear.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarDays.appendChild(document.createElement('div'));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.textContent = day;
            dayDiv.classList.add('calendar-day');

            const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasAppointment = appointments.some(app => app.date === dayString);

            if (hasAppointment) {
                dayDiv.classList.add('has-appointment');
            }

            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayDiv.classList.add('today');
            }
            calendarDays.appendChild(dayDiv);
        }
    };
    
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // --- INITIALIZATION ---
    checkUserSession();
});

