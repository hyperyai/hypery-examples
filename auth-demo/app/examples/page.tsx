'use client';

import {
  SignedIn,
  SignedOut,
  SignIn,
  SignUp,
  SignInForm,
  UserButton,
  UserProfile,
  useAuth,
  useUser,
  Protect,
  RedirectToSignIn,
  AuthModal,
  AuthButton,
} from '@hypery/auth';
import Link from 'next/link';
import { useState } from 'react';

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg" />
                <h1 className="text-xl font-bold">Hypery Auth</h1>
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600">Examples</span>
            </div>

            <SignedIn>
              <UserButton showUserInfo size="md" />
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Component Examples</h1>
          <p className="text-gray-600">
            Complete showcase of all @hypery/auth components and hooks
          </p>
        </div>

        <div className="space-y-8">
          {/* Modal Components */}
          <Section
            title="Modal Components"
            description="Reusable modal-based authentication components"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ExampleCard
                title="<AuthButton />"
                description="Button that opens authentication modal"
                code={`<AuthButton 
  variant="primary"
  mode="signin"
  onSuccess={() => router.push('/dashboard')}
>
  Sign In
</AuthButton>`}
              >
                <SignedOut>
                  <div className="space-y-3">
                    <AuthButton variant="primary">Sign In</AuthButton>
                    <AuthButton variant="secondary" mode="signup">
                      Get Started
                    </AuthButton>
                    <AuthButton variant="outline" mode="signin">
                      Outline Style
                    </AuthButton>
                  </div>
                </SignedOut>
                <SignedIn>
                  <p className="text-sm text-gray-600">
                    You're already signed in! Sign out to test this.
                  </p>
                </SignedIn>
              </ExampleCard>

              <ExampleCard
                title="<AuthModal />"
                description="Standalone modal for custom integrations"
                code={`const [isOpen, setIsOpen] = useState(false);

<AuthModal 
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  initialMode="signin"
  onSuccess={() => console.log('Success!')}
/>`}
              >
                <SignedOut>
                  <AuthModalExample />
                </SignedOut>
                <SignedIn>
                  <p className="text-sm text-gray-600">
                    You're already signed in! Sign out to test this.
                  </p>
                </SignedIn>
              </ExampleCard>
            </div>
          </Section>

          {/* Authentication Components */}
          <Section
            title="Authentication Components"
            description="Sign in, sign up, and user interface components"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ExampleCard
                title="<SignIn />"
                description="Button to initiate sign-in flow"
                code={`<SignIn 
  buttonText="Sign in"
  variant="primary"
/>`}
              >
                <SignedOut>
                  <SignIn buttonText="Try Sign In" variant="primary" />
                </SignedOut>
                <SignedIn>
                  <p className="text-sm text-gray-600">
                    You're already signed in! Sign out to test this.
                  </p>
                </SignedIn>
              </ExampleCard>

              <ExampleCard
                title="<SignInForm />"
                description="Embedded login form with email/password and OAuth"
                code={`<SignInForm 
  showCard
  showTitle
  onSuccess={() => console.log('Signed in!')}
/>`}
              >
                <SignedOut>
                  <SignInForm 
                    showCard
                    showTitle={false}
                    title="Try the form"
                    description="Embedded authentication"
                  />
                </SignedOut>
                <SignedIn>
                  <p className="text-sm text-gray-600">
                    You're already signed in! Sign out to test this.
                  </p>
                </SignedIn>
              </ExampleCard>

              <ExampleCard
                title="<SignUp />"
                description="Button to initiate sign-up flow"
                code={`<SignUp 
  buttonText="Get Started"
  variant="primary"
/>`}
              >
                <SignedOut>
                  <SignUp buttonText="Try Sign Up" variant="secondary" />
                </SignedOut>
                <SignedIn>
                  <p className="text-sm text-gray-600">
                    You're already signed in! Sign out to test this.
                  </p>
                </SignedIn>
              </ExampleCard>

              <ExampleCard
                title="<UserButton />"
                description="User menu with profile and sign out"
                code={`<UserButton 
  showUserInfo={true}
  size="md"
/>`}
              >
                <SignedIn>
                  <UserButton showUserInfo size="lg" />
                </SignedIn>
                <SignedOut>
                  <p className="text-sm text-gray-600">
                    Sign in to see the user button
                  </p>
                </SignedOut>
              </ExampleCard>

              <ExampleCard
                title="<UserProfile />"
                description="User profile card component"
                code={`<UserProfile 
  showExtended={true}
/>`}
              >
                <SignedIn>
                  <UserProfile showExtended />
                </SignedIn>
                <SignedOut>
                  <p className="text-sm text-gray-600">
                    Sign in to see your profile
                  </p>
                </SignedOut>
              </ExampleCard>
            </div>
          </Section>

          {/* Control Components */}
          <Section
            title="Control Components"
            description="Conditional rendering based on authentication state"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ExampleCard
                title="<SignedIn />"
                description="Only renders children when authenticated"
                code={`<SignedIn>
  <p>You can see this!</p>
</SignedIn>`}
              >
                <div className="space-y-2">
                  <SignedIn>
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-sm text-green-800">
                        ✓ You're signed in, so you can see this!
                      </p>
                    </div>
                  </SignedIn>
                  <SignedOut>
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <p className="text-sm text-gray-600">
                        You're not signed in. The SignedIn component won't show.
                      </p>
                    </div>
                  </SignedOut>
                </div>
              </ExampleCard>

              <ExampleCard
                title="<SignedOut />"
                description="Only renders children when NOT authenticated"
                code={`<SignedOut>
  <SignIn />
</SignedOut>`}
              >
                <div className="space-y-2">
                  <SignedOut>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-sm text-blue-800 mb-2">
                        ✓ You're signed out, so you can see this!
                      </p>
                      <SignIn buttonText="Sign in here" variant="outline" />
                    </div>
                  </SignedOut>
                  <SignedIn>
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <p className="text-sm text-gray-600">
                        You're signed in. The SignedOut component won't show.
                      </p>
                    </div>
                  </SignedIn>
                </div>
              </ExampleCard>

              <ExampleCard
                title="<Protect />"
                description="Protects routes with automatic redirect"
                code={`<Protect 
  fallback={<Loading />}
>
  <ProtectedContent />
</Protect>`}
              >
                <div className="bg-purple-50 border border-purple-200 rounded p-3">
                  <p className="text-sm text-purple-800">
                    See the <Link href="/protected" className="underline font-medium">protected page</Link> for a live example
                  </p>
                </div>
              </ExampleCard>

              <ExampleCard
                title="<RedirectToSignIn />"
                description="Immediately redirects to sign in"
                code={`<RedirectToSignIn />`}
              >
                <SignedIn>
                  <p className="text-sm text-gray-600">
                    You're signed in, so it won't redirect
                  </p>
                </SignedIn>
                <SignedOut>
                  <p className="text-sm text-orange-800 bg-orange-50 border border-orange-200 rounded p-3">
                    ⚠️ Disabled in this example to prevent redirect loop
                  </p>
                </SignedOut>
              </ExampleCard>
            </div>
          </Section>

          {/* Hooks */}
          <Section
            title="React Hooks"
            description="Access authentication state and user data"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ExampleCard
                title="useAuth()"
                description="Access full authentication state"
                code={`const { 
  isAuthenticated, 
  isLoading, 
  user, 
  login, 
  logout 
} = useAuth();`}
              >
                <UseAuthExample />
              </ExampleCard>

              <ExampleCard
                title="useUser()"
                description="Access just the user data"
                code={`const { user, isLoading } = useUser();

console.log(user.name);
console.log(user.email);`}
              >
                <UseUserExample />
              </ExampleCard>
            </div>
          </Section>

          {/* Styling Examples */}
          <Section
            title="Customization"
            description="Custom styling and behavior"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ExampleCard
                title="Primary Variant"
                description="Default blue style"
                code={`<SignIn variant="primary" />`}
              >
                <SignedOut>
                  <SignIn variant="primary" buttonText="Primary" />
                </SignedOut>
                <SignedIn>
                  <div className="w-full py-2.5 px-6 bg-blue-600 text-white rounded-lg text-center font-medium">
                    Primary Style
                  </div>
                </SignedIn>
              </ExampleCard>

              <ExampleCard
                title="Secondary Variant"
                description="Gray style"
                code={`<SignIn variant="secondary" />`}
              >
                <SignedOut>
                  <SignIn variant="secondary" buttonText="Secondary" />
                </SignedOut>
                <SignedIn>
                  <div className="w-full py-2.5 px-6 bg-gray-600 text-white rounded-lg text-center font-medium">
                    Secondary Style
                  </div>
                </SignedIn>
              </ExampleCard>

              <ExampleCard
                title="Outline Variant"
                description="Outlined style"
                code={`<SignIn variant="outline" />`}
              >
                <SignedOut>
                  <SignIn variant="outline" buttonText="Outline" />
                </SignedOut>
                <SignedIn>
                  <div className="w-full py-2.5 px-6 border-2 border-blue-600 text-blue-600 rounded-lg text-center font-medium">
                    Outline Style
                  </div>
                </SignedIn>
              </ExampleCard>
            </div>
          </Section>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ExampleCard({
  title,
  description,
  code,
  children,
}: {
  title: string;
  description: string;
  code: string;
  children: React.ReactNode;
}) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          <button
            onClick={() => setShowCode(!showCode)}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition"
          >
            {showCode ? 'Hide' : 'Code'}
          </button>
        </div>

        {showCode && (
          <div className="mb-4 bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-100">
              <code>{code}</code>
            </pre>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">{children}</div>
      </div>
    </div>
  );
}

