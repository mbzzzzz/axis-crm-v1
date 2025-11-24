// Lead extraction from property listing pages
export interface ExtractedLead {
  name: string;
  phone: string;
  email?: string;
  source: string;
  preferredLocation?: string;
  budget?: number;
  notes?: string;
  propertyUrl?: string;
}

export function extractLeadFromZameen(): ExtractedLead | null {
  try {
    // Look for contact information on Zameen property pages
    const nameSelectors = [
      'h1[class*="name"]',
      '[class*="agent-name"]',
      '[class*="contact-name"]',
      'div[class*="owner"]',
    ];
    
    let name = '';
    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        name = element.textContent?.trim() || '';
        if (name) break;
      }
    }

    // Look for phone number
    const phoneRegex = /(\+92|0)?[0-9]{10,11}/g;
    const phoneSelectors = [
      'a[href^="tel:"]',
      '[class*="phone"]',
      '[class*="contact"]',
      '[class*="mobile"]',
    ];
    
    let phone = '';
    for (const selector of phoneSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.getAttribute('href') || '';
        const match = text.match(phoneRegex);
        if (match) {
          phone = match[0].replace(/^\+92/, '0').replace(/\s+/g, '');
          break;
        }
      }
    }

    // If no phone found, search entire page
    if (!phone) {
      const pageText = document.body.textContent || '';
      const phoneMatch = pageText.match(phoneRegex);
      if (phoneMatch) {
        phone = phoneMatch[0].replace(/^\+92/, '0').replace(/\s+/g, '');
      }
    }

    // Look for email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailSelectors = [
      'a[href^="mailto:"]',
      '[class*="email"]',
    ];
    
    let email = '';
    for (const selector of emailSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.getAttribute('href') || '';
        const match = text.match(emailRegex);
        if (match) {
          email = match[0];
          break;
        }
      }
    }

    // Extract location from page
    const locationSelectors = [
      '[class*="location"]',
      '[class*="address"]',
      '[class*="area"]',
    ];
    
    let preferredLocation = '';
    for (const selector of locationSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        preferredLocation = element.textContent?.trim() || '';
        if (preferredLocation) break;
      }
    }

    // Extract price/budget
    const priceSelectors = [
      '[class*="price"]',
      '[class*="amount"]',
    ];
    
    let budget: number | undefined;
    for (const selector of priceSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || '';
        const priceMatch = text.match(/[\d,]+/);
        if (priceMatch) {
          budget = parseFloat(priceMatch[0].replace(/,/g, ''));
          break;
        }
      }
    }

    if (!name && !phone) {
      return null;
    }

    return {
      name: name || 'Unknown',
      phone: phone || '',
      email: email || undefined,
      source: 'zameen',
      preferredLocation: preferredLocation || undefined,
      budget: budget,
      propertyUrl: window.location.href,
      notes: `Extracted from ${window.location.href}`,
    };
  } catch (error) {
    console.error('Error extracting lead from Zameen:', error);
    return null;
  }
}

export function extractLeadFromZillow(): ExtractedLead | null {
  try {
    // Zillow typically shows agent contact info
    const nameSelectors = [
      '[data-testid*="agent-name"]',
      '[class*="agent-name"]',
      'h3[class*="name"]',
    ];
    
    let name = '';
    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        name = element.textContent?.trim() || '';
        if (name) break;
      }
    }

    // Look for phone
    const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phoneSelectors = [
      'a[href^="tel:"]',
      '[data-testid*="phone"]',
      '[class*="phone"]',
    ];
    
    let phone = '';
    for (const selector of phoneSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.getAttribute('href') || '';
        const match = text.match(phoneRegex);
        if (match) {
          phone = match[0].replace(/\D/g, '');
          if (phone.length === 10) phone = `1${phone}`;
          break;
        }
      }
    }

    // Look for email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailSelectors = [
      'a[href^="mailto:"]',
      '[data-testid*="email"]',
    ];
    
    let email = '';
    for (const selector of emailSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.getAttribute('href') || '';
        const match = text.match(emailRegex);
        if (match) {
          email = match[0];
          break;
        }
      }
    }

    if (!name && !phone) {
      return null;
    }

    return {
      name: name || 'Unknown',
      phone: phone || '',
      email: email || undefined,
      source: 'zillow',
      propertyUrl: window.location.href,
      notes: `Extracted from ${window.location.href}`,
    };
  } catch (error) {
    console.error('Error extracting lead from Zillow:', error);
    return null;
  }
}

