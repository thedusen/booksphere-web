# Cursor AI Expert Personas: Complete Workflow Guide

## Quick Reference - All 14 Personas

| Keyword | Expert | Primary Focus | When to Use | **Recommended Model** |
|---------|--------|---------------|-------------|----------------------|
| `;db` | PostgreSQL Database Architect | Performance, Security, Scalability | SQL migrations, functions, complex queries | **Claude 4 Sonnet** |
| `;security` | API Security Specialist | Vulnerabilities, Auth, Data Exposure | User input, authentication, API endpoints | **o3** |
| `;ux` | UI/UX & Accessibility Expert | User Experience, Accessibility, Design | React components, user workflows | **Gemini 2.5 Pro Preview 06-05** |
| `;test` | Test-Driven Development Coach | Comprehensive Testing | Before/after writing features | **Claude 4 Sonnet** |
| `;perf` | Performance Engineer | Algorithm & System Optimization | Complex algorithms, scalability concerns | **o3** |
| `;arch` | System Architect | Architecture Patterns, Design | Feature design, architectural decisions | **o3** |
| `;api` | API Design Expert | REST/GraphQL Design, DX | API contracts, endpoint design | **Claude 4 Sonnet** |
| `;deploy` | DevOps/Infrastructure Engineer | Deployment, Operations, Reliability | Infrastructure, CI/CD, deployment | **Claude 4 Sonnet** |
| `;business` | Business Logic Validator | Requirements, Domain Logic | Complex business rules | **o3** |
| `;analytics` | Analytics Engineering Expert | Event Tracking, Data Quality | Analytics implementation | **Gemini 2.5 Pro** |
| `;book` | Rare Book Domain Expert | Cataloging, Condition, Pricing | Booksphere-specific features | **Gemini 2.5 Pro** |
| `;pricing` | Pricing Strategy Expert | Market Analysis, Competitive Intelligence | Pricing algorithms, market logic | **o3** |
| `You are a world-class senior full-stack developer specializing in production-grade code implementation. Take all the expert feedback provided in this conversation and write the highest quality code possible. Focus on:

1. **Integration Excellence:** Incorporate all security, performance, accessibility, and domain expert recommendations into the implementation.
2. **Production Quality:** Write clean, maintainable, well-documented code that follows best practices and handles edge cases.
3. **Architecture Alignment:** Ensure the code aligns with system architecture principles and API design standards discussed.

Provide complete, working code with clear comments explaining how expert feedback was addressed. Include error handling, type safety, and comprehensive implementation.` | Senior Full-Stack Developer | Production Implementation | Integrating expert feedback into code | **Claude 4 Sonnet** |
| `;review` | Code Review Expert | Bug Detection, Completeness | Critical review of generated code | **Gemini 2.5 Pro Preview 06-05** |

---

## Model Selection Strategy

### Model Strengths Overview

#### 🧠 **o3 - The Deep Reasoner**
**Best for:** Complex analysis, reasoning-heavy tasks, security auditing, mathematical problems

**Key Strengths:**
- 87.5% on ARC-AGI visual reasoning benchmark, 96.7% on AIME 2024 mathematics
- 82.9% on MMMU College-level visual problem-solving benchmark
- Strong reasoning capabilities with step-by-step logical analysis
- Superior at multi-step problem solving and complex analytical tasks

**Use for these personas:** Security, Performance, Architecture, Business Logic, Pricing Strategy

#### ⚡ **Claude 4 Sonnet - The Reliable Coder**
**Best for:** Production code generation, systematic implementation, database work

**Key Strengths:**
- 72.5% on SWE-bench, 65% lower chance of using hacky solutions
- Best balance of speed (1.9s latency) and cost ($3/$15 per 1M tokens)
- Methodical thinking and consistency in code generation
- Clean, maintainable, well-documented code output

**Use for these personas:** Database, Testing, API Design, DevOps, Code Implementation

#### 🎨 **Gemini 2.5 Pro Preview 06-05 - The UI & Review Specialist**
**Best for:** User interface design, code review, creative tasks, front-end development

**Key Strengths:**
- #1 on WebDev Arena leaderboard for building functional web apps
- Meaningful improvements for front-end and UI development
- Improved style and structure for creative, better-formatted responses
- Enhanced reasoning with "thinking" capabilities

