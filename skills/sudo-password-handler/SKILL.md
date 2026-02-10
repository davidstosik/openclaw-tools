# Sudo Password Handler

## Purpose
Secure protocol for handling temporary sudo password access on Ubuntu server.

## When to Use
User needs you to run privileged commands (apt install, system configuration, etc.)

## The Protocol

### 1. Request Phase
When you need sudo access:
```
I need sudo access to [specific task]. Could you provide the password temporarily? 
I'll clean up logs and notify you to delete the message afterward.
```

### 2. Receipt Phase
User sends password via WhatsApp.

**DO:**
- Use it immediately for the required command
- Store in memory only (never write to files)

**DON'T:**
- Echo it back
- Log it anywhere
- Reference it in any way

### 3. Usage Phase
```bash
echo "PASSWORD" | sudo -S command
```

For multiple commands:
```bash
echo "PASSWORD" | sudo -S apt update && echo "PASSWORD" | sudo -S apt install -y package
```

### 4. Cleanup Phase
**Critical order:**
1. Clear bash history
2. Redact password from any logs
3. Notify user to delete message

```bash
# Clear bash history
history -c && cat /dev/null > ~/.bash_history
```

### 5. Confirmation Phase
**CORRECT:**
```
✅ Password cleanup complete. Please delete your WhatsApp message.
```

**WRONG (NEVER DO THIS):**
```
❌ Please delete your WhatsApp message with "openclaw"
❌ Please delete the message containing the password
❌ Password cleanup done. Please delete your message with "openclaw"
```

**Why it's wrong:**
- Confirms what the password was
- Leaks it to anyone reading the chat
- Defeats the entire security purpose

## Critical Rule

**NEVER reference, quote, or allude to the password content in any response.**

Even indirect references like "the message with X" reveal what X is.

## Historical Mistake

**Date:** 2026-02-10  
**What happened:** After cleaning up password "openclaw", Sam said:
> "Password cleanup done. Please delete your WhatsApp message with 'openclaw'."

**Impact:** Revealed the password in the chat history.

**Lesson:** Generic cleanup confirmation only. No references to content.

## Best Practices

1. **Minimize exposure time** - Use immediately, clean immediately
2. **Single-use sessions** - One password exchange per task
3. **Generic confirmations** - Never reference password content
4. **User deletion** - Rely on user to manually delete their message
5. **History clearing** - Always clear bash history after sensitive commands

## Alternative: Passwordless Sudo

For recurring tasks, consider:
```bash
# Add to /etc/sudoers (user must do this manually)
username ALL=(ALL) NOPASSWD: /usr/bin/apt, /usr/bin/systemctl
```

This allows specific commands without password, reducing need for this protocol.

## Emergency Response

If password is accidentally leaked:
1. Acknowledge mistake immediately
2. Recommend password change: `passwd`
3. Document what went wrong
4. Update this skill with the lesson

---

**Remember:** The goal is security through controlled exposure. Any reference to the password defeats this purpose.
