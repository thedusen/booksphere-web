### Task 5: Review Wizard – UI/UX & Accessibility Implementation Guide

**AI Persona:** UI/UX and Accessibility (a11y) Expert

**Purpose:** This document translates the `TASK_5_ARCHITECTURE_UPDATE_PLAN.md` into an actionable UI/UX and accessibility roadmap for the coding agent. It provides concrete solutions for implementing the required features while ensuring a seamless, intuitive, and accessible user experience.

---

## 1. General Principles: A Foundation for Quality

Before implementing specific components, adhere to these global principles:

*   **Stateful Components**: Every component that fetches data (`Attribute Picker`, `Location Autocomplete`, etc.) must have clear `loading`, `error`, and `empty` states.
    *   **Loading**: Use `shadcn/ui` **Skeleton** components to mimic the final layout, preventing content-shifting and reducing perceived latency.
    *   **Error**: Use the **Alert** component (with `variant="destructive"`) to display a user-friendly error message and a retry action if applicable.
*   **Responsiveness**: The wizard must be fully responsive. For complex interactions like the attribute picker or edition matching, use a **Sheet** component on mobile viewports to provide a focused, full-screen experience.
*   **Accessibility First**: All custom components must be fully keyboard navigable. Use `aria-live` regions for dynamic updates (like search results) and ensure all interactive elements have clear focus states.

---

## 2. Component-Specific Implementation Guide

This section details the UI/UX for each new feature outlined in the architectural plan.

### A. Contributor & Publisher Location Autocomplete

*   **Component**: Use the `shadcn/ui` **Combobox** (which combines `Popover`, `Command`, and `Input`).
*   **User Flow**:
    1.  User types into the input.
    2.  A list of matching existing contributors/locations appears after a 300ms debounce.
    3.  The user can select an existing entry or continue typing to create a new one.
    4.  If the search fails or the network is slow, **the component must still function as a standard text input**, allowing free-form entry.
*   **Accessibility**: The `Combobox` is highly accessible, but ensure the `aria-label` clearly describes its purpose (e.g., "Search or add an illustrator").

### B. Edition Matching Suggestions

*   **Trigger**: This flow should be automatically triggered after the user completes Step 1 (or when both ISBN and Title fields are valid).
*   **Presentation**: Display the results in a dedicated modal dialog or as an inline step before proceeding to Step 2.
*   **Component**:
    *   Use a `Dialog` component to present the matches.
    *   Inside, display up to 3 potential matches as `Card` components.
    *   Each `Card` should show key differentiating data: Cover Image, Title, Publisher, and Publication Year.
*   **User Actions**:
    1.  A prominent primary `Button` on each card: "Select This Edition".
    2.  A clear secondary `Button` at the bottom of the dialog: "None of these match, Create a New Edition". This is the user's explicit override.

---

## 3. Addressing Architectural Concerns (from Section #7)

This is the most critical section for ensuring a high-quality user experience. Here are the official UI/UX solutions for the risks identified by the architect.

### **Concern 1: Attribute Picker Overwhelm**

The architectural plan correctly identifies that exposing 53 attributes at once would be overwhelming.

*   **Solution: Progressive Disclosure with a "Command Picker"**
    *   **Trigger**: Use a single `Button` with the label "Add Attributes". As attributes are selected, update the button to "Edit Attributes (3 selected)".
    *   **Interaction**:
        1.  Clicking the button opens a `Popover`.
        2.  Inside the `Popover`, use the `Command` component.
        3.  Use `CommandGroup` to group attributes by their category (e.g., "Binding," "Provenance"). This makes the list scannable.
        4.  Include a `CommandInput` at the top for fast searching.
        5.  As the user selects items, they are instantly added to a list of `Badge` components displayed below the trigger button. Each `Badge` has an `(x)` to remove it.
*   **Benefit**: This design hides complexity by default but makes all 53 attributes easily discoverable through either browsing or searching, thus minimizing cognitive load.

### **Concern 2: Autocomplete Latency & Failure**

The architect noted that network issues could degrade the UX for location/contributor autocomplete.

*   **Solution: Graceful Degradation**
    *   The `Combobox` must **not** be exclusively a selection tool. It is fundamentally an `Input` that is enhanced with search.
    *   If the async search fails, display a small `Alert` below the input ("Could not load suggestions.") but **do not block the user**.
    *   The user can always type a value and tab away. The form validation logic must accept either a selected entity `ID` or a raw `string`. This is a critical requirement for offline-first resilience.

### **Concern 3: Edition Matching Confidence & Accuracy**

False positives in edition matching can corrupt inventory data. The UI must instill confidence and provide a clear "escape hatch."

*   **Solution: Clarity and Control**
    1.  **Visual Confidence Score**: On each result `Card`, add a `Badge` to indicate match quality (e.g., `variant="success"` for "High Confidence" on an ISBN match, `variant="warning"` for "Potential Match" on a title match).
    2.  **Highlight Differences**: If possible, subtly highlight the data points that differ from the user's entry.
    3.  **Prioritize User Override**: The "Create a New Edition" button must be just as prominent as the selection options. The dialog title should be "Is this your book?" to frame it as a question, not a command.

---

### Conclusion

By implementing these UI/UX patterns, the development team can successfully translate the architectural plan into a user-friendly, accessible, and powerful review wizard. This approach directly mitigates the identified risks and ensures the final product is both robust and a pleasure to use. 