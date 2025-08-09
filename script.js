document.addEventListener('DOMContentLoaded', () => {
    // --- STATE AND CONSTANTS ---
    let barChart, lineChart, pieChart;
    let expensesData = [];
    let allMonths = [];
    let allCategories = [];

    const COLORS = [
        'rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)',
        'rgba(255, 206, 86, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)',
    ];

    // --- DOM ELEMENTS (will be assigned after DOM is loaded) ---
    let barChartCtx, lineChartCtx, pieChartCtx;
    let monthFromFilter, monthToFilter;
    let categoryFilterButton, categoryFilterDropdown, categoryFilterList, categoryFilterText;

    // This function finds and assigns all our needed DOM elements to the variables above.
    function queryDOMElements() {
        barChartCtx = document.getElementById('bar-chart').getContext('2d');
        lineChartCtx = document.getElementById('line-chart').getContext('2d');
        pieChartCtx = document.getElementById('pie-chart').getContext('2d');
        monthFromFilter = document.getElementById('month-from-filter');
        monthToFilter = document.getElementById('month-to-filter');
        categoryFilterButton = document.getElementById('category-filter-button');
        categoryFilterDropdown = document.getElementById('category-filter-dropdown');
        categoryFilterList = document.getElementById('category-filter-list');
        categoryFilterText = document.getElementById('category-filter-text');
    }

    // --- DATA FETCHING AND PARSING ---
    async function fetchData() {
        try {
            const response = await fetch(`data/expensas.csv?v=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const csvText = await response.text();
            expensesData = parseCSV(csvText);
            if (expensesData.length === 0) throw new Error('CSV parsing resulted in no data.');
            initialize();
        } catch (error) {
            console.error("Error loading or processing data:", error);
            alert('Could not load data. Please check the developer console (F12) for details.');
        }
    }

    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return []; // Return empty if no data rows

        const headers = lines[0].split(',').map(h => h.trim());
        const montoIndex = headers.indexOf('monto');

        return lines.slice(1).map(line => {
            if (line.trim() === '') return null; // Skip empty lines
            const values = line.split(',');
            if (values.length !== headers.length) {
                console.warn('Skipping malformed CSV line:', line);
                return null; // Skip rows that don't match header count
            }

            const entry = {};
            headers.forEach((header, i) => {
                const value = values[i] ? values[i].trim() : '';
                entry[header] = (i === montoIndex) ? parseFloat(value) : value;
            });
            return entry;
        }).filter(Boolean); // Filter out any null entries
    }

    // --- INITIALIZATION ---
    function initialize() {
        allMonths = [...new Set(expensesData.map(d => d.mes))].sort();
        allCategories = [...new Set(expensesData.map(d => d.categoria))].sort();
        populateMonthFilters();
        populateCategoryFilter();
        setupEventListeners();
        updateCharts();
    }

    // --- FILTERS SETUP ---
    function populateMonthFilters() {
        allMonths.forEach(month => {
            monthFromFilter.add(new Option(month, month));
            monthToFilter.add(new Option(month, month));
        });
        monthFromFilter.value = allMonths[0];
        monthToFilter.value = allMonths[allMonths.length - 1];
    }

    function populateCategoryFilter() {
        categoryFilterList.innerHTML = ''; // Clear previous options
        // Add 'Todos' option
        const allOption = createCheckboxItem('all', 'Todos', true);
        categoryFilterList.appendChild(allOption);

        // Add separator
        const separator = document.createElement('hr');
        separator.className = 'my-1';
        categoryFilterList.appendChild(separator);

        // Add individual category options
        allCategories.forEach(cat => {
            const catOption = createCheckboxItem(cat, cat, true);
            categoryFilterList.appendChild(catOption);
        });
        updateCategoryButtonText();
    }

    function createCheckboxItem(value, label, checked) {
        const li = document.createElement('li');
        const labelEl = document.createElement('label');
        labelEl.className = 'inline-flex items-center gap-2 w-full p-2 rounded-md hover:bg-gray-100 cursor-pointer';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'h-5 w-5 rounded border-gray-300';
        checkbox.value = value;
        checkbox.checked = checked;
        labelEl.appendChild(checkbox);
        labelEl.appendChild(document.createTextNode(` ${label}`));
        li.appendChild(labelEl);
        return li;
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        monthFromFilter.addEventListener('change', updateCharts);
        monthToFilter.addEventListener('change', updateCharts);

        categoryFilterButton.addEventListener('click', () => {
            categoryFilterDropdown.classList.toggle('hidden');
        });

        categoryFilterList.addEventListener('change', (e) => {
            const checkbox = e.target;
            if (checkbox.type !== 'checkbox') return;

            const checkboxes = categoryFilterList.querySelectorAll('input[type="checkbox"]');
            const allCheckbox = checkboxes[0];

            if (checkbox.value === 'all') {
                checkboxes.forEach(cb => cb.checked = checkbox.checked);
            } else {
                const allCategoriesChecked = [...checkboxes].slice(1).every(cb => cb.checked);
                allCheckbox.checked = allCategoriesChecked;
            }
            updateCategoryButtonText();
            updateCharts();
        });

        document.addEventListener('click', (e) => {
            if (!categoryFilterButton.contains(e.target) && !categoryFilterDropdown.contains(e.target)) {
                categoryFilterDropdown.classList.add('hidden');
            }
        });
    }

    // --- UI UPDATES ---
    function updateCategoryButtonText() {
        const checkboxes = categoryFilterList.querySelectorAll('input[type="checkbox"]:not([value="all"])');
        const selected = [...checkboxes].filter(cb => cb.checked);
        if (selected.length === checkboxes.length) {
            categoryFilterText.textContent = 'Todos';
        } else if (selected.length === 0) {
            categoryFilterText.textContent = 'Ninguno';
        } else if (selected.length === 1) {
            categoryFilterText.textContent = selected[0].parentElement.textContent.trim();
        } else {
            categoryFilterText.textContent = `${selected.length} categorías`;
        }
    }

    // --- CHART LOGIC ---
    function updateCharts() {
        const monthFrom = monthFromFilter.value;
        const monthTo = monthToFilter.value;
        if (!monthFrom || !monthTo || monthFrom > monthTo) {
            console.warn('Invalid date range selected.');
            return;
        }

        const selectedCategories = [...categoryFilterList.querySelectorAll('input[type="checkbox"]:checked:not([value="all"])')].map(cb => cb.value);
        const periodData = expensesData.filter(d => d.mes >= monthFrom && d.mes <= monthTo);
        const filteredData = periodData.filter(d => selectedCategories.includes(d.categoria));

        updateLineChart(selectedCategories, monthFrom, monthTo);
        updateBarChart(filteredData, monthFrom, monthTo);
        updatePieChart(filteredData, monthFrom, monthTo);
    }

    function updateLineChart(categories, from, to) {
        const monthsInRange = allMonths.filter(m => m >= from && m <= to);
        const datasets = categories.map((cat, index) => {
            const catData = expensesData.filter(d => d.categoria === cat);
            const dataByMonth = monthsInRange.map(month => {
                return catData
                    .filter(d => d.mes === month)
                    .reduce((sum, curr) => sum + curr.monto, 0);
            });
            return {
                label: cat,
                data: dataByMonth,
                borderColor: COLORS[index % COLORS.length],
                tension: 0.1,
                fill: false
            };
        });

        if (lineChart) lineChart.destroy();
        lineChart = new Chart(lineChartCtx, {
            type: 'line',
            data: { labels: monthsInRange, datasets },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
    }

    function updateBarChart(data, from, to) {
        const dataByCat = data.reduce((acc, curr) => {
            acc[curr.categoria] = (acc[curr.categoria] || 0) + curr.monto;
            return acc;
        }, {});

        if (barChart) barChart.destroy();
        barChart = new Chart(barChartCtx, {
            type: 'bar',
            data: { 
                labels: Object.keys(dataByCat), 
                datasets: [{ 
                    label: `Gastos (${from} a ${to})`, 
                    data: Object.values(dataByCat), 
                    backgroundColor: 'rgba(54, 162, 235, 0.6)' 
                }] 
            },
            options: { scales: { y: { beginAtZero: true } }, responsive: true, maintainAspectRatio: false }
        });
    }

    function updatePieChart(data, from, to) {
        const dataBySubCat = data.reduce((acc, curr) => {
            acc[curr.subcategoria] = (acc[curr.subcategoria] || 0) + curr.monto;
            return acc;
        }, {});

        if (pieChart) pieChart.destroy();
        pieChart = new Chart(pieChartCtx, {
            type: 'pie',
            data: { 
                labels: Object.keys(dataBySubCat), 
                datasets: [{ 
                    label: `Proporción (${from} a ${to})`, 
                    data: Object.values(dataBySubCat), 
                    backgroundColor: Object.keys(dataBySubCat).map((_, i) => COLORS[i % COLORS.length])
                }] 
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // --- APP START ---
    // 1. Find all the necessary DOM elements on the page.
    queryDOMElements();
    // 2. Start the process of getting data and building the dashboard.
    fetchData();
});
