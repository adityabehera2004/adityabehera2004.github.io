/**
 * Loads timeline items from timeline.json and renders them in a vertical timeline
 */
async function loadTimeline() {
    try {
        const response = await fetch('timeline.json');
        const data = await response.json();
        
        const timelineContainer = document.getElementById('timeline-container');
        if (!timelineContainer) {
            console.error('Timeline container not found');
            return;
        }

        // Clear any existing content
        timelineContainer.innerHTML = '';

        if (!data.items || data.items.length === 0) {
            return;
        }

        // Find the date range
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();

        let earliestMonth = currentMonth;
        let earliestYear = currentYear;
        let latestMonth = currentMonth;
        let latestYear = currentYear;

        data.items.forEach(item => {
            const itemStartMonths = item.startYear * 12 + (item.startMonth - 1);
            const itemEndMonths = item.endYear * 12 + (item.endMonth - 1);
            const itemEarliest = Math.min(itemStartMonths, itemEndMonths);
            const itemLatest = Math.max(itemStartMonths, itemEndMonths);

            const currentEarliest = earliestYear * 12 + (earliestMonth - 1);
            const currentLatest = latestYear * 12 + (latestMonth - 1);

            if (itemEarliest < currentEarliest) {
                earliestMonth = (itemEarliest % 12) + 1;
                earliestYear = Math.floor(itemEarliest / 12);
            }
            if (itemLatest > currentLatest) {
                latestMonth = (itemLatest % 12) + 1;
                latestYear = Math.floor(itemLatest / 12);
            }
        });

        // Calculate total months in timeline
        const startMonths = latestYear * 12 + (latestMonth - 1); // Start at latest (top)
        const endMonths = earliestYear * 12 + (earliestMonth - 1); // End at earliest (bottom)
        const totalMonths = startMonths - endMonths;
        
        // Calculate height with variable px per month based on item lengths
        const pxPerMonthShort = 40; // For items < 12 months
        const pxPerMonthLong = 20; // For items >= 12 months
        
        let calculatedHeight = 0;
        for (let month = endMonths; month <= startMonths; month++) {
            let hasShortItem = false;
            
            data.items.forEach(item => {
                const itemStartMonths = item.startYear * 12 + (item.startMonth - 1);
                const itemEndMonths = item.endYear * 12 + (item.endMonth - 1);
                const itemStart = Math.min(itemStartMonths, itemEndMonths);
                const itemEnd = Math.max(itemStartMonths, itemEndMonths);
                const itemLength = itemEnd - itemStart + 1;
                
                if (month >= itemStart && month <= itemEnd && itemLength < 12) {
                    hasShortItem = true;
                }
            });
            
            calculatedHeight += hasShortItem ? pxPerMonthShort : pxPerMonthLong;
        }
        
        timelineContainer.style.minHeight = `${Math.max(600, calculatedHeight)}px`;
        
        // Now calculate cumulative heights for positioning
        // Store cumulative pixels at each month point
        const monthPixels = [];
        let cumulativePixels = 0;
        for (let month = startMonths; month >= endMonths; month--) {
            monthPixels[month] = cumulativePixels;
            
            let hasShortItem = false;
            data.items.forEach(item => {
                const itemStartMonths = item.startYear * 12 + (item.startMonth - 1);
                const itemEndMonths = item.endYear * 12 + (item.endMonth - 1);
                const itemStart = Math.min(itemStartMonths, itemEndMonths);
                const itemEnd = Math.max(itemStartMonths, itemEndMonths);
                const itemLength = itemEnd - itemStart + 1;
                
                if (month >= itemStart && month <= itemEnd && itemLength < 12) {
                    hasShortItem = true;
                }
            });
            
            cumulativePixels += hasShortItem ? pxPerMonthShort : pxPerMonthLong;
        }

        // Create timeline line wrapper (for dots within container)
        const timelineLineWrapper = document.createElement('div');
        timelineLineWrapper.className = 'timeline-line-wrapper';
        timelineContainer.appendChild(timelineLineWrapper);
        
        // Create extended timeline line (extends to bottom of container)
        const timelineLine = document.createElement('div');
        timelineLine.className = 'timeline-line';
        timelineContainer.appendChild(timelineLine);
        
        // Create extension line that goes past the bottom of the screen
        const timelineExtensionLine = document.createElement('div');
        timelineExtensionLine.className = 'timeline-extension-line';
        
        // Position extension line to start 200px below the start dot and extend to viewport bottom
        const updateExtensionLinePosition = () => {
            const containerRect = timelineContainer.getBoundingClientRect();
            const containerTop = containerRect.top; // Start dot is at top: 0 relative to container
            const startDotPosition = containerTop; // Start dot position in viewport
            const extensionStart = startDotPosition + 200; // 200px below start dot
            const viewportHeight = window.innerHeight;
            const extensionHeight = Math.max(0, viewportHeight - extensionStart);
            timelineExtensionLine.style.top = `${extensionStart}px`;
            timelineExtensionLine.style.height = `${extensionHeight}px`;
        };
        
        updateExtensionLinePosition();
        window.addEventListener('resize', updateExtensionLinePosition);
        window.addEventListener('scroll', updateExtensionLinePosition);
        
        document.body.appendChild(timelineExtensionLine);

        // Create start circle (latest/current)
        const startCircle = document.createElement('div');
        startCircle.className = 'timeline-circle timeline-start';
        const startLabel = document.createElement('div');
        startLabel.className = 'timeline-date-label';
        startLabel.textContent = getMonthYearString(latestMonth, latestYear);
        startCircle.appendChild(startLabel);
        timelineContainer.appendChild(startCircle);

        // Store dots to check for merging
        const dotsToCreate = [];
        // Store dot references by item index for hover effects
        const dotsByItemIndex = {};
        // Store actual dot positions after merging for accurate card positioning
        const actualDotPositions = {};
        
        // First pass: collect all dots to create
        data.items.forEach((item, index) => {
            // Calculate positions using cumulative pixels instead of percentages
            const itemStartMonths = item.startYear * 12 + (item.startMonth - 1);
            const itemEndMonths = item.endYear * 12 + (item.endMonth - 1);
            
            // Position for start dot, end dot using pixel-based positioning
            const startPositionPx = monthPixels[itemStartMonths];
            const endPositionPx = monthPixels[itemEndMonths];
            
            // Convert to percentages based on actual calculated height
            const startPosition = startPositionPx / calculatedHeight;
            const endPosition = endPositionPx / calculatedHeight;

            // Store dot information for merging logic
            dotsToCreate.push({
                type: 'start',
                position: startPosition,
                itemIndex: index,
                monthValue: itemStartMonths
            });
            
            dotsToCreate.push({
                type: 'end',
                position: endPosition,
                itemIndex: index,
                monthValue: itemEndMonths
            });
            
            // Initialize actual positions (will be updated after merging)
            actualDotPositions[index] = {
                start: startPosition,
                end: endPosition
            };
        });

        // Sort dots by month value, then by position
        dotsToCreate.sort((a, b) => {
            if (a.monthValue !== b.monthValue) {
                return b.monthValue - a.monthValue; // Latest first
            }
            return b.position - a.position;
        });

        // Group dots by month value, merging those at same month or 1 month apart
        const dotGroups = [];
        const processed = new Set();
        
        for (let i = 0; i < dotsToCreate.length; i++) {
            if (processed.has(i)) continue;
            
            const currentDot = dotsToCreate[i];
            const group = [currentDot];
            processed.add(i);
            
            // Find all dots that should merge with this one
            for (let j = i + 1; j < dotsToCreate.length; j++) {
                if (processed.has(j)) continue;
                
                const otherDot = dotsToCreate[j];
                const monthDiff = Math.abs(currentDot.monthValue - otherDot.monthValue);
                
                // Merge if same month or 1 month apart
                if (monthDiff === 0 || monthDiff === 1) {
                    group.push(otherDot);
                    processed.add(j);
                }
            }
            
            dotGroups.push(group);
        }
        
        // Create dots from groups
        dotGroups.forEach(group => {
            if (group.length === 1) {
                // Single dot - create normally
                const dotData = group[0];
                const dot = document.createElement('div');
                dot.className = `timeline-item-dot timeline-item-dot-${dotData.type}`;
                dot.style.top = `${dotData.position * 100}%`;
                dot.dataset.itemIndex = dotData.itemIndex;
                timelineLineWrapper.appendChild(dot);
                
                // Store dot reference
                if (!dotsByItemIndex[dotData.itemIndex]) {
                    dotsByItemIndex[dotData.itemIndex] = { element: null, dots: [] };
                }
                dotsByItemIndex[dotData.itemIndex].dots.push(dot);
                
                // Update actual position
                if (dotData.type === 'start') {
                    actualDotPositions[dotData.itemIndex].start = dotData.position;
                } else if (dotData.type === 'end') {
                    actualDotPositions[dotData.itemIndex].end = dotData.position;
                }
            } else {
                // Multiple dots - merge them
                // Calculate merged position (average or based on month difference)
                const allSameMonth = group.every(d => d.monthValue === group[0].monthValue);
                const mergedPosition = allSameMonth 
                    ? group[0].position 
                    : group.reduce((sum, d) => sum + d.position, 0) / group.length;
                
                const mergedDot = document.createElement('div');
                mergedDot.className = 'timeline-item-dot timeline-item-dot-merged';
                mergedDot.style.top = `${mergedPosition * 100}%`;
                mergedDot.dataset.itemIndex = group.map(d => d.itemIndex).join(',');
                timelineLineWrapper.appendChild(mergedDot);
                
                // Store merged dot for all items in the group
                group.forEach(dotData => {
                    if (!dotsByItemIndex[dotData.itemIndex]) {
                        dotsByItemIndex[dotData.itemIndex] = { element: null, dots: [] };
                    }
                    dotsByItemIndex[dotData.itemIndex].dots.push(mergedDot);
                    
                    // Update actual position
                    if (dotData.type === 'start') {
                        actualDotPositions[dotData.itemIndex].start = mergedPosition;
                    } else if (dotData.type === 'end') {
                        actualDotPositions[dotData.itemIndex].end = mergedPosition;
                    }
                });
            }
        });
        
        // Second pass: create timeline item elements using actual merged dot positions
        data.items.forEach((item, index) => {
            const positions = actualDotPositions[index];
            const centerPosition = (positions.start + positions.end) / 2;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'timeline-item';
            itemElement.style.top = `${centerPosition * 100}%`;
            itemElement.style.transform = 'translateY(-50%)';

            // Set side based on item.side field (L or R)
            if (item.side === 'L') {
                itemElement.classList.add('timeline-item-left');
            } else {
                itemElement.classList.add('timeline-item-right');
            }

            const itemContent = document.createElement('div');
            itemContent.className = 'timeline-item-content';
            itemContent.style.cursor = 'pointer';
            itemContent.addEventListener('click', () => openTimelineModal(item));

            const itemTitle = document.createElement('h3');
            itemTitle.className = 'timeline-item-title';
            itemTitle.textContent = item.title;

            const itemDate = document.createElement('div');
            itemDate.className = 'timeline-item-date';
            itemDate.textContent = `${getMonthYearString(item.startMonth, item.startYear)} - ${getMonthYearString(item.endMonth, item.endYear)}`;

            itemContent.appendChild(itemTitle);
            itemContent.appendChild(itemDate);

            // Add description if it exists
            if (item.description && item.description.trim()) {
                const itemDescription = document.createElement('p');
                itemDescription.className = 'timeline-item-description';
                itemDescription.textContent = item.description;
                itemContent.appendChild(itemDescription);
                
                // Check if content is truncated and add "has-more" class
                requestAnimationFrame(() => {
                    if (itemDescription.scrollHeight > itemDescription.clientHeight) {
                        itemDescription.classList.add('has-more');
                    }
                });
            }

            // Add links to card if they exist
            if (item.links && item.links.length > 0) {
                const cardLinks = document.createElement('div');
                cardLinks.className = 'timeline-item-links';
                
                // Show only first 2 links to keep cards compact
                const linksToShow = item.links.slice(0, 2);
                
                linksToShow.forEach((linkItem, linkIndex) => {
                    const link = document.createElement('a');
                    link.href = linkItem.link;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.className = 'timeline-item-link';
                    link.textContent = linkItem.displayName;
                    
                    // Prevent modal from opening when clicking on link
                    link.addEventListener('click', (e) => {
                        e.stopPropagation();
                    });

                    cardLinks.appendChild(link);

                    // Add separator (│) between links
                    if (linkIndex < linksToShow.length - 1) {
                        const separator = document.createElement('span');
                        separator.className = 'timeline-item-link-separator';
                        separator.textContent = ' │ ';
                        cardLinks.appendChild(separator);
                    }
                });

                itemContent.appendChild(cardLinks);
            }

            itemElement.appendChild(itemContent);

            // Create highlight line segment for hover effect
            const highlightLine = document.createElement('div');
            highlightLine.className = 'timeline-item-highlight';
            highlightLine.style.top = `${positions.start * 100}%`;
            highlightLine.style.height = `${(positions.end - positions.start) * 100}%`;
            highlightLine.dataset.itemIndex = index;
            timelineLineWrapper.appendChild(highlightLine);

            // Store item element reference for hover effects
            if (!dotsByItemIndex[index]) {
                dotsByItemIndex[index] = { element: itemElement, dots: [] };
            } else {
                dotsByItemIndex[index].element = itemElement;
            }
            
            // Add hover effect for highlight line
            itemElement.addEventListener('mouseenter', () => {
                highlightLine.classList.add('timeline-highlight-active');
            });

            itemElement.addEventListener('mouseleave', () => {
                highlightLine.classList.remove('timeline-highlight-active');
            });

            timelineContainer.appendChild(itemElement);
        });
        
        // Add hover effects to items to highlight their dots
        Object.keys(dotsByItemIndex).forEach(itemIndex => {
            const itemData = dotsByItemIndex[itemIndex];
            if (itemData.element && itemData.dots.length > 0) {
                itemData.element.addEventListener('mouseenter', () => {
                    itemData.dots.forEach(dot => {
                        dot.classList.add('timeline-dot-highlighted');
                    });
                });
                
                itemData.element.addEventListener('mouseleave', () => {
                    itemData.dots.forEach(dot => {
                        dot.classList.remove('timeline-dot-highlighted');
                    });
                });
            }
        });

        // End date (earliest) is still calculated but label is not displayed
        
        // Mark timeline as loaded
        window.contentLoaded.timeline = true;
        if (window.checkAllLoaded) {
            window.checkAllLoaded();
        }
    } catch (error) {
        console.error('Error loading timeline:', error);
        window.contentLoaded.timeline = true;
        if (window.checkAllLoaded) {
            window.checkAllLoaded();
        }
    }
}

