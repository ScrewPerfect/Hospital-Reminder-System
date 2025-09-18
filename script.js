document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const appointmentForm = document.getElementById('appointmentForm');
    const appointmentList = document.getElementById('appointmentList');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    // --- Calendar Elements ---
    const monthYearEl = document.getElementById('monthYear');
    const calendarDaysEl = document.getElementById('calendarDays');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    let currentDate = new Date();
    let appointments = []; // Local cache of appointments

    // --- Data Fetching ---
    async function fetchAppointments() {
        try {
            // Use a cache-busting query parameter to prevent browser caching of the API call
            const response = await fetch(`./get_appointments.php?t=${new Date().getTime()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            appointments = data;
            // Sort appointments by date and time
            appointments.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
            renderAppointments();
            renderCalendar();
        } catch (error) {
            console.error("Error fetching appointments:", error);
            appointmentList.innerHTML = `<div class="text-center p-4 bg-red-100 text-red-700 rounded-lg">
                <h3 class="font-bold">Failed to load appointments</h3>
                <p class="text-sm">Please ensure XAMPP is running, the database is set up correctly, and check the browser console for errors.</p>
            </div>`;
            loadingState.classList.add('hidden');
        }
    }

    // --- Render Functions ---
    function renderAppointments() {
        appointmentList.innerHTML = ''; // Clear previous entries
        loadingState.classList.add('hidden');

        if (appointments.length === 0) {
            appointmentList.appendChild(emptyState);
            emptyState.classList.remove('hidden');
            return;
        }
        emptyState.classList.add('hidden');

        appointments.forEach(appt => {
            const appointmentEl = document.createElement('div');
            // Add animation class
            appointmentEl.className = 'appointment-card bg-slate-100 p-4 rounded-xl border border-slate-200 transition-shadow hover:shadow-lg';
            appointmentEl.setAttribute('data-id', appt.id);
            
            const apptDate = new Date(`${appt.date}T${appt.time}`);
            const countdown = calculateCountdown(apptDate);
            const isPast = new Date() > apptDate;

            let countdownHTML = '';
            if(isPast) {
                countdownHTML = `<div class="text-sm font-medium text-slate-500">Appointment has passed.</div>`;
            } else {
                countdownHTML = `
                    <div class="text-sm font-semibold text-blue-600">
                        <span>${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s left</span>
                    </div>`;
            }
            
            const formattedTime = apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

            appointmentEl.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold text-lg text-slate-800">${appt.patient_name}</p>
                        <p class="text-sm text-slate-500 flex items-center mt-1">
                            <i data-lucide="user-md" class="w-4 h-4 mr-2 text-slate-400"></i>
                            Dr. ${appt.doctor_name}
                        </p>
                    </div>
                    <button class="delete-btn text-slate-400 hover:text-red-500 p-1 rounded-full transition-colors">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="mt-4 pt-4 border-t border-slate-200">
                    <div class="flex items-center text-sm text-slate-600 mb-3">
                        <i data-lucide="calendar" class="w-4 h-4 mr-2 text-slate-400"></i>
                        <span>${apptDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                     <div class="flex items-center text-sm text-slate-600 mb-3">
                        <i data-lucide="clock" class="w-4 h-4 mr-2 text-slate-400"></i>
                        <span>${formattedTime}</span>
                    </div>
                    ${appt.notes ? `<div class="text-sm bg-blue-50 border border-blue-200 p-3 rounded-lg mt-3">
                        <p class="font-semibold text-blue-800">Notes:</p> 
                        <p class="text-blue-700">${appt.notes}</p>
                    </div>` : ''}
                    <div class="mt-4">
                        ${countdownHTML}
                    </div>
                </div>
            `;
            appointmentList.appendChild(appointmentEl);
        });
        // After adding all new elements, tell Lucide to create the icons
        lucide.createIcons();
    }
    
    function renderCalendar() {
        calendarDaysEl.innerHTML = '';
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();

        monthYearEl.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Add empty divs for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarDaysEl.innerHTML += `<div></div>`;
        }

        // Add divs for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.textContent = day;
            dayEl.className = 'calendar-day';
            
            const today = new Date();
            // Check if the current day in the loop is today
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayEl.classList.add('today');
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasAppointment = appointments.some(appt => appt.date === dateStr);
            
            if (hasAppointment) {
                dayEl.classList.add('has-appointment');
            }
            calendarDaysEl.appendChild(dayEl);
        }
    }
    
    // --- Countdown Logic ---
    function calculateCountdown(targetDate) {
        const now = new Date().getTime();
        const distance = targetDate.getTime() - now;

        if (distance < 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        return { days, hours, minutes, seconds };
    }

    // --- Update Interval ---
    // Update the countdowns every second
    setInterval(() => {
       const appointmentElements = document.querySelectorAll('#appointmentList [data-id]');
       appointmentElements.forEach(el => {
            const appt = appointments.find(a => a.id == el.dataset.id);
            if (appt) {
                const apptDate = new Date(`${appt.date}T${appt.time}`);
                 const isPast = new Date() > apptDate;
                const countdownSpan = el.querySelector('.text-blue-600 span');
                if (countdownSpan && !isPast) {
                    const countdown = calculateCountdown(apptDate);
                    countdownSpan.textContent = `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s left`;
                } else if (countdownSpan && isPast) {
                     el.querySelector('.text-blue-600').innerHTML = `<div class="text-sm font-medium text-slate-500">Appointment has passed.</div>`;
                }
            }
       });
    }, 1000);

    // --- Event Handlers ---
    appointmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(appointmentForm);
        const selectedDate = new Date(`${formData.get('appointmentDate')}T${formData.get('appointmentTime')}`);
        
        // Basic validation for past dates
        if(selectedDate < new Date()){
            alert('Cannot schedule an appointment in the past.');
            return;
        }

        try {
            const response = await fetch('./add_appointment.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                appointmentForm.reset();
                fetchAppointments(); // Refresh the list
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error("Error adding appointment:", error);
            alert("Could not save appointment. Please try again.");
        }
    });

    appointmentList.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const appointmentEl = e.target.closest('[data-id]');
            const docId = appointmentEl.dataset.id;
            if (confirm('Are you sure you want to delete this appointment?')) {
                try {
                    const formData = new FormData();
                    formData.append('id', docId);

                    const response = await fetch('./delete_appointment.php', {
                        method: 'POST',
                        body: formData
                    });
                    const result = await response.json();
                    if (result.success) {
                        fetchAppointments(); // Refresh the list
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
    
    // Calendar navigation
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Initial Load
    fetchAppointments();
});