**Use for these personas:** UI/UX, Code Review

#### 📊 **Gemini 2.5 Pro - The Context King**
**Best for:** Large codebase analysis, research, domain expertise, data analysis

**Key Strengths:**
- 1 million token context window (expanding to 2M) - can process entire codebases
- Most cost-effective at $1.25/M input, $10/M output tokens
- Excellent multimodal capabilities and research-oriented tasks
- Strong domain knowledge and analytical capabilities

**Use for these personas:** Analytics, Rare Book Domain Expert

### Model Selection Rationale

**Security & Complex Analysis → o3**
Security vulnerabilities require deep reasoning and multi-step threat analysis. o3's 87.5% accuracy on visual reasoning and superior analytical capabilities make it ideal for identifying attack vectors and complex security patterns.

**Production Code → Claude 4 Sonnet**  
Claude 4 Sonnet's 72.5% SWE-bench score and 65% reduction in hacky solutions makes it the most reliable for production-grade code that needs to be maintainable and robust.

**UI/UX & Review → Gemini 2.5 Pro Preview 06-05**
Leading WebDev Arena performance and improved creative formatting makes this the best choice for user-facing design and comprehensive code review.

**Large Context Tasks → Gemini 2.5 Pro**
1M+ token context window eliminates chunking for massive enterprise codebases, perfect for domain expertise and comprehensive analysis.

---

## Persona Detailed Reference

### Core Development Experts

#### 🗄️ PostgreSQL Database Architect (`;db`)
**Recommended Model:** **Claude 4 Sonnet**
*Rationale: 72.5% SWE-bench performance and systematic approach to database optimization make it ideal for production-grade SQL work.*

**When to Use:**
- Before writing database migrations
- After generating SQL functions or stored procedures
- When designing complex queries or table relationships
- Database performance optimization

**Why This Expert:**
- Prevents performance anti-patterns early
- Ensures proper indexing strategies
- Validates security practices (RLS, SQL injection prevention)
- Considers scalability implications for high-transaction systems

#### 🔒 API Security Specialist (`;security`)
**Recommended Model:** **o3**
*Rationale: 87.5% visual reasoning accuracy and superior analytical capabilities make it best for identifying complex attack vectors and security patterns.*

**When to Use:**
- Any function handling user input
- Authentication and authorization code
- API endpoints and Supabase RPCs
- Payment processing or sensitive data handling

**Why This Expert:**
- Critical for SaaS platforms handling customer data
- Prevents security vulnerabilities before they reach production
- Ensures compliance with privacy regulations
- Validates proper authentication flows

#### 🎨 UI/UX & Accessibility Expert (`;ux`)
**Recommended Model:** **Gemini 2.5 Pro Preview 06-05**
*Rationale: #1 on WebDev Arena leaderboard and improved creative formatting make it the best choice for user-facing design work.*

**When to Use:**
- New React components or UI elements
- User workflow design
- Form design and validation
- Complex user interactions

**Why This Expert:**
- Ensures professional user experience
- Validates accessibility compliance
- Maintains design system consistency
- Optimizes for user productivity

#### 🧪 Test-Driven Development Coach (`;test`)
**Recommended Model:** **Claude 4 Sonnet**
*Rationale: Systematic approach and reliable code generation ensure comprehensive, maintainable test coverage.*

**When to Use:**
- Before implementing new features (TDD approach)
- After writing complex business logic
- When building critical system components
- API endpoint testing

**Why This Expert:**
- Ensures comprehensive test coverage
- Identifies edge cases early
- Validates error handling scenarios
- Provides specific, executable test code

#### ⚡ Performance Engineer (`;perf`)
**Recommended Model:** **o3**
*Rationale: Deep reasoning capabilities excel at analyzing algorithm complexity and multi-step optimization scenarios.*

**When to Use:**
- Complex algorithms or data processing
- Database-heavy operations
- Frontend components with large datasets
- Scalability-critical features

**Why This Expert:**
- Prevents performance bottlenecks
- Optimizes for scale (1x vs 100x scenarios)
- Identifies resource-intensive operations
- Validates caching strategies

### Architecture & System Design Experts

