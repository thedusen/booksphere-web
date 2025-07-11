# Cataloging Jobs Dashboard: UX & Accessibility Design

This document provides a comprehensive UX, UI, and Accessibility design plan for the Booksphere Cataloging Jobs Dashboard. The design prioritizes efficiency, scalability, and accessibility, adhering to the principles of the project's `shadcn/ui` design system.

## 1. Overall Layout & Information Architecture

The interface is structured into two main sections: a persistent header for controls and a responsive main content area for the job list.

*   **Header**: Contains global actions and filters. It remains visible while scrolling.
*   **Main Content**: Displays the list of jobs. It uses a `DataTable` on larger screens and switches to a `Card`-based layout on mobile devices.

---

## 2. Dashboard Header: Filters & Bulk Actions

The header is the primary control center for the dashboard.

### Default State (No items selected)
*   **Page Title**: `h1` element, "Cataloging Jobs".
*   **Primary Filters (Tabs)**: A `Tabs` component for the most common filter: **Status**. This provides immediate, one-click access to different workflow stages.
    *   Tabs: `All`, `Pending`, `Processing`, `Completed`, `Finalized`
    *   **UX Enhancement**: Each tab should display a count of the jobs in that state, e.g., `Completed (128)`.
*   **Secondary Controls**: A row below the tabs containing:
    1.  **Search Input**: A search field with a placeholder like "Search by title, author, or ISBN...". It should be debounced to avoid excessive API calls.
    2.  **Filter Dropdowns**: `Select` components for less-frequently used filters:
        *   **Source**: Filters by `isbn_scan`, `manual_isbn`, `image_capture`.
        *   **Date Range**: A `DatePicker` with `DateRange` and presets like "Last 7 days", "Last 30 days".
    3.  **Clear Filters Button**: Appears only when filters are active.

### Bulk Action State (Items selected)
When one or more jobs are selected in the table, the header transforms to show contextual actions:
*   The filter controls are replaced by a message: **"☑️ 12 items selected"**.
*   **Action Buttons**:
    *   `Retry Failed`: Enabled only if selectable jobs have an error status.
    *   `Delete`: A destructive action button.
    *   `Deselect all`: A link button to clear selection.
*   **Accessibility**: This state change must be announced to screen readers using an `aria-live` region.

---

## 3. Main Content: Displaying Jobs

### A. Desktop View: The `DataTable`

For screens wider than a tablet, a `DataTable` built with TanStack Table provides the density and power needed for at-scale management.

**Columns:**
1.  **Checkbox**: For bulk selection.
2.  **Job**: The primary identifier.
    *   **Content**: Displays a small cover thumbnail (if available from `extracted_data`), the book title, and the author. If no title is available, it shows the source identifier (e.g., `ISBN: 978-3-16-148410-0` or "Image Capture").
    *   **Sortable**: Yes.
3.  **Status**: A `Badge` component for clear visual state.
    *   **Content**: Text-based status (`Pending`, `Processing`).
    *   **Accessibility**: Badges must use color as an enhancement, not the sole indicator. The text label ensures accessibility.
    *   **Sortable**: Yes.
4.  **Source**: An icon paired with text.
    *   **Content**: e.g., `<scan_icon> ISBN Scan`.
    *   **Sortable**: Yes.
5.  **Created**: A user-friendly relative timestamp.
    *   **Content**: "2 hours ago". The full timestamp is available in a tooltip on hover.
    *   **Sortable**: Yes.
6.  **Actions**: A dropdown menu for row-level actions.
    *   A `DropdownMenu` (`...` icon) containing:
        *   `Review`: The primary action, navigates to the review wizard.
        *   `View Details`: Opens a modal or side sheet with all job data.
        *   `Delete`: A destructive action, styled in red, which triggers a confirmation `AlertDialog`.

**Pagination**: Standard pagination controls (`First`, `Previous`, `Next`, `Last`, and page number input) will be placed below the table.

### B. Mobile View: The `Card` List

On smaller screens, the table collapses into a list of `Card` components for optimal usability.

*   **Card Layout**: Each card represents one job.
    *   **Top Section**: `Status` badge and relative `Created` time.
    *   **Middle Section**: Cover thumbnail (if available) next to the `Title` and `Author`.
    *   **Bottom Section**: Primary `Action` button ("Review") and a `DropdownMenu` for secondary actions.
*   **Filtering**: The header filters collapse into a single "Filter" button which opens a `Sheet` (drawer) containing all filter options.
*   **Bulk Actions**: Long-pressing a card enters a selection mode. Checkboxes appear on each card, and a sticky header/footer appears with the bulk action buttons.

---

## 4. Empty & Loading States

### Loading State
When data is being fetched, the table/card area will display `Skeleton` components matching the layout. This reduces perceived load time and layout shift.

### Empty States
1.  **No Jobs Yet (Initial State)**:
    *   **Visual**: A large, centered icon (e.g., an empty box or file icon).
    *   **Heading**: `h2`, "Your cataloging queue is empty."
    *   **Message**: "Jobs created from the Booksphere mobile app will appear here, ready for your review and finalization."
    *   **Action**: A `Button` linking to a help document: "Learn How to Catalog on Mobile".

2.  **No Results for Filters**:
    *   **Visual**: A centered search icon.
    *   **Heading**: `h2`, "No jobs found."
    *   **Message**: "Your search and filter combination returned no results."
    *   **Action**: A `Button` to "Clear All Filters" and reset the view.

---

## 5. Accessibility & Component Design Summary

This design adheres to `shadcn/ui` principles and prioritizes accessibility (a11y).

*   **Keyboard Navigation**: A logical tab order is maintained through all controls, the data table/list, and pagination. All interactive elements are focusable.
*   **ARIA Standards**: Proper roles and attributes will be used (e.g., `aria-label` for icon buttons, `aria-live` for dynamic announcements, `scope` for table headers).
*   **Focus Management**: Modals (`AlertDialog`, `Sheet`) will trap focus and return it to the trigger element when closed.
*   **Contrast & Color**: Colors are used to enhance, not replace, information. All text and UI elements will meet WCAG AA contrast ratios.
*   **Component Consistency**: The design exclusively uses `shadcn/ui` components (`Tabs`, `DataTable`, `Badge`, `Card`, `Select`, `Button`, `Sheet`, `AlertDialog`), ensuring visual and behavioral consistency with the rest of the application. 