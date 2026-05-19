# Job Application Tracker - Next.js & TypeScript Guide

This comprehensive guide explains all Next.js and TypeScript concepts used in the Job Application Tracker project. Whether you're new to these technologies or want to understand advanced patterns, this README covers everything from basic setup to complex data flows.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Next.js Fundamentals](#nextjs-fundamentals)
3. [TypeScript in Next.js](#typescript-in-nextjs)
4. [Authentication System](#authentication-system)
5. [Database Integration](#database-integration)
6. [Data Flow Architecture](#data-flow-architecture)
7. [Component Architecture](#component-architecture)
8. [Configuration & Setup](#configuration--setup)
9. [Advanced Patterns](#advanced-patterns)
10. [Best Practices](#best-practices)

## Project Overview

The Job Application Tracker is a full-stack web application built with **Next.js 16** and **TypeScript** that helps users organize their job search process using a Kanban board interface. Users can create job applications, move them through different stages (Wish List → Applied → Interviewing → Offer → Rejected), and track their progress.

### Key Technologies
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **MongoDB** - NoSQL database with Mongoose ODM
- **Better Auth** - Authentication library
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **@dnd-kit** - Drag and drop functionality

## Next.js Fundamentals

### App Router vs Pages Router

This project uses **Next.js App Router** (introduced in Next.js 13), which is the modern routing system. Unlike the older Pages Router, App Router uses:

- **File-based routing** with `app/` directory
- **Server Components** by default
- **Nested layouts** and loading states
- **Server Actions** for form handling

```typescript
// File structure creates routes automatically:
app/page.tsx              → Homepage (/)
app/dashboard/page.tsx    → Dashboard (/dashboard)
app/sign-in/page.tsx      → Sign in page (/sign-in)
app/api/auth/[...all]/route.ts → All auth API routes (/api/auth/*)
```

### Server Components vs Client Components

#### Server Components (Default)
Server Components run on the server and can:
- Access databases directly
- Use server-side APIs
- Render before sending to client
- Are more secure (no client-side secrets)

```typescript
// app/dashboard/page.tsx - Server Component
async function DashboardPage() {
  // ✅ Direct database access
  const session = await getSession();
  const board = await getBoard(session?.user.id ?? "");

  // ✅ Server-side redirects
  if (!session?.user) {
    redirect("/sign-in");
  }

  return <KanbanBoard board={board} userId={session.user.id} />;
}
```

#### Client Components
Client Components run in the browser and handle:
- User interactions
- State management
- Event listeners
- Browser APIs

```typescript
// components/kanban-board.tsx - Client Component
"use client";  // Required directive

import { useState } from "react";

export default function KanbanBoard({ board, userId }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // ✅ Handles drag-and-drop interactions
  // ✅ Manages local state
  // ✅ Responds to user events
}
```

### Server Actions

Server Actions allow you to run server-side code directly from client components without creating API routes.

```typescript
// lib/actions/job-applications.ts
"use server";  // Marks function as server action

export async function createJobApplication(data: JobApplicationData) {
  // ✅ Server-side authentication
  const session = await getSession();

  // ✅ Direct database operations
  await connectDB();
  const jobApplication = await JobApplication.create({
    company: data.company,
    position: data.position,
    columnId: data.columnId,
    userId: session.user.id,
  });

  // ✅ Cache revalidation
  revalidatePath("/dashboard");

  return { data: jobApplication };
}
```

**How to use Server Actions:**

```typescript
// In a client component
"use client";

async function handleSubmit() {
  const result = await createJobApplication(formData);

  if (!result.error) {
    // Success - UI updates automatically due to revalidatePath
  }
}
```

### API Routes

API Routes handle HTTP requests and are used for authentication in this project.

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
// Creates: /api/auth/sign-in, /api/auth/sign-up, /api/auth/sign-out, etc.
```

### Middleware

Middleware runs before requests are processed and can:
- Redirect users
- Add headers
- Rewrite URLs
- Handle authentication

```typescript
// middleware.ts (referenced in proxy.ts)
export default async function middleware(request: NextRequest) {
  const session = await getSession();

  // Redirect authenticated users away from sign-in page
  if (request.nextUrl.pathname === "/sign-in" && session?.user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}
```

### Data Fetching & Caching

Next.js provides powerful caching mechanisms:

```typescript
// Enable caching for expensive operations
async function getBoard(userId: string) {
  "use cache";  // Next.js directive

  await connectDB();
  const board = await Board.findOne({ userId })
    .populate("columns")
    .populate("jobApplications");

  return board;
}

// In server actions, revalidate when data changes
revalidatePath("/dashboard");  // Clears cache for dashboard
```

## TypeScript in Next.js

### Type Definitions

TypeScript interfaces define the shape of your data:

```typescript
// lib/models/models.types.ts - Frontend types
export interface JobApplication {
  _id: string;
  company: string;
  position: string;
  location?: string;  // Optional field
  status: string;
  notes?: string;
  salary?: string;
  tags?: string[];
}

// lib/models/job-application.ts - Database model
export interface IJobApplication extends Document {
  company: string;
  position: string;
  location?: string;
  status: string;
  columnId: mongoose.Types.ObjectId;  // MongoDB ObjectId
  boardId: mongoose.Types.ObjectId;
  userId: string;
  order: number;
  createdAt: Date;  // Auto-added by timestamps
  updatedAt: Date;
}
```

### Generic Types

Generics make your code reusable and type-safe:

```typescript
// Generic API response type
interface ApiResponse<T> {
  data?: T;
  error?: string;
  success?: boolean;
}

// Usage in server actions
export async function createJobApplication(
  data: JobApplicationData
): Promise<ApiResponse<IJobApplication>> {
  try {
    const job = await JobApplication.create(data);
    return { data: job, success: true };
  } catch (error) {
    return { error: "Failed to create job application" };
  }
}
```

### Component Props Typing

```typescript
interface KanbanBoardProps {
  board: Board;
  userId: string;
}

interface JobApplicationCardProps {
  job: JobApplication;
  onEdit?: (job: JobApplication) => void;
  onDelete?: (id: string) => void;
}

export default function JobApplicationCard({
  job,
  onEdit,
  onDelete
}: JobApplicationCardProps) {
  // TypeScript ensures correct props are passed
}
```

### React Hook Typing

```typescript
// lib/hooks/useBoards.ts
export function useBoard(initialBoard?: Board | null) {
  const [board, setBoard] = useState<Board | null>(initialBoard || null);
  const [error, setError] = useState<string | null>(null);

  async function moveJob(
    jobApplicationId: string,
    newColumnId: string,
    newOrder: number
  ): Promise<void> {
    // Type-safe implementation
  }

  return { board, error, moveJob };
}
```

### Form Event Typing

```typescript
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  const formData = new FormData(e.currentTarget);
  const company = formData.get("company") as string;
  const position = formData.get("position") as string;

  // TypeScript ensures type safety
}
```

## Authentication System

### Better Auth Setup

Better Auth provides secure authentication with minimal setup:

```typescript
// lib/auth/auth.ts - Server-side configuration
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

export const auth = betterAuth({
  database: mongodbAdapter(db),

  emailAndPassword: {
    enabled: true,  // Enable email/password auth
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60,  // 1 hour cache
    },
  },

  // Auto-initialize user board on signup
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await initializeUserBoard(user.id);
        },
      },
    },
  },
});
```

### Client-Side Auth

```typescript
// lib/auth/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

### Authentication Flow

#### Sign Up Process:
1. User fills form → calls `signUp.email()`
2. Request goes to `/api/auth/sign-up`
3. Better Auth creates user in database
4. Triggers `databaseHooks` → creates default board
5. User redirected to dashboard with session

#### Sign In Process:
1. User enters credentials → calls `signIn.email()`
2. Validates against database
3. Sets session cookie
4. Redirects to dashboard

#### Session Management:
```typescript
// Server-side (in Server Components)
const session = await getSession();
if (!session?.user) {
  redirect("/sign-in");
}

// Client-side (in Client Components)
const { data: session } = useSession();
if (session?.user) {
  // Show authenticated UI
}
```

## Database Integration

### MongoDB Connection

The project uses connection pooling for efficiency:

```typescript
// lib/db.ts
import mongoose from "mongoose";

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI not defined");
  }

  // Reuse existing connection
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection if needed
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

### Mongoose Schemas

```typescript
// lib/models/job-application.ts
const JobApplicationSchema = new Schema<IJobApplication>(
  {
    company: { type: String, required: true },
    position: { type: String, required: true },
    location: { type: String },
    status: { type: String, required: true, default: "applied" },
    columnId: {
      type: Schema.Types.ObjectId,
      ref: "Column",
      required: true,
      index: true  // Database index for performance
    },
    userId: { type: String, required: true, index: true },
    order: { type: Number, required: true, default: 0 },
    tags: [{ type: String }],
  },
  { timestamps: true }  // Auto-adds createdAt, updatedAt
);

export default mongoose.models.JobApplication ||
  mongoose.model<IJobApplication>("JobApplication", JobApplicationSchema);
```

### Data Relationships

The app uses a hierarchical data structure:

```
Board (user's workspace)
├── columns: [Column IDs]
    └── Column (e.g., "Applied", "Interviewing")
        ├── jobApplications: [Job IDs]
            └── JobApplication (individual job entry)
```

### Data Population

```typescript
// Fetch board with all related data
const board = await Board.findOne({ userId })
  .populate({
    path: "columns",  // Get column documents
    populate: {
      path: "jobApplications",  // Get job documents
    },
  });

// Convert to plain object for React
const serializedBoard = JSON.parse(JSON.stringify(board));
```

## Data Flow Architecture

### Complete Example: Creating a Job Application

#### Step 1: User Interaction (Client Component)
```typescript
// components/create-job-dialog.tsx
"use client";

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  const result = await createJobApplication({
    company: "Acme Corp",
    position: "Senior Developer",
    columnId: "507f1f77bcf86cd799439011",
    boardId: "507f1f77bcf86cd799439010",
  });

  if (!result.error) {
    setOpen(false);  // Close dialog
    // Page re-renders automatically
  }
}
```

#### Step 2: Server Action Processing
```typescript
// lib/actions/job-applications.ts
"use server";

export async function createJobApplication(data: JobApplicationData) {
  // 2a. Server-side authentication check
  const session = await getSession();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  // 2b. Database connection
  await connectDB();

  // 2c. Create job application
  const jobApplication = await JobApplication.create({
    ...data,
    userId: session.user.id,
    order: 0,  // Will be updated by ordering logic
  });

  // 2d. Update column to include new job
  await Column.findByIdAndUpdate(data.columnId, {
    $push: { jobApplications: jobApplication._id },
  });

  // 2e. Clear cache so page shows new data
  revalidatePath("/dashboard");

  return { data: jobApplication };
}
```

#### Step 3: UI Update
- `revalidatePath("/dashboard")` clears the cache
- Next.js re-renders the dashboard page
- `getBoard()` fetches fresh data from database
- React updates the UI with new job application

### Drag and Drop Flow

#### Step 1: User drags job card
```typescript
// components/kanban-board.tsx
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,  // Require 8px movement to start drag
    },
  })
);

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;

  if (!over) return;

  const jobId = active.id as string;
  const newColumnId = over.id as string;

  // Call server action to update database
  moveJobApplication({
    jobApplicationId: jobId,
    newColumnId,
    newOrder: 0,  // Simplified - would calculate proper order
  });
}
```

#### Step 2: Server updates database
```typescript
// lib/actions/job-applications.ts
export async function moveJobApplication({
  jobApplicationId,
  newColumnId,
  newOrder
}: MoveJobData) {
  await connectDB();

  // Remove from old column
  await Column.findOneAndUpdate(
    { jobApplications: jobApplicationId },
    { $pull: { jobApplications: jobApplicationId } }
  );

  // Add to new column
  await Column.findByIdAndUpdate(newColumnId, {
    $push: { jobApplications: jobApplicationId },
  });

  // Update job's column reference
  await JobApplication.findByIdAndUpdate(jobApplicationId, {
    columnId: newColumnId,
    order: newOrder,
  });

  revalidatePath("/dashboard");
}
```

#### Step 3: UI reflects changes
- Cache cleared → page re-renders
- Database query returns updated data
- Kanban board shows job in new column

## Component Architecture

### Layout Components

```typescript
// app/layout.tsx - Root layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Navbar />  {/* Navigation */}
        <main>{children}</main>
      </body>
    </html>
  );
}
```

### Page Components

```typescript
// app/dashboard/page.tsx - Server component
async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const board = await getBoard(session.user.id);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Job Applications</h1>
      <KanbanBoard board={board} userId={session.user.id} />
    </div>
  );
}
```

### Feature Components

```typescript
// components/kanban-board.tsx - Client component
"use client";