function UseAuthExample() {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();

  return (
    <div className="space-y-2 text-sm font-mono">
      <div className="flex justify-between">
        <span className="text-gray-600">isAuthenticated:</span>
        <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
          {String(isAuthenticated)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">isLoading:</span>
        <span className="text-blue-600">{String(isLoading)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">user:</span>
        <span className="text-purple-600">
          {user ? 'object' : 'null'}
        </span>
      </div>
      <div className="pt-2 border-t border-gray-200 space-y-1">
        <div className="text-gray-600">Methods:</div>
        <div className="text-xs">• login()</div>
        <div className="text-xs">• logout()</div>
      </div>
    </div>
  );
}

function UseUserExample() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  if (!user) {
    return <p className="text-sm text-gray-500">Not signed in</p>;
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="font-mono bg-gray-50 rounded p-2">
        <div className="text-xs text-gray-500">user.name</div>
        <div className="font-medium">{user.name}</div>
      </div>
      <div className="font-mono bg-gray-50 rounded p-2">
        <div className="text-xs text-gray-500">user.email</div>
        <div className="font-medium">{user.email}</div>
      </div>
      <div className="font-mono bg-gray-50 rounded p-2">
        <div className="text-xs text-gray-500">user.id</div>
        <div className="font-medium text-xs truncate">{user.id}</div>
      </div>
    </div>
  );
}

function AuthModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-all"
      >
        Open Auth Modal
      </button>
      
      <AuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialMode="signin"
        onSuccess={() => {
          setIsOpen(false);
          alert('Successfully signed in!');
        }}
        branding={{
          appName: 'Hypery',
          primaryColor: '#8b5cf6',
        }}
      />
    </>
  );
}

