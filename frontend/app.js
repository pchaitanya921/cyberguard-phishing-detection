// ===================================
// CYBERGUARD - DASHBOARD JAVASCRIPT
// ===================================

const API_BASE = '/api';
let donutChart, scatterChart;
let stats = null;

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    loadStatistics();
    loadRecentThreats();
    setupEventListeners();
    
    // Auto-refresh every 10 seconds
    setInterval(loadRecentThreats, 10000);
    setInterval(loadStatistics, 15000);
});

// ===================================
// EVENT LISTENERS
// ===================================

function setupEventListeners() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const urlInput = document.getElementById('urlInput');
    
    analyzeBtn.addEventListener('click', analyzeURL);
    
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            analyzeURL();
        }
    });
}

// ===================================
// URL ANALYSIS
// ===================================

async function analyzeURL() {
    const urlInput = document.getElementById('urlInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const btnText = analyzeBtn.querySelector('.btn-text');
    const spinner = analyzeBtn.querySelector('.spinner');
    const confidenceDisplay = document.getElementById('confidenceDisplay');
    const confidenceValue = document.getElementById('confidenceValue');
    const alertBadge = document.getElementById('alertBadge');
    
    const url = urlInput.value.trim();
    
    if (!url) {
        alert('Please enter a URL to analyze');
        return;
    }
    
    // Show loading state
    analyzeBtn.classList.add('analyzing');
    btnText.style.display = 'none';
    spinner.style.display = 'block';
    analyzeBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/analyze-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });
        
        if (!response.ok) {
            throw new Error('Analysis failed');
        }
        
        const result = await response.json();
        
        // Show confidence
        confidenceDisplay.style.display = 'flex';
        const confidencePercent = (result.confidence * 100).toFixed(1);
        const confidenceLevel = result.confidence > 0.8 ? 'High' : result.confidence > 0.5 ? 'Medium' : 'Low';
        confidenceValue.textContent = `${confidencePercent}% (${confidenceLevel})`;
        
        // Show alert if phishing detected
        if (result.prediction === 'Phishing') {
            alertBadge.style.display = 'flex';
            
            // Show result notification
            showNotification(
                `⚠️ PHISHING DETECTED!`,
                `Risk Score: ${result.risk_score}/100 | Threat Type: ${result.threat_type}`,
                'critical'
            );
        } else {
            alertBadge.style.display = 'none';
            showNotification(
                `✅ URL appears legitimate`,
                `Confidence: ${confidencePercent}%`,
                'success'
            );
        }
        
        // Refresh statistics and threats
        setTimeout(() => {
            loadStatistics();
            loadRecentThreats();
        }, 500);
        
    } catch (error) {
        console.error('Analysis error:', error);
        showNotification('❌ Analysis failed', 'Please try again', 'error');
    } finally {
        // Reset button state
        analyzeBtn.classList.remove('analyzing');
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
        analyzeBtn.disabled = false;
    }
}

// ===================================
// LOAD STATISTICS
// ===================================

async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();
        stats = data;
        
        // Update metrics
        document.getElementById('totalAnalyzed').textContent = formatNumber(data.total_analyzed);
        document.getElementById('accuracy').textContent = `${(data.detection_accuracy * 100).toFixed(0)}%`;
        document.getElementById('responseTime').textContent = `<${data.avg_response_time_ms}ms`;
        document.getElementById('todayCount').textContent = `+${formatNumber(data.today_count)} today`;
        document.getElementById('avgResponseTime').textContent = `Average ${data.avg_response_time_ms}ms`;
        
        // Update donut chart
        updateDonutChart(data.threat_breakdown);
        
        // Create mini trend charts
        createMiniCharts();
        
    } catch (error) {
        console.error('Failed to load statistics:', error);
    }
}

// ===================================
// LOAD RECENT THREATS
// ===================================

