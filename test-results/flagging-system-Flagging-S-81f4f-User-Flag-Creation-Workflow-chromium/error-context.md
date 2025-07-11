# Page snapshot

```yaml
- region "Notifications alt+T"
- text: Booksphere Sign in to your account. Email
- textbox "Email": testuser@email.com
- text: Password
- textbox "Password": testuser
- alert: Invalid login credentials
- button "Sign In"
- alert
- button "Open Next.js Dev Tools":
  - img
- iframe
```