export function extractLeadFromRealtor(): ExtractedLead | null {
  try {
    // Similar to Zillow
    const nameSelectors = [
      '[data-label*="agent"]',
      '[class*="agent-name"]',
      'h3[class*="name"]',
    ];
    
    let name = '';
    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        name = element.textContent?.trim() || '';
        if (name) break;
      }
    }

    const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phoneSelectors = [
      'a[href^="tel:"]',
      '[data-label*="phone"]',
      '[class*="phone"]',
    ];
    
    let phone = '';
    for (const selector of phoneSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.getAttribute('href') || '';
        const match = text.match(phoneRegex);
        if (match) {
          phone = match[0].replace(/\D/g, '');
          if (phone.length === 10) phone = `1${phone}`;
          break;
        }
      }
    }

    if (!name && !phone) {
      return null;
    }

    return {
      name: name || 'Unknown',
      phone: phone || '',
      source: 'realtor',
      propertyUrl: window.location.href,
      notes: `Extracted from ${window.location.href}`,
    };
  } catch (error) {
    console.error('Error extracting lead from Realtor:', error);
    return null;
  }
}

export function extractLeadFromBayut(): ExtractedLead | null {
  try {
    // Bayut contact information extraction
    const nameSelectors = [
      '[class*="agent-name"]',
      '[class*="contact-name"]',
      '[class*="owner-name"]',
      'h2[class*="name"]',
      'h3[class*="name"]',
    ];
    
    let name = '';
    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        name = element.textContent?.trim() || '';
        if (name) break;
      }
    }

    // UAE phone number regex: +971 XX XXX XXXX or 0XX XXX XXXX
    const phoneRegex = /(\+971|0)?[0-9]{9,10}/g;
    const phoneSelectors = [
      'a[href^="tel:"]',
      '[class*="phone"]',
      '[class*="contact"]',
      '[class*="mobile"]',
      '[data-testid*="phone"]',
    ];
    
    let phone = '';
    for (const selector of phoneSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.getAttribute('href') || '';
        const match = text.match(phoneRegex);
        if (match) {
          phone = match[0].replace(/^\+971/, '0').replace(/\s+/g, '');
          break;
        }
      }
    }

    // Search entire page if no phone found
    if (!phone) {
      const pageText = document.body.textContent || '';
      const phoneMatch = pageText.match(phoneRegex);
      if (phoneMatch) {
        phone = phoneMatch[0].replace(/^\+971/, '0').replace(/\s+/g, '');
      }
    }

    // Look for email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailSelectors = [
      'a[href^="mailto:"]',
      '[class*="email"]',
      '[data-testid*="email"]',
    ];
    
    let email = '';
    for (const selector of emailSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.getAttribute('href') || '';
        const match = text.match(emailRegex);
        if (match) {
          email = match[0];
          break;
        }
      }
    }

    // Extract location
    const locationSelectors = [
      '[class*="location"]',
      '[class*="address"]',
      '[class*="area"]',
      '[data-testid*="location"]',
    ];
    
    let preferredLocation = '';
    for (const selector of locationSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        preferredLocation = element.textContent?.trim() || '';
        if (preferredLocation) break;
      }
    }

    // Extract price/budget
    const priceSelectors = [
      '[class*="price"]',
      '[class*="amount"]',
      '[data-testid*="price"]',
    ];
    
    let budget: number | undefined;
    for (const selector of priceSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || '';
        const priceMatch = text.match(/[\d,]+/);
        if (priceMatch) {
          budget = parseFloat(priceMatch[0].replace(/,/g, ''));
          break;
        }
      }
    }

    if (!name && !phone) {
      return null;
    }

    return {
      name: name || 'Unknown',
      phone: phone || '',
      email: email || undefined,
      source: 'bayut',
      preferredLocation: preferredLocation || undefined,
      budget: budget,
      propertyUrl: window.location.href,
      notes: `Extracted from ${window.location.href}`,
    };
  } catch (error) {
    console.error('Error extracting lead from Bayut:', error);
    return null;
  }
}

