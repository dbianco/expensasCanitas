document.addEventListener('DOMContentLoaded', () => {
    // --- STATE AND CONSTANTS ---
    let expensesData = [];
    let allMonths = [];
    let allCategories = [];
    let categoryColorMap = {};

    const HIGHCHARTS_COLORS = [
        '#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9',
        '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1'
    ];

    // --- DOM ELEMENTS ---
    let categoryFilterButton, categoryFilterDropdown, categoryFilterList, categoryFilterText;
    let monthFilterButton, monthFilterDropdown, monthFilterList, monthFilterText;

    function queryDOMElements() {
        monthFilterButton = document.getElementById('month-filter-button');
        monthFilterDropdown = document.getElementById('month-filter-dropdown');
        monthFilterList = document.getElementById('month-filter-list');
        monthFilterText = document.getElementById('month-filter-text');
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
        allCategories.forEach((cat, index) => { categoryColorMap[cat] = HIGHCHARTS_COLORS[index % HIGHCHARTS_COLORS.length]; });
        setHighchartsTheme();
        // Populate filters
        const lastTwoMonths = allMonths.slice(-2);
        populateFilter(monthFilterList, allMonths, lastTwoMonths);
        populateFilter(categoryFilterList, allCategories, allCategories);

        // Update button texts after populating
        updateMonthButtonText();
        updateCategoryButtonText();
        setupEventListeners();
        updateCharts();
    }

    // --- FILTERS SETUP ---
    function populateFilter(listElement, options, defaultSelection = []) {
        listElement.innerHTML = ''; // Clear previous options
        const allOption = createCheckboxItem('all', 'Todos', false);
        listElement.appendChild(allOption);

        options.forEach(option => {
            const isChecked = defaultSelection.includes(option);
            const item = createCheckboxItem(option, option, isChecked);
            listElement.appendChild(item);
        });

        // Sync 'Todos' checkbox based on default selection
        const allCheckboxes = Array.from(listElement.querySelectorAll('input[type="checkbox"]'));
        const allOptionCheckbox = allCheckboxes.find(cb => cb.value === 'all');
        const optionCheckboxes = allCheckboxes.filter(cb => cb.value !== 'all');
        allOptionCheckbox.checked = optionCheckboxes.every(cb => cb.checked);
    }

    function createCheckboxItem(value, label, checked) {
        const li = document.createElement('li');
        li.className = 'text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9';
        li.innerHTML = `
            <label class="flex items-center">
                <input type="checkbox" value="${value}" ${checked ? 'checked' : ''} class="h-4 w-4 border-gray-500 rounded text-indigo-600 focus:ring-indigo-500">
                <span class="ml-3 block font-normal">${label}</span>
            </label>
        `;
        return li;
    }

    function setupMultiSelect(button, dropdown, list, textUpdater, chartUpdater) {
        // Toggle dropdown visibility
        button.addEventListener('click', () => dropdown.classList.toggle('hidden'));

        // Handle checkbox changes
        list.addEventListener('change', e => {
            const clickedCheckbox = e.target;
            if (clickedCheckbox.tagName !== 'INPUT' || clickedCheckbox.type !== 'checkbox') return;

            const allCheckboxes = Array.from(list.querySelectorAll('input[type="checkbox"]'));
            const allOptionCheckbox = allCheckboxes.find(cb => cb.value === 'all');
            const optionCheckboxes = allCheckboxes.filter(cb => cb.value !== 'all');

            if (clickedCheckbox.value === 'all') {
                optionCheckboxes.forEach(cb => cb.checked = clickedCheckbox.checked);
            } else {
                allOptionCheckbox.checked = optionCheckboxes.every(cb => cb.checked);
            }

            textUpdater();
            chartUpdater();
        });
    }

    function setupEventListeners() {
        // Setup both multi-select filters
        setupMultiSelect(monthFilterButton, monthFilterDropdown, monthFilterList, updateMonthButtonText, updateCharts);
        setupMultiSelect(categoryFilterButton, categoryFilterDropdown, categoryFilterList, updateCategoryButtonText, updateCharts);

        // Close dropdowns if clicked outside
        document.addEventListener('click', e => {
            if (!monthFilterButton.contains(e.target) && !monthFilterDropdown.contains(e.target)) {
                monthFilterDropdown.classList.add('hidden');
            }
            if (!categoryFilterButton.contains(e.target) && !categoryFilterDropdown.contains(e.target)) {
                categoryFilterDropdown.classList.add('hidden');
            }
        });
    }

    function updateMonthButtonText() {
        const selectedMonths = Array.from(monthFilterList.querySelectorAll('input:checked'))
            .map(cb => cb.value)
            .filter(v => v !== 'all');
        if (selectedMonths.length === 0) {
            monthFilterText.textContent = 'Ninguno seleccionado';
        } else if (selectedMonths.length === allMonths.length) {
            monthFilterText.textContent = 'Todos los meses';
        } else {
            monthFilterText.textContent = `${selectedMonths.length} meses seleccionados`;
        }
    }

    function updateCategoryButtonText() {
        const selected = Array.from(categoryFilterList.querySelectorAll('input:checked'))
            .map(cb => cb.value)
            .filter(v => v !== 'all');

        if (selected.length === 0) {
            categoryFilterText.textContent = 'Ninguna seleccionada';
        } else if (selected.length === allCategories.length) {
            categoryFilterText.textContent = 'Todas las categorías';
        } else {
            categoryFilterText.textContent = `${selected.length} categorías seleccionadas`;
        }
    }

    // --- CHART LOGIC ---
    function updateCharts() {
        const filteredData = getFilteredData();
        updateLineChart(filteredData);
        updateBarChart(filteredData);
        updatePieChart(filteredData);
    }

    function getFilteredData() {
        const selectedMonths = Array.from(monthFilterList.querySelectorAll('input:checked')).map(cb => cb.value).filter(v => v !== 'all');
        const selectedCategories = Array.from(categoryFilterList.querySelectorAll('input:checked')).map(cb => cb.value).filter(v => v !== 'all');

        return expensesData.filter(item => {
            return (selectedMonths.length === 0 || selectedMonths.includes(item.mes)) &&
                (selectedCategories.length === 0 || selectedCategories.includes(item.categoria));
        });
    }

    function updateLineChart(data) {
        const selectedMonths = Array.from(monthFilterList.querySelectorAll('input:checked')).map(cb => cb.value).filter(v => v !== 'all').sort();
        const selectedCategories = Array.from(categoryFilterList.querySelectorAll('input:checked')).map(cb => cb.value).filter(v => v !== 'all');
        
        const series = selectedCategories.map(category => {
            const categoryData = selectedMonths.map(month => {
                const monthData = data.filter(d => d.mes === month && d.categoria === category);
                return monthData.reduce((sum, item) => sum + item.monto, 0);
            });
            return {
                name: category,
                data: categoryData,
                color: categoryColorMap[category] || '#7cb5ec'
            };
        });

        Highcharts.chart('line-chart', {
            chart: { type: 'line' },
            title: { text: null },
            xAxis: { 
                type: 'category', 
                categories: selectedMonths 
            },
            yAxis: { 
                title: { 
                    text: 'Monto (ARS)' 
                } 
            },
            series: series,
            credits: { enabled: false }
        });
    }

    function updateBarChart(data) {
        const categories = [...new Set(data.map(d => d.categoria))].filter(c => c !== 'Total');
        const dataByCat = categories.map(cat => ({
            name: cat,
            y: data.filter(d => d.categoria === cat).reduce((sum, item) => sum + item.monto, 0),
            color: categoryColorMap[cat]
        }));

        Highcharts.chart('bar-chart', {
            chart: { type: 'column' },
            title: { text: null },
            xAxis: { categories: categories, crosshair: true },
            yAxis: { min: 0, title: { text: 'Monto (ARS)' } },
            series: [{ name: 'Gastos', data: dataByCat, colorByPoint: true }],
            credits: { enabled: false },
            legend: { enabled: false }
        });
    }

    function updatePieChart(data) {
        const categories = [...new Set(data.map(d => d.categoria))].filter(c => c !== 'Total');
        const dataByCat = categories.map(cat => ({
            name: cat,
            y: data.filter(d => d.categoria === cat).reduce((sum, item) => sum + item.monto, 0),
            color: categoryColorMap[cat]
        }));

        Highcharts.chart('pie-chart', {
            chart: { type: 'pie' },
            title: { text: null },
            tooltip: { pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>' },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.percentage:.1f} %' }
                }
            },
            series: [{ name: 'Proporción', data: dataByCat }],
            credits: { enabled: false }
        });
    }

    function setHighchartsTheme() {
        Highcharts.setOptions({
            colors: HIGHCHARTS_COLORS,
            chart: {
                backgroundColor: '#f4f7f6',
                style: {
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                }
            },
            title: {
                style: { color: '#333', fontSize: '16px' }
            },
            subtitle: {
                style: { color: '#666' }
            },
            xAxis: {
                gridLineColor: '#e6e6e6',
                labels: { style: { color: '#666' } },
                lineColor: '#e6e6e6',
                tickColor: '#e6e6e6',
                title: { style: { color: '#666' } }
            },
            yAxis: {
                gridLineColor: '#e6e6e6',
                labels: { style: { color: '#666' } },
                lineColor: '#e6e6e6',
                tickColor: '#e6e6e6',
                title: { style: { color: '#666' } }
            },
            legend: {
                itemStyle: { color: '#333' },
                itemHoverStyle: { color: '#000' },
                itemHiddenStyle: { color: '#ccc' }
            },
            labels: {
                style: { color: '#666' }
            }
        });
    }

    // --- APP START ---
    function startApp() {
        queryDOMElements();
        fetchData();
    }

    startApp();
});
