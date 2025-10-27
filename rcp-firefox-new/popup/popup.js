// RCP Firefox Extension - Popup Script
// Simple, focused popup interface

class RCPPopup {
  constructor() {
    this.prompts = [];
    this.init();
  }

  async init() {
    try {
      console.log('📋 RCP Popup Starting...');

      // Load prompts
      await this.loadPrompts();

      // Setup event listeners
      this.setupEventListeners();

      console.log('✅ RCP Popup Ready');
    } catch (error) {
      console.error('❌ RCP Popup initialization failed:', error);
      this.showError('Failed to initialize popup');
    }
  }

  async loadPrompts() {
    try {
      const response = await this.sendMessage({ action: 'getPrompts' });

      if (response.success) {
        this.prompts = response.prompts;
        this.renderPrompts();
      } else {
        throw new Error(response.error || 'Failed to load prompts');
      }
    } catch (error) {
      console.error('❌ Failed to load prompts:', error);
      this.showError('Failed to load prompts: ' + error.message);
    }
  }

  renderPrompts() {
    const promptList = document.getElementById('prompt-list');

    if (this.prompts.length === 0) {
      promptList.innerHTML = `
        <div class="empty-state">
          <div class="icon">📝</div>
          <h3>No prompts yet</h3>
          <p>Create your first prompt to get started!<br>Right-click on any text field to use prompts.</p>
        </div>
      `;
      return;
    }

    promptList.innerHTML = '';

    this.prompts.forEach(prompt => {
      const promptElement = document.createElement('div');
      promptElement.className = 'prompt-item';
      promptElement.dataset.promptId = prompt.id;

      const preview = prompt.content.length > 50
        ? prompt.content.substring(0, 50) + '...'
        : prompt.content;

      promptElement.innerHTML = `
        <div class="title">${this.escapeHtml(prompt.title)}</div>
        <div class="category">${this.escapeHtml(prompt.category)}</div>
        <div class="preview">${this.escapeHtml(preview)}</div>
      `;

      promptElement.addEventListener('click', () => this.usePrompt(prompt.id));
      promptElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showPromptContextMenu(e, prompt);
      });

      promptList.appendChild(promptElement);
    });
  }

  setupEventListeners() {
    // Add prompt button
    document.getElementById('add-prompt').addEventListener('click', () => {
      this.showAddPromptDialog();
    });

    // Import prompts button
    document.getElementById('import-prompts').addEventListener('click', () => {
      this.showImportDialog();
    });

    // Help link
    document.getElementById('help-link').addEventListener('click', (e) => {
      e.preventDefault();
      this.showHelp();
    });
  }

  async usePrompt(promptId) {
    try {
      const prompt = this.prompts.find(p => p.id === promptId);
      if (!prompt) return;

      // Get the active tab
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        await this.sendMessage({
          action: 'insertPrompt',
          promptId: promptId,
          targetTabId: tabs[0].id
        });

        // Close popup
        window.close();
      }
    } catch (error) {
      console.error('❌ Failed to use prompt:', error);
      this.showError('Failed to use prompt: ' + error.message);
    }
  }

  showAddPromptDialog() {
    const title = prompt('Enter prompt title:');
    if (!title) return;

    const content = prompt('Enter prompt content:');
    if (!content) return;

    const category = prompt('Enter category (optional):') || 'General';

    this.savePrompt({
      title: title,
      content: content,
      category: category
    });
  }

  async savePrompt(promptData) {
    try {
      const response = await this.sendMessage({
        action: 'savePrompt',
        prompt: promptData
      });

      if (response.success) {
        await this.loadPrompts(); // Refresh the list
        this.showMessage('Prompt saved successfully!');
      } else {
        throw new Error(response.error || 'Failed to save prompt');
      }
    } catch (error) {
      console.error('❌ Failed to save prompt:', error);
      this.showError('Failed to save prompt: ' + error.message);
    }
  }

  showImportDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.json';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        this.importFromFile(file);
      }
    };

    input.click();
  }

  async importFromFile(file) {
    try {
      const text = await this.readFileAsText(file);
      let prompts = [];

      if (file.name.endsWith('.json')) {
        prompts = JSON.parse(text);
      } else {
        // Simple text/markdown format
        const title = file.name.replace(/\.(txt|md)$/i, '');
        prompts = [{
          title: title,
          content: text,
          category: 'Imported'
        }];
      }

      // Save each prompt
      for (const prompt of prompts) {
        await this.savePrompt(prompt);
      }

      this.showMessage(`Imported ${prompts.length} prompt(s) successfully!`);
    } catch (error) {
      console.error('❌ Failed to import file:', error);
      this.showError('Failed to import file: ' + error.message);
    }
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  showPromptContextMenu(event, prompt) {
    // Simple context menu for prompt actions
    const actions = [
      { label: 'Edit', action: () => this.editPrompt(prompt) },
      { label: 'Delete', action: () => this.deletePrompt(prompt.id) },
      { label: 'Copy Content', action: () => this.copyPromptContent(prompt) }
    ];

    // For now, just show a simple confirm dialog
    const action = prompt('Choose action:\n1. Edit\n2. Delete\n3. Copy Content\n\nEnter number:');
    const actionIndex = parseInt(action) - 1;

    if (actionIndex >= 0 && actionIndex < actions.length) {
      actions[actionIndex].action();
    }
  }

  editPrompt(prompt) {
    const newTitle = prompt('Edit title:', prompt.title);
    if (!newTitle) return;

    const newContent = prompt('Edit content:', prompt.content);
    if (!newContent) return;

    const newCategory = prompt('Edit category:', prompt.category);

    this.savePrompt({
      title: newTitle,
      content: newContent,
      category: newCategory || prompt.category
    });
  }

  async deletePrompt(promptId) {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      const response = await this.sendMessage({
        action: 'deletePrompt',
        promptId: promptId
      });

      if (response.success) {
        await this.loadPrompts(); // Refresh the list
        this.showMessage('Prompt deleted successfully!');
      } else {
        throw new Error(response.error || 'Failed to delete prompt');
      }
    } catch (error) {
      console.error('❌ Failed to delete prompt:', error);
      this.showError('Failed to delete prompt: ' + error.message);
    }
  }

  copyPromptContent(prompt) {
    navigator.clipboard.writeText(prompt.content).then(() => {
      this.showMessage('Prompt content copied to clipboard!');
    }).catch(() => {
      this.showError('Failed to copy to clipboard');
    });
  }

  showHelp() {
    const helpText = `
RCP - Right Click Prompts

How to use:
1. Right-click on any text field
2. Select "RCP - Insert Prompt"
3. Choose a prompt from the menu

Keyboard shortcuts:
• Ctrl+Shift+V: Quick paste last used prompt

File import:
• Supports .txt, .md, and .json files
• JSON format: [{"title": "Name", "content": "Text", "category": "Category"}]

Tips:
• Focus a text field before using prompts
• Prompts support variables like {{date}}, {{time}}, etc.
• Use categories to organize your prompts
    `;

    alert(helpText);
  }

  showMessage(message) {
    // Simple message display
    alert(message);
  }

  showError(message) {
    alert('Error: ' + message);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  sendMessage(message) {
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

// Initialize the popup
const rcpPopup = new RCPPopup();