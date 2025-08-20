workspace "FastAPI Auth System" "Context + Containers for authentication and token flows" {

  model {
    // ----- Actors -----
    user = person "User" "End user who signs up, signs in, and calls protected APIs"

    // ----- External Services -----
    group "External Services" {
      emailSvc = softwareSystem "Email Service" "SMTP/SendGrid-like provider for magic links and password resets"
      oidc = softwareSystem "OIDC Provider (optional)" "Google/Microsoft OIDC for SSO"
    }

    // ----- The main software system -----
    authSys = softwareSystem "Auth-enabled API System" "REST API with token-based authentication" {

      // ---- Containers ----
      frontend = container "Frontend Client" "SPA/PWA or native mobile app" "React/Vue/Native"
      api = container "API Backend" "Exposes /auth and domain APIs; issues and validates tokens" "Python / FastAPI" {
        // --- Components ---
        protectedApi = component "ProtectedResourceController" "Example protected domain endpoints" "FastAPI endpoints"
        authController = component "AuthController" "FastAPI endpoints: /register, /login, /refresh, /logout, /verify, /password-reset" "FastAPI endpoints"
        tokenService = component "TokenService" "Creates, signs, validates JWT access & refresh tokens; handles claim checks" "python-jose / PyJWT"
        passwordService = component "PasswordService" "Password hashing and verification using bcrypt" "Passlib CryptContext"
        sessionService = component "SessionService" "Refresh token rotation, persistence, revocation/blacklist" "Python service logic"
        userRepository = component "UserRepository" "CRUD for users, verifications" "SQLAlchemy"
        emailClient = component "EmailClient" "Sends emails (magic link, reset) via Email Service" "SMTP/HTTP client"
      }

      db = container "Application Database" "Stores users, refresh tokens, verification and reset artifacts" "PostgreSQL/MySQL" {
        tag "Database"
      }

      redis = container "Token Cache / Blacklist" "Blacklist, session locks, rate limiting (optional)" "Redis" {
        tag "Cache"
      }
    }

    // ----- Relationships: Actors → System -----
    user -> frontend "Uses the app for sign-up/sign-in and API access"

    // ----- Relationships: UI → Backend -----
    frontend -> api "JSON/HTTPS calls (credentials, tokens, API requests)"

    // ----- API → Internals / Components -----
    frontend -> authController "Calls /auth/* endpoints" "HTTPS/JSON"

    authController -> passwordService "Hash/verify credentials during register/login"
    authController -> userRepository "Load/save users, email verifications"
    authController -> tokenService "Issue/validate JWT access & refresh tokens"
    authController -> sessionService "Persist, rotate, revoke refresh tokens"
    authController -> emailClient "Send magic link & password reset emails"

    // ----- Components → Containers/External -----
    userRepository -> db "Read/Write user and session data" "SQL"
    sessionService -> db "Store refresh tokens, rotation metadata" "SQL"
    sessionService -> redis "Record revocations/blacklist; anti-replay" "Key/Value"
    tokenService -> redis "Check revocation/blacklist (optional)" "Key/Value"
    emailClient -> emailSvc "Send emails via SMTP/HTTP"
    authController -> oidc "SSO: exchange/validate ID token, map to user (optional)"

    // ----- Domain API (protected example) -----
    frontend -> protectedApi "Calls protected API with Bearer access token" "HTTPS/JSON"
    protectedApi -> tokenService "Validate access token (exp, signature, claims)"
    protectedApi -> userRepository "Fetch current user if needed"
    protectedApi -> db "Read domain data (example)"
  }

  views {
    systemContext authSys "SystemContext" {
      include *
      autoLayout lr
      title "Auth-enabled API System - Context Diagram"
      description "User, external services (Email/OIDC), and the auth-enabled system."
    }

    container authSys "Containers" {
      include *
      autoLayout tb
      title "Auth enabled API System - Container Diagram"
      description "Frontend, FastAPI backend, database, and Redis cache/blacklist."
    }

    component api "api-backend-components" {
      include *
      autoLayout tb
      title "API Backend - Component Diagram"
      description "AuthController, Token/Password/Session services, UserRepository, EmailClient."
    }

    // ----- Dynamic Views: Key Flows -----

    dynamic authSys "login_password_token_issuance" {
      user -> frontend "1. Enter email/password"
      frontend -> api "2. POST /auth/login {email, password}"
      api -> db "3. Get user by email"
      api -> db "4. Verify password"
      api -> redis "5. Create access & refresh tokens (JWT)"
      api -> db "6. Persist refresh token (rotation metadata)"
      api -> db "7. Store refresh token"
      api -> frontend "8. Return {access_token, refresh_token}"
      title "Flow A: Password login issues access & refresh tokens"
    }



    

    styles {
      element "Person" {
        color #ffffff
        background #08427b
        fontSize 22
        shape Person
      }
      element "Software System" {
        background #1168bd
        color #ffffff
      }
      element "Container" {
        background #438dd5
        color #ffffff
      }
      element "Component" {
        background #85bbf0
        color #000000
      }
      element "Database" {
        shape Cylinder
        background #438dd5
        color #ffffff
      }
      element "Cache" {
        background #2d6a4f
        color #ffffff
      }
    }
  }
}