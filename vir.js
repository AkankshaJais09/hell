function updateVisualizations(scheduler) {
    updateGanttChart(scheduler.ganttData);
    updateFrequencyChart(scheduler.frequencyData);
    updateEnergyChart(scheduler.energyData);
    updateFrequencyDistribution(scheduler.frequencyData);
}

function updateGanttChart(ganttData) {
    const ctx = document.getElementById('ganttChart').getContext('2d');
    if (window.ganttChart instanceof Chart) {
        window.ganttChart.destroy();
    }

    if (ganttData.length === 0) return;

    window.ganttChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ganttData.map(d => `P${d.pid}`),
            datasets: [{
                data: ganttData.map(d => ({
                    x: d.start,
                    y: d.frequency,
                    duration: d.duration
                })),
                backgroundColor: ganttData.map((_, i) => 
                    `hsl(${(i * 360) / ganttData.length}, 70%, 60%)`
                ),
                barPercentage: 0.8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: {
                    type: 'linear',
                    position: 'top',
                    title: {
                        display: true,
                        text: 'Time (ms)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Process'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const data = context.raw;
                            return [
                                `Time: ${data.x.toFixed(2)} - ${(data.x + data.duration).toFixed(2)} ms`,
                                `Frequency: ${data.y.toFixed(2)} GHz`
                            ];
                        }
                    }
                }
            }
        }
    });
}

function updateFrequencyChart(frequencyData) {
    const ctx = document.getElementById('frequencyDistChart').getContext('2d');
    if (window.frequencyChart instanceof Chart) {
        window.frequencyChart.destroy();
    }

    if (frequencyData.length === 0) return;

    // Calculate frequency distribution
    const frequencies = frequencyData.map(d => d.frequency);
    const bins = 10;
    const min = Math.min(...frequencies);
    const max = Math.max(...frequencies);
    const binSize = (max - min) / bins;
    
    const distribution = new Array(bins).fill(0);
    frequencies.forEach(f => {
        const binIndex = Math.min(Math.floor((f - min) / binSize), bins - 1);
        distribution[binIndex]++;
    });

    window.frequencyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: distribution.map((_, i) => 
                `${(min + i * binSize).toFixed(2)}-${(min + (i + 1) * binSize).toFixed(2)}`
            ),
            datasets: [{
                label: 'Frequency Distribution',
                data: distribution,
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Count'
                    }
                }
            }
        }
    });
}

function updateEnergyChart(energyData) {
    const ctx = document.getElementById('energyChart').getContext('2d');
    if (window.energyChart instanceof Chart) {
        window.energyChart.destroy();
    }

    if (energyData.length === 0) return;

    window.energyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: energyData.map(d => d.time.toFixed(1)),
            datasets: [{
                label: 'Energy Consumption',
                data: energyData.map(d => d.energy),
                borderColor: 'rgb(255, 159, 64)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (ms)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Energy (units)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}