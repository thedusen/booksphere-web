### Task 5: Review Wizard Implementation

**AI Persona:** UI/UX and Accessibility Expert (Gemini 2.5 Pro)  
**Status:** ✅ Design Plan Completed

This document outlines the UX, accessibility, and component design for the multi-step review wizard used to finalize cataloging entries. It is designed to reduce cognitive load for the user while ensuring high data quality before an item is committed to inventory.

---

### 1. Step Structure: Grouping for Clarity and Flow

A four-step process provides a logical flow that separates distinct categories of information, preventing cognitive overload. The wizard should prepopulate fields with AI-extracted data wherever possible.

- **Step 1: Core Bibliographic Data**
  - **Content:** Title, Subtitle, Author(s), ISBN-13, Publisher, Publication Date.
  - **Rationale:** This is the foundational identity of the book. It's the first thing a user should confirm.
- **Step 2: Physical & Descriptive Details**
  - **Content:** Binding Type (Hardcover, Paperback), Jacket (Present, Not Present, Price-clipped), Edition (e.g., "First Edition," "Book Club Edition"), Printing Number, Condition, and a free-text Description/Notes field.
  - **Rationale:** This step focuses on the physical attributes of the *specific copy* being cataloged.
- **Step 3: Attributes & Commerce**
  - **Content:** Special Attributes (e.g., Signed, Inscribed, First Edition), Price, Cost, Quantity, SKU, and Location/Bin.
  - **Rationale:** This section covers the commercial aspects and unique, value-adding attributes.
- **Step 4: Review & Finalize**
  - **Content:** A read-only, condensed summary of all data entered in the previous steps.
  - **Rationale:** This is a final confirmation step to allow users to catch any errors before finalizing.

#### Notes for Implementation Agent:
-   **Main Component:** Create a parent component `ReviewWizard.tsx`. It will manage the current step state and the overall `CatalogingJob` data being edited.
-   **Stepper UI:** Use a combination of `div`s styled to look like a stepper. Dynamically apply styles for `current`, `completed`, and `disabled` states. This should be a reusable `WizardStepper.tsx` component.
-   **Step Components:** Create individual components for each step (e.g., `Step1_BibliographicData.tsx`, `Step2_PhysicalDetails.tsx`, etc.). Each step component will receive the job data and `react-hook-form` methods as props.
-   **Author Input:** For authors, implement a dynamic list where users can add or remove author fields. Each author field should be an `Input`.
-   **Data Display:** In Step 4, use `shadcn/ui`'s `Card` components to group and display the summary information for readability.

---

### 2. Navigation Pattern: Guided yet Flexible

A linear progression with the ability to revisit completed steps is the ideal pattern. This ensures a logical flow while providing flexibility.

-   **Progression:** A "Next" button is enabled only when required fields in the current step are valid.
-   **Revisiting:** Completed steps in the stepper UI are clickable, allowing the user to jump back to a previous step to make edits.
-   **Keyboard Navigation:** The entire wizard must be navigable using `Tab`. `Enter` should trigger the primary action of the current view.

#### Notes for Implementation Agent:
-   **State Management:** Use `useState` in the parent `ReviewWizard.tsx` to manage the `currentStep` index (e.g., `const [step, setStep] = useState(1)`).
-   **Buttons:** Use `shadcn/ui` `Button` components for "Next," "Back," and "Save and Close." The "Next" button's `disabled` prop will be tied to the `react-hook-form` `formState.isValid`.
-   **Accessibility:**
    -   When navigating between steps, programmatically manage focus. Use `ref.current.focus()` to move focus to the first input element of the new step.
    -   The Stepper links should be actual `<button>` elements, not just styled `div`s, to be keyboard accessible.

---

### 3. Draft Saving: Seamless and Transparent

An auto-save mechanism is non-negotiable to prevent data loss.

-   **Trigger:** Auto-save should be triggered on a **debounce after user input** and on **field blur**.
-   **User Feedback:** A subtle, persistent indicator should communicate the save status (e.g., "Unsaved changes," "Saving...," "All changes saved").
-   **Explicit Save:** A "Save and Close" button allows the user to exit and resume later.

#### Notes for Implementation Agent:
-   **Auto-Save Hook:** Use the existing `useDebounce` hook. The `useEffect` hook that watches the form data should call a `useMutation` hook from TanStack Query to update the `cataloging_jobs` record.
-   **Save Status UI:** Create a `SaveStatusIndicator.tsx` component. It will take the `isMutating`, `isSuccess`, and form `isDirty` states as props to render the appropriate text and icon.
-   **"Save and Close":** This button should trigger the same save mutation and then call the router to navigate away from the wizard.

---

### 4. Validation Flow: Immediate, Clear, and Non-Intrusive

Validation should be helpful, not punitive.

-   **Inline Validation (On Blur):** Validate fields immediately as the user leaves them.
-   **Step-Level Validation:** On "Next" click, re-validate all fields in the current step and prevent progression if any are invalid.
-   **Error Display:** Show a concise, helpful message directly below the invalid field.

#### Notes for Implementation Agent:
-   **Schema:** Use `Zod` to define validation schemas for each step. This allows for partial validation.
-   **Form Library:** Use `react-hook-form` with the `zodResolver` to connect your Zod schemas to the form.
-   **Error UI:** Use `shadcn/ui`'s `Form` components, which have built-in support for displaying error messages from `react-hook-form`.
-   **Accessibility:** Ensure each error message is linked to its corresponding input via the `aria-describedby` attribute. `react-hook-form` and `shadcn/ui` handle this well, but it should be verified.

---

### 5. Mobile Web Experience: Responsive and Touch-Friendly

The wizard must be fully responsive and usable on a mobile browser.

-   **Layout:** Collapse multi-column layouts into a single vertical column.
-   **Controls:** Ensure all touch targets are sufficiently large and spaced out.
-   **Readability:** Use responsive font sizes and maintain adequate white space.

#### Notes for Implementation Agent:
-   **CSS:** Use Tailwind CSS's responsive prefixes (e.g., `md:`, `lg:`) to adapt the layout. For example, a `div` might have `flex flex-col md:flex-row`.
-   **Stepper on Mobile:** The stepper UI should transform. On `md` screens and up, show the full stepper. On smaller screens, collapse it to a simpler text display like `"Step 2 of 4: Physical Details"`.
-   **Modals:** Any dialogs (like a "Confirm Cancel" modal) should use `shadcn/ui`'s `AlertDialog` or `Dialog` component, which are responsive by default.
-   **Testing:** Use browser development tools to test the experience on various mobile screen sizes. 