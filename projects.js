/**
 * Loads projects from projects.json and renders them in a carousel
 */
async function loadProjects() {
    try {
        const response = await fetch('projects.json');
        const data = await response.json();
        
        const projectsContainer = document.getElementById('projects-container');
        const projectsCarousel = document.getElementById('projects-carousel');
        const prevButton = document.getElementById('projects-prev');
        const nextButton = document.getElementById('projects-next');
        
        if (!projectsContainer || !projectsCarousel) {
            console.error('Projects container not found');
            return;
        }

        // Clear any existing content
        projectsCarousel.innerHTML = '';

        // Create project tiles
        data.projects.forEach(project => {
            const projectTile = document.createElement('div');
            projectTile.className = 'project-tile';
            projectTile.style.cursor = 'pointer';

            const projectContent = document.createElement('div');
            projectContent.className = 'project-content';

            const projectTitle = document.createElement('h3');
            projectTitle.className = 'project-title';
            projectTitle.textContent = project.title;

            const projectDescription = document.createElement('p');
            projectDescription.className = 'project-description';
            projectDescription.textContent = project.description;

            projectContent.appendChild(projectTitle);
            projectContent.appendChild(projectDescription);
            
            // Check if content is truncated and add "has-more" class
            requestAnimationFrame(() => {
                if (projectDescription.scrollHeight > projectDescription.clientHeight) {
                    projectDescription.classList.add('has-more');
                }
            });

            // Add links to tile if they exist (limit to first 2-3 to fit)
            if (project.links && project.links.length > 0) {
                const tileLinks = document.createElement('div');
                tileLinks.className = 'project-tile-links';
                
                // Show only first 2 links to keep tiles compact
                const linksToShow = project.links.slice(0, 2);
                
                linksToShow.forEach((linkItem, index) => {
                    const link = document.createElement('a');
                    link.href = linkItem.link;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.className = 'project-tile-link';
                    link.textContent = linkItem.displayName;
                    
                    // Prevent tile click when clicking on link
                    link.addEventListener('click', (e) => {
                        e.stopPropagation();
                    });

                    tileLinks.appendChild(link);

                    // Add separator (│) between links
                    if (index < linksToShow.length - 1) {
                        const separator = document.createElement('span');
                        separator.className = 'project-tile-link-separator';
                        separator.textContent = ' │ ';
                        tileLinks.appendChild(separator);
                    }
                });

                projectContent.appendChild(tileLinks);
            }

            projectTile.appendChild(projectContent);
            
            // Add click handler to open modal
            projectTile.addEventListener('click', () => {
                openProjectModal(project);
            });

            projectsCarousel.appendChild(projectTile);
        });

        // Show/hide navigation buttons based on scroll position
        function updateNavigationButtons() {
            const isScrollable = projectsCarousel.scrollWidth > projectsCarousel.clientWidth;
            const scrollLeft = projectsCarousel.scrollLeft;
            const scrollRight = projectsCarousel.scrollWidth - projectsCarousel.clientWidth - scrollLeft;
            
            // Show prev button only if scrollable and not at the start
            if (prevButton) {
                prevButton.style.display = (isScrollable && scrollLeft > 1) ? 'flex' : 'none';
            }
            
            // Show next button only if scrollable and not at the end
            if (nextButton) {
                nextButton.style.display = (isScrollable && scrollRight > 1) ? 'flex' : 'none';
            }
        }

        // Update on load, resize, and scroll
        updateNavigationButtons();
        window.addEventListener('resize', updateNavigationButtons);
        projectsCarousel.addEventListener('scroll', updateNavigationButtons);

        // Navigation button handlers
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                projectsCarousel.scrollBy({ left: -400, behavior: 'smooth' });
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                projectsCarousel.scrollBy({ left: 400, behavior: 'smooth' });
            });
        }
        
        // Mark projects as loaded
        window.contentLoaded.projects = true;
        if (window.checkAllLoaded) {
            window.checkAllLoaded();
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        window.contentLoaded.projects = true;
        if (window.checkAllLoaded) {
            window.checkAllLoaded();
        }
    }
}

/**
 * Opens a modal popup for a project
 */
function openProjectModal(project) {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'project-modal-backdrop';
    backdrop.id = 'project-modal-backdrop';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'project-modal';

    // Modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'project-modal-content';

    // Title
    const modalTitle = document.createElement('h2');
    modalTitle.className = 'project-modal-title';
    modalTitle.textContent = project.title;

    // Description
    const modalDescription = document.createElement('p');
    modalDescription.className = 'project-modal-description';
    modalDescription.textContent = project.description;

    // Links container (similar to socials)
    const modalLinks = document.createElement('div');
    modalLinks.className = 'project-modal-links';

    if (project.links && project.links.length > 0) {
        project.links.forEach((linkItem, index) => {
            const link = document.createElement('a');
            link.href = linkItem.link;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'project-modal-link';
            link.textContent = linkItem.displayName;
            modalLinks.appendChild(link);

            // Add separator (│) between links, but not after the last one
            if (index < project.links.length - 1) {
                const separator = document.createElement('span');
                separator.className = 'project-modal-link-separator';
                separator.textContent = ' │ ';
                modalLinks.appendChild(separator);
            }
        });
    }

    // Close button
    const closeButton = document.createElement('button');
    closeButton.className = 'project-modal-close';
    closeButton.innerHTML = '×';
    closeButton.setAttribute('aria-label', 'Close modal');

    // Assemble modal
    modalContent.appendChild(modalTitle);
    modalContent.appendChild(modalDescription);
    if (project.links && project.links.length > 0) {
        modalContent.appendChild(modalLinks);
    }
    modal.appendChild(closeButton);
    modal.appendChild(modalContent);
    backdrop.appendChild(modal);

    // Add to body
    document.body.appendChild(backdrop);

    // Disable body scroll - need to set on both html and body
    const scrollY = window.scrollY;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    // Close handlers
    const closeModal = () => {
        document.body.removeChild(backdrop);
        // Restore scroll
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
    };

    closeButton.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
            closeModal();
        }
    });

    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// Load projects when DOM is ready
function initProjects() {
    // Wait a bit to ensure DOM is fully ready
    if (document.getElementById('projects-container') && document.getElementById('projects-carousel')) {
        loadProjects();
    } else {
        // Retry after a short delay if elements aren't found yet
        setTimeout(initProjects, 100);
    }
}
// Load projects when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProjects);
} else {
    loadProjects();
}