#### 🏗️ System Architect (`;arch`)
**Recommended Model:** **o3**
*Rationale: Superior reasoning capabilities and 87.5% visual reasoning benchmark performance make it ideal for analyzing complex system relationships and architectural trade-offs.*

**When to Use:**
- Designing new major features
- Making architectural decisions
- Service boundary definitions
- Integration strategy planning

**Why This Expert:**
- Ensures scalable architecture patterns
- Validates system boundaries and coupling
- Considers long-term evolution paths
- Analyzes complexity vs. benefit trade-offs

#### 📡 API Design Expert (`;api`)
**Recommended Model:** **Claude 4 Sonnet**
*Rationale: Systematic approach and production-grade code generation ensure consistent, well-designed API contracts that follow best practices.*

**When to Use:**
- Designing REST or GraphQL APIs
- API versioning strategies
- Integration point design
- Developer experience optimization

**Why This Expert:**
- Ensures consistent API design
- Optimizes developer experience
- Plans for API evolution and versioning
- Validates RESTful principles

#### ☁️ DevOps/Infrastructure Engineer (`;deploy`)
**Recommended Model:** **Claude 4 Sonnet**
*Rationale: Reliable code generation and systematic approach ensure robust, maintainable infrastructure code and deployment scripts.*

**When to Use:**
- Deployment configuration
- Infrastructure as Code
- CI/CD pipeline design
- Monitoring and alerting setup

**Why This Expert:**
- Ensures reliable deployments
- Validates operational security
- Optimizes infrastructure costs
- Plans for disaster recovery

### Business & Domain Experts

#### 📊 Business Logic Validator (`;business`)
**Recommended Model:** **o3**
*Rationale: Complex reasoning capabilities excel at analyzing multi-step business workflows and validating requirement implementation accuracy.*

**When to Use:**
- Complex business rule implementation
- Domain-specific calculations
- Workflow validation
- Requirements verification

**Why This Expert:**
- Ensures business requirements are met accurately
- Validates business rule consistency
- Identifies business logic edge cases
- Connects technical decisions to business impact

#### 📈 Analytics Engineering Expert (`;analytics`)
**Recommended Model:** **Gemini 2.5 Pro**
*Rationale: Large context window and strong analytical capabilities make it ideal for processing complex data relationships and compliance requirements.*

**When to Use:**
- Event tracking implementation
- Data pipeline design
- Analytics dashboard features
- Performance metrics tracking

**Why This Expert:**
- Ensures data quality and consistency
- Validates privacy compliance
- Optimizes for business intelligence needs
- Plans for data governance

### Booksphere-Specific Domain Experts

#### 📚 Rare Book Domain Expert (`;book`)
**Recommended Model:** **Gemini 2.5 Pro**
*Rationale: Large context window allows processing extensive book catalogs and industry knowledge, while multimodal capabilities can analyze book condition from images.*

**When to Use:**
- Book cataloging features
- Condition assessment algorithms
- Bibliographic data handling
- Industry standard compliance

**Why This Expert:**
- Ensures domain accuracy for antiquarian book trade
- Validates industry standard compliance
- Optimizes for both rare and general inventory
- Considers collector and dealer perspectives

#### 💰 Pricing Strategy Expert (`;pricing`)
**Recommended Model:** **o3**
*Rationale: Complex reasoning capabilities excel at analyzing multi-variable pricing factors, market dynamics, and competitive intelligence scenarios.*

**When to Use:**
- Pricing algorithm development
- Market analysis features
- Competitive intelligence systems
- Dynamic pricing logic

**Why This Expert:**
- Ensures competitive pricing strategies
- Validates market data integration
- Optimizes for profitability and competitiveness
- Considers market dynamics and seasonality

### Implementation & Quality Experts

#### 👨‍💻 Senior Full-Stack Developer (`You are a world-class senior full-stack developer specializing in production-grade code implementation. Take all the expert feedback provided in this conversation and write the highest quality code possible. Focus on:

1. **Integration Excellence:** Incorporate all security, performance, accessibility, and domain expert recommendations into the implementation.
2. **Production Quality:** Write clean, maintainable, well-documented code that follows best practices and handles edge cases.
3. **Architecture Alignment:** Ensure the code aligns with system architecture principles and API design standards discussed.

