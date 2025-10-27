# RCP - Right Click Prompts

A clean, minimal Firefox extension for inserting saved prompts into text fields via right-click context menu.

## Features

- **Right-click Context Menu**: Right-click on any text field to access your saved prompts
- **Smart Text Field Detection**: Automatically detects and enhances text input fields
- **Prompt Management**: Simple popup interface to manage your prompts
- **Cross-platform Support**: Works on any website with text fields
- **File Import**: Import prompts from .txt, .md, and .json files
- **Keyboard Shortcuts**: Quick paste with Ctrl+Shift+V
- **Variable Support**: Built-in variables like {{date}}, {{time}}, {{url}}, etc.

## Installation

1. **Load in Firefox Developer Edition**:
   - Open Firefox
   - Navigate to `about:debugging`
   - Click "This Firefox" → "Load Temporary Add-on"
   - Select the `manifest.json` file from this folder

2. **For Permanent Installation**:
   - Open Firefox
   - Go to `about:addons`
   - Click the gear icon ⚙️ → "Install Add-on From File..."
   - Select the `manifest.json` file

## How to Use

### Basic Usage

1. **Add Your First Prompt**:
   - Click the RCP extension icon in your toolbar
   - Click "+ Add Prompt"
   - Enter a title, content, and category

2. **Use a Prompt**:
   - Focus on any text field (input, textarea, or contenteditable)
   - Right-click and select "RCP - Insert Prompt"
   - Choose a prompt from the submenu
   - The prompt will be inserted at your cursor position

3. **Quick Paste**:
   - Press `Ctrl+Shift+V` to quickly insert the last used prompt

### Importing Prompts

- Click the 📥 Import button in the popup
- Select a .txt, .md, or .json file
- For JSON format: `[{"title": "Name", "content": "Text", "category": "Category"}]`

### Variables

Prompts support these built-in variables:
- `{{date}}` - Current date
- `{{time}}` - Current time
- `{{datetime}}` - Current date and time
- `{{timestamp}}` - Unix timestamp
- `{{url}}` - Current page URL
- `{{title}}` - Current page title
- `{{selection}}` - Currently selected text
- `{{hostname}}` - Current domain

## Platform Support

The extension automatically detects and enhances these platforms:
- **ChatGPT** - Auto-focus prompt textarea
- **Claude AI** - Header centering, contenteditable support
- **Google Gemini** - Rich textarea support
- **DeepSeek** - Textarea enhancements
- **CivitAI** - Prompt and negative prompt fields
- **NovelAI** - Prompt field detection
- **Universal** - Works on any website

## File Structure

```
rcp-firefox-new/
├── manifest.json          # Extension manifest
├── background.js          # Background script (context menu, storage)
├── content.js            # Content script (text field detection, insertion)
├── content.css           # Content script styles
├── popup/
│   ├── popup.html        # Popup interface
│   └── popup.js          # Popup functionality
└── icons/
    ├── icon-16.svg       # 16px extension icon
    ├── icon-48.svg       # 48px extension icon
    └── icon-128.svg      # 128px extension icon
```

## Architecture

This extension follows a simple, robust architecture:

1. **Background Script** (`background.js`):
   - Manages context menus
   - Handles storage operations
   - Coordinates between popup and content scripts

2. **Content Script** (`content.js`):
   - Detects text fields on web pages
   - Handles prompt insertion
   - Provides visual feedback

3. **Popup Interface** (`popup/`):
   - Simple interface for managing prompts
   - Import/export functionality
   - Basic prompt editing

## Development

### Prerequisites

- Firefox Developer Edition or Firefox with debugging enabled
- Basic understanding of web extension development

### Testing

1. Load the extension in Firefox as described above
2. Test on the included test page: `test-page.html`
3. Try different websites to verify text field detection
4. Test context menu functionality
5. Test file import features

### Debugging

- Use Firefox's built-in debugger (`about:debugging`)
- Check the Browser Console for errors
- Extension logs are prefixed with emojis for easy identification

## Troubleshooting

### Common Issues

1. **Context menu not appearing**:
   - Make sure you're right-clicking on an editable element
   - Check that the extension is enabled in `about:addons`

2. **Prompt not inserting**:
   - Ensure the target element is focused
   - Check the browser console for errors
   - Try refreshing the page

3. **Extension not loading**:
   - Verify the manifest.json file is valid
   - Check that all required files are present
   - Try reloading the extension

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify all files are present and correctly formatted
3. Test with the provided test page first

## Contributing

This extension is designed to be simple and maintainable. When adding features:

1. **Keep it simple** - Avoid over-engineering
2. **Test thoroughly** - Verify functionality works across different sites
3. **Handle errors** - Always provide user feedback for failures
4. **Document changes** - Update this README with new features

## License

This project is open source. Feel free to use, modify, and distribute.

---

**Remember**: This extension is built to actually work, not just show "coming soon" messages. Each feature is implemented and tested before being included.