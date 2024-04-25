## Assumptions:

Admin accounts can be onboarded by SuperAdmins. And admin needs to preonboard
the users who can login and create survey forms.



### OrgCreation

```mermaid
sequenceDiagram
    participant SuperAdmin
    participant APIGateway
    participant OrgService
    SuperAdmin->>APIGateway: POST /orgs/create\n{domainName, orgName}\nAuthorization: Basic Token
    APIGateway->>OrgService: Forward request
    OrgService-->>APIGateway: Generate org Access key
    APIGateway-->>SuperAdmin: Return org Access key
```


### OrgUserCreation

```mermaid
sequenceDiagram
    participant Org
    participant APIGateway
    participant UsersService
    Org->>APIGateway: POST /users/create {email} Authorization: Bearer OrgAccessKey
    APIGateway->>UsersService: Forward request
    UsersService-->>APIGateway: Check if valid orgAdmin and email domainName belongs to org
    APIGateway-->>Org: Return 401 if not valid
    UsersService-->>APIGateway: Create user record in db, with blank password, Return success: true
    APIGateway-->>Org: Return success: true
```


### OrgUserLogin

```mermaid
sequenceDiagram
    participant OrgUser
    participant APIGateway
    participant UserService
    participant AuthService
    OrgUser->>APIGateway: POST /auth/login {email, password}
    APIGateway->>UserService: Forward request (Rate limiter on Email)
    UserService-->>APIGateway: Check if password is blank
    APIGateway-->>OrgUser: Send reset password email if blank
    UserService-->>APIGateway: Proceed if password not blank
    APIGateway->>AuthService: Forward request
    AuthService-->>APIGateway: Check if email and password hash match\ nd org domain is present
    APIGateway-->>OrgUser: Return 401 if fails
    AuthService-->>APIGateway: Generate accessToken and refreshToken
    APIGateway-->>OrgUser: Set httponly cookie in response header. Return accessToken and refreshToken keys
```

(Rn, the org user has to be created and can be done from the cli app. `node
cmd/cli/index.mjs register:user --email email --password password`)



### OrgUserFormCreation

```mermaid
sequenceDiagram
    participant OrgUser
    participant APIGateway
    participant AuthMiddleware
    participant FormService
    participant MongoDb

    OrgUser->>+APIGateway: POST /forms/createe{title, description} Authorization: Bearer accessToken
    APIGateway->>+AuthMiddleware: Validate accessToken and expiry
    AuthMiddleware->>-APIGateway: Return 401 if invalid
    APIGateway->>+FormService: Forward validated request
    FormService->>+MongoDb: Save form to MongoDB
    MongoDb-->>-FormService: Confirmation of form save
    FormService-->>-APIGateway: Return show URL for the form
    APIGateway-->>-OrgUser: Return show URL in response
```


### Suvery

```mermaid
sequenceDiagram
    participant GuestUser
    participant UI
    participant FormService
    participant MongoDb
    participant SubmissionLimiter
    participant RateLimiter

    GuestUser->>+UI: Visit form page
    UI->>+FormService: GET /forms/{formId}
    FormService->>+MongoDb: Check if form and org pair exists
    MongoDb-->>-FormService: Return form object if exists
    GuestUser->>+UI: Fill out form and submit
    UI->>+SubmissionLimiter: Check if email has already submitted
    SubmissionLimiter->>+SubmissionLimiter: Check if email has already submitted for this form
    SubmissionLimiter-->>-UI: Return error if already submitted
    SubmissionLimiter->>+RateLimiter: Check email rate limiting
    RateLimiter->>+RateLimiter: Check rate limiting for email
    RateLimiter-->>-SubmissionLimiter: Return error if rate limit exceeded
    SubmissionLimiter-->>-UI: Return success if allowed
    UI->>+FormService: POST /forms/{formId}/submit\nForm data
    FormService->>+MongoDb: Save form data
    MongoDb-->>-FormService: Confirmation of form data saved

```


### Enabling search functions on data or other analytics

```mermaid
graph TD
    subgraph Form Service
    A[Save Answer Data] --> B{Enqueue to Queue}
    end

    subgraph Queue
    B --> C[Message: Answer ID]
    end

    subgraph Reporting Worker
    C --> D{Batch Consumption}
    D --> E[Get Answer Data from Database]
    E --> F{Calculate Metrics}
    F --> G[Save Metrics to Database]
    end

    subgraph Indexing Worker
    C --> H{Message Consumption}
    H --> I[Get Answer Data from Database]
    I --> J[Put Data in Elasticsearch]
    end
```
