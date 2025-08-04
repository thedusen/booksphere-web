# Page snapshot

```yaml
- region "Notifications alt+T"
- text: Booksphere Sign in to your account. Email
- textbox "Email": testuser@email.com
- text: Password
- textbox "Password": testuser
- alert: Failed to fetch
- button "Sign In"
- alert
- button "Open Next.js Dev Tools":
  - img
- button "Open issues overlay": 1 Issue
- button "Collapse issues badge":
  - img
- iframe
```