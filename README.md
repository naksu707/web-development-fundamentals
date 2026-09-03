# Web Development Fundamentals

Welcome to my **Frontend Web Development** learning repository! This space documents my progress, practice, and evolution in building interactive, responsive, and intuitive web interfaces based on hands-on practice and real designs.

---

## About The Repository

This repository brings together practice exercises and complete projects developed during my web development training, based on:

- **Udemy Course:** [*Diseño Web Desde Cero para Principiantes*](https://www.udemy.com/course/diseno-web-desde-cero-para-principiantes-gratis/)
- **University Course:** *Desarrollo de Aplicaciones Web*

The main goal is to solidify frontend core concepts—such as semantic layout, Responsive Web Design (RWD), and DOM manipulation—by working on practical projects built in Spanish.

---

### Technologies & Tools

* **Frontend:** HTML5, CSS3 (Flexbox/Grid), JavaScript (ES6+).
* **Backend:** Python (Flask), RESTful APIs.
* **Databases:** PostgreSQL / SQL (Schema design, DDL/DML scripts).
* **Documentation & UI/UX Design:** Markdown (User Stories), Mockups / Wireframing.

---

## Topics & Skills Covered

* Semantic markup and clean HTML5 structuring.
* Responsive Web Design (RWD) using media queries for Mobile First and Desktop layouts.
* Dynamic DOM manipulation, real-time product filtering, and JSON data integration.
* Full-stack web development: Integrating Flask REST API routes with SQL database operations.
* Relational database modeling, script writing (table creation, insertions), and data persistence.
* Handling user file uploads and backend asset management.
* Agile documentation practices (User Stories) and UI mockup prototyping.
* Reusable UI component architecture: Navigation bars, Hero sections, product grids, modals, and multi-role user profiles (Client/Agency).

---

## How to Run the Projects

To ensure all features work properly (especially dynamic JSON loading, dynamic routing, and interactive assets), it is recommended to run the projects using a local web server:

1. Open the project folder in **Visual Studio Code**.
2. Start the local server using one of the following methods:
   - Click the **Go Live** button in the bottom status bar:
     <p align="center">
       <img src="/z-img/go-live.png" width="300" alt="Go Live Option">
     </p>
   - Or right-click the `index.html` file and select **Open with Live Server**:
     <p align="center">
       <img src="/z-img/go-live-2.png" width="400" alt="Open with Live Server Option">
     </p>

---

## Included Projects

### 1. First Web Page 
An initial web page created to practice fundamental HTML layout concepts, text hierarchy, essential CSS properties, and section layout.

- **Technologies:** HTML5, CSS3.
- **Focus:** Basic markup, text styling, colors, and the Box Model.

<p align="center">
    <img src="/z-img/preview-kaisa.png" width="750" alt="First Web Page Preview">
</p>

---

### 2. Bangtanpedia 
An informational web page dedicated to the K-pop group BTS. Features stylized visual elements, thematic content organization, and image galleries And a gift for my cousin.

- **Technologies:** HTML5, CSS3, Google Fonts.
- **Focus:** Semantic layout, refined visual styling, web typography, and component arrangement.

<p align="center">
    <img src="/z-img/preview-bts.png" width="750" alt="Bangtanpedia Preview">
</p>

---

### 3. Arepas de la Casa 
A complete interactive web application for a traditional stuffed arepas restaurant. Users can explore the menu, filter items by category or search text, view dish details, and manage a shopping cart. The initial UI/UX mockups for this project were designed with **Gemini**.

- **Technologies:** HTML5, CSS3 (Flexbox/Grid), JavaScript (ES6+), JSON.
- **Focus:** 
  - **Multi-page architecture:** Menu page, Product Details, Shopping Cart, Checkout, Login, and Sign Up.
  - **Interactive logic:** Dynamic rendering of products from JSON files, live search, and category filters.
  - **Fully Responsive:** Layouts tailored for desktop, tablet, and mobile views.

<p align="center">
  <img src="/z-img/preview-arepa.png" width="750" alt="Arepas de la Casa - Desktop Preview">
</p>

---

### 4. Volaris 

A full-stack web platform designed for travel and trip management. It allows users to explore destinations, submit reviews, manage customer or agency profiles, and send PQRs (Inquiries, Complaints, and Claims), backed by a robust database architecture and mockups designed for an optimal user experience.

* **Technologies:** Python (Flask), PostgreSQL / SQL, HTML5, CSS3, JavaScript (ES6+), Markdown.
* **Focus:**
* **Full-Stack Architecture:** RESTful API endpoints, backend route management, and file upload handling for user assets and attachments.
* **Relational Database Design:** Complete data persistence schema with SQL scripts for structure and seed data.
* **User Experience & Documentation:** Comprehensive User Stories (HU) documentation paired with detailed UI/UX mockups for landing pages, authentication, trends, and dual profile roles (Client and Agency).

> **Note for Running the Project:**
> To properly run this project, update your VS Code settings. Access the settings by pressing `Ctrl + Shift + P`, search for **Open User Settings (JSON)**, and add or update the following configuration:
>
> ```json
> "liveServer.settings.ignoreFiles": [
>     "**/.vscode/**",
>     "**/*.scss",
>     "**/uploads/**"
> ]
> ```

<p align="center">
    <img src="/z-img/preview-volaris.png" width="750" alt="Volaris Preview">
</p>