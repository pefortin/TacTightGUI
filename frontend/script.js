const API_BASE_URL = 'api/';

// Force and thickness data for interpolation
const forces_4mm = [4.92, 6.18, 7.61, 9.42, 10.40];
const epaisseurs = [3.0, 3.5, 4.0, 4.5, 5.0];

// Global variable for scroll throttling
let scrollTimeout;

// Global variable to store STL data
let stlBlobData = null;
let stlFilename = null;

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

// Navigation mobile
function toggleMobileNav() {
    const navLinks = document.querySelector('.nav-links');
    const navToggle = document.querySelector('.nav-toggle');
    
    navLinks.classList.toggle('mobile-active');
    navToggle.classList.toggle('active');
}


// Process data function - Updated with simple spinner and visible download button
async function processData(event) {
    if (!event) {
        event = window.event;
    }
    
    const forceInput = document.getElementById('forceInput').value;
    const strapWidth = document.getElementById('strapWidth').value;
    
    if (!forceInput || !strapWidth) {
        showNotification('Please fill in all fields', 'warning');
        return;
    }
    
    // Get buttons
    const generateButton = event?.target || document.querySelector('.btn-primary');
    const downloadButton = document.querySelector('.download-btn');
    
    // Show spinner on generate button
    const originalText = generateButton.innerHTML;
    generateButton.innerHTML = '<span class="spinner"></span> Generating...';
    generateButton.disabled = true;
    
    // Hide download button while processing
    downloadButton.style.display = 'none';
    
    try {
        // Calculate thickness from force
        const force = parseFloat(forceInput);
        const calculatedThickness = estimerEpaisseur(force);
        
        // Remove this line - no longer updating thickness display
        // document.getElementById('calculatedThickness').value = calculatedThickness;
        
        // Validate inputs
        if (calculatedThickness < 3 || calculatedThickness > 5) {
            throw new Error('Calculated thickness must be between 3 and 5 mm');
        }
        
        if (parseFloat(strapWidth) < 26) {
            throw new Error('Strap width must be at least 26 mm');
        }
        
        console.log(`Requesting STL with springThickness=${calculatedThickness}, strapWidth=${strapWidth}`);
        
        // Generate STL file
        const response = await fetch(`${API_BASE_URL}/generate-stl/?springThickness=${calculatedThickness}&strapWidth=${parseFloat(strapWidth)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/sla, application/octet-stream, */*',
                'Content-Type': 'application/json',
            }
        });
        
        console.log('📊 Response status:', response.status);
        
        if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please wait 20 seconds before trying again.');
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(async () => {
                const text = await response.text();
                return { message: text || 'Unknown error' };
            });
            console.error('❌ API Error:', errorData);
            throw new Error(`Error generating STL: ${errorData.message || errorData.detail || 'Unknown error'}`);
        }
        
        // Get filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('content-disposition');
        stlFilename = `TacTight_f${force}N_t${calculatedThickness}mm_w${strapWidth}mm.stl`;
        
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                stlFilename = filenameMatch[1].replace(/['"]/g, '');
            }
        }
        
        // Store STL data
        stlBlobData = await response.blob();
        console.log('📦 Blob size:', stlBlobData.size, 'bytes');
        
        if (stlBlobData.size === 0) {
            throw new Error('Generated STL file is empty');
        }
        
        // Show success and download button
        generateButton.innerHTML = '<span class="btn-icon">✅</span> Generated';
        downloadButton.style.display = 'inline-flex';
        
        // Update download button text with file info
        const fileSizeKB = Math.round(stlBlobData.size / 1024);
        downloadButton.innerHTML = `Download STL (${fileSizeKB} KB)`;
        
        showNotification(`STL file "${stlFilename}" generated successfully! Click Download to save it.`, 'success');
        
    } catch (error) {
        console.error('❌ Error:', error);
        
        if (error.message.includes('Rate limit')) {
            showNotification(error.message, 'warning');
        } else {
            showNotification('Processing error: ' + error.message, 'error');
        }
        
        // Hide download button on error
        downloadButton.style.display = 'none';
    } finally {
        // Reset generate button
        generateButton.innerHTML = originalText;
        generateButton.disabled = false;
    }
}


// New download function
function downloadFile() {
    if (!stlBlobData || !stlFilename) {
        showNotification('No file available for download', 'error');
        return;
    }
    
    try {
        // Create and trigger download
        const url = window.URL.createObjectURL(stlBlobData);
        const a = document.createElement('a');
        a.href = url;
        a.download = stlFilename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
        
        showNotification(`File "${stlFilename}" downloaded successfully!`, 'success');
        
    } catch (error) {
        console.error('❌ Download error:', error);
        showNotification('Download error: ' + error.message, 'error');
    }
}

// Add notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Set icon based on type
    let icon = 'ℹ️';
    switch (type) {
        case 'success':
            icon = '✅';
            break;
        case 'error':
            icon = '❌';
            break;
        case 'warning':
            icon = '⚠️';
            break;
    }
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}



// Contact form functionality
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', handleContactFormSubmit);
    
    // Add real-time validation
    const inputs = contactForm.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Remove previous error message
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Validation rules
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    } else if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    } else if (field.name === 'message' && value && value.length < 10) {
        isValid = false;
        errorMessage = 'Message should be at least 10 characters long';
    }

    // Apply validation styles
    if (!isValid) {
        field.classList.add('error');
        field.classList.remove('success');
        
        const errorSpan = document.createElement('span');
        errorSpan.className = 'error-message';
        errorSpan.textContent = errorMessage;
        field.parentNode.appendChild(errorSpan);
    } else if (value) {
        field.classList.remove('error');
        field.classList.add('success');
    }

    return isValid;
}

function clearFieldError(event) {
    const field = event.target;
    if (field.classList.contains('error')) {
        field.classList.remove('error');
        const errorMessage = field.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }
}

async function handleContactFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('.contact-submit');
    const originalButtonText = submitButton.innerHTML;
    
    // Validate all fields
    const inputs = form.querySelectorAll('input, textarea');
    let isFormValid = true;
    
    inputs.forEach(input => {
        const fieldEvent = { target: input };
        if (!validateField(fieldEvent)) {
            isFormValid = false;
        }
    });
    
    if (!isFormValid) {
        showNotification('Please correct the errors in the form', 'error');
        return;
    }
    
    // Get form data
    const formData = new FormData(form);
    const contactData = {
        name: formData.get('name').trim(),
        email: formData.get('email').trim(),
        subject: formData.get('subject').trim(),
        message: formData.get('message').trim()
    };
    
    // Show loading state
    submitButton.innerHTML = '<span class="spinner"></span> Sending...';
    submitButton.disabled = true;
    
    try {
        // Simulate API call (you'll need to implement the actual backend endpoint)
        const response = await fetch(`${API_BASE_URL}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: 'p5fortin@uqac.ca',
                from: contactData.email,
                name: contactData.name,
                subject: `TacTight Contact: ${contactData.subject}`,
                message: `From: ${contactData.name} (${contactData.email})\n\nSubject: ${contactData.subject}\n\nMessage:\n${contactData.message}`,
                originalData: contactData
            })
        });
        
        if (response.ok) {
            showNotification('Message sent successfully! We will get back to you soon.', 'success');
            form.reset();
            
            // Remove validation classes
            inputs.forEach(input => {
                input.classList.remove('success', 'error');
            });
            
            submitButton.innerHTML = '<span class="btn-icon">✅</span> Message Sent';
            
            // Reset button after 3 seconds
            setTimeout(() => {
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
            }, 3000);
            
        } else {
            throw new Error('Failed to send message');
        }
        
    } catch (error) {
        console.error('Contact form error:', error);
        showNotification('Failed to send message. Please try again or contact us directly at p5fortin@uqac.ca', 'error');
        
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
}

// Update the existing event listeners
window.addEventListener('scroll', function() {
    updateActiveSection();
    updateNavbarBackground();
}, { passive: true });

window.addEventListener('resize', updateProgressThread);

// Initialize contact form when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initContactForm();
});

