**Product Requirements Document (PRD): Catalog Portfolio WebApp**

**1. Overview:**
This project aims to build a catalog portfolio web application using React and Next.js. The system will streamline the process of managing customer requests from Instagram and facilitate communication with suppliers in China. The app will automate the handling of requests, approvals, invoicing, and catalog browsing, ensuring efficiency and scalability.

---

**2. Objectives:**
- Automate customer request collection via Instagram.
- Store and organize requests in a Google Sheet or database.
- Provide a workflow for approval and invoice generation.
- Ensure smooth email communication with customers.
- Support multi-language capabilities (English and Chinese).
- Provide a simple catalog of products for customers to browse.

---

**3. Key Features:**

### 3.1 Customer Request Submission:
- **Instagram Integration**: Import customer requests automatically via Instagram API (or manual input as a fallback).
- **Request Form**: Display form for customers to provide details (product name, description, quantity, budget, etc.).
- **Customer Dashboard**: Customers can track their request status.

### 3.2 Product Catalog:
- **Catalog Page**:
  - Display products grouped by niches (e.g., fashion, electronics, home goods).
  - Simple grid layout with product images, names, and brief descriptions.
  - Search and filter options to browse by niche or keyword.
- **Product Details**:
  - Clicking on a product provides more details, including price ranges and availability.
  - Customers can add products of interest to their request.

### 3.3 Internal Request Management:
- **Admin Dashboard**:
  - Display all incoming requests with sorting and filtering options.
  - Option to approve, reject, or request clarification from customers.
- **Supplier Communication**:
  - Send requests to suppliers via email or integrate a supplier dashboard for direct updates.
  - Track supplier responses and costs.

### 3.4 Approval Workflow:
- Approve requests and calculate costs.
- Generate an invoice with detailed breakdowns (product cost, shipping, fees, etc.).
- Send invoice to customer’s email.

### 3.5 Notifications:
- **Customer Notifications**:
  - Email confirmation when a request is submitted.
  - Updates on approval/rejection and invoices.
- **Internal Notifications**:
  - Notify admin about new requests and supplier responses.

### 3.6 Invoicing and Payment:
- **Invoice Generation**: Create invoices in PDF format.
- **Payment Gateway Integration**: Support online payment (PayPal, Stripe, etc.).

### 3.7 Reporting:
- Track requests, approvals, and payments via a reporting dashboard.

---

**4. Tech Stack:**
- **Frontend**: React with Next.js (for server-side rendering and SEO optimization).
- **Backend**: Node.js with Express (if needed for API handling).
- **Database**: Firebase/Google Sheets for lightweight data storage.
- **Integrations**:
  - Instagram Graph API for request imports.
  - Email API (e.g., SendGrid or Nodemailer) for communication.
  - Payment Gateway APIs (e.g., Stripe, PayPal).

---

**5. Workflow and Flowchart:**

### Workflow:
1. **Request Submission**:
   - Customer submits a request via Instagram or web form.
   - Data is saved in Google Sheets or Firebase.
2. **Product Browsing**:
   - Customers browse a simple catalog of products grouped by niches.
   - Customers can add products of interest to their request.
3. **Admin Review**:
   - Admin reviews requests and forwards them to suppliers.
4. **Supplier Feedback**:
   - Supplier responds with pricing and availability.
5. **Approval & Invoice**:
   - Admin approves request and generates an invoice.
   - Invoice is sent to the customer.
6. **Customer Payment**:
   - Customer receives the invoice and completes payment.
7. **Order Processing**:
   - Order is confirmed, and the process is tracked until fulfillment.

### Flowchart:
```
Customer Request (Instagram Form) --> Data Storage (Google Sheets) --> Product Browsing (Catalog) --> Admin Review --> Supplier Request --> Supplier Feedback --> Admin Approval --> Invoice Generation --> Customer Notification --> Payment --> Order Fulfillment
```

---

**6. User Roles:**
- **Customers**:
  - Submit product requests.
  - Browse product catalog.
  - Add products to requests.
  - Receive updates and invoices.
- **Admin**:
  - Manage and approve requests.
  - Communicate with suppliers and customers.
- **Suppliers**:
  - Receive and respond to product inquiries.

---

**7. Key Screens:**

