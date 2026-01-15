# Restaurant SaaS Frontend

Modern Next.js 15 frontend application with App Router, TypeScript, and Tailwind CSS. Features a powerful WYSIWYG menu editor with drag-and-drop functionality.

## ✨ Features

- **Authentication System**: Login/Register with JWT token management
- **Store Owner Dashboard**: Complete menu management interface
- **WYSIWYG Menu Editor**: 
  - Drag-and-drop interface for menu customization
  - Real-time preview
  - Template system (save/load menu templates)
  - Global and per-element styling
  - Product field customization
  - Undo/Redo functionality
- **State-based Onboarding**: Automatic flow based on store status
- **Public Menu Pages**: QR code accessible menu display
- **Order Management**: View and manage orders from dashboard
- **Subscription Management**: Handle subscription payments and status

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ 
- npm or yarn
- Backend services running (see main README)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The application will be available at http://localhost:3000

### Environment Setup

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## 📁 Project Structure

```
frontend/
├── app/                      # Next.js App Router pages
│   ├── auth/                 # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/           # Store owner dashboard
│   │   ├── menu/            # Menu editor
│   │   ├── categories/      # Category management
│   │   ├── products/        # Product management
│   │   ├── orders/          # Order management
│   │   └── settings/        # Store settings
│   ├── setup/               # Onboarding flow
│   │   ├── create-store/
│   │   └── subscription/
│   └── menu/                # Public menu pages
│       └── [slug]/          # Dynamic menu route
├── components/              # React components
│   └── MenuEditor/          # WYSIWYG editor components
│       ├── WYSIWYGMenuEditor.tsx
│       ├── Toolbar.tsx
│       ├── SidebarPanel.tsx
│       ├── ProductCard.tsx
│       ├── CategorySection.tsx
│       ├── CustomElementComponent.tsx
│       └── ...
├── lib/                     # Utilities and helpers
│   └── menuEditor/          # Menu editor logic
│       ├── types.ts
│       ├── menuGenerator.ts
│       └── productHelpers.ts
└── public/                  # Static assets
```

## 🎨 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useCallback)
- **HTTP Client**: Axios
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
- **Notifications**: React Hot Toast
- **Color Picker**: react-colorful
- **QR Code**: react-qr-code

## 🔄 User Flows

### Store Owner Journey

1. **Registration** → User creates account
   - Default role: `STORE_OWNER`
   - JWT token stored in localStorage

2. **Login** → User authenticates
   - Token stored for subsequent requests

3. **State Check** → Dashboard checks store status
   - Calls `GET /catalog/stores/my-store`
   - **404**: Redirect to `/setup/create-store`
   - **TRIAL/EXPIRED**: Redirect to `/setup/subscription`
   - **ACTIVE**: Show dashboard

4. **Menu Creation** → Use WYSIWYG editor
   - Create categories and products
   - Customize menu layout and styling
   - Save menu HTML and data structure
   - Preview and publish

5. **Order Management** → View incoming orders
   - Real-time order updates (SSE)
   - Order status management

### Customer Journey

1. **Scan QR Code** → Access `/menu/{slug}`
2. **Menu Display** → Server-side rendered menu
3. **Add to Cart** → Select items and quantities
4. **Checkout** → Choose payment method
5. **Order Tracking** → Real-time status updates

## 🎯 Key Components

### WYSIWYG Menu Editor

The menu editor (`components/MenuEditor/WYSIWYGMenuEditor.tsx`) provides:

- **Drag & Drop**: Reorder categories, products, and custom elements
- **Real-time Editing**: Instant visual feedback
- **Style Customization**: Global and per-element styling
- **Template System**: Save and load menu templates
- **Undo/Redo**: History management for changes
- **Product Fields**: Customizable product name, price, description, image

### Menu Editor Features

- **Categories**: Organize products into categories
- **Products**: Individual menu items with pricing
- **Custom Elements**: Text, images, buttons, dividers, containers
- **Nested Elements**: Custom elements can contain other elements
- **Global Styles**: Apply styles across all elements
- **Field Ordering**: Configure display order of product fields

## 🔧 Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Clean .next directory
npm run clean
```

### Code Style

- TypeScript strict mode enabled
- ESLint configured with Next.js rules
- Prettier recommended for formatting

### Component Guidelines

- Use functional components with hooks
- Type all props with TypeScript interfaces
- Follow Next.js App Router conventions
- Use Tailwind CSS for styling
- Implement proper error handling

## 🐛 Troubleshooting

### Build Errors

If you encounter build errors:

```bash
# Clean and rebuild
npm run clean
npm run build
```

### API Connection Issues

1. Verify backend services are running
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Verify CORS is enabled on backend
4. Check browser console for errors

### Menu Editor Issues

- Clear browser localStorage if editor state is corrupted
- Check browser console for JavaScript errors
- Verify drag-and-drop libraries are installed

## 📦 Dependencies

### Core Dependencies

- `next`: 15.x - React framework
- `react`: 18.x - UI library
- `typescript`: 5.x - Type safety
- `tailwindcss`: 3.x - Styling
- `axios`: HTTP client
- `@dnd-kit/core`: Drag and drop core
- `@dnd-kit/sortable`: Sortable lists
- `react-hot-toast`: Notifications
- `react-colorful`: Color picker

### Development Dependencies

- `eslint`: Code linting
- `eslint-config-next`: Next.js ESLint config
- `@types/node`: Node.js types
- `@types/react`: React types

## 🔐 Security Considerations

- JWT tokens stored in localStorage (consider httpOnly cookies for production)
- API calls include Authorization headers
- Input validation on forms
- XSS protection via React's built-in escaping

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables for Production

Set `NEXT_PUBLIC_API_URL` to your production API URL:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### Docker Deployment

See main project README for Docker deployment instructions.

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [dnd-kit Documentation](https://docs.dndkit.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

**Part of the Restaurant Menu SaaS Platform**