/**
 * Converts month (1-12) and year to a string like "Jan 2024"
 */
function getMonthYearString(month, year) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[month - 1]} ${year}`;
}

/**
 * Opens a modal displaying timeline item details
 */
function openTimelineModal(item) {
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'timeline-modal-backdrop';
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'timeline-modal';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'timeline-modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close');
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'timeline-modal-content';
    
    // Create title
    const title = document.createElement('h2');
    title.className = 'timeline-modal-title';
    title.textContent = item.title;
    
    // Create date
    const date = document.createElement('div');
    date.className = 'timeline-modal-date';
    date.textContent = `${getMonthYearString(item.startMonth, item.startYear)} - ${getMonthYearString(item.endMonth, item.endYear)}`;
    
    // Create description
    const description = document.createElement('div');
    description.className = 'timeline-modal-description';
    description.textContent = item.description || '';
    
    // Create links container (if links exist)
    const modalLinks = document.createElement('div');
    modalLinks.className = 'timeline-modal-links';

    if (item.links && item.links.length > 0) {
        item.links.forEach((linkItem, linkIndex) => {
            const link = document.createElement('a');
            link.href = linkItem.link;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'timeline-modal-link';
            link.textContent = linkItem.displayName;
            modalLinks.appendChild(link);

            // Add separator (│) between links, but not after the last one
            if (linkIndex < item.links.length - 1) {
                const separator = document.createElement('span');
                separator.className = 'timeline-modal-link-separator';
                separator.textContent = ' │ ';
                modalLinks.appendChild(separator);
            }
        });
    }
    
    // Assemble modal
    content.appendChild(title);
    content.appendChild(date);
    content.appendChild(description);
    if (item.links && item.links.length > 0) {
        content.appendChild(modalLinks);
    }
    modal.appendChild(closeButton);
    modal.appendChild(content);
    backdrop.appendChild(modal);
    
    // Add to document
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
        backdrop.remove();
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

// Load timeline when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTimeline);
} else {
    loadTimeline();
}