### 7.1 Customer Interface:
- Request Submission Form
- Request Status Dashboard
- Product Catalog Page
- Product Details Page
- Invoice View

### 7.2 Admin Interface:
- Request Management Dashboard
- Supplier Communication Dashboard
- Invoice Management Panel

---

**8. Database Structure:**

### Tables:
1. **Users**:
   - `id` (Primary Key, UUID)
   - `name` (String)
   - `email` (String, Unique)
   - `role` (Enum: Customer, Admin, Supplier)
   - `password_hash` (String)
   - `created_at` (Timestamp)

2. **Requests**:
   - `id` (Primary Key, UUID)
   - `customer_id` (Foreign Key to Users)
   - `product_details` (JSON)
   - `status` (Enum: Pending, Approved, Rejected, Fulfilled)
   - `total_cost` (Float)
   - `created_at` (Timestamp)

3. **Products**:
   - `id` (Primary Key, UUID)
   - `name` (String)
   - `description` (Text)
   - `category` (String)
   - `price_range` (String)
   - `availability` (Boolean)
   - `created_at` (Timestamp)

4. **Invoices**:
   - `id` (Primary Key, UUID)
   - `request_id` (Foreign Key to Requests)
   - `invoice_pdf_url` (String)
   - `payment_status` (Enum: Pending, Paid)
   - `created_at` (Timestamp)

5. **Notifications**:
   - `id` (Primary Key, UUID)
   - `user_id` (Foreign Key to Users)
   - `message` (Text)
   - `status` (Enum: Unread, Read)
   - `created_at` (Timestamp)

6. **Supplier Responses**:
   - `id` (Primary Key, UUID)
   - `request_id` (Foreign Key to Requests)
   - `supplier_id` (Foreign Key to Users)
   - `response_details` (Text)
   - `quoted_price` (Float)
   - `created_at` (Timestamp)

---

**9. Milestones:**
1. **MVP Development (4 Weeks):**
   - Instagram integration and request form.
   - Google Sheets data storage.
   - Admin dashboard for basic request management.
   - Basic product catalog with search and filter options.
2. **Enhanced Features (4 Weeks):**
   - Supplier communication.
   - Invoice generation and email automation.
   - Customer ability to add products to requests.
3. **Payment Gateway Integration (2 Weeks):**
   - Add Stripe/PayPal.
4. **Finalization and Testing (2 Weeks):**
   - End-to-end testing and deployment.

---

**10. Success Metrics:**
- Reduced manual effort in handling customer requests.
- Increased request fulfillment accuracy.
- Enhanced communication between admin, suppliers, and customers.
- Positive user feedback on request, catalog, and invoice workflows.
- High engagement with the product catalog.

---

**11. Next Steps:**
- Finalize detailed wireframes for key screens.
- Begin development with priority on customer request flow and product catalog.
- Conduct initial testing with internal users.

---

**Prompt for V0 Development:**

*"We are building a modern catalog portfolio web application with the following requirements:*  

1. Create a **Customer Request Flow**:
   - Build a request submission form where users can input product details (product name, description, quantity, budget).
   - Develop Instagram API integration for automated request imports.
   - Include a customer dashboard to track request status.

2. Design a **Product Catalog Page**:
   - Display products grouped by niches (fashion, electronics, home goods).
   - Use a modern grid layout with product images, names, and brief descriptions.
   - Provide search and filter options for easy navigation.
   - Add a product details page showing price ranges and availability.
   - Enable users to add products of interest to their requests.

3. Develop an **Admin Dashboard**:
   - Include features for viewing and managing customer requests.
   - Allow communication with suppliers (email integration or supplier dashboard).
   - Enable request approval/rejection and invoice generation.

4. Implement **Invoice Management**:
   - Build functionality to generate detailed PDF invoices.
   - Set up email automation for sending invoices to customers.

5. Integrate **Payment Gateway**:
   - Add support for Stripe/PayPal to process payments.

6. Develop **Notification System**:
   - Notify customers about updates on requests and invoices.
   - Notify admin of new requests and supplier feedback.

7. Implement **Reporting Dashboard**:
   - Provide metrics on requests, approvals, and payments.

*The site should have a modern, clean design with responsiveness and seamless user interaction across all features.*