Provide complete, working code with clear comments explaining how expert feedback was addressed. Include error handling, type safety, and comprehensive implementation.`)
**Recommended Model:** **Claude 4 Sonnet**
*Rationale: 72.5% SWE-bench performance and systematic approach ensure reliable, production-ready code that integrates expert feedback effectively.*

**When to Use:**
- After gathering expert feedback
- Final implementation phase
- Integrating multiple expert recommendations
- Production-ready code generation

**Why This Expert:**
- Synthesizes all expert feedback into working code
- Ensures production-quality implementation
- Provides complete, documented solutions
- Handles integration complexity

#### 🔍 Code Review Expert (`;review`)
**Recommended Model:** **Gemini 2.5 Pro Preview 06-05**
*Rationale: Enhanced reasoning with "thinking" capabilities and improved creative analysis make it excellent for comprehensive code review and bug detection.*

**When to Use:**
- After code generation by any model
- Before deploying critical features
- When debugging incomplete implementations
- Quality assurance checkpoint

**Why This Expert:**
- Catches bugs and logic errors with fresh eyes
- Identifies incomplete implementations
- Validates code-comment accuracy
- Ensures runtime stability

---

## Workflow Patterns by Development Context

### 1. Database-First Features

**Use Case:** New data models, complex queries, schema changes

**Workflow:**
```
1. Design schema/query (Claude 4 Sonnet - reliable coding)
2. ;db → Database architecture review (Claude 4 Sonnet - systematic DB optimization)
3. ;security → Security validation (o3 - deep threat analysis)
4. You are a world-class senior full-stack developer specializing in production-grade code implementation. Take all the expert feedback provided in this conversation and write the highest quality code possible. Focus on:

1. **Integration Excellence:** Incorporate all security, performance, accessibility, and domain expert recommendations into the implementation.
2. **Production Quality:** Write clean, maintainable, well-documented code that follows best practices and handles edge cases.
3. **Architecture Alignment:** Ensure the code aligns with system architecture principles and API design standards discussed.

Provide complete, working code with clear comments explaining how expert feedback was addressed. Include error handling, type safety, and comprehensive implementation. → Implementation (Claude 4 Sonnet - production-grade code)
5. ;review → Bug check (Gemini 2.5 Pro Preview 06-05 - comprehensive review)
6. ;test → Database testing (Claude 4 Sonnet - thorough test coverage)
```

**Example Model Switching:**
```
Claude 4 Sonnet: "Generate book inventory schema"
→ Claude 4 Sonnet: ";db" (database optimization)
→ o3: ";security" (security threat analysis)  
→ Claude 4 Sonnet: "You are a world-class senior full-stack developer specializing in production-grade code implementation. Take all the expert feedback provided in this conversation and write the highest quality code possible. Focus on:

1. **Integration Excellence:** Incorporate all security, performance, accessibility, and domain expert recommendations into the implementation.
2. **Production Quality:** Write clean, maintainable, well-documented code that follows best practices and handles edge cases.
3. **Architecture Alignment:** Ensure the code aligns with system architecture principles and API design standards discussed.

Provide complete, working code with clear comments explaining how expert feedback was addressed. Include error handling, type safety, and comprehensive implementation." (final implementation)
→ Gemini 2.5 Pro Preview 06-05: ";review" (code review)
```

**Example Scenarios:**
- Book inventory schema design
- Multi-tenant data isolation
- Complex reporting queries
- Data migration scripts

### 2. API Development

**Use Case:** New endpoints, service integrations, external APIs

**Workflow:**
```
1. Design API contract (Primary model)
2. ;api → API design review
3. ;security → Security audit
4. ;arch → Architecture validation
5. You are a world-class senior full-stack developer specializing in production-grade code implementation. Take all the expert feedback provided in this conversation and write the highest quality code possible. Focus on:

1. **Integration Excellence:** Incorporate all security, performance, accessibility, and domain expert recommendations into the implementation.
2. **Production Quality:** Write clean, maintainable, well-documented code that follows best practices and handles edge cases.
3. **Architecture Alignment:** Ensure the code aligns with system architecture principles and API design standards discussed.

