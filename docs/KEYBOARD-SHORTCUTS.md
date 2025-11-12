# Keyboard Shortcuts Guide

## Overview

Vibe University includes comprehensive keyboard shortcuts to improve productivity and accessibility. All shortcuts work across the application and are designed to follow common conventions from popular applications.

## Global Shortcuts

### Navigation

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/⌘ + K` | Focus Chat Input | Jump to the chat input to ask questions or give commands |
| `Ctrl/⌘ + E` | Focus File Explorer | Navigate to the file explorer panel |
| `Ctrl/⌘ + P` | Focus Preview | Jump to the preview panel to see your work |
| `Ctrl/⌘ + B` | Toggle Sidebar | Show or hide the sidebar panel |

### Appearance

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/⌘ + Shift + T` | Toggle Theme | Switch between light, dark, and system theme |

### Help

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/⌘ + /` | Show Shortcuts Help | Display this keyboard shortcuts reference |
| `Escape` | Close Dialogs | Close any open modal or dialog |

## Platform-Specific Keys

- **Windows/Linux**: Use `Ctrl` key
- **macOS**: Use `⌘` (Command) key

All shortcuts are automatically adapted to your platform.

## Accessibility

All keyboard shortcuts are designed with accessibility in mind:

- **Screen Reader Announcements**: Actions are announced to screen readers
- **Keyboard-Only Navigation**: All features accessible without a mouse
- **Focus Management**: Proper focus handling for keyboard navigation
- **Visual Feedback**: Clear indication of focused elements

## Tips for Power Users

### Workflow Optimization

1. **Start with Chat** - Use `Ctrl/⌘ + K` to quickly start a new task
2. **Review Files** - Press `Ctrl/⌘ + E` to browse generated files
3. **Check Preview** - Use `Ctrl/⌘ + P` to see live results
4. **Reduce Clutter** - Toggle sidebar with `Ctrl/⌘ + B` for more space

### Common Workflows

#### Research Paper Workflow
```
1. Ctrl/⌘ + K - Start chat: "Help me write a research paper"
2. Ctrl/⌘ + E - Check generated files
3. Ctrl/⌘ + P - Preview the document
4. Ctrl/⌘ + Shift + T - Switch to dark mode for night writing
```

#### Data Analysis Workflow
```
1. Ctrl/⌘ + K - Upload and analyze data
2. Ctrl/⌘ + E - Browse generated sheets
3. Ctrl/⌘ + P - View charts and visualizations
```

## Customization (Future)

In future versions, we plan to add:
- Custom keyboard shortcut configuration
- Shortcut profiles for different workflows
- Conflict detection for extensions
- Import/export shortcut configurations

## Troubleshooting

### Shortcut Not Working

1. **Check for Conflicts**: Some browser extensions may override shortcuts
2. **Verify Focus**: Some shortcuts require specific elements to be present
3. **Browser Compatibility**: Ensure you're using a modern browser

### Common Issues

**Issue**: `Ctrl/⌘ + K` opens browser search
- **Solution**: The shortcut is intercepted before browser. If persistent, try refreshing the page.

**Issue**: Shortcuts don't work in iframe
- **Solution**: Click inside the main application area to ensure focus.

**Issue**: Theme toggle doesn't work
- **Solution**: Ensure JavaScript is enabled. Theme toggle requires client-side JS.

## Implementation Details

### For Developers

Keyboard shortcuts are implemented in `components/keyboard-shortcuts.tsx` using the global event listener pattern:

```typescript
// Example: Adding a new shortcut
if (modKey && e.key === 'n') {
  e.preventDefault()
  // Your action here
  announce('Action performed', 'polite')
}
```

### Architecture

- **Global Handler**: Single event listener on window
- **Platform Detection**: Automatic Ctrl/Cmd key detection
- **Accessibility**: Screen reader announcements via ARIA live regions
- **Performance**: Minimal overhead, no re-renders

### Adding New Shortcuts

1. Edit `components/keyboard-shortcuts.tsx`
2. Add key handler in `handleKeyDown` function
3. Update help dialog in `showShortcutsHelp` function
4. Document in this file
5. Test on both Windows/Linux and macOS

## Best Practices

### For Users

- **Learn Gradually**: Start with 2-3 shortcuts, add more over time
- **Use Help**: Press `Ctrl/⌘ + /` anytime to see available shortcuts
- **Combine with Mouse**: Shortcuts complement mouse usage, not replace it
- **Customize Your Workflow**: Find the shortcuts that work best for your tasks

### For Developers

- **Avoid Conflicts**: Check existing shortcuts before adding new ones
- **Follow Conventions**: Use standard shortcuts when possible (Ctrl+K, Ctrl+/, etc.)
- **Provide Feedback**: Always announce actions to screen readers
- **Test Cross-Platform**: Verify on Windows, macOS, and Linux

## Comparison with Other Apps

### Similar to Google Docs
- `Ctrl/⌘ + /` - Show shortcuts (same)
- `Escape` - Close dialogs (same)

### Similar to VS Code
- `Ctrl/⌘ + K` - Command palette (similar concept)
- `Ctrl/⌘ + B` - Toggle sidebar (same)
- `Ctrl/⌘ + P` - Quick open (similar)

### Similar to Notion
- `Ctrl/⌘ + Shift + T` - Theme toggle (similar)
- `Ctrl/⌘ + E` - File navigation (similar)

## Keyboard Shortcuts Quick Reference Card

```
╔════════════════════════════════════════════════════════╗
║           Vibe University Keyboard Shortcuts           ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  Navigation                                            ║
║  • Ctrl/⌘ + K ............... Focus Chat Input        ║
║  • Ctrl/⌘ + E ............... Focus File Explorer     ║
║  • Ctrl/⌘ + P ............... Focus Preview           ║
║  • Ctrl/⌘ + B ............... Toggle Sidebar          ║
║                                                        ║
║  Appearance                                            ║
║  • Ctrl/⌘ + Shift + T ....... Toggle Theme            ║
║                                                        ║
║  Help                                                  ║
║  • Ctrl/⌘ + / ............... Show Shortcuts Help     ║
║  • Escape ................... Close Dialogs           ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

## Accessibility Features

### Screen Reader Support

All keyboard shortcuts trigger screen reader announcements:
- "Chat input focused"
- "File explorer focused"
- "Preview panel focused"
- "Theme switched to dark mode"
- "Dialog closed"

### WCAG 2.1 AA Compliance

Our keyboard shortcuts meet WCAG 2.1 AA standards:
- ✅ All functionality available via keyboard
- ✅ Focus indicators visible
- ✅ No keyboard traps
- ✅ Consistent navigation order
- ✅ Skip links available

### Assistive Technology Compatibility

Tested with:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS)
- TalkBack (Android)

## Future Enhancements

Phase 3.2.1 roadmap includes:
- [ ] Customizable keyboard shortcuts
- [ ] Shortcut cheat sheet overlay
- [ ] Context-sensitive shortcuts
- [ ] Vim-mode support (advanced users)
- [ ] Shortcut recording/macros

## Feedback

Have suggestions for new shortcuts or improvements? Please:
1. Check existing shortcuts don't conflict
2. Consider accessibility implications
3. Submit via GitHub Issues or feedback form

---

**Last Updated:** November 12, 2025  
**Version:** 1.0  
**Phase:** 3.2.1 UI/UX Improvements

## References

- [Accessibility Guide](./ACCESSIBILITY.md)
- [Phase 3 Roadmap](../ROADMAP.md#phase-3-platform-optimization)
- [Keyboard Shortcuts Implementation](../components/keyboard-shortcuts.tsx)
