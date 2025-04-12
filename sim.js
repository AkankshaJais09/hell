class Process {
    constructor(pid, burstTime, arrivalTime, priority) {
        this.pid = pid;
        this.burstTime = burstTime;
        this.remainingTime = burstTime;
        this.arrivalTime = arrivalTime;
        this.priority = priority;
        this.energyConsumption = 0;
        this.cpuFrequency = 1.0;
        this.state = 'NEW';
        this.completionTime = 0;
        this.waitingTime = 0;
        this.turnaroundTime = 0;
    }

    updateEnergyConsumption(timeSlice, frequency) {
        // Match C++ energy calculation: E ∝ f^3
        const powerFactor = Math.pow(frequency, 3);
        this.energyConsumption += powerFactor * timeSlice;
        this.remainingTime -= timeSlice * frequency;
    }

    isCompleted() {
        return this.remainingTime <= 0;
    }
}

class Scheduler {
    constructor() {
        this.processes = [];
        this.completedProcesses = [];
        this.currentTime = 0;
        this.totalEnergy = 0;
        this.timeQuantum = 2.0;
        this.maxFreq = 2.0;
        this.minFreq = 0.5;
        this.ganttData = [];
        this.frequencyData = [];
        this.energyData = [];
        this.avgWorkload = 0;
        this.processCount = 0;
    }

    addProcess(process) {
        if (this.processes.some(p => p.pid === process.pid)) {
            alert('Process ID already exists!');
            return false;
        }
        this.processes.push(process);
        // Update workload metrics
        this.avgWorkload = (this.avgWorkload * this.processCount + process.remainingTime) / 
                          (this.processCount + 1);
        this.processCount++;
        this.updateTable();
        return true;
    }

