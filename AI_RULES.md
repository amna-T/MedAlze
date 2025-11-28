# AI Rules for MedAlze Application

This document outlines the core technologies and specific library usage guidelines for the MedAlze application.

## Tech Stack Overview

MedAlze is built using a modern web development stack designed for performance, scalability, and a rich user experience.

*   **Frontend Framework**: React with TypeScript
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS for utility-first styling, enhanced with `tailwindcss-animate` for animations.
*   **UI Components**: shadcn/ui, providing accessible and customizable UI components built on Radix UI.
*   **Routing**: React Router for declarative navigation.
*   **Authentication & Database**: Firebase for user authentication (Email/Password, Google) and Firestore for database operations.
*   **Image Storage**: Cloudinary for efficient storage and delivery of X-ray images.
*   **AI X-ray Analysis**: TensorFlow.js for on-device (or server-side) machine learning inference using a pre-trained MobileNetV2 model.
*   **AI Report Generation**: Google Generative AI (Gemini) for generating detailed medical reports based on X-ray analysis.
*   **Data Visualization**: Recharts for creating interactive charts and graphs in dashboards.
*   **Utility Functions**: `clsx` and `tailwind-merge` for robust CSS class management.

## Library Usage Guidelines

To maintain consistency, performance, and best practices, please adhere to the following guidelines when developing new features or modifying existing ones:

*   **UI Components**: Always use components from `shadcn/ui` (e.g., `Button`, `Card`, `Input`, `Dialog`, `Select`, `Table`, `Badge`, `Progress`, `Textarea`, `Label`, `Avatar`). If a required component is not available in `shadcn/ui`, create a new, small component in `src/components/` following `shadcn/ui`'s styling principles.
*   **Routing**: Use `react-router-dom` for all navigation within the application. Routes are defined in `src/routes/index.tsx`.
*   **Authentication**: Utilize the `AuthContext` in `src/contexts/AuthContext.tsx` for all user authentication (login, logout, registration) and user role management.
*   **Database Operations**: For interacting with the Firestore database, use the `db` instance from `src/lib/firebase.ts`.
*   **Image Uploads**: All image uploads (specifically X-ray images) must use the `uploadToCloudinary` function from `src/utils/cloudinary.ts`.
*   **X-ray Analysis**: For performing AI analysis on X-ray images, use the `analyzeXRay` function from `src/utils/xrayAnalysis.ts`. Ensure the TensorFlow.js model is loaded via `loadModel` from the same utility.
*   **Report Generation**: For generating medical reports, use the `generateReport` function from `src/utils/reportGeneration.ts`, which interfaces with Google Generative AI.
*   **Data Visualization**: When displaying charts or graphs in dashboards, use `recharts`.
*   **CSS Utilities**: For conditionally applying or merging Tailwind CSS classes, always use the `cn` utility function from `src/lib/utils.ts`.
*   **Toasts/Notifications**: For displaying user feedback messages, use the `useToast` hook from `@/hooks/use-toast` (which leverages `shadcn/ui`'s `Toast` component).
*   **Icons**: Use icons from the `lucide-react` library.