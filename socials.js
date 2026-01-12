/**
 * Loads social media links from socials.json and renders them below the profile name
 */
async function loadSocials() {
    try {
        const response = await fetch('socials.json');
        const data = await response.json();
        
        const socialsContainer = document.getElementById('socials-container');
        if (!socialsContainer) {
            console.error('Socials container not found');
            return;
        }

        // Clear any existing content
        socialsContainer.innerHTML = '';

        // Create social links
        data.socials.forEach(social => {
            const socialLink = document.createElement('a');
            socialLink.href = social.link;
            socialLink.target = '_blank';
            socialLink.rel = 'noopener noreferrer';
            socialLink.className = 'social-link';
            socialLink.setAttribute('aria-label', `${social.socialName}: ${social.accountName}`);

            const iconSpan = document.createElement('span');
            iconSpan.className = 'social-icon';
            
            const iconImg = document.createElement('img');
            // Use iconLocal if available, otherwise fall back to iconUrl
            iconImg.src = social.iconLocal || social.iconUrl;
            iconImg.alt = social.socialName;
            iconImg.setAttribute('aria-hidden', 'true');
            iconImg.className = 'social-icon-img';
            
            iconSpan.appendChild(iconImg);

            const accountSpan = document.createElement('span');
            accountSpan.className = 'social-account';
            accountSpan.textContent = social.accountName;

            socialLink.appendChild(iconSpan);
            socialLink.appendChild(accountSpan);
            socialsContainer.appendChild(socialLink);
        });
        
        // Mark socials as loaded
        window.contentLoaded.socials = true;
        if (window.checkAllLoaded) {
            window.checkAllLoaded();
        }
    } catch (error) {
        console.error('Error loading socials:', error);
        window.contentLoaded.socials = true;
        if (window.checkAllLoaded) {
            window.checkAllLoaded();
        }
    }
}

// Load socials when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSocials);
} else {
    loadSocials();
}