    updateTable() {
        const tableBody = document.getElementById('processTableBody');
        tableBody.innerHTML = '';

        this.processes.forEach(process => {
            if (!this.completedProcesses.includes(process)) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 py-4">${process.pid}</td>
                    <td class="px-6 py-4">${process.arrivalTime.toFixed(2)}</td>
                    <td class="px-6 py-4">${process.burstTime.toFixed(2)}</td>
                    <td class="px-6 py-4">${process.priority}</td>
                    <td class="px-6 py-4">-</td>
                    <td class="px-6 py-4">-</td>
                    <td class="px-6 py-4">-</td>
                    <td class="px-6 py-4">-</td>
                `;
                tableBody.appendChild(row);
            }
        });

        this.completedProcesses.forEach(process => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4">${process.pid}</td>
                <td class="px-6 py-4">${process.arrivalTime.toFixed(2)}</td>
                <td class="px-6 py-4">${process.burstTime.toFixed(2)}</td>
                <td class="px-6 py-4">${process.priority}</td>
                <td class="px-6 py-4">${process.completionTime.toFixed(2)}</td>
                <td class="px-6 py-4">${process.turnaroundTime.toFixed(2)}</td>
                <td class="px-6 py-4">${process.waitingTime.toFixed(2)}</td>
                <td class="px-6 py-4">${process.energyConsumption.toFixed(2)}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    calculateFrequency(process) {
        const completionRatio = process.remainingTime / process.burstTime;
        const workloadFactor = this.avgWorkload / this.processCount;
        const priorityFactor = process.priority / 10.0;

        // Match C++ DVFS strategy
        const freq = this.minFreq + 
                    (this.maxFreq - this.minFreq) * 
                    (0.4 * (1 - completionRatio) + 
                     0.3 * workloadFactor + 
                     0.3 * priorityFactor);

        return Math.max(this.minFreq, Math.min(freq, this.maxFreq));
    }

    simulate() {
        this.timeQuantum = parseFloat(document.getElementById('timeQuantum').value);
        this.maxFreq = parseFloat(document.getElementById('maxFreq').value);
        
        document.getElementById('minFreqDisplay').textContent = this.minFreq + ' GHz';
        document.getElementById('maxFreqDisplay').textContent = this.maxFreq + ' GHz';
        document.getElementById('timeQuantumDisplay').textContent = this.timeQuantum + ' ms';

        let remainingProcesses = [...this.processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
        let readyQueue = [];
        
        this.ganttData = [];
        this.frequencyData = [];
        this.energyData = [];
        this.currentTime = 0;
        this.totalEnergy = 0;
        this.completedProcesses = [];

        while (remainingProcesses.length > 0 || readyQueue.length > 0) {
            // Add newly arrived processes to ready queue
            while (remainingProcesses.length > 0 && 
                   remainingProcesses[0].arrivalTime <= this.currentTime) {
                const process = remainingProcesses.shift();
                process.state = 'READY';
                readyQueue.push(process);
            }

            if (readyQueue.length === 0) {
                this.currentTime = remainingProcesses[0].arrivalTime;
                continue;
            }

            // Sort ready queue by priority and remaining time
            readyQueue.sort((a, b) => {
                if (a.priority !== b.priority) return a.priority - b.priority;
                return a.remainingTime - b.remainingTime;
            });

            const currentProcess = readyQueue[0];
            currentProcess.state = 'RUNNING';

            const frequency = this.calculateFrequency(currentProcess);
            const executionTime = Math.min(this.timeQuantum, currentProcess.remainingTime);

            this.ganttData.push({
                pid: currentProcess.pid,
                start: this.currentTime,
                duration: executionTime,
                frequency: frequency
            });

            this.frequencyData.push({
                time: this.currentTime,
                frequency: frequency
            });

            currentProcess.updateEnergyConsumption(executionTime, frequency);
            this.totalEnergy += currentProcess.energyConsumption;

            this.energyData.push({
                time: this.currentTime,
                energy: this.totalEnergy
            });

            this.currentTime += executionTime;

            if (currentProcess.isCompleted()) {
                currentProcess.state = 'TERMINATED';
                currentProcess.completionTime = this.currentTime;
                currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
                currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
                this.completedProcesses.push(currentProcess);
                readyQueue.shift();
            } else {
                currentProcess.state = 'READY';
                readyQueue.push(readyQueue.shift());
            }
        }

        this.updateMetrics();
        this.updateTable();
        updateVisualizations(this);
    }

    updateMetrics() {
        if (this.completedProcesses.length > 0) {
            const avgWaiting = this.completedProcesses.reduce((sum, p) => sum + p.waitingTime, 0) / 
                             this.completedProcesses.length;
            const avgTurnaround = this.completedProcesses.reduce((sum, p) => sum + p.turnaroundTime, 0) / 
                                this.completedProcesses.length;
            const totalBurst = this.completedProcesses.reduce((sum, p) => sum + p.burstTime, 0);
            const cpuUtil = (totalBurst / this.currentTime) * 100;

            document.getElementById('avgWaitingTime').textContent = avgWaiting.toFixed(2) + ' ms';
            document.getElementById('avgTurnaroundTime').textContent = avgTurnaround.toFixed(2) + ' ms';
            document.getElementById('cpuUtilization').textContent = cpuUtil.toFixed(1) + '%';
            document.getElementById('energyEfficiency').textContent = this.totalEnergy.toFixed(2) + ' units';
        }
    }

    reset() {
        this.processes = [];
        this.completedProcesses = [];
        this.currentTime = 0;
        this.totalEnergy = 0;
        this.ganttData = [];
        this.frequencyData = [];
        this.energyData = [];
        this.avgWorkload = 0;
        this.processCount = 0;
        this.updateTable();
        this.updateMetrics();
        updateVisualizations(this);
    }
}

// Initialize scheduler
const scheduler = new Scheduler();

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('processForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const pid = parseInt(document.getElementById('pid').value);
        const arrivalTime = parseFloat(document.getElementById('arrivalTime').value);
        const burstTime = parseFloat(document.getElementById('burstTime').value);
        const priority = parseInt(document.getElementById('priority').value);

        const process = new Process(pid, burstTime, arrivalTime, priority);
        if (scheduler.addProcess(process)) {
            e.target.reset();
        }
    });

    document.getElementById('startBtn').addEventListener('click', () => {
        if (scheduler.processes.length === 0) {
            alert('Please add at least one process before starting simulation!');
            return;
        }
        scheduler.simulate();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
        scheduler.reset();
    });
});