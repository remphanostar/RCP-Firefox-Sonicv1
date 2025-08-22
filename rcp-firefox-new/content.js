// RCP Firefox Extension - Content Script
// Handles text field detection and prompt insertion

class RCPContentScript {
  constructor() {
    this.currentPlatform = this.detectPlatform();
    this.messageQueue = [];
    this.isInitialized = false;
    this.init();
  }

  async init() {
    try {
      console.log('🔧 RCP Content Script Starting...');

      // Setup message listeners
      this.setupMessageListeners();

      // Setup keyboard shortcuts
      this.setupKeyboardShortcuts();

      // Setup text field enhancements
      this.setupTextFieldEnhancements();

      this.isInitialized = true;
      console.log('✅ RCP Content Script Ready');

      // Notify background script
      this.sendMessageToBackground({ action: 'contentScriptReady' });

    } catch (error) {
      console.error('❌ RCP Content Script initialization failed:', error);
    }
  }

  detectPlatform() {
    const hostname = window.location.hostname.toLowerCase();

    if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
      return 'chatgpt';
    } else if (hostname.includes('claude.ai')) {
      return 'claude';
    } else if (hostname.includes('gemini.google.com')) {
      return 'gemini';
    } else if (hostname.includes('deepseek.com')) {
      return 'deepseek';
    } else if (hostname.includes('civitai.com')) {
      return 'civitai';
    } else if (hostname.includes('novelai.net')) {
      return 'novelai';
    }

    return 'universal';
  }

  setupMessageListeners() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      console.log('📨 Content script received message:', message.action);

      switch (message.action) {
        case 'insertPrompt':
          await this.insertPrompt(message.prompt);
          sendResponse({ success: true });
          break;

        case 'showToast':
          this.showToast(message.message, message.type);
          sendResponse({ success: true });
          break;

        default:
          console.warn('❓ Unknown message action:', message.action);
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('❌ Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async insertPrompt(prompt) {
    try {
      console.log('📝 Inserting prompt:', prompt.title);

      // Find the best target element
      const targetElement = this.findBestTargetElement();

      if (!targetElement) {
        this.showToast('No suitable text field found. Please focus a text field first.', 'error');
        return;
      }

      // Process variables in the prompt
      let processedContent = this.processPromptVariables(prompt);

      // Insert the prompt
      await this.insertTextIntoElement(targetElement, processedContent);

      // Focus the element
      targetElement.focus();

      // Trigger input event
      const inputEvent = new Event('input', { bubbles: true });
      targetElement.dispatchEvent(inputEvent);

      // Show success message
      this.showToast(`Prompt "${prompt.title}" inserted successfully!`, 'success');

      console.log('✅ Prompt inserted successfully');

    } catch (error) {
      console.error('❌ Failed to insert prompt:', error);
      this.showToast('Failed to insert prompt: ' + error.message, 'error');
    }
  }

  findBestTargetElement() {
    // Strategy: Find the most recently focused text input, or the largest visible one

    const selectors = [
      // Platform-specific selectors
      this.getPlatformSpecificSelector(),

      // General selectors (in order of preference)
      'textarea#prompt-textarea', // ChatGPT
      'div[contenteditable="true"]', // Claude, etc.
      'textarea[placeholder*="Message"]', // DeepSeek
      'textarea[name="prompt"]', // CivitAI
      'textarea', // Any textarea
      'input[type="text"]', // Text inputs
      '[contenteditable="true"]' // Content editable elements
    ];

    // First, try to find the currently focused element
    const activeElement = document.activeElement;
    if (activeElement && this.isEditableElement(activeElement)) {
      return activeElement;
    }

    // Then try selectors in order
    for (const selector of selectors) {
      if (!selector) continue;

      const element = document.querySelector(selector);
      if (element && this.isElementVisible(element) && this.isEditableElement(element)) {
        return element;
      }
    }

    return null;
  }

  getPlatformSpecificSelector() {
    const platform = this.currentPlatform;

    const platformSelectors = {
      chatgpt: 'textarea#prompt-textarea',
      claude: 'div[contenteditable="true"]',
      gemini: 'rich-textarea[aria-label*="Message"]',
      deepseek: 'textarea[placeholder*="Message"]',
      civitai: 'textarea[name="prompt"]',
      novelai: 'textarea[id="prompt"]'
    };

    return platformSelectors[platform] || null;
  }

  isEditableElement(element) {
    if (!element) return false;

    return (
      element.tagName === 'TEXTAREA' ||
      element.tagName === 'INPUT' ||
      element.contentEditable === 'true' ||
      element.isContentEditable
    );
  }

  isElementVisible(element) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth) &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  }

  processPromptVariables(prompt) {
    let content = prompt.content || prompt;

    // Replace built-in variables
    const variables = {
      '{{date}}': new Date().toLocaleDateString(),
      '{{time}}': new Date().toLocaleTimeString(),
      '{{datetime}}': new Date().toLocaleString(),
      '{{timestamp}}': Date.now().toString(),
      '{{url}}': window.location.href,
      '{{title}}': document.title,
      '{{selection}}': this.getSelectionText() || '',
      '{{hostname}}': window.location.hostname
    };

    // Replace variables
    for (const [variable, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(variable, 'g'), value);
    }

    // Handle custom variables (prompt for user input if needed)
    if (prompt.variables && prompt.variables.length > 0) {
      for (const variable of prompt.variables) {
        const placeholder = `{${variable}}`;
        if (content.includes(placeholder)) {
          const userValue = prompt(`Enter value for "${variable}":`) || '';
          content = content.replace(new RegExp(placeholder, 'g'), userValue);
        }
      }
    }

    return content;
  }

  getSelectionText() {
    const selection = window.getSelection();
    return selection ? selection.toString().trim() : '';
  }

  async insertTextIntoElement(element, text) {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      // For textarea and input elements
      const start = element.selectionStart || element.value.length;
      const end = element.selectionEnd || element.value.length;
      const currentValue = element.value;

      element.value = currentValue.substring(0, start) + text + currentValue.substring(end);
      element.selectionStart = element.selectionEnd = start + text.length;
    } else if (element.contentEditable === 'true' || element.isContentEditable) {
      // For contenteditable elements
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);

      // Delete any selected content
      range.deleteContents();

      // Insert the text
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);

      // Move cursor to end of inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+V: Quick paste (handled by background script)
      // We just need to make sure we don't interfere
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        // Let the background script handle this
        return;
      }
    });
  }

  setupTextFieldEnhancements() {
    // Add visual indicators to text fields when focused
    const handleFocus = (e) => {
      if (this.isEditableElement(e.target)) {
        e.target.style.transition = 'all 0.3s ease';
        e.target.style.boxShadow = '0 0 0 2px rgba(74, 144, 226, 0.3)';
      }
    };

    const handleBlur = (e) => {
      if (this.isEditableElement(e.target)) {
        e.target.style.boxShadow = '';
      }
    };

    // Use event delegation for better performance
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);
  }

  showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.rcp-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = 'rcp-toast';
    toast.textContent = message;

    // Style toast
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${colors[type]};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      max-width: 300px;
      word-wrap: break-word;
      animation: slideIn 0.3s ease-out;
      opacity: 0.95;
    `;

    document.body.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  sendMessageToBackground(message) {
    return new Promise((resolve, reject) => {
      browser.runtime.sendMessage(message, (response) => {
        if (browser.runtime.lastError) {
          reject(new Error(browser.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize the content script
const rcpContentScript = new RCPContentScript();