export default function KanbanBoard({ board, userId }: KanbanBoardProps) {
  const { columns, moveJob } = useBoard(board);

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto">
        {columns.map((column) => (
          <Column key={column._id} column={column} />
        ))}
        <CreateJobDialog boardId={board._id} />
      </div>
    </DndContext>
  );
}
```

### UI Components (shadcn/ui)

```typescript
// components/ui/button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

## Configuration & Setup

### Next.js Configuration

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: true,  // Enable server actions
  },
  // Other config options...
};

export default nextConfig;
```

### TypeScript Configuration

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,  // Enable strict type checking
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]  // Path alias for imports
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Environment Variables

```bash
# .env.local
MONGODB_URI=mongodb://localhost:27017/job-tracker
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key
```

## Advanced Patterns

### Custom Hooks

```typescript
// lib/hooks/useBoards.ts
export function useBoard(initialBoard?: Board | null) {
  const [board, setBoard] = useState<Board | null>(initialBoard || null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialBoard) {
      setBoard(initialBoard);
      setColumns(initialBoard.columns);
    }
  }, [initialBoard]);

  const moveJob = async (jobId: string, newColumnId: string, newOrder: number) => {
    try {
      await moveJobApplication({ jobId, newColumnId, newOrder });
    } catch (err) {
      setError("Failed to move job");
    }
  };

  return { board, columns, error, moveJob };
}
```

### Error Boundaries

```typescript
// components/error-boundary.tsx
"use client";