Provide complete, working code with clear comments explaining how expert feedback was addressed. Include error handling, type safety, and comprehensive implementation. → Implementation
6. ;test → API testing
7. ;review → Final check
```

**Example Scenarios:**
- Amazon SP-API integration
- Customer-facing REST APIs
- Webhook implementations
- Third-party service integrations

### 3. User Interface Development

**Use Case:** New components, user workflows, complex interactions

**Workflow:**
```
1. Design component/workflow (Primary model)
2. ;ux → UX and accessibility review
3. ;perf → Frontend performance check
4. You are a world-class senior full-stack developer specializing in production-grade code implementation. Take all the expert feedback provided in this conversation and write the highest quality code possible. Focus on:

1. **Integration Excellence:** Incorporate all security, performance, accessibility, and domain expert recommendations into the implementation.
2. **Production Quality:** Write clean, maintainable, well-documented code that follows best practices and handles edge cases.
3. **Architecture Alignment:** Ensure the code aligns with system architecture principles and API design standards discussed.

Provide complete, working code with clear comments explaining how expert feedback was addressed. Include error handling, type safety, and comprehensive implementation. → Implementation
5. ;test → Component testing
6. ;review → Quality check
```

**Example Scenarios:**
- Book search interface
- Dealer dashboard components
- Mobile-responsive layouts
- Complex form interactions

### 4. Business Logic Implementation

**Use Case:** Domain-specific algorithms, complex calculations, workflows

**Workflow:**
```
1. Design business logic (Primary model)
2. ;business → Requirements validation
3. ;book → Domain expert review (if book-related)
4. ;pricing → Pricing logic review (if pricing-related)
5. ;security → Data protection check
6. You are a world-class senior full-stack developer specializing in production-grade code implementation. Take all the expert feedback provided in this conversation and write the highest quality code possible. Focus on:

1. **Integration Excellence:** Incorporate all security, performance, accessibility, and domain expert recommendations into the implementation.
2. **Production Quality:** Write clean, maintainable, well-documented code that follows best practices and handles edge cases.
3. **Architecture Alignment:** Ensure the code aligns with system architecture principles and API design standards discussed.

Provide complete, working code with clear comments explaining how expert feedback was addressed. Include error handling, type safety, and comprehensive implementation. → Implementation
7. ;test → Business logic testing
8. ;review → Logic verification
```

**Example Scenarios:**
- Book condition assessment algorithms
- Pricing intelligence calculations
- Dealer commission structures
- Inventory allocation logic

### 5. Performance-Critical Features

**Use Case:** High-volume operations, real-time features, optimization

**Workflow:**
```
1. Design feature (Primary model)
2. ;perf → Performance analysis
3. ;db → Database optimization
4. ;arch → Scalability review
5. You are a world-class senior full-stack developer specializing in production-grade code implementation. Take all the expert feedback provided in this conversation and write the highest quality code possible. Focus on:

1. **Integration Excellence:** Incorporate all security, performance, accessibility, and domain expert recommendations into the implementation.
2. **Production Quality:** Write clean, maintainable, well-documented code that follows best practices and handles edge cases.
3. **Architecture Alignment:** Ensure the code aligns with system architecture principles and API design standards discussed.

Provide complete, working code with clear comments explaining how expert feedback was addressed. Include error handling, type safety, and comprehensive implementation. → Optimized implementation
6. ;test → Performance testing
7. ;review → Efficiency check
```

**Example Scenarios:**
- Real-time inventory sync
- Bulk data processing
- Search optimization
- High-frequency pricing updates

### 6. Security-Sensitive Features

**Use Case:** Authentication, payments, sensitive data, user permissions

**Workflow:**
```
1. Design security feature (Primary model)
2. ;security → Security audit
3. ;db → Database security review
4. ;arch → Security architecture validation
5. You are a world-class senior full-stack developer specializing in production-grade code implementation. Take all the expert feedback provided in this conversation and write the highest quality code possible. Focus on:

1. **Integration Excellence:** Incorporate all security, performance, accessibility, and domain expert recommendations into the implementation.
2. **Production Quality:** Write clean, maintainable, well-documented code that follows best practices and handles edge cases.
3. **Architecture Alignment:** Ensure the code aligns with system architecture principles and API design standards discussed.

