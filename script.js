document.addEventListener('DOMContentLoaded', () => {
    // --- STATE AND CONSTANTS ---
    let expensesData = [];
    let individualExpensesData = [];
    let allMonths = [];
    let allCategories = [];
    let categoryColorMap = {};
    
    const PASTEL_COLORS = [
        '#A8E6CF', '#DCEDC1', '#FFD3B6', '#FFAAA5', '#FF8B94',
        '#D4A5A5', '#9C9CA8', '#7BC8A4', '#4CC9F0', '#B388FF',
        '#80CEE1', '#F8B195', '#F67280', '#C06C84', '#6C5B7B',
        '#99B898', '#FECEA8', '#FF847C', '#E84A5F', '#2A363B'
    ];
    
    // --- DOM ELEMENTS ---
    let categoryFilterButton, categoryFilterDropdown, categoryFilterList, categoryFilterText;
    let monthFilterButton, monthFilterDropdown, monthFilterList, monthFilterText;

    // --- INITIALIZATION ---
    async function main() {
        queryDOMElements();
        setHighchartsTheme();
        await fetchData();
        initializeFilters();
        setupEventListeners();
        updateCharts();
    }

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

    function setHighchartsTheme() {
        Highcharts.setOptions({ colors: PASTEL_COLORS });
        Highcharts.theme = {
            colors: PASTEL_COLORS,
            chart: { backgroundColor: '#f8f9fa' },
            title: { style: { color: '#333' } },
            xAxis: { labels: { style: { color: '#666' } } },
            yAxis: { labels: { style: { color: '#666' } } },
            legend: { itemStyle: { color: '#444' } }
        };
        Highcharts.setOptions(Highcharts.theme);
    }

    async function fetchData() {
        try {
            const [expensesResponse, individualResponse] = await Promise.all([
                fetch(`data/expensas.csv?v=${new Date().getTime()}`),
                fetch(`data/individual.csv?v=${new Date().getTime()}`)
            ]);

            if (!expensesResponse.ok || !individualResponse.ok) {
                throw new Error(`HTTP error! status: ${expensesResponse.status}, ${individualResponse.status}`);
            }

            const [expensesCsv, individualCsv] = await Promise.all([expensesResponse.text(), individualResponse.text()]);

            expensesData = parseCSV(expensesCsv, 'expensas.csv');
            individualExpensesData = parseIndividualCSV(individualCsv, 'individual.csv');

            if (expensesData.length === 0) console.warn('Expenses CSV parsing resulted in no data.');

        } catch (error) {
            console.error("Error loading or processing data:", error);
            document.getElementById('charts-container').innerHTML = 
                '<div class="text-center text-red-500">Error al cargar los datos. Por favor, revise la consola para más detalles.</div>';
        }
    }

    function parseCSV(csvText, fileName) {
        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim());
        const montoIndex = headers.indexOf('monto');

        return lines.slice(1).map((line, index) => {
            if (line.trim() === '') return null;
            const values = line.split(',');
            if (values.length !== headers.length) {
                console.warn(`[${fileName}] Skipping malformed row #${index + 2}: expected ${headers.length} fields, but got ${values.length}. Line: "${line}"`);
                return null;
            }

            const entry = {};
            headers.forEach((header, i) => {
                const value = values[i] ? values[i].trim() : '';
                if (i === montoIndex) {
                    const parsedAmount = parseFloat(value);
                    if (isNaN(parsedAmount)) {
                        console.warn(`[${fileName}] Invalid 'monto' in row #${index + 2}: "${value}". Defaulting to 0.`);
                        entry[header] = 0;
                    } else {
                        entry[header] = parsedAmount;
                    }
                } else {
                    entry[header] = value;
                }
            });
            return entry;
        }).filter(Boolean);
    }

    function parseIndividualCSV(csvText, fileName) {
        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim());
        const montoIndex = headers.indexOf('monto');
        const mesIndex = headers.indexOf('mes');

        return lines.slice(1).map((line, index) => {
            if (line.trim() === '') return null;
            const values = line.split(',');
            if (values.length !== headers.length) {
                 console.warn(`[${fileName}] Skipping malformed row #${index + 2}: expected ${headers.length} fields, but got ${values.length}. Line: "${line}"`);
                return null;
            }
            const parsedAmount = parseFloat(values[montoIndex]);
            return {
                mes: values[mesIndex] ? values[mesIndex].trim() : 'Sin Mes',
                monto: isNaN(parsedAmount) ? 0 : parsedAmount
            };
        }).filter(Boolean);
    }

    function initializeFilters() {
        allMonths = [...new Set(expensesData.map(d => d.mes))].sort();
        allCategories = [...new Set(expensesData.map(d => d.categoria))].sort();
        allCategories.forEach((cat, index) => { categoryColorMap[cat] = PASTEL_COLORS[index % PASTEL_COLORS.length]; });
        
        const lastTwoMonths = allMonths.slice(-2);
        populateFilter(monthFilterList, allMonths, lastTwoMonths);
        populateFilter(categoryFilterList, allCategories, allCategories);
        
        updateMonthButtonText();
        updateCategoryButtonText();
    }

    function populateFilter(listElement, options, defaultSelection = []) {
        listElement.innerHTML = '';
        const allOption = createCheckboxItem('all', 'Todos', false);
        listElement.appendChild(allOption);

        options.forEach(option => {
            const isChecked = defaultSelection.includes(option);
            const item = createCheckboxItem(option, option, isChecked);
            listElement.appendChild(item);
        });

        updateSelectAllState(listElement);
    }

    function createCheckboxItem(value, label, checked) {
        const li = document.createElement('li');
        li.className = 'text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9';
        li.innerHTML = `<label class="flex items-center"><input type="checkbox" value="${value}" ${checked ? 'checked' : ''} class="h-4 w-4 border-gray-500 rounded text-indigo-600 focus:ring-indigo-500"><span class="ml-3 block font-normal">${label}</span></label>`;
        return li;
    }
    
    function setupEventListeners() {
        setupMultiSelect(monthFilterButton, monthFilterDropdown, monthFilterList, updateMonthButtonText, updateCharts);
        setupMultiSelect(categoryFilterButton, categoryFilterDropdown, categoryFilterList, updateCategoryButtonText, updateCharts);

        document.addEventListener('click', e => {
            if (!monthFilterButton.contains(e.target) && !monthFilterDropdown.contains(e.target)) {
                monthFilterDropdown.classList.add('hidden');
            }
            if (!categoryFilterButton.contains(e.target) && !categoryFilterDropdown.contains(e.target)) {
                categoryFilterDropdown.classList.add('hidden');
            }
        });
    }

    function setupMultiSelect(button, dropdown, list, textUpdater, chartUpdater) {
        button.addEventListener('click', () => dropdown.classList.toggle('hidden'));
        list.addEventListener('change', e => {
            const clickedCheckbox = e.target;
            if (clickedCheckbox.tagName !== 'INPUT' || clickedCheckbox.type !== 'checkbox') return;
            
            const allOptionCheckbox = list.querySelector('input[value="all"]');
            const optionCheckboxes = Array.from(list.querySelectorAll('input[type="checkbox"]:not([value="all"])'));

            if (clickedCheckbox.value === 'all') {
                optionCheckboxes.forEach(cb => cb.checked = clickedCheckbox.checked);
            } else {
                allOptionCheckbox.checked = optionCheckboxes.every(cb => cb.checked);
            }
            textUpdater();
            chartUpdater();
        });
    }

    function updateSelectAllState(listElement) {
        const allCheckboxes = Array.from(listElement.querySelectorAll('input[type="checkbox"]'));
        const allOptionCheckbox = allCheckboxes.find(cb => cb.value === 'all');
        const optionCheckboxes = allCheckboxes.filter(cb => cb.value !== 'all');
        if(allOptionCheckbox) allOptionCheckbox.checked = optionCheckboxes.every(cb => cb.checked);
    }

    function updateMonthButtonText() {
        updateButtonText(monthFilterList, monthFilterText, allMonths.length, 'meses');
    }

    function updateCategoryButtonText() {
        updateButtonText(categoryFilterList, categoryFilterText, allCategories.length, 'categorías');
    }

    function updateButtonText(list, textElement, total, itemLabel) {
        const selected = Array.from(list.querySelectorAll('input:checked:not([value="all"])')).map(cb => cb.value);
        if (selected.length === 0) textElement.textContent = 'Ninguno seleccionado';
        else if (selected.length === total) textElement.textContent = `Todos los ${itemLabel}`;
        else textElement.textContent = `${selected.length} ${itemLabel} seleccionados`;
    }

    function getSelectedMonths() {
        return Array.from(monthFilterList.querySelectorAll('input:checked:not([value="all"])')).map(cb => cb.value).sort();
    }

    function getFilteredData() {
        const selectedMonths = getSelectedMonths();
        const selectedCategories = Array.from(categoryFilterList.querySelectorAll('input:checked:not([value="all"])')).map(cb => cb.value);
        
        return expensesData.filter(item => {
            const monthMatch = selectedMonths.length === 0 || selectedMonths.includes(item.mes);
            const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(item.categoria);
            return monthMatch && categoryMatch;
        });
    }

    function updateCharts() {
        const filteredData = getFilteredData();
        updateLineChart(filteredData);
        updateIndividualChart();
        updateBarChart(filteredData);
        updatePieChart(filteredData);
        updateSankeyChart(filteredData);
    }

    function updateLineChart(data) {
        const selectedMonths = getSelectedMonths();
        const selectedCategories = Array.from(categoryFilterList.querySelectorAll('input:checked:not([value="all"])')).map(cb => cb.value);
        
        const series = selectedCategories.map((category) => {
            const categoryData = selectedMonths.map(month => {
                return data
                    .filter(d => d.mes === month && d.categoria === category)
                    .reduce((sum, item) => sum + item.monto, 0);
            });
            return { name: category, data: categoryData, color: categoryColorMap[category] };
        });

        Highcharts.chart('line-chart', {
            chart: { type: 'line' },
            title: { text: null },
            xAxis: { categories: selectedMonths, title: { text: 'Mes' } },
            yAxis: { title: { text: 'Monto (ARS)' } },
            tooltip: { pointFormat: '<b>{point.y:,.0f} ARS</b>' },
            series: series,
            credits: { enabled: false }
        });
    }

    function updateIndividualChart() {
        const selectedMonths = getSelectedMonths();
        const filteredData = individualExpensesData
            .filter(item => selectedMonths.length === 0 || selectedMonths.includes(item.mes))
            .sort((a, b) => allMonths.indexOf(a.mes) - allMonths.indexOf(b.mes));

        if (filteredData.length === 0) {
            document.getElementById('individual-chart').innerHTML = '<div class="text-center p-4">No hay datos individuales para los meses seleccionados.</div>';
            return;
        }

        const categories = filteredData.map(item => item.mes);
        const seriesData = filteredData.map(item => item.monto);

        // Calculate percentage changes between months
        const percentageChanges = [];
        for (let i = 1; i < seriesData.length; i++) {
            const prev = seriesData[i - 1];
            const current = seriesData[i];
            const change = prev !== 0 ? ((current - prev) / prev) * 100 : 0;
            percentageChanges.push({
                from: categories[i - 1],
                to: categories[i],
                value: Math.round(change * 10) / 10, // Round to 1 decimal place
                color: change >= 0 ? '#e74c3c' : '#2ecc71' // Red for increase, green for decrease
            });
        }

        Highcharts.chart('individual-chart', {
            chart: { type: 'line' },
            title: { text: null },
            xAxis: { 
                categories: categories, 
                title: { text: 'Mes' },
                labels: {
                    formatter: function() {
                        // Add the month to the x-axis labels
                        return this.value;
                    }
                }
            },
            yAxis: { 
                title: { text: 'Monto (ARS)' },
                labels: {
                    formatter: function() {
                        return Highcharts.numberFormat(this.value, 0, ',', '.');
                    }
                }
            },
            tooltip: { 
                pointFormat: '<b>{point.y:,.0f} ARS</b>',
                valueDecimals: 0,
                valueSuffix: ' ARS'
            },
            plotOptions: {
                series: {
                    dataLabels: {
                        enabled: true,
                        formatter: function() {
                            // Show value on the point
                            return Highcharts.numberFormat(this.y, 0, ',', '.');
                        },
                        style: {
                            fontWeight: 'bold',
                            textOutline: '1px contrast',
                            color: 'white'
                        },
                        y: -15
                    },
                    lineWidth: 3,
                    marker: {
                        lineWidth: 1,
                        lineColor: '#fff',
                        radius: 5,
                        states: {
                            hover: {
                                radius: 7,
                                lineWidth: 2
                            }
                        }
                    }
                }
            },
            series: [{
                name: 'Gasto Individual', 
                data: seriesData.map((value, index) => ({
                    y: value,
                    dataLabels: {
                        enabled: index > 0, // Only show data labels for points after the first one
                        formatter: function() {
                            if (index === 0) return '';
                            const change = percentageChanges[index - 1];
                            return `<span style="color:${change.color}">${change.value >= 0 ? '+' : ''}${change.value}%</span>`;
                        },
                        align: 'left',
                        verticalAlign: 'middle',
                        x: 15,
                        y: -5,
                        style: {
                            fontSize: '12px',
                            fontWeight: 'normal',
                            textOutline: 'none'
                        }
                    }
                })),
                color: '#7cb5ec',
                zoneAxis: 'x',
                zones: percentageChanges.map((change, i) => ({
                    value: i + 1.5,
                    color: change.color.replace('ff', '33') + '33' // Add transparency
                })).concat([{
                    value: 1000,
                    color: '#7cb5ec'
                }])
            }],
            credits: { enabled: false },
            legend: {
                enabled: false
            }
        });
    }

    function updateBarChart(data) {
        const selectedCategories = [...new Set(data.map(d => d.categoria))].filter(c => c !== 'Total').sort();
        const selectedMonths = [...new Set(data.map(d => d.mes))].sort((a, b) => allMonths.indexOf(a) - allMonths.indexOf(b));

        const series = selectedMonths.map((month, monthIndex) => ({
            name: month,
            color: PASTEL_COLORS[monthIndex % PASTEL_COLORS.length],
            data: selectedCategories.map(category => {
                return data
                    .filter(d => d.mes === month && d.categoria === category)
                    .reduce((sum, item) => sum + item.monto, 0);
            })
        }));

        Highcharts.chart('bar-chart', {
            chart: { type: 'bar' },
            title: { text: null },
            xAxis: { categories: selectedCategories, title: { text: null } },
            yAxis: { min: 0, title: { text: 'Monto (ARS)' }, labels: { formatter: function () { return this.value / 1000000 + 'M'; } } },
            tooltip: { pointFormat: '<b>{point.y:,.0f} ARS</b>' },
            plotOptions: { bar: { dataLabels: { enabled: false } } },
            series: series,
            credits: { enabled: false }
        });
    }

    function updatePieChart(data) {
        const categoryTotals = data.reduce((acc, item) => {
            if (item.categoria !== 'Total') {
                acc[item.categoria] = (acc[item.categoria] || 0) + item.monto;
            }
            return acc;
        }, {});

        const seriesData = Object.keys(categoryTotals).map(category => ({
            name: category,
            y: categoryTotals[category],
            color: categoryColorMap[category]
        }));

        Highcharts.chart('pie-chart', {
            chart: { type: 'pie' },
            title: { text: null },
            tooltip: { pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b> ({point.y:,.0f} ARS)' },
            plotOptions: { pie: { allowPointSelect: true, cursor: 'pointer', dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.percentage:.1f} %' } } },
            series: [{ name: 'Proporción', data: seriesData }],
            credits: { enabled: false }
        });
    }

    function updateSankeyChart(filteredData) {
        const container = document.getElementById('sankey-chart-container');
        const chartDiv = document.getElementById('sankey-chart');
        const selectedMonths = getSelectedMonths();

        if (selectedMonths.length === 0) {
            if (container) container.style.display = 'none';
            return;
        }

        const latestMonth = selectedMonths[selectedMonths.length - 1];
        const dataForLatestMonth = filteredData.filter(item => item.mes === latestMonth);

        const categoryTotals = dataForLatestMonth.reduce((acc, item) => {
            if (item.categoria && item.categoria !== 'Total') {
                acc[item.categoria] = (acc[item.categoria] || 0) + item.monto;
            }
            return acc;
        }, {});

        let highestCategory = '';
        let highestAmount = 0;
        Object.entries(categoryTotals).forEach(([category, total]) => {
            if (total > highestAmount) {
                highestAmount = total;
                highestCategory = category;
            }
        });

        if (!highestCategory || highestAmount <= 0) {
            if (container) container.style.display = 'none';
            return;
        }

        const categoryItems = dataForLatestMonth
            .filter(item => item.categoria === highestCategory && item.monto > 0)
            .sort((a,b) => b.monto - a.monto);

        if (categoryItems.length === 0) {
            if (container) container.style.display = 'none';
            return;
        }

        if (container) container.style.display = 'block';
        
        // Group small subcategories (less than 1%) into 'Otros'
        const totalAmount = categoryItems.reduce((sum, item) => sum + item.monto, 0);
        const threshold = totalAmount * 0.01; // 1% threshold
        
        // Separate items into main and small items
        const mainItems = [];
        let otrosItems = [];
        
        categoryItems.forEach(item => {
            if (item.monto >= threshold) {
                mainItems.push(item);
            } else {
                otrosItems.push(item);
            }
        });
        
        // If there are small items, group them into 'Otros'
        if (otrosItems.length > 0) {
            const otrosTotal = otrosItems.reduce((sum, item) => sum + item.monto, 0);
            if (otrosTotal > 0) {
                mainItems.push({
                    categoria: highestCategory,
                    subcategoria: 'Otros',
                    monto: otrosTotal
                });
            }
        }
        
        // Sort by amount in descending order
        const sortedItems = mainItems.sort((a, b) => b.monto - a.monto);
        
        // Calculate chart height based on number of items
        const minHeight = 400; // Minimum height in pixels
        const itemHeight = 35; // Height per item in pixels
        const chartHeight = Math.max(minHeight, 100 + (sortedItems.length * itemHeight));
        
        // Prepare nodes and links for the Sankey chart
        const nodes = [
            { 
                id: highestCategory, 
                name: highestCategory, 
                color: PASTEL_COLORS[0],
                dataLabels: {
                    enabled: true,
                    style: {
                        fontWeight: 'bold',
                        color: '#333',
                        textOutline: 'none',
                        width: '200px',
                        textAlign: 'left'
                    }
                }
            },
            ...sortedItems.map((item, index) => ({
                id: `${item.subcategoria || 'item'}-${index}`,
                name: item.subcategoria,
                color: item.subcategoria === 'Otros' 
                    ? '#CCCCCC' // Gray color for 'Otros'
                    : PASTEL_COLORS[(index % (PASTEL_COLORS.length - 1)) + 1],
                dataLabels: {
                    enabled: true,
                    style: {
                        color: '#555',
                        textOutline: 'none',
                        width: '200px',
                        textAlign: 'right',
                        fontWeight: 'normal',
                        fontSize: '11px'
                    }
                }
            }))
        ];
        
        const links = sortedItems.map((item, index) => ({
            from: highestCategory,
            to: `${item.subcategoria || 'item'}-${index}`,
            weight: item.monto,
            value: item.monto,
            color: item.subcategoria === 'Otros'
                ? '#CCCCCCB3' // Semi-transparent gray for 'Otros'
                : PASTEL_COLORS[(index % (PASTEL_COLORS.length - 1)) + 1] + 'B3',
            dataLabels: {
                enabled: false  // Disable link labels to reduce clutter
            }
        }));
        
        // Create the chart with simplified configuration
        // Ensure minimum height for consistency
        const finalChartHeight = Math.max(400, chartHeight);
        Highcharts.chart(chartDiv, {
            chart: {
                type: 'sankey',
                height: '400px',
                marginRight: 300  // Increased right margin for labels
            },
            title: {
                text: `${highestCategory} (Mes: ${latestMonth})`,
                style: {
                    fontSize: '16px',
                    fontWeight: 'normal',
                    color: '#333'
                }
            },
            plotOptions: {
                sankey: {
                    nodeWidth: 30,
                    nodePadding: 20,
                    width: '100%',
                    showInLegend: false,
                    node: {
                        labels: {
                            enabled: true,
                            style: {
                                fontSize: '12px',
                                textOverflow: 'none',
                                whiteSpace: 'nowrap',
                                width: '200px',
                                textAlign: 'left'
                            },
                            useHTML: true
                        }
                    },
                    dataLabels: {
                        enabled: true,
                        style: {
                            fontSize: '12px',
                            textOverflow: 'none',
                            whiteSpace: 'nowrap',
                            width: '200px',
                            textAlign: 'right',
                            color: '#333',
                            textOutline: 'none'
                        },
                        useHTML: true
                    }
                }
            },
            tooltip: {
                headerFormat: null,
                pointFormat: '{point.fromNode.name} → {point.toNode.name}: <b>{point.value:,.0f} ARS</b>',
                nodeFormat: '{point.name}: <b>{point.sum:,.0f} ARS</b>'
            },
            series: [{
                keys: ['from', 'to', 'weight', 'value', 'color'],
                data: links.map(link => [link.from, link.to, link.weight, link.value, link.color]),
                nodes: nodes,
                name: 'Gastos',
                dataLabels: {
                    enabled: true,
                    style: {
                        fontSize: '12px',
                        textOverflow: 'none',
                        whiteSpace: 'nowrap',
                        width: '200px',
                        textAlign: 'right',
                        color: '#333',
                        textOutline: 'none'
                    },
                    useHTML: true
                }
            }],
            credits: { 
                enabled: false 
            }
        });
    }

    // --- STARTUP ---
    main();
});
