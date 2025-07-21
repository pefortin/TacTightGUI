const API_BASE_URL = 'http://localhost:8000';

// Force and thickness data for interpolation
const forces_4mm = [4.92, 6.18, 7.61, 9.42, 10.40];
const epaisseurs = [3.0, 3.5, 4.0, 4.5, 5.0];

// Linear interpolation function
function linearInterpolation(x, x0, x1, y0, y1) {
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
}

// Spline-like interpolation using piecewise linear interpolation
function estimerEpaisseur(force) {
    // Vérifie si force dans plage mesurée
    if (force < Math.min(...forces_4mm) || force > Math.max(...forces_4mm)) {
        throw new Error(`La force doit être comprise entre ${Math.min(...forces_4mm).toFixed(2)} N et ${Math.max(...forces_4mm).toFixed(2)} N.`);
    }
    
    // Find the two closest points for interpolation
    let i = 0;
    while (i < forces_4mm.length - 1 && forces_4mm[i + 1] < force) {
        i++;
    }
    
    if (i === forces_4mm.length - 1) {
        return epaisseurs[i];
    }
    
    // Linear interpolation between the two points
    const epaisseur = linearInterpolation(
        force,
        forces_4mm[i],
        forces_4mm[i + 1],
        epaisseurs[i],
        epaisseurs[i + 1]
    );
    
    return parseFloat(epaisseur.toFixed(2));
}

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