export function extractLeadFromPropertyFinder(): ExtractedLead | null {
  try {
    const nameSelectors = [
      '[class*="agent-name"]',
      '[class*="contact-name"]',
      'h2[class*="name"]',
      'h3[class*="name"]',
    ];
    
    let name = '';
    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        name = element.textContent?.trim() || '';
        if (name) break;
      }
    }

    const phoneRegex = /(\+971|0)?[0-9]{9,10}/g;
    const phoneSelectors = [
      'a[href^="tel:"]',
      '[class*="phone"]',
      '[class*="contact"]',
    ];
    
    let phone = '';
    for (const selector of phoneSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.getAttribute('href') || '';
        const match = text.match(phoneRegex);
        if (match) {
          phone = match[0].replace(/^\+971/, '0').replace(/\s+/g, '');
          break;
        }
      }
    }

    if (!phone) {
      const pageText = document.body.textContent || '';
      const phoneMatch = pageText.match(phoneRegex);
      if (phoneMatch) {
        phone = phoneMatch[0].replace(/^\+971/, '0').replace(/\s+/g, '');
      }
    }

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    let email = '';
    const emailElements = document.querySelectorAll('a[href^="mailto:"]');
    for (const element of emailElements) {
      const text = element.getAttribute('href') || '';
      const match = text.match(emailRegex);
      if (match) {
        email = match[0];
        break;
      }
    }

    if (!name && !phone) {
      return null;
    }

    return {
      name: name || 'Unknown',
      phone: phone || '',
      email: email || undefined,
      source: 'propertyfinder',
      propertyUrl: window.location.href,
      notes: `Extracted from ${window.location.href}`,
    };
  } catch (error) {
    console.error('Error extracting lead from Property Finder:', error);
    return null;
  }
}

export function extractLeadFromDubizzle(): ExtractedLead | null {
  try {
    const nameSelectors = [
      '[class*="agent-name"]',
      '[class*="seller-name"]',
      '[class*="contact-name"]',
    ];
    
    let name = '';
    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        name = element.textContent?.trim() || '';
        if (name) break;
      }
    }

    const phoneRegex = /(\+971|0)?[0-9]{9,10}/g;
    const phoneSelectors = [
      'a[href^="tel:"]',
      '[class*="phone"]',
      '[class*="contact"]',
    ];
    
    let phone = '';
    for (const selector of phoneSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.getAttribute('href') || '';
        const match = text.match(phoneRegex);
        if (match) {
          phone = match[0].replace(/^\+971/, '0').replace(/\s+/g, '');
          break;
        }
      }
    }

    if (!phone) {
      const pageText = document.body.textContent || '';
      const phoneMatch = pageText.match(phoneRegex);
      if (phoneMatch) {
        phone = phoneMatch[0].replace(/^\+971/, '0').replace(/\s+/g, '');
      }
    }

    if (!name && !phone) {
      return null;
    }

    return {
      name: name || 'Unknown',
      phone: phone || '',
      source: 'dubizzle',
      propertyUrl: window.location.href,
      notes: `Extracted from ${window.location.href}`,
    };
  } catch (error) {
    console.error('Error extracting lead from Dubizzle:', error);
    return null;
  }
}

export function extractLeadFromPropsearch(): ExtractedLead | null {
  try {
    const nameSelectors = [
      '[class*="agent-name"]',
      '[class*="contact-name"]',
    ];
    
    let name = '';
    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        name = element.textContent?.trim() || '';
        if (name) break;
      }
    }

    const phoneRegex = /(\+971|0)?[0-9]{9,10}/g;
    const phoneSelectors = [
      'a[href^="tel:"]',
      '[class*="phone"]',
    ];
    
    let phone = '';
    for (const selector of phoneSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.getAttribute('href') || '';
        const match = text.match(phoneRegex);
        if (match) {
          phone = match[0].replace(/^\+971/, '0').replace(/\s+/g, '');
          break;
        }
      }
    }

    if (!name && !phone) {
      return null;
    }

    return {
      name: name || 'Unknown',
      phone: phone || '',
      source: 'propsearch',
      propertyUrl: window.location.href,
      notes: `Extracted from ${window.location.href}`,
    };
  } catch (error) {
    console.error('Error extracting lead from Propsearch:', error);
    return null;
  }
}

export function extractLeadFromCurrentPage(): ExtractedLead | null {
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname.includes('zameen.com')) {
    return extractLeadFromZameen();
  } else if (hostname.includes('zillow.com')) {
    return extractLeadFromZillow();
  } else if (hostname.includes('realtor.com')) {
    return extractLeadFromRealtor();
  } else if (hostname.includes('bayut.com') || hostname.includes('bayut.ae')) {
    return extractLeadFromBayut();
  } else if (hostname.includes('propertyfinder.ae') || hostname.includes('propertyfinder.com')) {
    return extractLeadFromPropertyFinder();
  } else if (hostname.includes('dubizzle.com') || hostname.includes('dubizzle.ae')) {
    return extractLeadFromDubizzle();
  } else if (hostname.includes('propsearch.ae') || hostname.includes('propsearch.com')) {
    return extractLeadFromPropsearch();
  }
  
  return null;
}

