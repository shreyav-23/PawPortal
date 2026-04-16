# 🐾 PawPortal

**AI-Powered Pet Health & Activity Dashboard**

PawPortal is a modern React-based web application that helps pet owners manage their pets’ health, activities, and medical records — with built-in AI-powered veterinary insights.

---

## 🚀 Features

### 🐶 Pet Management

* Add and manage multiple pets
* Track breed, age, and weight
* Clean dashboard overview

### 🩺 Vet Copilot (AI)

* Describe symptoms or upload images
* AI analyzes pet health using structured pipelines:

  * Symptom interpretation
  * Risk assessment
  * Care planning
* Provides:

  * Clinical summary
  * Risk level (Low → Critical)
  * Recommended actions

### 📋 Medical Records

* Track:

  * Vaccinations
  * Medications
  * Surgeries
  * Checkups
* Add notes and next due dates

### 🏃 Activity Tracker

* Log daily activities:

  * Walks
  * Playtime
  * Training
* View total activity stats

### 📊 Analytics Dashboard

* Activity breakdown charts
* Pet distribution by species
* Quick health insights

---

## 🧠 Tech Stack

* **Frontend:** React + TypeScript + Vite
* **Backend (optional):** Supabase
* **AI Integration:** Gemini API
* **Charts:** Recharts
* **Icons:** Lucide React
* **Styling:** Tailwind CSS

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/pawportal.git
cd pawportal
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

> ⚠️ Do NOT commit your `.env` file.

---

### 4. Run the app locally

```bash
npm run dev
```

---

## 🔌 Optional Setup

### Supabase Tables

Create the following tables:

* `pets`
* `logs`
* `medical_records`
* `activity_logs`

---

### Gemini API

Add your API key in the code:

```ts
const apiKey = "your_gemini_api_key";
```

---

## 📁 Project Structure

```bash
pawportal/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── components/
├── public/
├── .env
├── package.json
└── README.md
```

---

## 🖼️ Screenshots (optional)

*Add screenshots of your app here once deployed*

---

## 🚀 Deployment

You can deploy easily using:

* Vercel
* Netlify

Example (Vercel):

```bash
npm install -g vercel
vercel
```

---

## ⚠️ Notes

* App works without Supabase (local state fallback)
* AI features require Gemini API key
* Ensure environment variables are correctly configured

---

## 📌 Future Improvements

* User authentication
* Notifications for medical due dates
* Multi-user support
* Mobile app version

---

## ⭐ Support

If you like this project:

* ⭐ Star the repo
* 🍴 Fork it
* 🧠 Contribute ideas

---

## 📄 License

This project is open-source and available under the MIT License.
