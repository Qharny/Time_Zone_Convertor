document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const localTimeEl = document.getElementById('local-time');
    const sourceTimezoneSelect = document.getElementById('source-timezone');
    const targetTimezoneSelect = document.getElementById('target-timezone');
    const sourceTimeInput = document.getElementById('source-time');
    const resultTimeEl = document.getElementById('result-time');
    const convertBtn = document.getElementById('convert-btn');
    const swapBtn = document.getElementById('swap-btn');
    const currentTimeBtn = document.getElementById('current-time-btn');
    const historyList = document.getElementById('history-list');
    
    // Time zones list
    const timeZones = [
        { label: 'Greenwich Mean Time (GMT)', value: 'GMT' },
        { label: 'Eastern Africa Time (EAT)', value: 'Africa/Nairobi' },
        { label: 'Central European Time (CET)', value: 'Europe/Paris' },
        { label: 'Eastern European Time (EET)', value: 'Europe/Athens' },
        { label: 'Eastern Standard Time (EST)', value: 'America/New_York' },
        { label: 'Central Standard Time (CST)', value: 'America/Chicago' },
        { label: 'Mountain Standard Time (MST)', value: 'America/Denver' },
        { label: 'Pacific Standard Time (PST)', value: 'America/Los_Angeles' },
        { label: 'Japan Standard Time (JST)', value: 'Asia/Tokyo' },
        { label: 'Australian Eastern Standard Time (AEST)', value: 'Australia/Sydney' },
        { label: 'India Standard Time (IST)', value: 'Asia/Kolkata' },
        { label: 'Coordinated Universal Time (UTC)', value: 'UTC' }
    ];
    
    // Conversion history
    let conversionHistory = JSON.parse(localStorage.getItem('timeConverterHistory')) || [];
    
    // Initialize
    function init() {
        // Populate timezone dropdowns
        populateTimezoneDropdowns();
        
        // Set default values
        setDefaultValues();
        
        // Update local time
        updateLocalTime();
        setInterval(updateLocalTime, 1000);
        
        // Load conversion history
        renderHistory();
        
        // Add event listeners
        addEventListeners();
    }
    
    function populateTimezoneDropdowns() {
        timeZones.forEach(tz => {
            const sourceOption = document.createElement('option');
            sourceOption.value = tz.value;
            sourceOption.textContent = tz.label;
            sourceTimezoneSelect.appendChild(sourceOption);
            
            const targetOption = document.createElement('option');
            targetOption.value = tz.value;
            targetOption.textContent = tz.label;
            targetTimezoneSelect.appendChild(targetOption);
        });
    }
    
    function setDefaultValues() {
        // Try to get user's timezone
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Find closest match in our list
        const closestMatch = timeZones.find(tz => tz.value === userTimezone) || 
                            timeZones.find(tz => tz.value === 'UTC');
        
        // Set source to user's timezone and target to GMT
        if (closestMatch) {
            sourceTimezoneSelect.value = closestMatch.value;
        }
        targetTimezoneSelect.value = 'GMT';
        
        // Set current time
        setCurrentTime();
    }
    
    function updateLocalTime() {
        const now = new Date();
        localTimeEl.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
    }
    
    function setCurrentTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        sourceTimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    function addEventListeners() {
        convertBtn.addEventListener('click', convertTime);
        swapBtn.addEventListener('click', swapTimezones);
        currentTimeBtn.addEventListener('click', setCurrentTime);
        
        // Auto-convert when inputs change
        sourceTimezoneSelect.addEventListener('change', convertTime);
        targetTimezoneSelect.addEventListener('change', convertTime);
        sourceTimeInput.addEventListener('change', convertTime);
    }
    
    function convertTime() {
        // Get input values
        const sourceTimezone = sourceTimezoneSelect.value;
        const targetTimezone = targetTimezoneSelect.value;
        const sourceTimeStr = sourceTimeInput.value;
        
        if (!sourceTimeStr) {
            setCurrentTime();
            return;
        }
        
        try {
            // Parse the input time
            const [datePart, timePart] = sourceTimeStr.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hours, minutes] = timePart.split(':').map(Number);
            
            // Create Date object in the source timezone
            const sourceDate = new Date(Date.UTC(year, month-1, day, hours, minutes));
            
            // Format options for displaying the result
            const options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: targetTimezone
            };
            
            // Format the result
            const formatter = new Intl.DateTimeFormat('en-US', options);
            const result = formatter.format(sourceDate);
            
            // Display the result
            resultTimeEl.textContent = result;
            
            // Add to history
            addToHistory(sourceTimezone, targetTimezone, sourceTimeStr, result);
            
        } catch (error) {
            resultTimeEl.textContent = 'Invalid input';
            console.error(error);
        }
    }
    
    function swapTimezones() {
        // Animate the button
        swapBtn.classList.add('animate-spin');
        setTimeout(() => swapBtn.classList.remove('animate-spin'), 300);
        
        // Swap the values
        const temp = sourceTimezoneSelect.value;
        sourceTimezoneSelect.value = targetTimezoneSelect.value;
        targetTimezoneSelect.value = temp;
        
        // Convert with new values
        convertTime();
    }
    
    function addToHistory(from, to, sourceTime, result) {
        // Create history item
        const historyItem = {
            id: Date.now(),
            from: from,
            to: to,
            sourceTime: sourceTime,
            result: result,
            timestamp: new Date().toISOString()
        };
        
        // Add to beginning of array
        conversionHistory.unshift(historyItem);
        
        // Keep only last 10 items
        if (conversionHistory.length > 10) {
            conversionHistory.pop();
        }
        
        // Save to localStorage
        localStorage.setItem('timeConverterHistory', JSON.stringify(conversionHistory));
        
        // Update UI
        renderHistory();
    }
    
    function renderHistory() {
        // Clear current list
        historyList.innerHTML = '';
        
        if (conversionHistory.length === 0) {
            historyList.innerHTML = '<div class="text-sm text-gray-400 italic text-center py-4">No recent conversions</div>';
            return;
        }
        
        // Add each history item
        conversionHistory.forEach((item, index) => {
            const fromLabel = timeZones.find(tz => tz.value === item.from)?.label || item.from;
            const toLabel = timeZones.find(tz => tz.value === item.to)?.label || item.to;
            
            const historyItemEl = document.createElement('div');
            historyItemEl.className = 'history-item bg-gray-700 p-3 rounded-lg shadow-sm border border-purple-900/20 animate-fadeIn';
            historyItemEl.style.animationDelay = `${index * 0.1}s`;
            
            historyItemEl.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <div class="text-sm font-medium text-purple-200">${fromLabel} → ${toLabel}</div>
                        <div class="text-xs text-gray-400 mt-1">${item.result}</div>
                    </div>
                    <button class="delete-history text-gray-500 hover:text-red-400 transition-colors" data-id="${item.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            historyList.appendChild(historyItemEl);
            
            // Add delete event listener
            historyItemEl.querySelector('.delete-history').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteHistoryItem(item.id);
            });
            
            // Add click event to reuse this conversion
            historyItemEl.addEventListener('click', () => {
                reuseHistoryItem(item);
            });
        });
    }
    
    function deleteHistoryItem(id) {
        conversionHistory = conversionHistory.filter(item => item.id !== id);
        localStorage.setItem('timeConverterHistory', JSON.stringify(conversionHistory));
        renderHistory();
    }
    
    function reuseHistoryItem(item) {
        sourceTimezoneSelect.value = item.from;
        targetTimezoneSelect.value = item.to;
        sourceTimeInput.value = item.sourceTime;
        convertTime();
    }
    
    // Initialize the app
    init();
    
    // Initial conversion
    setTimeout(convertTime, 500);
});