Provide complete, working code with clear comments explaining how expert feedback was addressed. Include error handling, type safety, and comprehensive implementation. → Secure implementation
6. ;test → Security testing
7. ;deploy → Operational security check
8. ;review → Security verification
```

**Example Scenarios:**
- User authentication systems
- Payment processing
- Data privacy features
- Role-based access control

### 7. Integration & Deployment

**Use Case:** Service integrations, deployment pipelines, infrastructure

**Workflow:**
```
1. Design integration/deployment (Primary model)
2. ;arch → Architecture review
3. ;security → Integration security
4. ;deploy → Operational review
5. You are a world-class senior full-stack developer specializing in production-grade code implementation. Take all the expert feedback provided in this conversation and write the highest quality code possible. Focus on:

1. **Integration Excellence:** Incorporate all security, performance, accessibility, and domain expert recommendations into the implementation.
2. **Production Quality:** Write clean, maintainable, well-documented code that follows best practices and handles edge cases.
3. **Architecture Alignment:** Ensure the code aligns with system architecture principles and API design standards discussed.

Provide complete, working code with clear comments explaining how expert feedback was addressed. Include error handling, type safety, and comprehensive implementation. → Implementation
6. ;test → Integration testing
7. ;review → Deployment readiness
```

**Example Scenarios:**
- CI/CD pipeline setup
- Third-party service integrations
- Infrastructure provisioning
- Monitoring and alerting

### 8. Analytics & Tracking

**Use Case:** Event tracking, data pipelines, business intelligence

**Workflow:**
```
1. Design analytics feature (Primary model)
2. ;analytics → Data strategy review
3. ;business → Business requirements validation
4. ;security → Data privacy check
5. ;db → Data modeling review
6. You are a world-class senior full-stack developer specializing in production-grade code implementation. Take all the expert feedback provided in this conversation and write the highest quality code possible. Focus on:

1. **Integration Excellence:** Incorporate all security, performance, accessibility, and domain expert recommendations into the implementation.
2. **Production Quality:** Write clean, maintainable, well-documented code that follows best practices and handles edge cases.
3. **Architecture Alignment:** Ensure the code aligns with system architecture principles and API design standards discussed.

Provide complete, working code with clear comments explaining how expert feedback was addressed. Include error handling, type safety, and comprehensive implementation. → Implementation
7. ;test → Data quality testing
```

**Example Scenarios:**
- User behavior tracking
- Business metrics dashboards
- Data export features
- Performance monitoring

---

## Specialized Booksphere Workflows

### Book Cataloging Feature
```
1. Design cataloging system
2. ;book → Domain expert validation
3. ;ux → Cataloging workflow UX
4. ;db → Bibliographic data modeling
5. You are a world-class senior full-stack developer specializing in production-grade code implementation. Take all the expert feedback provided in this conversation and write the highest quality code possible. Focus on:

1. **Integration Excellence:** Incorporate all security, performance, accessibility, and domain expert recommendations into the implementation.
2. **Production Quality:** Write clean, maintainable, well-documented code that follows best practices and handles edge cases.
3. **Architecture Alignment:** Ensure the code aligns with system architecture principles and API design standards discussed.

Provide complete, working code with clear comments explaining how expert feedback was addressed. Include error handling, type safety, and comprehensive implementation. → Implementation
6. ;test → Cataloging accuracy testing
```

### Pricing Engine Development
```
1. Design pricing algorithm
2. ;pricing → Market strategy validation
3. ;book → Domain-specific factors
4. ;perf → Algorithm optimization
5. ;analytics → Pricing metrics tracking
6. You are a world-class senior full-stack developer specializing in production-grade code implementation. Take all the expert feedback provided in this conversation and write the highest quality code possible. Focus on:

1. **Integration Excellence:** Incorporate all security, performance, accessibility, and domain expert recommendations into the implementation.
2. **Production Quality:** Write clean, maintainable, well-documented code that follows best practices and handles edge cases.
3. **Architecture Alignment:** Ensure the code aligns with system architecture principles and API design standards discussed.

Provide complete, working code with clear comments explaining how expert feedback was addressed. Include error handling, type safety, and comprehensive implementation. → Implementation
7. ;test → Pricing accuracy testing
```

### Multi-Channel Inventory Sync
```
1. Design sync architecture
2. ;arch → System design review
3. ;api → Integration design
4. ;perf → Sync performance optimization
5. ;security → Data security validation
6. ;deploy → Operational reliability
7. You are a world-class senior full-stack developer specializing in production-grade code implementation. Take all the expert feedback provided in this conversation and write the highest quality code possible. Focus on:

