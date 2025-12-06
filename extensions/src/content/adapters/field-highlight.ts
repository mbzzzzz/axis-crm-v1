/**
 * Field Highlighting
 * Provides visual feedback for successfully filled fields
 */

const HIGHLIGHT_STYLE_ID = 'axis-autofill-highlight-style';
const HIGHLIGHT_CLASS = 'axis-autofill-highlighted';

/**
 * Initialize highlight styles
 */
function initHighlightStyles(): void {
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) {
    return; // Already initialized
  }

  const style = document.createElement('style');
  style.id = HIGHLIGHT_STYLE_ID;
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      border: 2px solid #10b981 !important;
      background-color: rgba(16, 185, 129, 0.1) !important;
      transition: all 0.3s ease !important;
      position: relative !important;
    }
    
    .${HIGHLIGHT_CLASS}::after {
      content: '✓';
      position: absolute;
      top: 4px;
      right: 4px;
      background-color: #10b981;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      z-index: 10000;
    }
    
    .${HIGHLIGHT_CLASS}.fade-out {
      border-color: transparent !important;
      background-color: transparent !important;
    }
    
    .${HIGHLIGHT_CLASS}.fade-out::after {
      opacity: 0;
      transition: opacity 0.5s ease;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Highlight a filled field
 */
export function highlightField(element: HTMLElement): void {
  initHighlightStyles();

  // Remove existing highlight
  element.classList.remove(HIGHLIGHT_CLASS, 'fade-out');

  // Add highlight
  element.classList.add(HIGHLIGHT_CLASS);

  // Fade out after 2 seconds
  setTimeout(() => {
    element.classList.add('fade-out');
    setTimeout(() => {
      element.classList.remove(HIGHLIGHT_CLASS, 'fade-out');
    }, 500);
  }, 2000);
}

/**
 * Highlight multiple fields
 */
export function highlightFields(elements: HTMLElement[]): void {
  elements.forEach((el, index) => {
    setTimeout(() => {
      highlightField(el);
    }, index * 100); // Stagger highlights
  });
}

/**
 * Remove all highlights
 */
export function removeAllHighlights(): void {
  const highlighted = document.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
  highlighted.forEach(el => {
    el.classList.remove(HIGHLIGHT_CLASS, 'fade-out');
  });
}