export default class ErrorBoundary extends Component {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>;
    }

    return this.props.children;
  }
}
```

### Loading States

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );
}
```

## Best Practices

### 1. Server vs Client Components
- Use Server Components by default
- Add `"use client"` only when needed (interactivity, browser APIs)
- Keep sensitive operations server-side

### 2. TypeScript Usage
- Use strict mode (`"strict": true`)
- Define interfaces for all data structures
- Use generics for reusable types
- Avoid `any` type

### 3. Database Operations
- Always connect before operations
- Use connection pooling
- Index frequently queried fields
- Serialize data for React (`JSON.parse(JSON.stringify())`)

### 4. Authentication
- Check sessions server-side for security
- Use middleware for route protection
- Handle auth errors gracefully

### 5. Performance
- Use caching directives (`"use cache"`)
- Revalidate cache when data changes
- Optimize images and fonts
- Lazy load components when appropriate

### 6. Error Handling
- Use try-catch in server actions
- Provide user-friendly error messages
- Log errors for debugging
- Use error boundaries for client components

### 7. Code Organization
- Separate concerns (components, actions, models)
- Use path aliases (`@/*`)
- Keep components small and focused
- Extract reusable logic into hooks

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd job-application-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your MongoDB URI and auth secrets
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Conclusion

This project demonstrates modern full-stack development with Next.js and TypeScript, featuring:
- Secure authentication with Better Auth
- Efficient database operations with MongoDB/Mongoose
- Type-safe development throughout
- Server-side rendering and caching
- Interactive UI with drag-and-drop functionality
- Scalable component architecture

The combination of Next.js App Router, TypeScript, and modern React patterns provides a robust foundation for building complex web applications.
