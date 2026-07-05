# 🎨 SASS Breakpoint System - English Version

## 📐 Available Breakpoints

| Name    | Min Width | Typical Device              | Common Use                         |
| ------- | --------- | --------------------------- | ---------------------------------- |
| **xs**  | 0px       | Small phones                | Base layout                        |
| **sm**  | 640px     | Modern smartphones          | Basic layout adjustments           |
| **md**  | 768px     | Tablets / phones horizontal | Column reorganization              |
| **lg**  | 1024px    | Small laptops               | "Desktop" layout                   |
| **xl**  | 1280px    | Standard monitors           | More columns, wider padding        |
| **2xl** | 1536px    | Large monitors              | Fine adjustments for large screens |

## 🚀 Basic Usage

### Individual Mixins (Recommended)

```scss
// Import mixins at the beginning of your SCSS file
@import "../styles/abstracts";

.my-component {
  padding: 1rem;

  @include sm {
    padding: 1.5rem;
  }

  @include md {
    padding: 2rem;
    display: flex;
  }

  @include lg {
    padding: 2.5rem;
    grid-template-columns: repeat(3, 1fr);
  }

  @include xl {
    padding: 3rem;
  }

  @include xxl {
    padding: 4rem;
  }
}
```

### Main Mixin with Parameters

```scss
@import "../styles/abstracts";

.element {
  font-size: 14px;

  @include breakpoint(sm) {
    font-size: 16px;
  }

  @include breakpoint(md) {
    font-size: 18px;
  }

  @include breakpoint(lg) {
    font-size: 20px;
  }
}
```

## 🎯 Special Mixins

### Specific Ranges Only

```scss
.mobile-special {
  background: red;

  @include mobile-only {
    // Only up to 639px
    background: blue;
  }
}

.tablet-special {
  @include tablet-only {
    // Only between 640px and 1023px
    background: green;
  }
}

.desktop-special {
  @include desktop-only {
    // Only from 1024px and up
    background: purple;
  }
}
```

### Custom Ranges

```scss
.custom-range {
  @include breakpoint-between(sm, lg) {
    // Only between 640px and 1023px
    display: flex;
  }
}

.max-width {
  @include breakpoint-max(md) {
    // Only up to 767px
    display: none;
  }
}
```

## 📱 Practical Examples

### Responsive Grid

```scss
.grid-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @include sm {
    grid-template-columns: repeat(2, 1fr);
  }

  @include md {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  @include lg {
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
  }

  @include xl {
    grid-template-columns: repeat(6, 1fr);
  }
}
```

### Responsive Typography

```scss
.title {
  font-size: 1.5rem;
  line-height: 1.2;

  @include sm {
    font-size: 2rem;
  }

  @include md {
    font-size: 2.5rem;
    line-height: 1.3;
  }

  @include lg {
    font-size: 3rem;
    line-height: 1.4;
  }

  @include xl {
    font-size: 3.5rem;
  }
}
```

### Container with Max-Width

```scss
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;

  @include sm {
    max-width: 640px;
  }

  @include md {
    max-width: 768px;
    padding: 0 1.5rem;
  }

  @include lg {
    max-width: 1024px;
    padding: 0 2rem;
  }

  @include xl {
    max-width: 1280px;
  }

  @include xxl {
    max-width: 1536px;
  }
}
```

## 🛠️ File Structure

```
src/styles/
├── abstracts/
│   ├── _index.scss      # Imports everything
│   ├── _variables.scss  # Breakpoints and variables
│   └── _mixins.scss     # Breakpoint mixins
├── _examples.scss       # Usage examples
└── main.scss           # Main file
```

## 📝 How to Import in Your Components

### In SCSS files

```scss
// At the beginning of your .scss file
@import "../styles/abstracts";

// Or if you're in a subfolder
@import "../../styles/abstracts";
```

### In React components

```tsx
// For component files
import "./MyComponent.scss";
```

## 🔄 Mobile-First Approach

The system uses a **mobile-first** approach, which means:

- Base styles are for mobile (xs)
- Each breakpoint adds styles for larger screens
- It's more efficient and accessible

```scss
.mobile-first-example {
  // Base styles (mobile)
  padding: 1rem;
  font-size: 14px;

  // Applied from 640px and up
  @include sm {
    padding: 1.5rem;
    font-size: 16px;
  }

  // Applied from 768px and up
  @include md {
    padding: 2rem;
    font-size: 18px;
  }
}
```

## 🚨 Common Errors

### ❌ Non-existent breakpoint

```scss
@include invalidBreakpoint {
  // Error: breakpoint doesn't exist
  color: red;
}
```

### ✅ Correct breakpoint

```scss
@include md {
  color: red;
}
```

## 🎨 Integration with TailwindCSS

The SASS system is fully compatible with TailwindCSS. You can use both:

```scss
.hybrid-component {
  @apply bg-blue-500 text-white; // TailwindCSS

  @include md {
    @apply bg-green-500; // TailwindCSS in SASS breakpoint
    padding: 2rem; // Custom SASS
  }
}
```

## 🌐 Demo Component

Visit http://localhost:3000 to see the responsive demo component in action. It demonstrates all breakpoints working in real-time.

## ✅ What's Been Translated

All code comments, variable names, class names, and documentation have been converted from Spanish to English:

- ✅ Variables and mixins comments
- ✅ Error messages in English
- ✅ Class names in examples
- ✅ Demo component content
- ✅ File structure documentation
- ✅ All SCSS files updated

The system is now fully in English and ready to use! 🎉