// Process data function - Updated to calculate thickness from force
async function processData() {
    const forceInput = document.getElementById('forceInput').value;
    const strapWidth = document.getElementById('strapWidth').value;
    
    if (!forceInput || !strapWidth) {
        showNotification('Please fill in all fields', 'warning');
        return;
    }
    
    // Animation de chargement
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="btn-icon">⏳</span> Analyzing...';
    button.disabled = true;
    
    try {
        // Calculate thickness from force
        const force = parseFloat(forceInput);
        const calculatedThickness = estimerEpaisseur(force);
        
        // Update the thickness display
        document.getElementById('calculatedThickness').value = calculatedThickness;
        
        const response = await fetch(`${API_BASE_URL}/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                thicknessSpring: calculatedThickness,
                strapWidth: parseFloat(strapWidth)
            })
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors du traitement des données');
        }
        
        const result = await response.json();
        displayResults(result, force, calculatedThickness);
        showNotification('Analysis completed successfully!', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Processing error: ' + error.message, 'error');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Generate file function - Updated to use calculated thickness
async function generateFile() {
    const forceInput = document.getElementById('forceInput').value;
    const strapWidth = document.getElementById('strapWidth').value;
    
    if (!forceInput || !strapWidth) {
        showNotification('Please fill in all fields', 'warning');
        return;
    }
    
    // Animation de chargement
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="btn-icon">📁</span> Generating...';
    button.disabled = true;
    
    try {
        // Calculate thickness from force
        const force = parseFloat(forceInput);
        const calculatedThickness = estimerEpaisseur(force);
        
        const response = await fetch(`${API_BASE_URL}/generate-file`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                thicknessSpring: calculatedThickness,
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
        a.download = `haptistrap_results_f${force}_t${calculatedThickness}_w${strapWidth}.csv`;
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

// Display results function - Updated to show force and calculated thickness
function displayResults(result, inputForce, calculatedThickness) {
    const resultsContainer = document.getElementById('results');
    const resultsContent = document.getElementById('results-content');
    
    if (result.status === 'success') {
        resultsContent.innerHTML = `
            <div class="result-item fade-in" style="animation-delay: 0.1s">
                <div class="result-label">Input Force</div>
                <div class="result-value">${inputForce} N</div>
            </div>
            <div class="result-item fade-in" style="animation-delay: 0.2s">
                <div class="result-label">Calculated Thickness</div>
                <div class="result-value">${calculatedThickness} mm</div>
            </div>
            <div class="result-item fade-in" style="animation-delay: 0.3s">
                <div class="result-label">Strap Width</div>
                <div class="result-value">${result.data.strapWidth} mm</div>
            </div>
            <div class="result-item fade-in" style="animation-delay: 0.4s">
                <div class="result-label">Computed Value</div>
                <div class="result-value">${result.data.computed_value.toFixed(2)}</div>
            </div>
            <div class="result-item fade-in" style="animation-delay: 0.5s">
                <div class="result-label">Status</div>
                <div class="result-value success">${result.data.status}</div>
            </div>
            <div class="result-item fade-in" style="animation-delay: 0.6s">
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

// Function to update thickness in real-time when force changes
function updateThicknessFromForce() {
    const forceInput = document.getElementById('forceInput');
    const thicknessDisplay = document.getElementById('calculatedThickness');
    
    if (forceInput && thicknessDisplay) {
        forceInput.addEventListener('input', function() {
            try {
                const force = parseFloat(this.value);
                if (!isNaN(force) && this.value !== '') {
                    const thickness = estimerEpaisseur(force);
                    thicknessDisplay.value = thickness;
                } else {
                    thicknessDisplay.value = '';
                }
            } catch (error) {
                thicknessDisplay.value = 'Invalid range';
            }
        });
    }
}

// Navigation mobile
function toggleMobileNav() {
    const navLinks = document.querySelector('.nav-links');
    const navToggle = document.querySelector('.nav-toggle');
    
    navLinks.classList.toggle('mobile-active');
    navToggle.classList.toggle('active');
}

// Gestion du scroll avec throttle pour performance
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

// Process data function - Updated to calculate thickness from force
async function processData() {
    const forceInput = document.getElementById('forceInput').value;
    const strapWidth = document.getElementById('strapWidth').value;
    
    if (!forceInput || !strapWidth) {
        showNotification('Please fill in all fields', 'warning');
        return;
    }
    
    // Animation de chargement
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="btn-icon">⏳</span> Analyzing...';
    button.disabled = true;
    
    try {
        // Calculate thickness from force
        const force = parseFloat(forceInput);
        const calculatedThickness = estimerEpaisseur(force);
        
        // Update the thickness display
        document.getElementById('calculatedThickness').value = calculatedThickness;
        
        const response = await fetch(`${API_BASE_URL}/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                thicknessSpring: calculatedThickness,
                strapWidth: parseFloat(strapWidth)
            })
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors du traitement des données');
        }
        
        const result = await response.json();
        displayResults(result, force, calculatedThickness);
        showNotification('Analysis completed successfully!', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Processing error: ' + error.message, 'error');
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Generate file function - Updated to use calculated thickness
async function generateFile() {
    const forceInput = document.getElementById('forceInput').value;
    const strapWidth = document.getElementById('strapWidth').value;
    
    if (!forceInput || !strapWidth) {
        showNotification('Please fill in all fields', 'warning');
        return;
    }
    
    // Animation de chargement
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="btn-icon">📁</span> Generating...';
    button.disabled = true;
    
    try {
        // Calculate thickness from force
        const force = parseFloat(forceInput);
        const calculatedThickness = estimerEpaisseur(force);
        
        const response = await fetch(`${API_BASE_URL}/generate-file`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                thicknessSpring: calculatedThickness,
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
        a.download = `haptistrap_results_f${force}_t${calculatedThickness}_w${strapWidth}.csv`;
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

// Display results function - Updated to show force and calculated thickness
function displayResults(result, inputForce, calculatedThickness) {
    const resultsContainer = document.getElementById('results');
    const resultsContent = document.getElementById('results-content');
    
    if (result.status === 'success') {
        resultsContent.innerHTML = `
            <div class="result-item fade-in" style="animation-delay: 0.1s">
                <div class="result-label">Input Force</div>
                <div class="result-value">${inputForce} N</div>
            </div>
            <div class="result-item fade-in" style="animation-delay: 0.2s">
                <div class="result-label">Calculated Thickness</div>
                <div class="result-value">${calculatedThickness} mm</div>
            </div>
            <div class="result-item fade-in" style="animation-delay: 0.3s">
                <div class="result-label">Strap Width</div>
                <div class="result-value">${result.data.strapWidth} mm</div>
            </div>
            <div class="result-item fade-in" style="animation-delay: 0.4s">
                <div class="result-label">Computed Value</div>
                <div class="result-value">${result.data.computed_value.toFixed(2)}</div>
            </div>
            <div class="result-item fade-in" style="animation-delay: 0.5s">
                <div class="result-label">Status</div>
                <div class="result-value success">${result.data.status}</div>
            </div>
            <div class="result-item fade-in" style="animation-delay: 0.6s">
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

// Function to update thickness in real-time when force changes
function updateThicknessFromForce() {
    const forceInput = document.getElementById('forceInput');
    const thicknessDisplay = document.getElementById('calculatedThickness');
    
    if (forceInput && thicknessDisplay) {
        forceInput.addEventListener('input', function() {
            try {
                const force = parseFloat(this.value);
                if (!isNaN(force) && this.value !== '') {
                    const thickness = estimerEpaisseur(force);
                    thicknessDisplay.value = thickness;
                } else {
                    thicknessDisplay.value = '';
                }
            } catch (error) {
                thicknessDisplay.value = 'Invalid range';
            }
        });
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

// Initialize on page load - Updated to include thickness calculation
document.addEventListener('DOMContentLoaded', function() {
    updateActiveSection();
    setupScrollAnimations();
    updateThicknessFromForce();
    
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
