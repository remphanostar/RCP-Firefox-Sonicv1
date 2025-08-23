// Create prompt element    // Create accordion for categories
    function createAccordion(categoryId, categoryName, prompts, isOpen = false) {
        const accordion = document.createElement('div');
        accordion.style.cssText = `
            margin-bottom: 20px;
            background: linear-gradient(145deg, #2d2d2d, #1a1a1a);
            border-radius: 15px;
            border: 2px solid #b8860b;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
            overflow: hidden;
        `;

        // Accordion header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #a0522d, #8b0000);
            padding: 20px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
            user-select: none;
            border-bottom: 2px solid #b8860b;
        `;

        const headerLeft = document.createElement('div');
        headerLeft.style.display = 'flex';
        headerLeft.style.alignItems = 'center';
        headerLeft.style.gap = '15px';

        const chevron = document.createElement('span');
        chevron.innerHTML = isOpen ? '▼' : '▶';
        chevron.style.cssText = `
            color: #b8860b;
            font-size: 18px;
            transition: transform 0.3s ease;
            transform: rotate(${isOpen ? '0deg' : '-90deg'});
        `;

        const title = document.createElement('h3');
        title.textContent = `${categoryName} (${prompts.length})`;
        title.style.cssText = `
            margin: 0;
            color: #fff;
            font-size: 20px;
            font-weight: 600;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        `;

        headerLeft.append(chevron, title);

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '10px';

        if (categoryId !== 'uncategorized') {
            const deleteBtn = createButton('Delete', () => deleteCategory(categoryId));
            deleteBtn.style.cssText += `
                background: linear-gradient(145deg, #8b0000, #654321);
                padding: 8px 16px;
                font-size: 12px;
            `;
            actions.appendChild(deleteBtn);
        }

        header.append(headerLeft, actions);

        // Accordion content
        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = `
            max-height: ${isOpen ? 'none' : '0'};
            overflow: hidden;
            transition: all 0.3s ease;
            background: linear-gradient(145deg, #1a1a1a, #2d2d2d);
        `;

        const innerContent = document.createElement('div');
        innerContent.style.cssText = `
            padding: ${isOpen ? '20px' : '0 20px'};
            opacity: ${isOpen ? '1' : '0'};
            transition: all 0.3s ease;
        `;

        // Sort prompts by name
        const sortedPrompts = prompts.sort((a, b) =>
            a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );

        if (sortedPrompts.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = `
                text-align: center;
                padding: 30px;
                color: #888;
                font-style: italic;
                background: linear-gradient(145deg, #333, #2a2a2a);
                border-radius: 10px;
                border: 1px solid #444;
            `;
            emptyMsg.textContent = 'No prompts in this category';
            innerContent.appendChild(emptyMsg);
        } else {
            sortedPrompts.forEach(prompt => {
                const promptDiv = createPromptElement(prompt);
                innerContent.appendChild(promptDiv);
            });
        }

        contentDiv.appendChild(innerContent);

        // Toggle functionality
        header.onclick = (e) => {
            if (e.target.closest('button')) return; // Don't toggle if clicking button

            const isCurrentlyOpen = contentDiv.style.maxHeight !== '0px' && contentDiv.style.maxHeight !== '';

            if (isCurrentlyOpen) {
                contentDiv.style.maxHeight = '0';
                contentDiv.style.opacity = '0';
                innerContent.style.padding = '0 20px';
                innerContent.style.opacity = '0';
                chevron.style.transform = 'rotate(-90deg)';
                chevron.innerHTML = '▶';
            } else {
                contentDiv.style.maxHeight = contentDiv.scrollHeight + 'px';
                contentDiv.style.opacity = '1';
                innerContent.style.padding = '20px';
                innerContent.style.opacity = '1';
                chevron.style.transform = 'rotate(0deg)';
                chevron.innerHTML = '▼';

                // Adjust height after transition
                setTimeout(() => {
                    if (contentDiv.style.maxHeight !== '0px') {
                        contentDiv.style.maxHeight = 'none';
                    }
                }, 300);
            }
        };

        // Hover effects
        header.onmouseover = () => {
            header.style.background = 'linear-gradient(135deg, #8b0000, #654321)';
        };
        header.onmouseout = () => {
            header.style.background = 'linear-gradient(135deg, #a0522d, #8b0000)';
        };

        accordion.append(header, contentDiv);
        return accordion;
    }// ==UserScript==
// @name         LLM Prompt Manager
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Organize and manage LLM prompts with categories, import/export, and right-click menu
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Storage key for prompts
    const STORAGE_KEY = 'llm_prompt_manager_data';

    // Default data structure
    let promptData = {
        categories: {},
        prompts: []
    };

    // Load data from localStorage
    function loadData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                promptData = JSON.parse(stored);
                // Ensure categories object exists
                if (!promptData.categories) promptData.categories = {};
                if (!promptData.prompts) promptData.prompts = [];
            } catch (e) {
                console.error('Error loading prompt data:', e);
            }
        }
    }

    // Save data to localStorage
    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(promptData));
    }

    // Generate unique ID
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Create the overlay UI
    function createOverlayUI() {
        // Main overlay container
        const overlay = document.createElement('div');
        overlay.id = 'prompt-manager-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(0, 0, 0, 0.9));
            backdrop-filter: blur(5px);
            z-index: 10000;
            display: none;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            animation: fadeIn 0.3s ease-out;
        `;

        // Main container
        const container = document.createElement('div');
        container.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(145deg, #1a1a1a, #2d2d2d);
            width: 95%;
            max-width: 1400px;
            height: 90%;
            border-radius: 20px;
            box-shadow:
                0 20px 60px rgba(0, 0, 0, 0.7),
                0 0 0 3px #b8860b,
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #333;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 25px 30px;
            background: linear-gradient(135deg, #a0522d, #8b0000);
            border-bottom: 3px solid #b8860b;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            overflow: hidden;
        `;

        // Add decorative pattern
        const pattern = document.createElement('div');
        pattern.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background:
                radial-gradient(circle at 20% 50%, rgba(184, 134, 11, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 50%, rgba(184, 134, 11, 0.1) 0%, transparent 50%);
            pointer-events: none;
        `;
        header.appendChild(pattern);

        const title = document.createElement('h1');
        title.textContent = 'LLM Prompt Manager';
        title.style.cssText = `
            margin: 0;
            color: #fff;
            font-size: 28px;
            font-weight: 600;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            letter-spacing: 1px;
            position: relative;
            z-index: 1;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            background: linear-gradient(145deg, #8b0000, #654321);
            border: 2px solid #b8860b;
            color: #fff;
            width: 45px;
            height: 45px;
            border-radius: 50%;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            position: relative;
            z-index: 1;
        `;
        closeBtn.onmouseover = () => {
            closeBtn.style.background = 'linear-gradient(145deg, #a0522d, #8b0000)';
            closeBtn.style.transform = 'scale(1.1)';
        };
        closeBtn.onmouseout = () => {
            closeBtn.style.background = 'linear-gradient(145deg, #8b0000, #654321)';
            closeBtn.style.transform = 'scale(1)';
        };
        closeBtn.onclick = () => overlay.style.display = 'none';

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Tab container
        const tabContainer = document.createElement('div');
        tabContainer.style.cssText = `
            background: linear-gradient(135deg, #2d2d2d, #1a1a1a);
            border-bottom: 2px solid #b8860b;
            padding: 0;
            display: flex;
            justify-content: center;
        `;

        // Create tabs
        const tabs = [
            { id: 'manage-tab', label: 'Manage Prompts', active: true },
            { id: 'import-tab', label: 'Import/Export', active: false }
        ];

        tabs.forEach((tab, index) => {
            const tabBtn = document.createElement('button');
            tabBtn.id = tab.id;
            tabBtn.textContent = tab.label;
            tabBtn.style.cssText = `
                background: ${tab.active ? 'linear-gradient(145deg, #a0522d, #8b0000)' : 'linear-gradient(145deg, #3d3d3d, #2d2d2d)'};
                color: ${tab.active ? '#fff' : '#ccc'};
                border: none;
                padding: 15px 30px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                border-radius: ${index === 0 ? '0' : '0'} ${index === tabs.length - 1 ? '0' : '0'} 0 0;
                border-bottom: 3px solid ${tab.active ? '#b8860b' : 'transparent'};
                margin: 0 2px;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
                box-shadow: ${tab.active ? '0 -2px 8px rgba(184, 134, 11, 0.3)' : 'none'};
            `;

            tabBtn.onclick = () => switchTab(tab.id);
            tabContainer.appendChild(tabBtn);
        });

        header.append(title, closeBtn);

        // Content area with tabs
        const content = document.createElement('div');
        content.id = 'prompt-content';
        content.style.cssText = `
            flex: 1;
            background: linear-gradient(145deg, #1a1a1a, #2d2d2d);
            overflow-y: auto;
            position: relative;
        `;

        // Tab content containers
        const manageContent = document.createElement('div');
        manageContent.id = 'manage-content';
        manageContent.style.cssText = `
            padding: 20px;
            display: block;
        `;

        const importContent = document.createElement('div');
        importContent.id = 'import-content';
        importContent.style.cssText = `
            padding: 40px;
            display: none;
            text-align: center;
        `;

        // Import/Export section
        importContent.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto;">
                <h2 style="color: #b8860b; font-size: 24px; margin-bottom: 30px; text-align: center;">Import & Export Options</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div id="import-section" style="background: linear-gradient(145deg, #2d2d2d, #1a1a1a); padding: 25px; border-radius: 15px; border: 2px solid #b8860b; text-align: center;">
                        <h3 style="color: #a0522d; margin-bottom: 15px;">Import</h3>
                        <button id="import-json-btn" style="width: 100%; margin-bottom: 10px; padding: 12px; background: linear-gradient(145deg, #8b0000, #654321); color: white; border: 1px solid #b8860b; border-radius: 8px; cursor: pointer; transition: all 0.3s ease;">Import JSON</button>
                        <button id="import-file-btn" style="width: 100%; padding: 12px; background: linear-gradient(145deg, #8b0000, #654321); color: white; border: 1px solid #b8860b; border-radius: 8px; cursor: pointer; transition: all 0.3s ease;">Import .md/.txt</button>
                    </div>
                    <div style="background: linear-gradient(145deg, #2d2d2d, #1a1a1a); padding: 25px; border-radius: 15px; border: 2px solid #b8860b; text-align: center;">
                        <h3 style="color: #a0522d; margin-bottom: 15px;">Export</h3>
                        <button id="export-json-btn" style="width: 100%; padding: 12px; background: linear-gradient(145deg, #8b0000, #654321); color: white; border: 1px solid #b8860b; border-radius: 8px; cursor: pointer; transition: all 0.3s ease;">Export JSON</button>
                    </div>
                </div>
            </div>
        `;

        content.appendChild(manageContent);
        content.appendChild(importContent);

        container.append(header, tabContainer, content);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // Add event listeners for import/export buttons
        document.getElementById('import-json-btn').onclick = importData;
        document.getElementById('export-json-btn').onclick = exportData;
        document.getElementById('import-file-btn').onclick = importFile;

        return overlay;
    }

    // Switch tab function
    function switchTab(activeTabId) {
        // Update tab buttons
        document.querySelectorAll('#prompt-manager-overlay button[id$="-tab"]').forEach(btn => {
            const isActive = btn.id === activeTabId;
            btn.style.background = isActive ? 'linear-gradient(145deg, #a0522d, #8b0000)' : 'linear-gradient(145deg, #3d3d3d, #2d2d2d)';
            btn.style.color = isActive ? '#fff' : '#ccc';
            btn.style.borderBottom = `3px solid ${isActive ? '#b8860b' : 'transparent'}`;
            btn.style.boxShadow = isActive ? '0 -2px 8px rgba(184, 134, 11, 0.3)' : 'none';
        });

        // Show/hide content
        document.getElementById('manage-content').style.display = activeTabId === 'manage-tab' ? 'block' : 'none';
        document.getElementById('import-content').style.display = activeTabId === 'import-tab' ? 'block' : 'none';
    }

    // Create button helper
    function createButton(text, onclick) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
            padding: 12px 24px;
            background: linear-gradient(145deg, #a0522d, #8b0000);
            color: #fff;
            border: 2px solid #b8860b;
            border-radius: 10px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            position: relative;
            overflow: hidden;
        `;

        // Add shine effect
        const shine = document.createElement('div');
        shine.style.cssText = `
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s ease;
        `;
        btn.appendChild(shine);

        btn.onmouseover = () => {
            btn.style.background = 'linear-gradient(145deg, #8b0000, #654321)';
            btn.style.transform = 'translateY(-2px) scale(1.05)';
            btn.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)';
            shine.style.left = '100%';
        };
        btn.onmouseout = () => {
            btn.style.background = 'linear-gradient(145deg, #a0522d, #8b0000)';
            btn.style.transform = 'translateY(0) scale(1)';
            btn.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
            shine.style.left = '-100%';
        };
        btn.onclick = onclick;
        return btn;
    }

    // Render the content
    function renderContent() {
        const content = document.getElementById('manage-content');
        if (!content) return;

        // Clear and rebuild content
        content.innerHTML = '';

        // Add toolbar to manage content
        const toolbar = document.createElement('div');
        toolbar.style.cssText = `
            padding: 20px;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            justify-content: center;
            background: linear-gradient(135deg, #2d2d2d, #1a1a1a);
            border-bottom: 2px solid #b8860b;
            margin-bottom: 20px;
        `;

        // Create buttons
        const addPromptBtn = createButton('Add Prompt', addPrompt);
        const addCategoryBtn = createButton('Add Category', addCategory);

        toolbar.append(addPromptBtn, addCategoryBtn);
        content.appendChild(toolbar);

        // Create main content area
        const mainContent = document.createElement('div');
        mainContent.style.cssText = `
            padding: 0 20px 20px 20px;
        `;

        // Debug log
        console.log('Rendering content. Categories:', Object.keys(promptData.categories).length, 'Prompts:', promptData.prompts.length);

        // Group prompts by category
        const categorizedPrompts = {};

        // Initialize categories
        Object.keys(promptData.categories).forEach(catId => {
            categorizedPrompts[catId] = [];
        });

        // Add uncategorized
        categorizedPrompts['uncategorized'] = [];

        // Sort prompts into categories
        promptData.prompts.forEach(prompt => {
            const categoryId = prompt.categoryId || 'uncategorized';
            if (!categorizedPrompts[categoryId]) {
                categorizedPrompts[categoryId] = [];
            }
            categorizedPrompts[categoryId].push(prompt);
        });

        // If no categories and no prompts, show welcome message
        const totalPrompts = promptData.prompts.length;
        const totalCategories = Object.keys(promptData.categories).length;

        if (totalPrompts === 0 && totalCategories === 0) {
            const welcomeMsg = document.createElement('div');
            welcomeMsg.style.cssText = `
                text-align: center;
                padding: 60px 20px;
                color: #b8860b;
                background: linear-gradient(145deg, #2d2d2d, #1a1a1a);
                border-radius: 15px;
                border: 2px solid #b8860b;
                margin: 20px;
            `;
            welcomeMsg.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 20px;">🎯</div>
                <h2 style="margin: 0 0 10px 0; color: #b8860b;">Welcome to LLM Prompt Manager!</h2>
                <p style="margin: 0; color: #ccc;">Start by adding your first prompt or category using the buttons above.</p>
            `;
            mainContent.appendChild(welcomeMsg);
        } else {
            // Render categories as accordions
            let hasContent = false;
            Object.keys(categorizedPrompts).forEach((categoryId, index) => {
                const categoryName = categoryId === 'uncategorized' ? 'Uncategorized' :
                                     (promptData.categories[categoryId] || 'Unknown Category');

                // Only show categories that exist in our data or have prompts
                if (categoryId === 'uncategorized' || promptData.categories[categoryId] || categorizedPrompts[categoryId].length > 0) {
                    const accordion = createAccordion(categoryId, categoryName, categorizedPrompts[categoryId], index === 0);
                    mainContent.appendChild(accordion);
                    hasContent = true;
                }
            });

            if (!hasContent) {
                const noContentMsg = document.createElement('div');
                noContentMsg.style.cssText = `
                    text-align: center;
                    padding: 40px 20px;
                    color: #888;
                    background: linear-gradient(145deg, #333, #2a2a2a);
                    border-radius: 10px;
                    border: 1px solid #444;
                    margin: 20px;
                `;
                noContentMsg.innerHTML = `
                    <div style="font-size: 36px; margin-bottom: 15px;">📝</div>
                    <p style="margin: 0; font-style: italic;">No prompts found. Add some using the buttons above!</p>
                `;
                mainContent.appendChild(noContentMsg);
            }
        }

        content.appendChild(mainContent);
    }

    // Create prompt element
    function createPromptElement(prompt) {
        const div = document.createElement('div');
        div.style.cssText = `
            background: linear-gradient(145deg, #333, #2a2a2a);
            border: 2px solid #b8860b;
            border-radius: 12px;
            margin-bottom: 15px;
            padding: 20px;
            box-shadow:
                0 6px 12px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        `;

        // Hover effect
        div.onmouseover = () => {
            div.style.transform = 'translateY(-2px)';
            div.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
        };
        div.onmouseout = () => {
            div.style.transform = 'translateY(0)';
            div.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
        };

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #444;
        `;

        const name = document.createElement('h4');
        name.textContent = prompt.name;
        name.style.cssText = `
            margin: 0;
            color: #b8860b;
            font-size: 18px;
            font-weight: 600;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        `;

        const actions = document.createElement('div');
        actions.style.cssText = `
            display: flex;
            gap: 8px;
        `;

        const editBtn = createButton('Edit', () => editPrompt(prompt));
        editBtn.style.cssText += `
            padding: 6px 12px;
            font-size: 11px;
            background: linear-gradient(145deg, #228B22, #006400);
            border: 1px solid #32CD32;
        `;

        const copyBtn = createButton('Copy', () => copyToClipboard(prompt.content));
        copyBtn.style.cssText += `
            padding: 6px 12px;
            font-size: 11px;
            background: linear-gradient(145deg, #4682B4, #191970);
            border: 1px solid #87CEEB;
        `;

        const deleteBtn = createButton('Delete', () => deletePrompt(prompt.id));
        deleteBtn.style.cssText += `
            padding: 6px 12px;
            font-size: 11px;
            background: linear-gradient(145deg, #DC143C, #8B0000);
            border: 1px solid #FF6347;
        `;

        actions.append(editBtn, copyBtn, deleteBtn);

        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(145deg, #1a1a1a, #0d0d0d);
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #444;
            white-space: pre-wrap;
            max-height: 250px;
            overflow-y: auto;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.5;
            word-wrap: break-word;
            word-break: break-word;
            color: #e0e0e0;
            text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
        `;

        // Custom scrollbar for content
        content.style.cssText += `
            scrollbar-width: thin;
            scrollbar-color: #b8860b #333;
        `;

        content.textContent = prompt.content;

        header.append(name, actions);
        div.append(header, content);

        return div;
    }

    // Add new prompt
    function addPrompt() {
        const name = prompt('Enter prompt name:');
        if (!name) return;

        const content = prompt('Enter prompt content:');
        if (!content) return;

        // Enhanced category selection with option to create new
        let categoryId = null;
        const categories = Object.keys(promptData.categories);

        if (categories.length > 0) {
            const categoryOptions = categories.map(id => `${id}: ${promptData.categories[id]}`).join('\n');
            const selection = prompt(`Choose an option:\n1. Leave in "Uncategorized"\n2. Select existing category\n3. Create new category\n\nExisting categories:\n${categoryOptions}\n\nEnter: 1, 2, 3, or category ID:`);

            if (selection === '2') {
                const selectedCategory = prompt('Enter the category ID from the list above:');
                if (selectedCategory && promptData.categories[selectedCategory]) {
                    categoryId = selectedCategory;
                }
            } else if (selection === '3') {
                const newCategoryName = prompt('Enter new category name:');
                if (newCategoryName) {
                    const newCategoryId = generateId();
                    promptData.categories[newCategoryId] = newCategoryName;
                    categoryId = newCategoryId;
                }
            } else if (selection && promptData.categories[selection]) {
                categoryId = selection;
            }
        } else {
            const createCategory = confirm('No categories exist. Would you like to create one for this prompt?');
            if (createCategory) {
                const newCategoryName = prompt('Enter category name:');
                if (newCategoryName) {
                    const newCategoryId = generateId();
                    promptData.categories[newCategoryId] = newCategoryName;
                    categoryId = newCategoryId;
                }
            }
        }

        const newPrompt = {
            id: generateId(),
            name: name,
            content: content,
            categoryId: categoryId,
            createdAt: new Date().toISOString()
        };

        promptData.prompts.push(newPrompt);
        saveData();
        renderContent();
        console.log('Added prompt:', newPrompt);
    }

    // Edit prompt
    function editPrompt(prompt) {
        const newName = prompt('Enter new name:', prompt.name);
        if (!newName) return;

        const newContent = prompt('Enter new content:', prompt.content);
        if (!newContent) return;

        const promptIndex = promptData.prompts.findIndex(p => p.id === prompt.id);
        if (promptIndex !== -1) {
            promptData.prompts[promptIndex].name = newName;
            promptData.prompts[promptIndex].content = newContent;
            saveData();
            renderContent();
        }
    }

    // Delete prompt
    function deletePrompt(promptId) {
        if (!confirm('Are you sure you want to delete this prompt?')) return;

        promptData.prompts = promptData.prompts.filter(p => p.id !== promptId);
        saveData();
        renderContent();
    }

    // Add category
    function addCategory() {
        const name = prompt('Enter category name:');
        if (!name) return;

        const id = generateId();
        promptData.categories[id] = name;
        saveData();
        renderContent();
        console.log('Added category:', {id, name});
    }

    // Delete category
    function deleteCategory(categoryId) {
        if (!confirm('Are you sure you want to delete this category? Prompts will be moved to uncategorized.')) return;

        // Move prompts to uncategorized
        promptData.prompts.forEach(prompt => {
            if (prompt.categoryId === categoryId) {
                prompt.categoryId = null;
            }
        });

        delete promptData.categories[categoryId];
        saveData();
        renderContent();
    }

    // Export data
    function exportData() {
        const dataStr = JSON.stringify(promptData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'llm-prompts-export.json';
        a.click();

        URL.revokeObjectURL(url);
    }

    // Import data
    function importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (confirm('This will replace all current data. Continue?')) {
                        promptData = imported;
                        saveData();
                        renderContent();
                        alert('Data imported successfully!');
                    }
                } catch (error) {
                    alert('Error importing data: ' + error.message);
                }
            };
            reader.readAsText(file);
        };

        input.click();
    }

    // Import file (.md/.txt)
    function importFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.txt';

        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                const name = prompt('Enter name for this prompt:', file.name.replace(/\.[^/.]+$/, ""));
                if (!name) return;

                // Category selection with option to create new
                let categoryId = null;
                const categories = Object.keys(promptData.categories);

                if (categories.length > 0) {
                    const categoryOptions = categories.map(id => `${id}: ${promptData.categories[id]}`).join('\n');
                    const selection = prompt(`Choose an option:\n1. Leave in "Uncategorized"\n2. Select existing category\n3. Create new category\n\nExisting categories:\n${categoryOptions}\n\nEnter: 1, 2, 3, or category ID:`);

                    if (selection === '2') {
                        const selectedCategory = prompt('Enter the category ID from the list above:');
                        if (selectedCategory && promptData.categories[selectedCategory]) {
                            categoryId = selectedCategory;
                        }
                    } else if (selection === '3') {
                        const newCategoryName = prompt('Enter new category name:');
                        if (newCategoryName) {
                            const newCategoryId = generateId();
                            promptData.categories[newCategoryId] = newCategoryName;
                            categoryId = newCategoryId;
                        }
                    } else if (selection && promptData.categories[selection]) {
                        categoryId = selection;
                    }
                } else {
                    const createCategory = confirm('No categories exist. Would you like to create one for this prompt?');
                    if (createCategory) {
                        const newCategoryName = prompt('Enter category name:');
                        if (newCategoryName) {
                            const newCategoryId = generateId();
                            promptData.categories[newCategoryId] = newCategoryName;
                            categoryId = newCategoryId;
                        }
                    }
                }

                const newPrompt = {
                    id: generateId(),
                    name: name,
                    content: content,
                    categoryId: categoryId,
                    createdAt: new Date().toISOString()
                };

                promptData.prompts.push(newPrompt);
                saveData();
                renderContent();
                alert('File imported successfully!');
            };
            reader.readAsText(file);
        };

        input.click();
    }

    // Copy to clipboard
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        }).catch(() => {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('Copied to clipboard!');
        });
    }

    // Create right-click context menu
    function createContextMenu() {
        const menu = document.createElement('div');
        menu.id = 'prompt-context-menu';
        menu.style.cssText = `
            position: fixed;
            background: linear-gradient(145deg, #2d2d2d, #1a1a1a);
            border: 2px solid #b8860b;
            border-radius: 8px;
            box-shadow:
                0 8px 24px rgba(0, 0, 0, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            z-index: 10001;
            display: none;
            min-width: 240px;
            max-width: 320px;
            max-height: 400px;
            overflow-y: auto;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 13px;
            backdrop-filter: blur(8px);
            transition: all 0.2s ease;
        `;

        // Custom scrollbar for menu
        const style = document.createElement('style');
        style.textContent += `
            #prompt-context-menu::-webkit-scrollbar {
                width: 6px;
            }

            #prompt-context-menu::-webkit-scrollbar-track {
                background: rgba(45, 45, 45, 0.3);
                border-radius: 3px;
            }

            #prompt-context-menu::-webkit-scrollbar-thumb {
                background: #b8860b;
                border-radius: 3px;
            }

            #prompt-context-menu::-webkit-scrollbar-thumb:hover {
                background: #8b6914;
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(menu);
        return menu;
    }

    // Show context menu
    function showContextMenu(e) {
        e.preventDefault();

        // Check if the default context menu should be shown instead
        const target = e.target;
        const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        const hasSelection = window.getSelection().toString().length > 0;

        // If it's a text input or has selection, let the default menu show but add our options
        if (isTextInput || hasSelection) {
            addPromptManagerToDefaultMenu(e);
            return;
        }

        const menu = document.getElementById('prompt-context-menu');
        menu.innerHTML = '';
        menu.style.display = 'block';

        // Position menu with taskbar awareness
        const viewportHeight = window.innerHeight;
        const taskbarHeight = 60; // Approximate taskbar height
        const maxTop = viewportHeight - taskbarHeight - 20; // 20px margin

        let menuTop = e.pageY;
        let menuLeft = e.pageX;

        // Adjust if menu would be too low
        setTimeout(() => {
            const menuHeight = menu.offsetHeight;
            if (menuTop + menuHeight > maxTop) {
                menuTop = Math.max(10, maxTop - menuHeight);
            }

            // Adjust horizontal position if needed
            const menuWidth = menu.offsetWidth;
            const viewportWidth = window.innerWidth;
            if (menuLeft + menuWidth > viewportWidth - 20) {
                menuLeft = Math.max(10, viewportWidth - menuWidth - 20);
            }

            menu.style.top = menuTop + 'px';
            menu.style.left = menuLeft + 'px';
        }, 10);

        // Manager option
        const managerItem = document.createElement('div');
        managerItem.innerHTML = '🎯 <strong>Open Prompt Manager</strong>';
        managerItem.style.cssText = `
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 2px solid #b8860b;
            font-weight: 600;
            background: linear-gradient(135deg, #a0522d, #8b0000);
            color: #fff;
            text-align: center;
            transition: all 0.2s ease;
            font-size: 13px;
        `;
        managerItem.onmouseover = () => {
            managerItem.style.background = 'linear-gradient(135deg, #8b0000, #654321)';
        };
        managerItem.onmouseout = () => {
            managerItem.style.background = 'linear-gradient(135deg, #a0522d, #8b0000)';
        };
        managerItem.onclick = () => {
            document.getElementById('prompt-manager-overlay').style.display = 'block';
            renderContent();
            menu.style.display = 'none';
        };
        menu.appendChild(managerItem);

        // Group prompts by category
        const categorizedPrompts = {};

        // Initialize categories
        Object.keys(promptData.categories).forEach(catId => {
            categorizedPrompts[catId] = [];
        });
        categorizedPrompts['uncategorized'] = [];

        // Sort prompts into categories
        promptData.prompts.forEach(prompt => {
            const categoryId = prompt.categoryId || 'uncategorized';
            if (!categorizedPrompts[categoryId]) {
                categorizedPrompts[categoryId] = [];
            }
            categorizedPrompts[categoryId].push(prompt);
        });

        // Add categories and prompts to menu
        let hasPrompts = false;
        Object.keys(categorizedPrompts).forEach(categoryId => {
            const categoryName = categoryId === 'uncategorized' ? 'Uncategorized' :
                                 (promptData.categories[categoryId] || 'Unknown Category');

            if (categorizedPrompts[categoryId].length === 0) return;

            hasPrompts = true;

            // Category header
            const categoryItem = document.createElement('div');
            categoryItem.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span><strong>📁 ${categoryName}</strong></span>
                    <span style="background: rgba(184, 134, 11, 0.2); padding: 2px 6px; border-radius: 10px; font-size: 10px;">${categorizedPrompts[categoryId].length}</span>
                </div>
            `;
            categoryItem.style.cssText = `
                padding: 8px 16px;
                background: linear-gradient(135deg, #444, #333);
                border-bottom: 1px solid #555;
                color: #b8860b;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            `;
            menu.appendChild(categoryItem);

            // Sort and add prompts
            const sortedPrompts = categorizedPrompts[categoryId].sort((a, b) =>
                a.name.toLowerCase().localeCompare(b.name.toLowerCase())
            );

            sortedPrompts.forEach((prompt, index) => {
                const promptItem = document.createElement('div');

                // Truncate long names
                const displayName = prompt.name.length > 35 ? prompt.name.substring(0, 32) + '...' : prompt.name;

                promptItem.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                        <span style="color: #b8860b; flex-shrink: 0;">📝</span>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${displayName}</div>
                            <div style="font-size: 10px; opacity: 0.6; color: #999;">${prompt.content.length} chars</div>
                        </div>
                    </div>
                `;
                promptItem.style.cssText = `
                    padding: 8px 16px 8px 24px;
                    cursor: pointer;
                    color: #e0e0e0;
                    transition: all 0.2s ease;
                    border-bottom: ${index === sortedPrompts.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.1)'};
                    font-size: 12px;
                    line-height: 1.3;
                `;

                promptItem.onmouseover = () => {
                    promptItem.style.background = 'linear-gradient(90deg, rgba(160, 82, 45, 0.3), transparent)';
                    promptItem.style.color = '#fff';
                    promptItem.style.paddingLeft = '28px';
                };
                promptItem.onmouseout = () => {
                    promptItem.style.background = 'transparent';
                    promptItem.style.color = '#e0e0e0';
                    promptItem.style.paddingLeft = '24px';
                };
                promptItem.onclick = () => {
                    copyToClipboard(prompt.content);
                    menu.style.display = 'none';
                };
                menu.appendChild(promptItem);
            });
        });

        if (!hasPrompts) {
            const emptyItem = document.createElement('div');
            emptyItem.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 24px; margin-bottom: 8px;">📝</div>
                    <div style="color: #888; font-size: 12px; margin-bottom: 4px;">No prompts available</div>
                    <div style="color: #666; font-size: 10px;">Click 'Open Prompt Manager' to add some!</div>
                </div>
            `;
            emptyItem.style.cssText = `
                background: linear-gradient(145deg, #333, #2a2a2a);
                margin: 8px;
                border-radius: 8px;
                border: 1px solid #444;
            `;
            menu.appendChild(emptyItem);
        }

        // Add subtle animation
        menu.style.opacity = '0';
        menu.style.transform = 'scale(0.95)';
        setTimeout(() => {
            menu.style.opacity = '1';
            menu.style.transform = 'scale(1)';
        }, 10);
    }

    // Add prompt manager option to default context menu
    function addPromptManagerToDefaultMenu(e) {
        // For now, we'll still show our custom menu but positioned better
        // This could be enhanced to integrate with the actual browser context menu
        setTimeout(() => showContextMenu(e), 100);
    }

    // Hide context menu
    function hideContextMenu() {
        const menu = document.getElementById('prompt-context-menu');
        if (menu) {
            menu.style.display = 'none';
        }
    }

    // Create floating button
    function createFloatingButton() {
        const button = document.createElement('button');
        button.id = 'prompt-manager-btn';
        button.innerHTML = '🎯';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(145deg, #a0522d, #8b0000);
            color: #fff;
            border: 3px solid #b8860b;
            cursor: pointer;
            font-size: 24px;
            z-index: 9999;
            box-shadow:
                0 8px 16px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        button.title = 'LLM Prompt Manager - Click to open or right-click anywhere for quick access';

        // Floating animation
        let floatDirection = 1;
        setInterval(() => {
            button.style.transform = `translateY(${Math.sin(Date.now() * 0.003) * 3}px)`;
        }, 50);

        button.onmouseover = () => {
            button.style.background = 'linear-gradient(145deg, #8b0000, #654321)';
            button.style.transform = 'scale(1.15) translateY(-5px)';
            button.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
        };
        button.onmouseout = () => {
            button.style.background = 'linear-gradient(145deg, #a0522d, #8b0000)';
            button.style.transform = 'scale(1) translateY(0px)';
            button.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
        };

        button.onclick = () => {
            document.getElementById('prompt-manager-overlay').style.display = 'block';
            renderContent();

            // Add click animation
            button.style.transform = 'scale(0.9)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 150);
        };

        document.body.appendChild(button);
    }

    // Initialize the script
    function init() {
        loadData();

        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1); }
            }

            @keyframes slideDown {
                from { max-height: 0; opacity: 0; }
                to { max-height: 300px; opacity: 1; }
            }

            /* Custom scrollbar styles */
            #prompt-manager-overlay *::-webkit-scrollbar {
                width: 8px;
            }

            #prompt-manager-overlay *::-webkit-scrollbar-track {
                background: #333;
                border-radius: 4px;
            }

            #prompt-manager-overlay *::-webkit-scrollbar-thumb {
                background: linear-gradient(145deg, #b8860b, #8b6914);
                border-radius: 4px;
                border: 1px solid #444;
            }

            #prompt-manager-overlay *::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(145deg, #8b6914, #b8860b);
            }

            /* Smooth transitions for all elements */
            #prompt-manager-overlay * {
                transition: all 0.3s ease;
            }

            /* Glow effect for gold elements */
            .gold-glow {
                box-shadow: 0 0 10px rgba(184, 134, 11, 0.5);
            }
        `;
        document.head.appendChild(style);

        createOverlayUI();
        createContextMenu();
        createFloatingButton();

        // Modify context menu event to be smarter
        document.addEventListener('contextmenu', (e) => {
            // Only show our custom menu if not on input fields or with text selected
            const target = e.target;
            const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
            const hasSelection = window.getSelection().toString().length > 0;

            if (!isTextInput && !hasSelection) {
                showContextMenu(e);
            }
            // Otherwise let the default context menu show
        });

        document.addEventListener('click', hideContextMenu);

        // Close context menu on scroll
        document.addEventListener('scroll', hideContextMenu);

        // Add escape key to close overlay
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const overlay = document.getElementById('prompt-manager-overlay');
                if (overlay && overlay.style.display === 'block') {
                    overlay.style.display = 'none';
                }
                hideContextMenu();
            }
        });

        // Debug log on initialization
        console.log('LLM Prompt Manager initialized. Current data:', promptData);
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();