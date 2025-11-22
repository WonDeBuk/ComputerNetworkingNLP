/** @type {import('tailwindcss').Config} */
// Export the configuration object for Tailwind CSS
export default {
    // Specify the files that Tailwind should scan for class names
    content: [
        // Scan the index.html file
        "./index.html",
        // Scan all JavaScript, TypeScript, JSX, and TSX files in the src directory
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    // Define the theme customization
    theme: {
        // Extend the default theme
        extend: {},
    },
    // Define the plugins to include
    plugins: [],
}
