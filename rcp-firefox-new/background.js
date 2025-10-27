// RCP Firefox Extension - Background Script
// Simple, robust message passing and context menu management

class RCPBackground {
  constructor() {
    this.prompts = [];
    this.lastUsedPrompt = null;
    this.init();
  }

  async init() {
    try {
      console.log('🚀 RCP Background Script Starting...');

      // Load saved prompts
      await this.loadPrompts();

      // Setup context menu
      await this.setupContextMenu();

      // Setup message listeners
      this.setupMessageListeners();

      // Setup command listeners
      this.setupCommandListeners();

      console.log('✅ RCP Background Script Ready');
    } catch (error) {
      console.error('❌ RCP Background initialization failed:', error);
    }
  }

  async loadPrompts() {
    try {
      const result = await browser.storage.local.get(['prompts']);
      this.prompts = result.prompts || [];

      // Add default prompts if none exist
      if (this.prompts.length === 0) {
        this.prompts = this.getDefaultPrompts();
        await browser.storage.local.set({ prompts: this.prompts });
      }

      console.log(`📦 Loaded ${this.prompts.length} prompts`);
    } catch (error) {
      console.error('❌ Failed to load prompts:', error);
      this.prompts = this.getDefaultPrompts();
    }
  }

  getDefaultPrompts() {
    return [
      {
        id: 'general_assistant',
        title: 'General AI Assistant',
        content: 'You are a helpful AI assistant. Please help me with the following task:\n\n{task}\n\nPlease provide a comprehensive, well-structured response.',
        variables: ['task'],
        category: 'General',
        tags: ['assistant', 'general']
      },
      {
        id: 'code_explanation',
        title: 'Code Explanation',
        content: 'Please explain the following code in detail:\n\n```\n{code}\n```\n\nExplain what this code does, how it works, and any important concepts it demonstrates.',
        variables: ['code'],
        category: 'Programming',
        tags: ['code', 'explanation']
      },
      {
        id: 'writing_improvement',
        title: 'Writing Improvement',
        content: 'Please review and improve the following text:\n\n"{text}"\n\nPlease provide:\n1. Improved version\n2. Specific changes made\n3. Reasoning for each change',
        variables: ['text'],
        category: 'Writing',
        tags: ['writing', 'improvement']
      }
    ];
  }

  async setupContextMenu() {
    try {
      // Remove existing menu items
      await browser.contextMenus.removeAll();

      // Create parent menu
      await browser.contextMenus.create({
        id: 'rcp-main',
        title: 'RCP - Insert Prompt',
        contexts: ['editable']
      });

      // Create prompt menu items
      for (const prompt of this.prompts.slice(0, 10)) { // Limit to 10 for menu size
        await browser.contextMenus.create({
          id: `rcp-prompt-${prompt.id}`,
          parentId: 'rcp-main',
          title: prompt.title,
          contexts: ['editable']
        });
      }

      // Add more options
      await browser.contextMenus.create({
        id: 'rcp-separator',
        parentId: 'rcp-main',
        type: 'separator',
        contexts: ['editable']
      });

      await browser.contextMenus.create({
        id: 'rcp-manage',
        parentId: 'rcp-main',
        title: '📋 Manage Prompts...',
        contexts: ['editable']
      });

      console.log('✅ Context menu created');
    } catch (error) {
      console.error('❌ Failed to setup context menu:', error);
    }
  }

  setupMessageListeners() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      console.log('📨 Background received message:', message.action);

      switch (message.action) {
        case 'getPrompts':
          sendResponse({ success: true, prompts: this.prompts });
          break;

        case 'savePrompt':
          await this.savePrompt(message.prompt);
          sendResponse({ success: true });
          break;

        case 'deletePrompt':
          await this.deletePrompt(message.promptId);
          sendResponse({ success: true });
          break;

        case 'insertPrompt':
          await this.insertPrompt(message.promptId, message.targetTabId);
          sendResponse({ success: true });
          break;

        case 'getLastUsedPrompt':
          sendResponse({ success: true, prompt: this.lastUsedPrompt });
          break;

        case 'refreshContextMenu':
          await this.setupContextMenu();
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

  setupCommandListeners() {
    browser.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });
  }

  async handleCommand(command) {
    try {
      switch (command) {
        case 'quick-paste':
          if (this.lastUsedPrompt) {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
              await this.insertPrompt(this.lastUsedPrompt.id, tabs[0].id);
            }
          }
          break;
      }
    } catch (error) {
      console.error('❌ Error handling command:', error);
    }
  }

  // Context menu click handler
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    try {
      if (info.menuItemId === 'rcp-manage') {
        // Open the popup
        await browser.action.openPopup();
      } else if (info.menuItemId.startsWith('rcp-prompt-')) {
        const promptId = info.menuItemId.replace('rcp-prompt-', '');
        await this.insertPrompt(promptId, tab.id);
      }
    } catch (error) {
      console.error('❌ Error handling context menu click:', error);
    }
  });

  async savePrompt(prompt) {
    try {
      const newPrompt = {
        id: Date.now().toString(),
        title: prompt.title,
        content: prompt.content,
        variables: prompt.variables || [],
        category: prompt.category || 'General',
        tags: prompt.tags || [],
        created: new Date().toISOString()
      };

      this.prompts.push(newPrompt);
      await browser.storage.local.set({ prompts: this.prompts });
      await this.setupContextMenu(); // Refresh context menu

      console.log('✅ Prompt saved:', newPrompt.title);
    } catch (error) {
      console.error('❌ Failed to save prompt:', error);
      throw error;
    }
  }

  async deletePrompt(promptId) {
    try {
      this.prompts = this.prompts.filter(p => p.id !== promptId);
      await browser.storage.local.set({ prompts: this.prompts });
      await this.setupContextMenu(); // Refresh context menu

      console.log('✅ Prompt deleted:', promptId);
    } catch (error) {
      console.error('❌ Failed to delete prompt:', error);
      throw error;
    }
  }

  async insertPrompt(promptId, tabId) {
    try {
      const prompt = this.prompts.find(p => p.id === promptId);
      if (!prompt) {
        throw new Error('Prompt not found');
      }

      this.lastUsedPrompt = prompt;

      // Send message to content script
      await browser.tabs.sendMessage(tabId, {
        action: 'insertPrompt',
        prompt: prompt
      });

      console.log('✅ Prompt sent for insertion:', prompt.title);
    } catch (error) {
      console.error('❌ Failed to insert prompt:', error);
      throw error;
    }
  }
}

// Initialize the background script
const rcpBackground = new RCPBackground();