async function loadRecentThreats() {
    try {
        const response = await fetch(`${API_BASE}/recent-threats?limit=10`);
        const data = await response.json();
        
        const tbody = document.getElementById('threatTableBody');
        
        if (data.threats && data.threats.length > 0) {
            tbody.innerHTML = data.threats.map(threat => {
                const time = new Date(threat.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                
                const domain = extractDomain(threat.url);
                const severity = getSeverity(threat.risk_score);
                
                return `
                    <tr>
                        <td>${time} UTC</td>
                        <td>${domain}</td>
                        <td>${getTargetBrand(threat.url)}</td>
                        <td>${threat.threat_type || 'Unknown'}</td>
                        <td>${threat.risk_score}/100</td>
                        <td><span class="severity-badge severity-${severity.toLowerCase()}">${severity}</span></td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                        No threats detected yet. Start analyzing URLs above!
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Failed to load recent threats:', error);
    }
}

// ===================================
// CHART INITIALIZATION
// ===================================

function initializeCharts() {
    // Donut Chart
    const donutCtx = document.getElementById('donutChart').getContext('2d');
    donutChart = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#8b5cf6', // Purple
                    '#3b82f6', // Blue
                    '#ec4899', // Pink
                    '#10b981', // Green
                    '#f59e0b'  // Orange
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1e2433',
                    titleColor: '#ffffff',
                    bodyColor: '#9ca3af',
                    borderColor: '#8b5cf6',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${(context.parsed * 100).toFixed(1)}%`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
    
    // Scatter Chart
    const scatterCtx = document.getElementById('scatterChart').getContext('2d');
    scatterChart = new Chart(scatterCtx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'High Risk Cluster',
                    data: generateScatterData(20, 60, 100, 0, 24),
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    borderColor: 'rgba(239, 68, 68, 0.8)',
                    pointRadius: 6
                },
                {
                    label: 'Emerging Pattern',
                    data: generateScatterData(15, 40, 60, 0, 24),
                    backgroundColor: 'rgba(245, 158, 11, 0.6)',
                    borderColor: 'rgba(245, 158, 11, 0.8)',
                    pointRadius: 5
                },
                {
                    label: 'Low Risk / False Positives',
                    data: generateScatterData(25, 0, 40, 0, 24),
                    backgroundColor: 'rgba(59, 130, 246, 0.4)',
                    borderColor: 'rgba(59, 130, 246, 0.6)',
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#9ca3af',
                        padding: 15,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#1e2433',
                    titleColor: '#ffffff',
                    bodyColor: '#9ca3af',
                    borderColor: '#8b5cf6',
                    borderWidth: 1,
                    padding: 12
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Threat Score (0-100)',
                        color: '#9ca3af'
                    },
                    grid: {
                        color: 'rgba(139, 92, 246, 0.1)'
                    },
                    ticks: {
                        color: '#6b7280'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Detection Time (Last 24 Hours)',
                        color: '#9ca3af'
                    },
                    grid: {
                        color: 'rgba(139, 92, 246, 0.1)'
                    },
                    ticks: {
                        color: '#6b7280'
                    }
                }
            }
        }
    });
}

// ===================================
// UPDATE CHARTS
// ===================================

function updateDonutChart(threatBreakdown) {
    if (!threatBreakdown || Object.keys(threatBreakdown).length === 0) {
        // Default data
        threatBreakdown = {
            'Brand Impersonation': 0.45,
            'Credential Harvesting': 0.32,
            'Malware Distribution': 0.15,
            'Social Engineering': 0.05,
            'Other / Unclassified': 0.03
        };
    }
    
    const labels = Object.keys(threatBreakdown);
    const data = Object.values(threatBreakdown);
    
    donutChart.data.labels = labels;
    donutChart.data.datasets[0].data = data;
    donutChart.update();
    
    // Update legend
    updateDonutLegend(labels, data);
}

function updateDonutLegend(labels, data) {
    const legendContainer = document.getElementById('donutLegend');
    const colors = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b'];
    
    legendContainer.innerHTML = labels.map((label, index) => {
        const percentage = (data[index] * 100).toFixed(0);
        return `
            <div class="legend-item">
                <div class="legend-label">
                    <div class="legend-color" style="background: ${colors[index]}"></div>
                    <span class="legend-text">${label}</span>
                </div>
                <span class="legend-value">${percentage}%</span>
            </div>
        `;
    }).join('');
}

function createMiniCharts() {
    // Mini trend charts for metric cards
    const charts = ['trendChart1', 'trendChart2', 'trendChart3'];
    
    charts.forEach((chartId, index) => {
        const ctx = document.getElementById(chartId);
        if (!ctx) return;
        
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 40);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(10).fill(''),
                datasets: [{
                    data: generateTrendData(10),
                    borderColor: '#8b5cf6',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    });
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function generateScatterData(count, minX, maxX, minY, maxY) {
    const data = [];
    for (let i = 0; i < count; i++) {
        data.push({
            x: Math.random() * (maxX - minX) + minX,
            y: Math.random() * (maxY - minY) + minY
        });
    }
    return data;
}

function generateTrendData(count) {
    const data = [];
    let value = 50;
    for (let i = 0; i < count; i++) {
        value += (Math.random() - 0.4) * 10;
        value = Math.max(20, Math.min(80, value));
        data.push(value);
    }
    return data;
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function extractDomain(url) {
    try {
        const urlObj = new URL(url.startsWith('http') ? url : 'http://' + url);
        return urlObj.hostname;
    } catch {
        return url.substring(0, 30) + '...';
    }
}

function getTargetBrand(url) {
    const brands = ['PayPal', 'Microsoft 365', 'Chase Bank', 'Amazon', 'Apple', 'Netflix', 'Google'];
    const urlLower = url.toLowerCase();
    
    for (const brand of brands) {
        if (urlLower.includes(brand.toLowerCase().replace(' ', ''))) {
            return brand;
        }
    }
    
    return 'Unknown';
}

function getSeverity(riskScore) {
    if (riskScore >= 76) return 'CRITICAL';
    if (riskScore >= 51) return 'HIGH';
    if (riskScore >= 26) return 'MEDIUM';
    return 'LOW';
}

function showNotification(title, message, type) {
    // Simple notification (can be enhanced with a library)
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'critical' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 1000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 0.25rem;">${title}</div>
        <div style="font-size: 0.875rem; opacity: 0.9;">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