1. **Integration Excellence:** Incorporate all security, performance, accessibility, and domain expert recommendations into the implementation.
2. **Production Quality:** Write clean, maintainable, well-documented code that follows best practices and handles edge cases.
3. **Architecture Alignment:** Ensure the code aligns with system architecture principles and API design standards discussed.

Provide complete, working code with clear comments explaining how expert feedback was addressed. Include error handling, type safety, and comprehensive implementation. → Implementation
8. ;test → Sync reliability testing
```

---

## Context Management Guidelines

### When to Start New Chats
- **New major feature** (different user story)
- **Unrelated functionality** (UI → Database migration)
- **Chat exceeds 40-50 messages**
- **Need clean architectural slate**

### Context Preservation Techniques
- Use `@filename` and `@folder` for code context
- Start expert reviews with brief context summary
- Maintain expert feedback summaries
- Reference previous decisions explicitly

### Workflow Optimization Tips
- **Batch related reviews** (security + performance together)
- **Use progressive refinement** (basic → detailed → optimized)
- **Document key decisions** in code comments
- **Preserve expert insights** for team knowledge sharing

---

## Model Switching Optimization

### Strategic Model Switching Patterns

#### **The Security-First Pattern**
```
Claude 4 Sonnet → o3 → Claude 4 Sonnet
(Build → Deep Security Analysis → Secure Implementation)
```
**Best for:** Authentication systems, payment processing, sensitive data handling

#### **The UI Excellence Pattern**  
```
Gemini 2.5 Pro Preview 06-05 → Claude 4 Sonnet → Gemini 2.5 Pro Preview 06-05
(Creative UI Design → Reliable Implementation → Comprehensive Review)
```
**Best for:** User-facing components, complex interactions, design-heavy features

#### **The Large Codebase Pattern**
```
Gemini 2.5 Pro → o3 → Claude 4 Sonnet
(Context Analysis → Complex Reasoning → Production Implementation)
```
**Best for:** Enterprise features, multi-file changes, large refactors

#### **The Domain Expert Pattern**
```
Gemini 2.5 Pro → o3 → Claude 4 Sonnet
(Domain Knowledge → Business Logic Analysis → Reliable Implementation)  
```
**Best for:** Booksphere-specific features, industry-specific requirements

### Practical Model Switching Tips

#### **Context Preservation Between Models**
- Always provide brief context when switching: "We're building X feature, previous model provided Y feedback"
- Use `@filename` references to maintain code context across model switches
- Summarize key decisions from previous expert reviews

#### **Cost Optimization**
- **Start with Claude 4 Sonnet** for initial code generation (cost-effective, reliable)
- **Switch to o3** only for complex reasoning tasks (security, architecture, complex business logic)  
- **Use Gemini 2.5 Pro** for large context tasks (massive codebases, extensive research)
- **Reserve Gemini 2.5 Pro Preview 06-05** for UI/UX and final review stages

#### **Speed Optimization**
- **Claude 4 Sonnet:** Fastest at 1.9s latency - use for iterative development
- **Gemini 2.5 Pro Preview 06-05:** Good for UI tasks requiring creativity
- **o3:** Slower but thorough - use when deep analysis is critical
- **Gemini 2.5 Pro:** Use when context size is more important than speed

### Model-Specific Prompt Optimization

#### **For o3 (Reasoning Tasks):**
```
"Analyze the following systematically. Consider multiple scenarios and edge cases. 
Provide step-by-step reasoning for your conclusions."
```

#### **For Claude 4 Sonnet (Code Generation):**
```
"Generate production-ready code with comprehensive error handling, clear comments, 
and following best practices. Include type safety and proper documentation."
```

#### **For Gemini 2.5 Pro (Large Context):**
```
"@entire_codebase Review this comprehensive system. Consider the full context 
and relationships between all components."
```

#### **For Gemini 2.5 Pro Preview 06-05 (UI/Review):**
```
"Focus on user experience and visual design. Consider accessibility, usability, 
and modern design principles. Be creative with styling and interactions."
```

---

## Booksphere-Optimized Model Workflows

### Book Authentication & Security
```
Claude 4 Sonnet: Generate dealer authentication system
→ o3: ";security" (Deep threat analysis for book dealer data)
→ Claude 4 Sonnet: "You are a world-class senior full-stack developer specializing in production-grade code implementation. Take all the expert feedback provided in this conversation and write the highest quality code possible. Focus on:

