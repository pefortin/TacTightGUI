const API_BASE_URL = 'http://localhost:8000';

// Navigation functionality
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Active section tracking - Updated for new thread
function updateActiveSection() {
    const sections = document.querySelectorAll('.content-section');
    const threadSteps = document.querySelectorAll('.thread-step');
    
    let currentSection = '';
    let activeIndex = 0;
    
    sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
            currentSection = section.id;
            activeIndex = index;
        }
    });
    
    threadSteps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (step.dataset.section === currentSection) {
            step.classList.add('active');
        } else if (index < activeIndex) {
            step.classList.add('completed');
        }
    });
    
    // Update progress line
    const progressLine = document.getElementById('progress-line');
    if (progressLine && threadSteps.length > 0) {
        const progress = Math.min((activeIndex + 1) / threadSteps.length * 100, 100);
        progressLine.style.height = `${progress}%`;
    }
}

// Progress thread tracking
function updateProgressThread() {
    const sections = document.querySelectorAll('.content-section');
    const threadSteps = document.querySelectorAll('.thread-step');
    const progressLine = document.getElementById('progress-line');
    
    let currentSection = '';
    let activeIndex = 0;
    
    // Déterminer la section active
    sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const sectionTop = rect.top;
        const sectionHeight = rect.height;
        const windowHeight = window.innerHeight;
        
        // Section est considérée active si elle occupe le centre de l'écran
        if (sectionTop <= windowHeight / 2 && sectionTop + sectionHeight >= windowHeight / 2) {
            currentSection = section.id;
            activeIndex = index;
        }
    });
    
    // Mettre à jour les étapes du fil
    threadSteps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        
        if (index < activeIndex) {
            step.classList.add('completed');
        } else if (index === activeIndex) {
            step.classList.add('active');
        }
    });
    
    // Mettre à jour la ligne de progression
    if (progressLine) {
        const progress = Math.min((activeIndex + 1) / threadSteps.length * 100, 100);
        progressLine.style.height = `${progress}%`;
    }
}

// Gestion du scroll avec throttle pour performance
let scrollTimeout;
function handleScroll() {
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
    
    scrollTimeout = setTimeout(() => {
        updateProgressThread();
        updateNavbarBackground();
    }, 10);
}

// Changer l'opacité de la navbar en fonction du scroll
function updateNavbarBackground() {
    const navbar = document.getElementById('main-nav');
    const scrolled = window.pageYOffset;
    const heroHeight = window.innerHeight;
    
    if (scrolled > heroHeight / 2) {
        navbar.style.background = 'rgba(255,255,255,0.98)';
        navbar.style.backdropFilter = 'blur(20px)';
    } else {
        navbar.style.background = 'rgba(255,255,255,0.9)';
        navbar.style.backdropFilter = 'blur(10px)';
    }
}

// Event listeners
window.addEventListener('scroll', function() {
    updateActiveSection();
    updateNavbarBackground();
}, { passive: true });
window.addEventListener('resize', updateProgressThread);

// Navigation mobile
function toggleMobileNav() {
    const navLinks = document.querySelector('.nav-links');
    const navToggle = document.querySelector('.nav-toggle');
    
    navLinks.classList.toggle('mobile-active');
    navToggle.classList.toggle('active');
}

// Process data function
async function processData() {
    const thicknessSpring = document.getElementById('thicknessSpring').value;
    const strapWidth = document.getElementById('strapWidth').value;
    
    if (!thicknessSpring || !strapWidth) {
        showNotification('Please fill in all fields', 'warning');
        return;
    }
    
    // Animation de chargement
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="btn-icon">⏳</span> Analyzing...';
    button.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                thicknessSpring: parseFloat(thicknessSpring),
                strapWidth: parseFloat(strapWidth)
            })
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors du traitement des données');
        }
        
        const result = await response.json();
        displayResults(result);
        showNotification('Analysis completed successfully!', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Processing error: ' + error.message, 'error');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Generate file function
async function generateFile() {
    const thicknessSpring = document.getElementById('thicknessSpring').value;
    const strapWidth = document.getElementById('strapWidth').value;
    
    if (!thicknessSpring || !strapWidth) {
        showNotification('Please fill in all fields', 'warning');
        return;
    }
    
    // Animation de chargement
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="btn-icon">📁</span> Generating...';
    button.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/generate-file`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                thicknessSpring: parseFloat(thicknessSpring),
                strapWidth: parseFloat(strapWidth)
            })
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la génération du fichier');
        }
        
        // Create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `haptistrap_results_t${thicknessSpring}_w${strapWidth}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('File downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Generation error: ' + error.message, 'error');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Display results function avec animation
function displayResults(result) {
    const resultsContainer = document.getElementById('results');
    const resultsContent = document.getElementById('results-content');
    
    if (result.status === 'success') {
        resultsContent.innerHTML = `
            <div class="result-item fade-in" style="animation-delay: 0.1s">
                <div class="result-label">Spring Thickness</div>
                <div class="result-value">${result.data.thicknessSpring} mm</div>
            </div>
            <div class="result-item fade-in" style="animation-delay: 0.2s">
                <div class="result-label">Strap Width</div>
                <div class="result-value">${result.data.strapWidth} mm</div>
            </div>
            <div class="result-item fade-in" style="animation-delay: 0.3s">
                <div class="result-label">Calculated Value</div>
                <div class="result-value">${result.data.computed_value.toFixed(2)}</div>
            </div>
            <div class="result-item fade-in" style="animation-delay: 0.4s">
                <div class="result-label">Status</div>
                <div class="result-value success">${result.data.status}</div>
            </div>
            <div class="result-item fade-in" style="animation-delay: 0.5s">
                <div class="result-label">Timestamp</div>
                <div class="result-value">${new Date(result.data.timestamp).toLocaleString()}</div>
            </div>
        `;
        
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        showNotification('Data processing error', 'error');
    }
}

// Système de notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Suppression automatique
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 4000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        default: return 'ℹ️';
    }
}

// Animations au scroll (Intersection Observer)
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observer les éléments à animer
    document.querySelectorAll('.research-card, .tech-card, .team-member, .publication-item').forEach(el => {
        observer.observe(el);
    });
}

// Initialize on page load - Updated
document.addEventListener('DOMContentLoaded', function() {
    updateActiveSection();
    setupScrollAnimations();
    
    // Add click listeners for thread steps
    document.querySelectorAll('.thread-step').forEach((step) => {
        step.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.dataset.section;
            if (sectionId) {
                scrollToSection(sectionId);
            }
        });
    });
    
    // Smooth scroll pour tous les liens d'ancrage
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