1. **Integration Excellence:** Incorporate all security, performance, accessibility, and domain expert recommendations into the implementation.
2. **Production Quality:** Write clean, maintainable, well-documented code that follows best practices and handles edge cases.
3. **Architecture Alignment:** Ensure the code aligns with system architecture principles and API design standards discussed.

Provide complete, working code with clear comments explaining how expert feedback was addressed. Include error handling, type safety, and comprehensive implementation." (Secure implementation)
→ Claude 4 Sonnet: ";test" (Comprehensive security testing)
```

### Book Cataloging Interface  
```
Gemini 2.5 Pro Preview 06-05: Design cataloging UI workflow
→ Gemini 2.5 Pro: ";book" (Domain expert validation with full context)
→ Claude 4 Sonnet: "You are a world-class senior full-stack developer specializing in production-grade code implementation. Take all the expert feedback provided in this conversation and write the highest quality code possible. Focus on:

1. **Integration Excellence:** Incorporate all security, performance, accessibility, and domain expert recommendations into the implementation.
2. **Production Quality:** Write clean, maintainable, well-documented code that follows best practices and handles edge cases.
3. **Architecture Alignment:** Ensure the code aligns with system architecture principles and API design standards discussed.

Provide complete, working code with clear comments explaining how expert feedback was addressed. Include error handling, type safety, and comprehensive implementation." (Reliable implementation)
→ Gemini 2.5 Pro Preview 06-05: ";review" (UI/UX final review)
```

### Pricing Intelligence Engine
```
o3: Design pricing algorithm architecture
→ o3: ";pricing" (Market analysis reasoning)  
→ Gemini 2.5 Pro: ";analytics" (Data pipeline design)
→ Claude 4 Sonnet: "You are a world-class senior full-stack developer specializing in production-grade code implementation. Take all the expert feedback provided in this conversation and write the highest quality code possible. Focus on:

1. **Integration Excellence:** Incorporate all security, performance, accessibility, and domain expert recommendations into the implementation.
2. **Production Quality:** Write clean, maintainable, well-documented code that follows best practices and handles edge cases.
3. **Architecture Alignment:** Ensure the code aligns with system architecture principles and API design standards discussed.

Provide complete, working code with clear comments explaining how expert feedback was addressed. Include error handling, type safety, and comprehensive implementation." (Production implementation)
→ o3: ";perf" (Scale optimization)
```

### Multi-Channel Inventory Sync
```
Claude 4 Sonnet: Design sync architecture
→ o3: ";arch" (Complex system reasoning)
→ Claude 4 Sonnet: ";api" (Integration design)
→ Claude 4 Sonnet: ";deploy" (Operational setup)
→ Gemini 2.5 Pro: Large codebase integration review
```

### Book Search & Discovery
```
Gemini 2.5 Pro Preview 06-05: Design search interface
→ o3: ";perf" (Search algorithm optimization)
→ Claude 4 Sonnet: ";db" (Database indexing strategy)
→ Claude 4 Sonnet: "You are a world-class senior full-stack developer specializing in production-grade code implementation. Take all the expert feedback provided in this conversation and write the highest quality code possible. Focus on:

1. **Integration Excellence:** Incorporate all security, performance, accessibility, and domain expert recommendations into the implementation.
2. **Production Quality:** Write clean, maintainable, well-documented code that follows best practices and handles edge cases.
3. **Architecture Alignment:** Ensure the code aligns with system architecture principles and API design standards discussed.

Provide complete, working code with clear comments explaining how expert feedback was addressed. Include error handling, type safety, and comprehensive implementation." (Implementation)
→ Gemini 2.5 Pro Preview 06-05: ";ux" (User experience review)
```

This systematic approach ensures that every piece of code benefits from multiple expert perspectives while maintaining development velocity and context coherence.